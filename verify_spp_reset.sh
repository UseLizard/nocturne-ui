#!/bin/bash

# Verify SPP Reset Script
# Checks if Bluetooth SPP reset was successful

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

echo "=== BLUETOOTH SPP RESET VERIFICATION ==="
echo ""

log_info "Checking Bluetooth configuration on Car Thing..."

# Test connectivity
if ! sshpass -p "$CAR_THING_PASS" ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no "$CAR_THING_USER@$CAR_THING_IP" "echo 'SSH OK'" &>/dev/null; then
    log_error "Cannot connect to Car Thing"
    exit 1
fi

# Run verification checks
sshpass -p "$CAR_THING_PASS" ssh -o StrictHostKeyChecking=no "$CAR_THING_USER@$CAR_THING_IP" '
    echo "Checking SPP reset status..."
    echo ""
    
    # Check 1: bnep0 interface should be gone
    echo "1. Checking for bnep0 interface:"
    if ip addr show bnep0 >/dev/null 2>&1; then
        echo "   ❌ bnep0 interface still present - tethering may still be active"
        ip addr show bnep0 | grep "inet "
    else
        echo "   ✅ bnep0 interface removed - no more Bluetooth tethering"
    fi
    echo ""
    
    # Check 2: kbnepd process should be gone
    echo "2. Checking for kbnepd process:"
    if pgrep kbnepd >/dev/null 2>&1; then
        echo "   ❌ kbnepd process still running"
        ps aux | grep kbnepd | grep -v grep
    else
        echo "   ✅ kbnepd process not running - network daemon stopped"
    fi
    echo ""
    
    # Check 3: bluetoothd should be running with disabled profiles
    echo "3. Checking bluetoothd configuration:"
    if pgrep -f "bluetoothd.*-P.*network" >/dev/null 2>&1; then
        echo "   ✅ bluetoothd running with networking profiles disabled"
        ps aux | grep bluetoothd | grep -v grep | head -1
    else
        echo "   ❌ bluetoothd may not have networking profiles disabled"
        ps aux | grep bluetoothd | grep -v grep | head -1
    fi
    echo ""
    
    # Check 4: Adapter status
    echo "4. Checking Bluetooth adapter status:"
    btmgmt info | grep -E "(name|current settings|addr)"
    echo ""
    
    # Check 5: Network interfaces summary
    echo "5. Current network interfaces:"
    ip addr show | grep -E "^[0-9]+:" | grep -v "lo\|tunl\|vti\|sit"
    echo ""
    
    # Summary
    echo "=== SUMMARY ==="
    ISSUES=0
    
    if ip addr show bnep0 >/dev/null 2>&1; then
        echo "❌ Bluetooth tethering interface still active"
        ISSUES=$((ISSUES + 1))
    else
        echo "✅ Bluetooth tethering disabled"
    fi
    
    if pgrep kbnepd >/dev/null 2>&1; then
        echo "❌ Bluetooth network daemon still running"
        ISSUES=$((ISSUES + 1))
    else
        echo "✅ Bluetooth network daemon stopped"
    fi
    
    if pgrep -f "bluetoothd.*-P.*network" >/dev/null 2>&1; then
        echo "✅ BlueZ configured for SPP-only mode"
    else
        echo "❌ BlueZ may not be properly configured"
        ISSUES=$((ISSUES + 1))
    fi
    
    echo ""
    if [ $ISSUES -eq 0 ]; then
        echo "🎉 SPP RESET SUCCESSFUL!"
        echo "   Your Car Thing is now configured for SPP-only Bluetooth connectivity."
        echo "   You can pair your Android device with NocturneCompanion."
    else
        echo "⚠️  SPP RESET PARTIALLY SUCCESSFUL"
        echo "   $ISSUES issue(s) detected. You may want to run the reset script again."
    fi
    
    echo ""
    echo "Next steps:"
    echo "1. On your Android device, forget/unpair the Car Thing if previously paired"
    echo "2. Search for Bluetooth devices and pair with \"Nocturne (Q914)\""
    echo "3. Open NocturneCompanion app - it should connect via SPP only"
    echo ""
'