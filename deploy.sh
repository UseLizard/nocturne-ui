#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Define the project directory and remote host details
PROJECT_DIR="/home/paultownwrites/Google Drive/nocturne-ui"
REMOTE_USER="root"
REMOTE_HOST="172.16.42.2"
REMOTE_PASS="nocturne"
REMOTE_UI_DIR="/etc/nocturne/ui"

# --- User Prompt ---
# Ask the user if they want to reset the tutorial at the beginning.
read -p "Reset tutorial and all local data? (y/n) " -n 1 -r
echo    # move to a new line

# --- Build Step ---
echo "Building the application..."
cd "$PROJECT_DIR"
bun run build

# --- Deployment Step ---
echo "Deploying to the device..."

# 1. Prepare the remote system and clear old assets in one SSH session
# -T disables pseudo-terminal allocation, preventing the warning.
sshpass -p "$REMOTE_PASS" ssh -T ${REMOTE_USER}@${REMOTE_HOST} << 'EOF'
  echo "Remounting filesystem as read-write and clearing old assets..."
  mount -o remount,rw /
  rm -rf /etc/nocturne/ui/assets/*
EOF

# 2. Copy the new build files to the device
echo "Copying new build files..."
sshpass -p "$REMOTE_PASS" scp -r "$PROJECT_DIR/dist/"* ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_UI_DIR}/

# 3. Finalize: conditionally clear cache, restart UI, and remount as read-only
if [[ $REPLY =~ ^[Yy]$ ]]
then
  # User chose YES: clear data, restart, and remount
  sshpass -p "$REMOTE_PASS" ssh -T ${REMOTE_USER}@${REMOTE_HOST} << 'EOF'
    echo "Clearing cache/local data, restarting UI, and remounting as read-only..."
    sync
    rm -rf /data/etc/chrome/cache/* /data/etc/chrome/data/*
    rm -rf /var/cache/chrome_storage/Default/Cache/*
    sv restart nocturne-ui
    sv restart chromium
    mount -o remount,ro /
EOF
else
  # User chose NO: just restart and remount
  sshpass -p "$REMOTE_PASS" ssh -T ${REMOTE_USER}@${REMOTE_HOST} << 'EOF'
    echo "Clearing chromium cache, restarting UI, and remounting as read-only..."
    sync
    rm -rf /var/cache/chrome_storage/Default/Cache/*
    sv restart nocturne-ui
    sv restart chromium
    mount -o remount,ro /
EOF
fi

echo "Deployment complete!"
