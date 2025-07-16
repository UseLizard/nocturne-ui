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
