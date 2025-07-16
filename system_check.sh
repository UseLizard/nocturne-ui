#!/bin/bash

# System Check - Convenient wrapper for Nocturne Car Thing system analysis
# Usage: ./system_check.sh [options]

set -e

# Configuration
CAR_THING_IP="172.16.42.2"
CAR_THING_USER="root"
CAR_THING_PASS="nocturne"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="${SCRIPT_DIR}/system_reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

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
    echo "System Check - Nocturne Car Thing System Analysis"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help      Show this help message"
    echo "  -j, --json      Output in JSON format"
    echo "  -m, --minimal   Minimal output (key info only)"
    echo "  -q, --quick     Quick check (connectivity + key services)"
    echo "  -s, --save      Save output to timestamped file"
    echo "  -v, --verbose   Verbose output"
    echo "  --compare FILE  Compare with previous report"
    echo "  --ip IP         Use custom Car Thing IP (default: $CAR_THING_IP)"
    echo ""
    echo "Examples:"
    echo "  $0                    # Basic system check"
    echo "  $0 -s -j              # Save JSON report"
    echo "  $0 -q                 # Quick connectivity check"
    echo "  $0 --compare system_reports/20240107_143000.txt"
    echo ""
}

# Parse command line arguments
JSON_OUTPUT=false
MINIMAL=false
QUICK=false
SAVE=false
VERBOSE=false
COMPARE_FILE=""
CUSTOM_IP=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -j|--json)
            JSON_OUTPUT=true
            shift
            ;;
        -m|--minimal)
            MINIMAL=true
            shift
            ;;
        -q|--quick)
            QUICK=true
            shift
            ;;
        -s|--save)
            SAVE=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        --compare)
            COMPARE_FILE="$2"
            shift 2
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
    local deps=("sshpass" "ssh" "curl")
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
    
    # Test SSH connectivity
    if sshpass -p "$CAR_THING_PASS" ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no "$CAR_THING_USER@$CAR_THING_IP" "echo 'SSH OK'" &>/dev/null; then
        log_success "SSH connection established"
    else
        log_error "SSH connection failed"
        return 1
    fi
    
    # Test HTTP connectivity
    if curl -s --connect-timeout 5 "http://$CAR_THING_IP" &>/dev/null; then
        log_success "HTTP connection established"
    else
        log_warning "HTTP connection failed (may be normal)"
    fi
    
    return 0
}

# Quick check function
quick_check() {
    log_info "Performing quick system check..."
    
    # Check key services
    sshpass -p "$CAR_THING_PASS" ssh -o StrictHostKeyChecking=no "$CAR_THING_USER@$CAR_THING_IP" '
        echo "=== QUICK SYSTEM CHECK ==="
        echo "Timestamp: $(date)"
        echo ""
        echo "Key Services:"
        echo "  Nocturned: $(rc-service nocturned status 2>/dev/null | grep -o "started\|stopped\|crashed" || echo "unknown")"
        echo "  Caddy: $(rc-service caddy status 2>/dev/null | grep -o "started\|stopped\|crashed" || echo "unknown")"
        echo "  Weston: $(rc-service weston status 2>/dev/null | grep -o "started\|stopped\|crashed" || echo "unknown")"
        echo ""
        echo "System Health:"
        echo "  Uptime: $(uptime | cut -d"," -f1)"
        echo "  Load: $(uptime | sed "s/.*load average: //")"
        echo "  Memory: $(free -h | grep Mem | awk "{print \$3\"/\"\$2\" used\"}")"
        echo "  Disk: $(df -h / | tail -n 1 | awk "{print \$5\" used\"}")"
        echo ""
        echo "Network:"
        echo "  IP: $(ip route get 1 2>/dev/null | head -n 1 | awk "{print \$7}" || echo "unknown")"
        echo "  Bluetooth: $(hciconfig 2>/dev/null | grep -o "hci[0-9]*" | head -n 1 || echo "none")"
        echo ""
        echo "API Status:"
        echo "  Port 5000: $(netstat -tlnp 2>/dev/null | grep -q ":5000 " && echo "listening" || echo "not listening")"
        echo "  Media API: $(wget -q -O - --timeout=3 http://localhost:5000/media/status >/dev/null 2>&1 && echo "accessible" || echo "not accessible")"
    '
}

# Full system check
full_check() {
    log_info "Performing full system analysis..."
    
    # Build script arguments
    local script_args=""
    if [[ "$JSON_OUTPUT" == true ]]; then
        script_args="$script_args --json"
    fi
    if [[ "$MINIMAL" == true ]]; then
        script_args="$script_args --minimal"
    fi
    
    # Run the enhanced system map script
    sshpass -p "$CAR_THING_PASS" ssh -o StrictHostKeyChecking=no "$CAR_THING_USER@$CAR_THING_IP" 'sh -s' $script_args < "$SCRIPT_DIR/system_map_enhanced.sh"
}

# Save output function
save_output() {
    local content="$1"
    local extension="txt"
    
    if [[ "$JSON_OUTPUT" == true ]]; then
        extension="json"
    fi
    
    # Create output directory
    mkdir -p "$OUTPUT_DIR"
    
    local output_file="$OUTPUT_DIR/system_report_${TIMESTAMP}.${extension}"
    echo "$content" > "$output_file"
    
    log_success "Report saved to: $output_file"
    
    # Keep only last 10 reports
    find "$OUTPUT_DIR" -name "system_report_*.${extension}" -type f | sort -r | tail -n +11 | xargs rm -f 2>/dev/null || true
}

# Compare function
compare_reports() {
    local file1="$1"
    local file2="$2"
    
    if [[ ! -f "$file1" ]]; then
        log_error "File not found: $file1"
        return 1
    fi
    
    if [[ ! -f "$file2" ]]; then
        log_error "File not found: $file2"
        return 1
    fi
    
    log_info "Comparing reports..."
    diff -u "$file1" "$file2" || true
}

# Main execution
main() {
    log_info "Starting Nocturne Car Thing system check..."
    
    # Check dependencies
    check_dependencies
    
    # Test connectivity
    if ! test_connectivity; then
        log_error "Cannot connect to Car Thing. Please check:"
        log_error "  1. Car Thing is powered on and connected"
        log_error "  2. IP address is correct ($CAR_THING_IP)"
        log_error "  3. SSH is enabled and password is correct"
        exit 1
    fi
    
    # Perform the appropriate check
    local output
    if [[ "$QUICK" == true ]]; then
        output=$(quick_check)
    else
        output=$(full_check)
    fi
    
    # Handle output
    if [[ "$SAVE" == true ]]; then
        save_output "$output"
    fi
    
    # Handle comparison
    if [[ -n "$COMPARE_FILE" ]]; then
        local current_file="/tmp/current_report_${TIMESTAMP}.txt"
        echo "$output" > "$current_file"
        compare_reports "$COMPARE_FILE" "$current_file"
        rm -f "$current_file"
    fi
    
    # Display output if not saving or comparing
    if [[ "$SAVE" == false && -z "$COMPARE_FILE" ]]; then
        echo "$output"
    fi
    
    log_success "System check completed"
}

# Run main function
main "$@"