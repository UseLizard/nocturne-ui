#!/bin/bash

# Bluetooth SPP Reset Script
# Resets Bluetooth configuration to SPP-only mode for NocturneCompanion connectivity
# Backs up current settings before making changes

set -e

# Configuration
CAR_THING_IP="172.16.42.2"
CAR_THING_USER="root"
CAR_THING_PASS="nocturne"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${SCRIPT_DIR}/bluetooth_backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
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
    echo "Bluetooth SPP Reset Script"
    echo "Resets Bluetooth configuration to SPP-only mode for NocturneCompanion connectivity"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help      Show this help message"
    echo "  -n, --dry-run   Show what would be done without making changes"
    echo "  -b, --backup    Only backup current settings (don't reset)"
    echo "  -r, --restore   Restore from backup (requires backup timestamp)"
    echo "  -l, --list      List available backups"
    echo "  --ip IP         Use custom Car Thing IP (default: $CAR_THING_IP)"
    echo ""
    echo "Examples:"
    echo "  $0                    # Backup and reset to SPP-only"
    echo "  $0 -n                 # Dry run (show changes)"
    echo "  $0 -b                 # Only backup current settings"
    echo "  $0 -r 20250108_143000 # Restore specific backup"
    echo "  $0 -l                 # List available backups"
    echo ""
}

# Parse command line arguments
DRY_RUN=false
BACKUP_ONLY=false
RESTORE_TIMESTAMP=""
LIST_BACKUPS=false
CUSTOM_IP=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -n|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -b|--backup)
            BACKUP_ONLY=true
            shift
            ;;
        -r|--restore)
            RESTORE_TIMESTAMP="$2"
            shift 2
            ;;
        -l|--list)
            LIST_BACKUPS=true
            shift
            ;;
        --ip)
            CUSTOM_IP="$2"
            shift 2
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Use custom IP if provided
if [[ -n "$CUSTOM_IP" ]]; then
    CAR_THING_IP="$CUSTOM_IP"
fi

