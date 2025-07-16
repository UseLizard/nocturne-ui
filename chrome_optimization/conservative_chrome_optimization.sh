#!/bin/bash

# Conservative Chrome Optimization for Spotify Car Thing
# Incremental improvements without breaking existing functionality

set -e

echo "=== CONSERVATIVE CHROME OPTIMIZATION FOR SPOTIFY CAR THING ==="
echo "Applying safe, incremental optimizations..."

# SSH into Car Thing and apply conservative optimizations
sshpass -p "nocturne" ssh root@172.16.42.2 '
    # Remount filesystem as read-write
    mount -o remount,rw /
    
    echo "Creating conservative memory optimization..."
    
    # Create conservative memory optimization script
    cat > /usr/bin/optimize-memory-conservative << "EOF"
#!/bin/sh
# Conservative memory optimization for 512MB Spotify Car Thing

echo "Running conservative memory optimization..."

# Light memory optimization (safe)
echo 1 > /proc/sys/vm/drop_caches
echo 10 > /proc/sys/vm/swappiness
echo 50 > /proc/sys/vm/overcommit_ratio

# Reduce memory pressure
echo 20 > /proc/sys/vm/vfs_cache_pressure

echo "Conservative memory optimization completed"
EOF
    
    chmod +x /usr/bin/optimize-memory-conservative
    
    echo "Backing up current Weston service..."
    cp /etc/init.d/weston /etc/init.d/weston.backup.conservative.$(date +%Y%m%d_%H%M%S)
    
    echo "Creating conservatively optimized Chrome configuration..."
    
    # Create conservatively optimized Weston service - keep existing flags and add safe optimizations
    cat > /etc/init.d/weston << "EOF"
#!/sbin/openrc-run
# shellcheck shell=ash

# Conservatively optimized Weston service for Spotify Car Thing

# shellcheck disable=SC2034
name="Weston"
supervisor="supervise-daemon"
command="/usr/bin/weston"
command_args="--continue-without-input --config=/etc/weston/weston.ini -- chromium \
  --no-gpu \
  --disable-gpu \
  --disable-gpu-compositing \
  --ozone-platform-hint=auto \
  --ozone-platform=wayland \
  --enable-wayland-ime \
  --no-sandbox \
  --autoplay-policy=no-user-gesture-required \
  --use-fake-ui-for-media-stream \
  --use-fake-device-for-media-stream \
  --disable-sync \
  --force-device-scale-factor=1.0 \
  --pull-to-refresh=0 \
  --noerrdialogs \
  --no-first-run \
  --disable-infobars \
  --fast \
  --fast-start \
  --disable-pinch \
  --disable-translate \
  --overscroll-history-navigation=0 \
  --hide-scrollbars \
  --disable-overlay-scrollbar \
  --disable-features=OverlayScrollbar,TranslateUI,TouchpadOverscrollHistoryNavigation,OverscrollHistoryNavigation \
  --force-dark-mode \
  --password-store=basic \
  --touch-events=enabled \
  --ignore-certificate-errors \
  --disk-cache-dir=/data/etc/chrome/cache \
  --user-data-dir=/data/etc/chrome/data \
  --kiosk \
  --app=http://localhost:3000 \
  --max_old_space_size=256 \
  --memory-pressure-off \
  --js-flags=\"--max-old-space-size=256\" \
  --aggressive-cache-discard \
  --disable-background-timer-throttling \
  --disable-backgrounding-occluded-windows \
  --disable-renderer-backgrounding \
  --disable-extensions \
  --disable-plugins \
  --disable-default-apps \
  --disable-features=VizDisplayCompositor"

depend() {
  need localmount
  after bootmisc modules
  provide display-manager
}

start_pre() {
  # Ensure runtime directory exists
  export XDG_RUNTIME_DIR=/data/tmp/0-runtime-dir
  if [ ! -d "$XDG_RUNTIME_DIR" ]; then
    mkdir -p "$XDG_RUNTIME_DIR"
    chmod 0700 "$XDG_RUNTIME_DIR"
  fi
  
  # Run conservative memory optimization
  if [ -x /usr/bin/optimize-memory-conservative ]; then
    /usr/bin/optimize-memory-conservative
  fi
  
  # Clear Chrome cache if it gets too large (>100MB)
  if [ -d /data/etc/chrome/cache ]; then
    CACHE_SIZE=$(du -sm /data/etc/chrome/cache 2>/dev/null | cut -f1)
    if [ "$CACHE_SIZE" -gt 100 ]; then
      echo "Clearing Chrome cache (size: ${CACHE_SIZE}MB)"
      rm -rf /data/etc/chrome/cache/*
    fi
  fi
}
EOF
    
    chmod +x /etc/init.d/weston
    
    echo "Syncing changes..."
    sync
    
    echo "Conservative Chrome optimization completed!"
    echo ""
    echo "Applied optimizations:"
    echo "  ✓ Memory management tuning (conservative)"
    echo "  ✓ V8 heap size limit (256MB)"
    echo "  ✓ Background process optimization"
    echo "  ✓ Cache management"
    echo "  ✓ Performance flags (safe)"
    echo ""
    echo "Maintained existing configuration for:"
    echo "  ✓ GPU settings (--no-gpu, --disable-gpu)"
    echo "  ✓ Wayland platform"
    echo "  ✓ All original stability flags"
    echo ""
    echo "Ready for testing!"
'