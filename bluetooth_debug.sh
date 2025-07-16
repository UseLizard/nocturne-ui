#!/bin/bash

# Bluetooth Debug Script
# Monitors Bluetooth connections and provides troubleshooting info

set -e

CAR_THING_IP="172.16.42.2"
CAR_THING_USER="root"
CAR_THING_PASS="nocturne"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_help() {
    echo "Bluetooth Debug Script"
    echo "Monitors and troubleshoots Bluetooth connections"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help      Show this help message"
    echo "  -m, --monitor   Monitor Bluetooth events in real-time"
    echo "  -c, --check     Check current connection status"
    echo "  -f, --fix       Attempt to fix common connection issues"
    echo "  -l, --logs      Show recent Bluetooth logs"
    echo ""
}

# Parse command line arguments
MONITOR=false
CHECK=false
FIX=false
LOGS=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -m|--monitor)
            MONITOR=true
            shift
            ;;
        -c|--check)
            CHECK=true
            shift
            ;;
        -f|--fix)
            FIX=true
            shift
            ;;
        -l|--logs)
            LOGS=true
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Test connectivity
test_connectivity() {
    if ! sshpass -p "$CAR_THING_PASS" ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no "$CAR_THING_USER@$CAR_THING_IP" "echo 'SSH OK'" &>/dev/null; then
        log_error "Cannot connect to Car Thing"
        return 1
    fi
    return 0
}

# Check current status
check_status() {
    log_info "Checking current Bluetooth connection status..."
    
    sshpass -p "$CAR_THING_PASS" ssh -o StrictHostKeyChecking=no "$CAR_THING_USER@$CAR_THING_IP" '
        echo "=== BLUETOOTH CONNECTION STATUS ==="
        echo "Timestamp: $(date)"
        echo ""
        
        # Adapter status
        echo "1. Adapter Status:"
        btmgmt info | grep -E "(name|current settings|addr)"
        echo ""
        
        # Connected devices
        echo "2. Connected Devices:"
        bluetoothctl << EOL
devices
info
exit
EOL
        echo ""
        
        # Active connections
        echo "3. Active Connections:"
        hciconfig -a 2>/dev/null || echo "hciconfig not available"
        echo ""
        
        # Running processes
        echo "4. Bluetooth Processes:"
        ps aux | grep -E "(bluetooth|rfcomm|spp)" | grep -v grep
        echo ""
        
        # Socket status
        echo "5. Socket Status:"
        netstat -tlnp | grep -E "(rfcomm|bluetooth)" || echo "No Bluetooth sockets found"
        echo ""
        
        # Recent logs
        echo "6. Recent Logs (last 20 lines):"
        dmesg | grep -i bluetooth | tail -20 || echo "No recent Bluetooth logs"
        echo ""
    '
}

# Show logs
show_logs() {
    log_info "Showing recent Bluetooth logs..."
    
    sshpass -p "$CAR_THING_PASS" ssh -o StrictHostKeyChecking=no "$CAR_THING_USER@$CAR_THING_IP" '
        echo "=== BLUETOOTH LOGS ==="
        echo ""
        
        echo "System logs (dmesg):"
        dmesg | grep -i bluetooth | tail -30
        echo ""
        
        echo "Kernel logs (if available):"
        journalctl -u bluetoothd --lines=20 2>/dev/null || echo "journalctl not available"
        echo ""
        
        echo "Service logs:"
        sv log bluetoothd 2>/dev/null | tail -10 || echo "No service logs available"
        echo ""
    '
}

# Monitor connections
monitor_connections() {
    log_info "Monitoring Bluetooth connections in real-time..."
    log_info "Try connecting from your Android device now..."
    log_warning "Press Ctrl+C to stop monitoring"
    
    sshpass -p "$CAR_THING_PASS" ssh -o StrictHostKeyChecking=no "$CAR_THING_USER@$CAR_THING_IP" '
        echo "=== BLUETOOTH CONNECTION MONITOR ==="
        echo "Watching for connection attempts..."
        echo ""
        
        # Monitor dmesg for Bluetooth events
        dmesg -w | grep -i bluetooth &
        DMESG_PID=$!
        
        # Monitor bluetoothctl
        bluetoothctl << EOL &
        scan on
        EOL
        
        # Wait for user interrupt
        trap "kill $DMESG_PID 2>/dev/null || true; exit 0" INT TERM
        
        while true; do
            echo "$(date): Monitoring... (Press Ctrl+C to stop)"
            sleep 5
        done
    '
}

# Fix common issues
fix_issues() {
    log_info "Attempting to fix common Bluetooth connection issues..."
    
    sshpass -p "$CAR_THING_PASS" ssh -o StrictHostKeyChecking=no "$CAR_THING_USER@$CAR_THING_IP" '
        set -e
        echo "=== BLUETOOTH CONNECTION FIX ==="
        echo ""
        
        # Remount filesystem as read-write
        mount -o remount,rw /
        
        echo "1. Clearing Bluetooth cache..."
        rm -rf /var/lib/bluetooth/* 2>/dev/null || true
        
        echo "2. Restarting Bluetooth services..."
        sv restart bluetoothd
        sleep 3
        sv restart bluetooth_adapter
        sleep 2
        
        echo "3. Resetting adapter..."
        hciconfig hci0 down 2>/dev/null || true
        sleep 1
        hciconfig hci0 up 2>/dev/null || true
        sleep 2
        
        echo "4. Configuring adapter for SPP..."
        bluetoothctl << EOL || true
        power on
        discoverable on
        pairable on
        agent NoInputNoOutput
        default-agent
        exit
EOL
        
        echo "5. Checking SPP service availability..."
        # Ensure SPP service is available
        sdptool browse local | grep -i "serial\|spp" || echo "SPP service may not be registered"
        
        echo "6. Final adapter configuration..."
        btmgmt power on
        btmgmt connectable on
        btmgmt discoverable on
        btmgmt bondable on
        
        # Remount filesystem as read-only
        sync
        mount -o remount,ro /
        
        echo ""
        echo "=== FIX COMPLETED ==="
        echo "Try pairing your Android device again."
        echo "Make sure to:"
        echo "1. Forget the device on Android first"
        echo "2. Search for new devices"
        echo "3. Pair with Nocturne (Q914)"
        echo "4. Open NocturneCompanion app immediately after pairing"
        echo ""
    '
    
    if [[ $? -eq 0 ]]; then
        log_success "Bluetooth fix completed"
    else
        log_error "Fix procedure encountered errors"
    fi
}

# Main execution
main() {
    log_info "Starting Bluetooth Debug Script..."
    
    # Test connectivity
    if ! test_connectivity; then
        log_error "Cannot connect to Car Thing"
        exit 1
    fi
    
    # Default to check if no options
    if [[ "$MONITOR" == false && "$CHECK" == false && "$FIX" == false && "$LOGS" == false ]]; then
        CHECK=true
    fi
    
    # Execute requested operations
    if [[ "$CHECK" == true ]]; then
        check_status
    fi
    
    if [[ "$LOGS" == true ]]; then
        show_logs
    fi
    
    if [[ "$FIX" == true ]]; then
        fix_issues
    fi
    
    if [[ "$MONITOR" == true ]]; then
        monitor_connections
    fi
}

# Run main function
main "$@"