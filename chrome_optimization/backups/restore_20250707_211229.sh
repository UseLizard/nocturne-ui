#!/bin/bash
# Restore script for configuration backup from 20250707_211229

echo "Restoring Car Thing configuration from backup 20250707_211229..."

# Restore Weston service
sshpass -p "nocturne" ssh root@172.16.42.2 "mount -o remount,rw / && cp /etc/init.d/weston /etc/init.d/weston.backup"
sshpass -p "nocturne" scp "/home/paultownwrites/Google Drive/nocturne-ui/chrome_optimization/backups/weston_service_20250707_211229.txt" root@172.16.42.2:/etc/init.d/weston

# Restore Weston config
sshpass -p "nocturne" scp "/home/paultownwrites/Google Drive/nocturne-ui/chrome_optimization/backups/weston_ini_20250707_211229.txt" root@172.16.42.2:/etc/weston/weston.ini

# Restart services and remount
sshpass -p "nocturne" ssh root@172.16.42.2 "sync && rc-service weston restart && mount -o remount,ro /"

echo "Restore completed!"
