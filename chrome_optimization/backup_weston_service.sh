#!/bin/bash

# Backup current Weston configuration before optimization
# This script creates backups of the current configuration

set -e

BACKUP_DIR="/home/paultownwrites/Google Drive/nocturne-ui/chrome_optimization/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "Creating backup directory..."
mkdir -p "$BACKUP_DIR"

echo "Backing up current Car Thing configuration..."

# Backup Weston service
sshpass -p "nocturne" ssh root@172.16.42.2 "cat /etc/init.d/weston" > "$BACKUP_DIR/weston_service_${TIMESTAMP}.txt"

# Backup Weston config
sshpass -p "nocturne" ssh root@172.16.42.2 "cat /etc/weston/weston.ini" > "$BACKUP_DIR/weston_ini_${TIMESTAMP}.txt" 2>/dev/null || echo "No weston.ini found" > "$BACKUP_DIR/weston_ini_${TIMESTAMP}.txt"

# Backup nocturned service
sshpass -p "nocturne" ssh root@172.16.42.2 "cat /etc/init.d/nocturned" > "$BACKUP_DIR/nocturned_service_${TIMESTAMP}.txt" 2>/dev/null || echo "No nocturned service found" > "$BACKUP_DIR/nocturned_service_${TIMESTAMP}.txt"

# Get current environment variables
sshpass -p "nocturne" ssh root@172.16.42.2 "env" > "$BACKUP_DIR/environment_${TIMESTAMP}.txt"

# Get current GPU/graphics status
sshpass -p "nocturne" ssh root@172.16.42.2 "
    echo '=== GPU DEVICES ===' && ls -la /dev/mali* /dev/dri/ 2>/dev/null || echo 'No GPU devices found'
    echo -e '\n=== GPU FREQUENCY ===' && cat /sys/class/devfreq/1c20000.gpu/cur_freq 2>/dev/null || echo 'GPU frequency not available'
    echo -e '\n=== GPU GOVERNOR ===' && cat /sys/class/devfreq/1c20000.gpu/governor 2>/dev/null || echo 'GPU governor not available'
    echo -e '\n=== THERMAL ZONES ===' && cat /sys/class/thermal/thermal_zone*/temp 2>/dev/null || echo 'Thermal zones not available'
    echo -e '\n=== CURRENT PROCESSES ===' && ps aux | grep -E 'weston|chromium|nocturned'
" > "$BACKUP_DIR/gpu_status_${TIMESTAMP}.txt"

echo "Backup completed successfully!"
echo "Backup files saved to: $BACKUP_DIR"
echo "Timestamp: $TIMESTAMP"

# Create restore script
cat > "$BACKUP_DIR/restore_${TIMESTAMP}.sh" << EOF
#!/bin/bash
# Restore script for configuration backup from $TIMESTAMP

echo "Restoring Car Thing configuration from backup $TIMESTAMP..."

# Restore Weston service
sshpass -p "nocturne" ssh root@172.16.42.2 "mount -o remount,rw / && cp /etc/init.d/weston /etc/init.d/weston.backup"
sshpass -p "nocturne" scp "$BACKUP_DIR/weston_service_${TIMESTAMP}.txt" root@172.16.42.2:/etc/init.d/weston

# Restore Weston config
sshpass -p "nocturne" scp "$BACKUP_DIR/weston_ini_${TIMESTAMP}.txt" root@172.16.42.2:/etc/weston/weston.ini

# Restart services and remount
sshpass -p "nocturne" ssh root@172.16.42.2 "sync && rc-service weston restart && mount -o remount,ro /"

echo "Restore completed!"
EOF

chmod +x "$BACKUP_DIR/restore_${TIMESTAMP}.sh"
echo "Restore script created: $BACKUP_DIR/restore_${TIMESTAMP}.sh"