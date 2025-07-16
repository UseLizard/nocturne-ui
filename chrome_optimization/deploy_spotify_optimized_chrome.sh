#!/bin/bash

# Deploy Spotify Car Thing Hardware-Optimized Chrome
# Conservative deployment with hardware-specific optimizations

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/spotify_deployment_$(date +%Y%m%d_%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

show_help() {
    echo "Deploy Spotify Car Thing Hardware-Optimized Chrome"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help           Show this help message"
    echo "  -t, --test-only      Test connectivity and show current status"
    echo "  -f, --force          Skip safety checks and confirmations"
    echo "  --dry-run           Show what would be done without executing"
    echo ""
    echo "Hardware-specific optimizations:"
    echo "  - Amlogic S905D2 SoC optimization"
    echo "  - Mali T60x GPU with DRM backend"
    echo "  - 512MB RAM memory management"
    echo "  - ARM Cortex-A53 performance tuning"
    echo ""
}

test_connectivity() {
    log_info "Testing connectivity to Car Thing..."
    
    if sshpass -p "nocturne" ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@172.16.42.2 "echo 'SSH OK'" &>/dev/null; then
        log_success "SSH connection established"
        return 0
    else
        log_error "SSH connection failed"
        return 1
    fi
}

analyze_hardware() {
    log_info "Analyzing Spotify Car Thing hardware..."
    
    sshpass -p "nocturne" ssh root@172.16.42.2 '
        echo "=== SPOTIFY CAR THING HARDWARE ANALYSIS ==="
        echo "Date: $(date)"
        echo ""
        
        echo "--- CPU Information ---"
        grep -E "processor|Hardware|Features|CPU part" /proc/cpuinfo | head -8
        echo "CPU Cores: $(nproc)"
        echo ""
        
        echo "--- Memory Information ---"
        free -h
        echo ""
        
        echo "--- Graphics Hardware ---"
        echo "DRM Devices:"
        ls -la /dev/dri/ 2>/dev/null || echo "No DRM devices found"
        echo ""
        echo "Graphics Platform Info:"
        cat /sys/devices/platform/*/uevent | grep -E "mali|drm" | head -5 || echo "No GPU platform info"
        echo ""
        
        echo "--- Current Chrome Process ---"
        ps aux | grep chromium | grep -v crashpad | head -1 | cut -c1-100 || echo "Chrome not running"
        echo ""
        
        echo "--- Memory Usage ---"
        echo "Total Chrome Memory: $(ps aux | grep chromium | awk "{sum += \$6} END {print sum/1024}" 2>/dev/null || echo 0) MB"
        echo ""
        
        echo "--- Display Information ---"
        if [ -f /sys/class/backlight/*/brightness ]; then
            BRIGHTNESS=$(cat /sys/class/backlight/*/brightness)
            MAX_BRIGHTNESS=$(cat /sys/class/backlight/*/max_brightness)
            echo "Display Brightness: $BRIGHTNESS/$MAX_BRIGHTNESS"
        fi
        echo ""
        
        echo "--- Temperature ---"
        if [ -f /sys/class/thermal/thermal_zone0/temp ]; then
            TEMP=$(cat /sys/class/thermal/thermal_zone0/temp)
            echo "System Temperature: $((TEMP / 1000))°C"
        fi
    '
}