# Check dependencies
check_dependencies() {
    local deps=("sshpass" "ssh")
    local missing=()
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            missing+=("$dep")
        fi
    done
    
    if [[ ${#missing[@]} -gt 0 ]]; then
        log_error "Missing dependencies: ${missing[*]}"
        log_info "Please install missing dependencies and try again"
        exit 1
    fi
}

# Test connectivity
test_connectivity() {
    log_info "Testing connectivity to Car Thing ($CAR_THING_IP)..."
    
    if sshpass -p "$CAR_THING_PASS" ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no "$CAR_THING_USER@$CAR_THING_IP" "echo 'SSH OK'" &>/dev/null; then
        log_success "SSH connection established"
        return 0
    else
        log_error "SSH connection failed"
        return 1
    fi
}

# List available backups
list_backups() {
    if [[ ! -d "$BACKUP_DIR" ]]; then
        log_warning "No backup directory found"
        return 0
    fi
    
    log_info "Available backups:"
    find "$BACKUP_DIR" -type d -name "backup_*" | sort -r | while read -r backup_path; do
        local backup_name=$(basename "$backup_path")
        local backup_time=$(echo "$backup_name" | sed 's/backup_//')
        local formatted_time=$(date -d "${backup_time:0:8} ${backup_time:9:2}:${backup_time:11:2}:${backup_time:13:2}" 2>/dev/null || echo "Unknown")
        echo "  $backup_time - $formatted_time"
    done
}

# Backup current settings
backup_settings() {
    local backup_path="$BACKUP_DIR/backup_$TIMESTAMP"
    
    log_info "Creating backup of current Bluetooth settings..."
    
    # Create backup directory
    mkdir -p "$backup_path"
    
    # Create backup info file
    cat > "$backup_path/backup_info.txt" << EOF
Bluetooth Settings Backup
Created: $(date)
Car Thing IP: $CAR_THING_IP
Backup Path: $backup_path
EOF
    
    # Backup current Bluetooth configuration
    sshpass -p "$CAR_THING_PASS" ssh -o StrictHostKeyChecking=no "$CAR_THING_USER@$CAR_THING_IP" '
        set -e
        echo "=== BLUETOOTH SETTINGS BACKUP ==="
        echo "Timestamp: $(date)"
        echo ""
        
        # Bluetooth service configuration
        echo "=== BLUETOOTH SERVICE CONFIG ==="
        if [ -f /etc/sv/bluetoothd/run ]; then
            echo "bluetoothd service config:"
            cat /etc/sv/bluetoothd/run
        fi
        echo ""
        
        # Main BlueZ configuration
        echo "=== BLUEZ MAIN CONFIG ==="
        if [ -f /etc/bluetooth/main.conf ]; then
            echo "main.conf:"
            cat /etc/bluetooth/main.conf
        fi
        echo ""
        
        # Current adapter settings
        echo "=== ADAPTER SETTINGS ==="
        echo "btmgmt info:"
        btmgmt info 2>/dev/null || echo "btmgmt not available"
        echo ""
        
        # Current device pairings
        echo "=== PAIRED DEVICES ==="
        bluetoothctl << EOL
devices
exit
EOL
        echo ""
        
        # Current network interfaces
        echo "=== NETWORK INTERFACES ==="
        ip addr show | grep -E "^[0-9]+:|inet "
        echo ""
        
        # Running processes
        echo "=== BLUETOOTH PROCESSES ==="
        ps aux | grep -E "(bluetooth|bnep|rfcomm)" | grep -v grep
        echo ""
        
        # Network services
        echo "=== NETWORK SERVICES ==="
        netstat -tlnp | grep -E "(5000|22|80)"
        echo ""
        
    ' > "$backup_path/bluetooth_config.txt"
    
    # Backup specific config files
    log_info "Backing up configuration files..."
    
    # Backup BlueZ config files
    sshpass -p "$CAR_THING_PASS" scp -o StrictHostKeyChecking=no "$CAR_THING_USER@$CAR_THING_IP:/etc/bluetooth/main.conf" "$backup_path/main.conf.backup" 2>/dev/null || log_warning "Could not backup main.conf"
    
    # Backup service files
    sshpass -p "$CAR_THING_PASS" scp -o StrictHostKeyChecking=no "$CAR_THING_USER@$CAR_THING_IP:/etc/sv/bluetoothd/run" "$backup_path/bluetoothd_run.backup" 2>/dev/null || log_warning "Could not backup bluetoothd service"
    
    # Create restore script
    cat > "$backup_path/restore.sh" << 'EOF'
#!/bin/bash
# Restore script for Bluetooth settings backup
# Generated automatically - do not edit

set -e

BACKUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CAR_THING_IP="172.16.42.2"
CAR_THING_USER="root"
CAR_THING_PASS="nocturne"

echo "Restoring Bluetooth settings from backup..."
echo "Backup directory: $BACKUP_DIR"

# Restore main.conf if it exists
if [[ -f "$BACKUP_DIR/main.conf.backup" ]]; then
    echo "Restoring main.conf..."
    sshpass -p "$CAR_THING_PASS" scp -o StrictHostKeyChecking=no "$BACKUP_DIR/main.conf.backup" "$CAR_THING_USER@$CAR_THING_IP:/etc/bluetooth/main.conf"
fi

# Restore bluetoothd service if it exists
if [[ -f "$BACKUP_DIR/bluetoothd_run.backup" ]]; then
    echo "Restoring bluetoothd service..."
    sshpass -p "$CAR_THING_PASS" scp -o StrictHostKeyChecking=no "$BACKUP_DIR/bluetoothd_run.backup" "$CAR_THING_USER@$CAR_THING_IP:/etc/sv/bluetoothd/run"
fi

# Restart Bluetooth service
echo "Restarting Bluetooth service..."
sshpass -p "$CAR_THING_PASS" ssh -o StrictHostKeyChecking=no "$CAR_THING_USER@$CAR_THING_IP" '
    mount -o remount,rw /
    sv restart bluetoothd
    sleep 2
    sv restart bluetooth_adapter
    mount -o remount,ro /
    sync
'

echo "Restore completed. Please check Bluetooth functionality."
EOF
    
    chmod +x "$backup_path/restore.sh"
    
    log_success "Backup created: $backup_path"
    log_info "To restore this backup, run: $0 -r $TIMESTAMP"
}

# Restore from backup
restore_settings() {
    local backup_path="$BACKUP_DIR/backup_$RESTORE_TIMESTAMP"
    
    if [[ ! -d "$backup_path" ]]; then
        log_error "Backup not found: $backup_path"
        return 1
    fi
    
    log_info "Restoring Bluetooth settings from backup: $RESTORE_TIMESTAMP"
    
    if [[ -f "$backup_path/restore.sh" ]]; then
        bash "$backup_path/restore.sh"
        log_success "Settings restored from backup"
    else
        log_error "Restore script not found in backup"
        return 1
    fi
}

# Reset to SPP-only configuration
reset_to_spp_only() {
    log_info "Resetting Bluetooth configuration to SPP-only mode..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log_info "DRY RUN: Would perform the following actions:"
        echo "  1. Disconnect existing Bluetooth network connections"
        echo "  2. Remove BNEP interface (bnep0)"
        echo "  3. Update BlueZ configuration to disable networking profiles"
        echo "  4. Restart Bluetooth services"
        echo "  5. Clear device cache and re-pair with SPP-only profile"
        return 0
    fi
    
    # Execute the reset
    sshpass -p "$CAR_THING_PASS" ssh -o StrictHostKeyChecking=no "$CAR_THING_USER@$CAR_THING_IP" '
        set -e
        echo "=== BLUETOOTH SPP RESET ==="
        echo "Starting Bluetooth reset to SPP-only configuration..."
        
        # Remount filesystem as read-write
        mount -o remount,rw /
        
        # Step 1: Disconnect existing Bluetooth network connections
        echo "Step 1: Disconnecting Bluetooth network connections..."
        
        # Kill BNEP processes
        if pgrep kbnepd >/dev/null 2>&1; then
            echo "  Killing BNEP processes..."
            pkill -f kbnepd || true
        fi
        
        # Bring down BNEP interface
        if ip link show bnep0 >/dev/null 2>&1; then
            echo "  Bringing down bnep0 interface..."
            ip link set bnep0 down || true
        fi
        
        # Step 2: Update BlueZ configuration
        echo "Step 2: Updating BlueZ configuration..."
        
        # Create or update main.conf to disable networking profiles
        cat > /etc/bluetooth/main.conf << EOF
[General]
Name = Nocturne (Q914)
Class = 0x000100
DiscoverableTimeout = 0
PairableTimeout = 0
AutoConnectTimeout = 60
EnableGatt = false

[Policy]
AutoEnable = true
ReconnectUUIDs = 00001101-0000-1000-8000-00805f9b34fb
ReconnectAttempts = 7
ReconnectIntervals = 1,2,4,8,16,32,64

[GATT]
Cache = no
KeySize = 16
ExchangeMTU = 517
Channels = 1

# Disable all networking profiles
[BR/EDR]
SDP = false
RFCOMM = true
L2CAP = true

# Explicitly disable problematic services
DisablePlugins = network,input,hog,gap,scanparam,deviceinfo,battery,heartrate,cyclingspeed,alert,time,proximity,thermometer,health,netstumbler,sap,a2dp,avrcp,hfp,hsp,pbap,map,opp,ftp,dun,panu,nap,gn
EOF
        
        # Step 3: Update bluetoothd service to run with restricted options
        echo "Step 3: Updating bluetoothd service configuration..."
        
        cat > /etc/sv/bluetoothd/run << EOF
#!/bin/sh
[ -r ./conf ] && . ./conf
sv check dbus >/dev/null || exit 1
exec 2>&1
# Run with minimal plugins and no networking
exec /usr/libexec/bluetooth/bluetoothd -n -P network,input,hog,gap,scanparam,deviceinfo,battery,heartrate,cyclingspeed,alert,time,proximity,thermometer,health,netstumbler,sap,a2dp,avrcp,hfp,hsp,pbap,map,opp,ftp,dun,panu,nap,gn
EOF
        
        # Step 4: Clear device cache and restart services
        echo "Step 4: Clearing device cache and restarting services..."
        
        # Clear Bluetooth device cache
        if [ -d /var/lib/bluetooth ]; then
            rm -rf /var/lib/bluetooth/* || true
        fi
        
        # Restart Bluetooth services
        echo "  Restarting bluetoothd..."
        sv restart bluetoothd
        sleep 3
        
        echo "  Restarting bluetooth_adapter..."
        sv restart bluetooth_adapter
        sleep 2
        
        # Step 5: Configure adapter for SPP-only mode
        echo "Step 5: Configuring adapter for SPP-only mode..."
        
        # Wait for adapter to be ready
        sleep 3
        
        # Set adapter to discoverable for pairing using bluetoothctl (more reliable)
        bluetoothctl << EOL || true
power on
discoverable on
pairable on
exit
EOL
        
        # Brief verification
        echo "Verifying configuration..."
        if ! ip addr show bnep0 >/dev/null 2>&1; then
            echo "✓ bnep0 interface successfully removed"
        else
            echo "⚠ bnep0 interface still present"
        fi
        
        if pgrep -f "bluetoothd.*-P.*network" >/dev/null 2>&1; then
            echo "✓ bluetoothd running with networking profiles disabled"
        else
            echo "⚠ bluetoothd may not have networking profiles disabled"
        fi
        
        # Remount filesystem as read-only
        sync
        mount -o remount,ro /
        
        echo "=== BLUETOOTH SPP RESET COMPLETED ==="
        echo "Bluetooth is now configured for SPP-only mode"
        echo "You can now pair your Android device with NocturneCompanion"
        echo ""
        echo "To verify the configuration:"
        echo "  1. Check adapter status: btmgmt info"
        echo "  2. Pair Android device with NocturneCompanion"
        echo "  3. Verify SPP connection works for media control"
        echo ""
        
    ' || {
        log_error "Failed to reset Bluetooth configuration"
        return 1
    }
    
    log_success "Bluetooth configuration reset to SPP-only mode"
    log_info "You can now pair your Android device with NocturneCompanion"
    log_warning "Note: You may need to unpair and re-pair your Android device"
}

# Main execution
main() {
    log_info "Starting Bluetooth SPP Reset Script..."
    
    # Check dependencies
    check_dependencies
    
    # Handle list backups
    if [[ "$LIST_BACKUPS" == true ]]; then
        list_backups
        exit 0
    fi
    
    # Handle restore
    if [[ -n "$RESTORE_TIMESTAMP" ]]; then
        if ! test_connectivity; then
            log_error "Cannot connect to Car Thing"
            exit 1
        fi
        restore_settings
        exit 0
    fi
    
    # Test connectivity
    if ! test_connectivity; then
        log_error "Cannot connect to Car Thing. Please check:"
        log_error "  1. Car Thing is powered on and connected"
        log_error "  2. IP address is correct ($CAR_THING_IP)"
        log_error "  3. SSH is enabled and password is correct"
        exit 1
    fi
    
    # Always backup current settings unless restoring
    if [[ "$BACKUP_ONLY" == false ]]; then
        backup_settings
    fi
    
    # Only backup if requested
    if [[ "$BACKUP_ONLY" == true ]]; then
        backup_settings
        exit 0
    fi
    
    # Perform the reset
    reset_to_spp_only
    
    log_success "Bluetooth SPP reset completed successfully"
    log_info "Backup saved to: $BACKUP_DIR/backup_$TIMESTAMP"
    log_info "To restore original settings, run: $0 -r $TIMESTAMP"
}

# Run main function
main "$@"