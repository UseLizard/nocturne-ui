#!/bin/bash

# Deploy GPU Optimization for Nocturne Car Thing
# Complete deployment script with safety checks and rollback capability

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/deployment_$(date +%Y%m%d_%H%M%S).log"

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
    echo "Deploy GPU Optimization for Nocturne Car Thing"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help           Show this help message"
    echo "  -t, --test-only      Test connectivity and show current status"
    echo "  -f, --force          Skip safety checks and confirmations"
    echo "  --skip-backup        Skip creating backup (not recommended)"
    echo "  --dry-run           Show what would be done without executing"
    echo ""
    echo "Deployment steps:"
    echo "  1. Test connectivity"
    echo "  2. Create backup"
    echo "  3. Install Mali GPU optimization"
    echo "  4. Configure optimized Chrome flags"
    echo "  5. Install verification tools"
    echo "  6. Test deployment"
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

get_current_status() {
    log_info "Getting current system status..."
    
    sshpass -p "nocturne" ssh root@172.16.42.2 '
        echo "=== CURRENT SYSTEM STATUS ==="
        echo "Date: $(date)"
        echo "Uptime: $(uptime)"
        echo ""
        echo "--- GPU Devices ---"
        ls -la /dev/mali* /dev/dri/ 2>/dev/null || echo "No GPU devices found"
        echo ""
        echo "--- Current Chrome Flags ---"
        ps aux | grep chromium | head -1 | sed "s/.*chromium/chromium/" || echo "Chrome not running"
        echo ""
        echo "--- Memory Usage ---"
        free -h
        echo ""
        echo "--- Services ---"
        rc-status | grep -E "(weston|nocturned)" || echo "No services found"
    '
}

# Parse command line arguments
TEST_ONLY=false
FORCE=false
SKIP_BACKUP=false
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
        --skip-backup)
            SKIP_BACKUP=true
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
    log_info "Starting Nocturne GPU Optimization Deployment"
    log_info "Log file: $LOG_FILE"
    echo ""
    
    # Test connectivity
    if ! test_connectivity; then
        log_error "Cannot connect to Car Thing. Exiting."
        exit 1
    fi
    
    # Show current status
    get_current_status
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
        echo "  2. Install Mali GPU environment and optimization scripts"
        echo "  3. Update Weston service with GPU-accelerated Chrome flags"
        echo "  4. Install GPU verification and monitoring tools"
        echo "  5. Restart services and test deployment"
        exit 0
    fi
    
    # Confirmation prompt
    if [[ "$FORCE" != true ]]; then
        echo ""
        log_warning "This will modify the Car Thing system configuration."
        log_warning "A backup will be created, but there are always risks."
        echo ""
        read -p "Continue with GPU optimization deployment? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Deployment cancelled by user"
            exit 0
        fi
    fi
    
    # Step 1: Create backup
    if [[ "$SKIP_BACKUP" != true ]]; then
        log_info "Step 1: Creating backup..."
        if ! "$SCRIPT_DIR/backup_weston_service.sh"; then
            log_error "Backup failed. Aborting deployment."
            exit 1
        fi
        log_success "Backup completed"
    else
        log_warning "Skipping backup as requested"
    fi
    
    # Step 2: Install Mali GPU optimization
    log_info "Step 2: Installing Mali GPU optimization..."
    if ! "$SCRIPT_DIR/mali_gpu_optimization.sh"; then
        log_error "Mali GPU optimization failed"
        exit 1
    fi
    log_success "Mali GPU optimization installed"
    
    # Step 3: Configure optimized Chrome flags
    log_info "Step 3: Configuring optimized Chrome flags..."
    if ! "$SCRIPT_DIR/optimized_chrome_flags.sh"; then
        log_error "Chrome flags configuration failed"
        exit 1
    fi
    log_success "Optimized Chrome flags configured"
    
    # Step 4: Install verification tools
    log_info "Step 4: Installing GPU verification tools..."
    if ! "$SCRIPT_DIR/gpu_verification_tools.sh"; then
        log_error "GPU verification tools installation failed"
        exit 1
    fi
    log_success "GPU verification tools installed"
    
    # Step 5: Test deployment
    log_info "Step 5: Testing deployment..."
    
    log_info "Restarting services..."
    sshpass -p "nocturne" ssh root@172.16.42.2 "
        mount -o remount,rw /
        rc-service weston restart
        rc-service nocturned restart
        sync
        mount -o remount,ro /
    "
    
    sleep 10  # Give services time to start
    
    log_info "Running post-deployment verification..."
    sshpass -p "nocturne" ssh root@172.16.42.2 "
        if command -v gpu-status >/dev/null 2>&1; then
            echo '=== POST-DEPLOYMENT GPU STATUS ==='
            gpu-status
        else
            echo 'GPU status command not available'
        fi
    " | tee -a "$LOG_FILE"
    
    log_success "Deployment completed successfully!"
    echo ""
    log_info "Next steps:"
    echo "  1. Monitor the system for stability over the next few minutes"
    echo "  2. Check GPU acceleration with: ssh root@172.16.42.2 'gpu-status'"
    echo "  3. Run performance test with: ssh root@172.16.42.2 'gpu-benchmark'"
    echo "  4. Monitor continuously with: ssh root@172.16.42.2 'gpu-monitor'"
    echo ""
    log_info "If issues occur, run the restore script:"
    echo "  $SCRIPT_DIR/backups/restore_*.sh"
}

# Run main function
main "$@"