#!/bin/bash

# Optimized Chrome Configuration for Nocturne Car Thing
# Implements GPU acceleration and memory optimization for Mali GPU

set -e

echo "=== CHROME GPU ACCELERATION CONFIGURATION ==="
echo "Updating Weston service with optimized Chrome flags..."

# Create the optimized Chrome command arguments
OPTIMIZED_CHROME_ARGS="--continue-without-input --config=/etc/weston/weston.ini -- chromium \\
  --kiosk \\
  --app=http://localhost:3000 \\
  --enable-gpu-acceleration \\
  --use-gl=egl \\
  --enable-zero-copy \\
  --enable-hardware-overlays \\
  --enable-gpu-rasterization \\
  --enable-oop-rasterization \\
  --enable-accelerated-video-decode \\
  --disable-software-rasterizer \\
  --enable-webgl \\
  --enable-webgl2 \\
  --ozone-platform=wayland \\
  --enable-wayland-ime \\
  --no-sandbox \\
  --max_old_space_size=256 \\
  --single-process \\
  --disable-dev-shm-usage \\
  --autoplay-policy=no-user-gesture-required \\
  --use-fake-ui-for-media-stream \\
  --use-fake-device-for-media-stream \\
  --disable-sync \\
  --force-device-scale-factor=1.0 \\
  --pull-to-refresh=0 \\
  --noerrdialogs \\
  --no-first-run \\
  --disable-infobars \\
  --fast \\
  --fast-start \\
  --disable-pinch \\
  --disable-translate \\
  --overscroll-history-navigation=0 \\
  --hide-scrollbars \\
  --disable-overlay-scrollbar \\
  --disable-features=OverlayScrollbar,TranslateUI,TouchpadOverscrollHistoryNavigation,OverscrollHistoryNavigation \\
  --enable-features=VaapiVideoDecoder,VaapiVideoEncoder \\
  --force-dark-mode \\
  --password-store=basic \\
  --touch-events=enabled \\
  --ignore-certificate-errors \\
  --disk-cache-dir=/data/etc/chrome/cache \\
  --user-data-dir=/data/etc/chrome/data \\
  --disable-background-timer-throttling \\
  --disable-backgrounding-occluded-windows \\
  --disable-renderer-backgrounding \\
  --disable-field-trial-config \\
  --disable-ipc-flooding-protection"

# SSH into Car Thing and update Weston service
sshpass -p "nocturne" ssh root@172.16.42.2 "
    # Remount filesystem as read-write
    mount -o remount,rw /
    
    echo 'Backing up current Weston service...'
    cp /etc/init.d/weston /etc/init.d/weston.backup.$(date +%Y%m%d_%H%M%S)
    
    echo 'Creating optimized Weston service configuration...'
    
    cat > /etc/init.d/weston << 'EOF'
#!/sbin/openrc-run
# shellcheck shell=ash

# Optimized Weston service for Nocturne with Mali GPU acceleration

# shellcheck disable=SC2034
name=\"Weston\"
supervisor=\"supervise-daemon\"
command=\"/usr/bin/weston\"
command_args=\"$OPTIMIZED_CHROME_ARGS\"

depend() {
  need localmount
  after bootmisc modules optimize-gpu
  provide display-manager
}

start_pre() {
  # Ensure runtime directory exists
  export XDG_RUNTIME_DIR=/data/tmp/0-runtime-dir
  if [ ! -d \"\$XDG_RUNTIME_DIR\" ]; then
    mkdir -p \"\$XDG_RUNTIME_DIR\"
    chmod 0700 \"\$XDG_RUNTIME_DIR\"
  fi
  
  # Load Mali GPU environment
  if [ -f /etc/profile.d/mali.sh ]; then
    . /etc/profile.d/mali.sh
  fi
  
  # Run GPU optimization
  if [ -x /usr/bin/optimize-gpu ]; then
    /usr/bin/optimize-gpu
  fi
  
  # Clear Chrome cache if it's getting too large (>100MB)
  if [ -d /data/etc/chrome/cache ]; then
    CACHE_SIZE=\$(du -sm /data/etc/chrome/cache 2>/dev/null | cut -f1)
    if [ \"\$CACHE_SIZE\" -gt 100 ]; then
      echo \"Clearing Chrome cache (size: \${CACHE_SIZE}MB)\"
      rm -rf /data/etc/chrome/cache/*
    fi
  fi
}

start_post() {
  # Start thermal management in background
  if [ -x /usr/bin/thermal-gpu-manager ]; then
    nohup sh -c 'while true; do /usr/bin/thermal-gpu-manager; sleep 30; done' >/dev/null 2>&1 &
  fi
}
EOF
    
    chmod +x /etc/init.d/weston
    
    echo 'Creating GPU optimization service...'
    
    # Create a service to run GPU optimization at boot
    cat > /etc/init.d/optimize-gpu << 'EOF'
#!/sbin/openrc-run

name=\"GPU Optimization\"
command=\"/usr/bin/optimize-gpu\"

depend() {
  need modules
  before weston
}
EOF
    
    chmod +x /etc/init.d/optimize-gpu
    
    # Add to default runlevel
    rc-update add optimize-gpu default 2>/dev/null || true
    
    echo 'Syncing changes...'
    sync
    
    echo 'Chrome optimization configuration completed!'
    echo 'Ready for deployment and testing.'
"