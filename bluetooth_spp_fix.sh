#!/bin/bash

# Bluetooth SPP Fix Script
# Fixes the SPP configuration to enable SPP while disabling only networking profiles

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

log_info "Fixing Bluetooth SPP configuration..."
log_warning "This will enable SPP while keeping networking profiles disabled"

# Test connectivity
if ! sshpass -p "$CAR_THING_PASS" ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no "$CAR_THING_USER@$CAR_THING_IP" "echo 'SSH OK'" &>/dev/null; then
    log_error "Cannot connect to Car Thing"
    exit 1
fi

log_success "Connected to Car Thing"

# Apply the fix
sshpass -p "$CAR_THING_PASS" ssh -o StrictHostKeyChecking=no "$CAR_THING_USER@$CAR_THING_IP" '
    set -e
    echo "=== BLUETOOTH SPP FIX ==="
    echo "Fixing SPP configuration..."
    
    # Remount filesystem as read-write
    mount -o remount,rw /
    
    echo "1. Updating BlueZ configuration for SPP + no networking..."
    
    # Create corrected main.conf that enables SPP but disables networking
    cat > /etc/bluetooth/main.conf << EOF
[General]
Name = Nocturne (Q914)
Class = 0x000100
DiscoverableTimeout = 0
PairableTimeout = 0
AutoConnectTimeout = 60
EnableGatt = true

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
EOF
    
    echo "2. Updating bluetoothd service to ONLY disable networking plugins..."
    
    # Updated service that only disables networking plugins but keeps SPP
    cat > /etc/sv/bluetoothd/run << EOF
#!/bin/sh
[ -r ./conf ] && . ./conf
sv check dbus >/dev/null || exit 1
exec 2>&1
# Only disable networking plugins, keep SPP and essential services
exec /usr/libexec/bluetooth/bluetoothd -n -P network,panu,nap,gn,dun
EOF
    
    echo "3. Clearing device cache and restarting services..."
    
    # Clear Bluetooth device cache
    rm -rf /var/lib/bluetooth/* 2>/dev/null || true
    
    echo "4. Restarting Bluetooth services..."
    sv restart bluetoothd
    sleep 3
    sv restart bluetooth_adapter
    sleep 2
    
    echo "5. Configuring adapter..."
    bluetoothctl << EOL || true
power on
discoverable on
pairable on
agent NoInputNoOutput
default-agent
exit
EOL
    
    echo "6. Verifying SPP service..."
    sleep 2
    if sdptool browse local | grep -i "serial\|spp" >/dev/null 2>&1; then
        echo "✓ SPP service is available"
        sdptool browse local | grep -A 5 -i "serial\|spp"
    else
        echo "⚠ SPP service may not be available yet, waiting..."
        sleep 3
        sdptool browse local | grep -A 5 -i "serial\|spp" || echo "Still no SPP service found"
    fi
    
    echo "7. Final adapter status..."
    btmgmt info | grep -E "(name|current settings)"
    
    # Remount filesystem as read-only
    sync
    mount -o remount,ro /
    
    echo ""
    echo "=== SPP FIX COMPLETED ==="
    echo "SPP should now be available while networking is disabled"
    echo ""
    
' || {
    log_error "Failed to apply SPP fix"
    exit 1
}

log_success "SPP fix applied successfully!"
log_info "Now try these steps:"
echo ""
echo "1. On your Android device:"
echo "   - Go to Bluetooth settings"
echo "   - Forget/unpair 'Nocturne (Q914)' if it exists"
echo "   - Search for devices and pair again"
echo ""
echo "2. Immediately after pairing:"
echo "   - Open NocturneCompanion app"
echo "   - It should connect via SPP"
echo ""
echo "3. If it still doesn't work:"
echo "   - Run: ./bluetooth_debug.sh -m"
echo "   - Then try connecting and watch the logs"