# Parse command line arguments
TEST_ONLY=false
FORCE=false
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -t|--test-only)
            TEST_ONLY=true
            shift
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Main deployment function
main() {
    log_info "Starting Spotify Car Thing Hardware-Optimized Chrome Deployment"
    log_info "Log file: $LOG_FILE"
    echo ""
    
    # Test connectivity
    if ! test_connectivity; then
        log_error "Cannot connect to Car Thing. Exiting."
        exit 1
    fi
    
    # Analyze hardware
    analyze_hardware
    echo ""
    
    # Exit if test-only mode
    if [[ "$TEST_ONLY" == true ]]; then
        log_info "Test-only mode completed"
        exit 0
    fi
    
    # Show what will be done
    if [[ "$DRY_RUN" == true ]]; then
        log_info "DRY RUN - The following would be executed:"
        echo "  1. Create backup of current configuration"
        echo "  2. Install Amlogic S905D2 + Mali T60x optimizations"
        echo "  3. Configure memory management for 512MB RAM"
        echo "  4. Set up ARM Cortex-A53 performance optimizations"
        echo "  5. Update Weston with DRM backend and conservative GPU acceleration"
        echo "  6. Deploy hardware-specific Chrome flags"
        echo "  7. Test deployment"
        exit 0
    fi
    
    # Confirmation prompt
    if [[ "$FORCE" != true ]]; then
        echo ""
        log_warning "This will deploy hardware-optimized Chrome configuration."
        log_warning "The optimization is conservative and hardware-specific."
        echo ""
        read -p "Continue with Spotify Car Thing optimization? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Deployment cancelled by user"
            exit 0
        fi
    fi
    
    # Step 1: Create backup
    log_info "Step 1: Creating backup..."
    if ! "$SCRIPT_DIR/backup_weston_service.sh"; then
        log_error "Backup failed. Aborting deployment."
        exit 1
    fi
    log_success "Backup completed"
    
    # Step 2: Deploy Spotify hardware optimizations
    log_info "Step 2: Deploying Spotify Car Thing hardware optimizations..."
    if ! "$SCRIPT_DIR/spotify_hardware_optimized_chrome.sh"; then
        log_error "Hardware optimization deployment failed"
        exit 1
    fi
    log_success "Hardware optimizations deployed"
    
    # Step 3: Test deployment
    log_info "Step 3: Testing deployment..."
    
    log_info "Restarting services..."
    sshpass -p "nocturne" ssh root@172.16.42.2 "
        mount -o remount,rw /
        /usr/bin/optimize-system start
        rc-service weston restart
        sync
        mount -o remount,ro /
    "
    
    sleep 15  # Give services more time to start
    
    log_info "Running post-deployment verification..."
    sshpass -p "nocturne" ssh root@172.16.42.2 "
        echo '=== POST-DEPLOYMENT STATUS ==='
        
        echo 'Services:'
        rc-status | grep -E '(weston|optimize)' || echo 'Services not found'
        
        echo -e '\nChrome Process:'
        if pgrep chromium >/dev/null; then
            echo 'Chrome is running'
            ps aux | grep chromium | grep -v crashpad | head -1 | cut -c1-80
        else
            echo 'Chrome is not running'
        fi
        
        echo -e '\nMemory Usage:'
        free -h | grep Mem
        
        echo -e '\nTemperature:'
        if [ -f /sys/class/thermal/thermal_zone0/temp ]; then
            TEMP=\$(cat /sys/class/thermal/thermal_zone0/temp)
            echo \"System Temperature: \$((TEMP / 1000))°C\"
        fi
        
        echo -e '\nOptimization Status:'
        if [ -x /usr/bin/optimize-memory ]; then
            echo '✓ Memory optimization script installed'
        fi
        if [ -x /usr/bin/optimize-cpu ]; then
            echo '✓ CPU optimization script installed'
        fi
        if [ -f /etc/profile.d/amlogic-graphics.sh ]; then
            echo '✓ Amlogic graphics environment configured'
        fi
    " | tee -a "$LOG_FILE"
    
    log_success "Deployment completed successfully!"
    echo ""
    log_info "Spotify Car Thing optimization summary:"
    echo "  ✓ Hardware-specific DRM backend configuration"
    echo "  ✓ Conservative GPU acceleration for Mali T60x"
    echo "  ✓ Memory optimization for 512MB RAM constraint"
    echo "  ✓ ARM Cortex-A53 performance tuning"
    echo "  ✓ Cache management and background process optimization"
    echo ""
    log_info "Monitor the system for performance improvements."
    log_info "If issues occur, run the restore script:"
    echo "  $SCRIPT_DIR/backups/restore_*.sh"
}

# Run main function
main "$@"