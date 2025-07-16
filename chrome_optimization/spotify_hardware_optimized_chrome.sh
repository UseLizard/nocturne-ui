#!/bin/bash

# Spotify Car Thing Hardware-Optimized Chrome Configuration
# Based on actual hardware analysis: Amlogic S905D2, Mali T60x, 512MB RAM

set -e

echo "=== SPOTIFY CAR THING OPTIMIZED CHROME SETUP ==="
echo "Applying hardware-specific optimizations for Amlogic S905D2 + Mali T60x"

# SSH into Car Thing and apply hardware-specific optimizations
sshpass -p "nocturne" ssh root@172.16.42.2 '
    # Remount filesystem as read-write
    mount -o remount,rw /
    
    echo "Creating hardware-specific environment configuration..."
    
    # Create Amlogic/Mali-specific environment
    cat > /etc/profile.d/amlogic-graphics.sh << "EOF"
# Amlogic S905D2 + Mali T60x Graphics Configuration
export DISPLAY=:0
export WAYLAND_DISPLAY=wayland-0
export XDG_RUNTIME_DIR=/data/tmp/0-runtime-dir

# DRM/Mesa configuration for Amlogic
export MESA_LOADER_DRIVER_OVERRIDE=
export EGL_PLATFORM=drm
export GBM_BACKEND=
export LIBGL_ALWAYS_SOFTWARE=0

# Memory optimization for 512MB system
export MALLOC_ARENA_MAX=2
export MALLOC_MMAP_THRESHOLD_=131072

# Chromium-specific environment variables
export CHROME_FLAGS="--max-old-space-size=256 --memory-pressure-off"
EOF
    
    echo "Creating memory optimization script..."
    
    # Create memory optimization script
    cat > /usr/bin/optimize-memory << "EOF"
#!/bin/sh
# Memory optimization for 512MB Spotify Car Thing

echo "Optimizing memory for 512MB system..."

# Aggressive memory management
echo 3 > /proc/sys/vm/drop_caches
echo 1 > /proc/sys/vm/overcommit_memory
echo 5 > /proc/sys/vm/swappiness
echo 40 > /proc/sys/vm/overcommit_ratio

# Reduce memory fragmentation
echo 1 > /proc/sys/vm/compact_memory 2>/dev/null || true

# Optimize for low memory
echo 10 > /proc/sys/vm/vfs_cache_pressure
echo 1 > /proc/sys/vm/oom_kill_allocating_task

echo "Memory optimization completed"
EOF
    
    chmod +x /usr/bin/optimize-memory
    
    echo "Creating CPU optimization script..."
    
    # Create CPU optimization for ARM Cortex-A53
    cat > /usr/bin/optimize-cpu << "EOF"
#!/bin/sh
# CPU optimization for ARM Cortex-A53 quad-core

echo "Optimizing ARM Cortex-A53 performance..."

# Set CPU governors to performance for consistent performance
for cpu in /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor; do
    if [ -f "$cpu" ]; then
        echo performance > "$cpu" 2>/dev/null || true
    fi
done

# Set CPU frequency scaling
for cpu in /sys/devices/system/cpu/cpu*/cpufreq/scaling_min_freq; do
    if [ -f "$cpu" ]; then
        MAX_FREQ=$(cat "${cpu%/*}/cpufreq_max_freq" 2>/dev/null || echo "")
        if [ -n "$MAX_FREQ" ]; then
            echo "$MAX_FREQ" > "$cpu" 2>/dev/null || true
        fi
    fi
done

echo "CPU optimization completed"
EOF
    
    chmod +x /usr/bin/optimize-cpu
    
    echo "Creating optimized Weston configuration for Amlogic..."
    
    # Create Amlogic-optimized Weston configuration
    cat > /etc/weston/weston.ini << "EOF"
[core]
backend=drm-backend.so
use-pixman=false
gbm-format=xrgb8888
idle-time=0
hide-cursor=true

[shell]
background-type=scale
background-color=0xff000000
panel-position=none
locking=false
animation=none
startup-animation=none

[output]
name=LVDS-1
mode=800x480@60
transform=normal
scale=1

[libinput]
natural_scroll=true
enable_tap=true

[keyboard]
repeat-delay=800
repeat-rate=25

# Amlogic-specific optimizations
[drm]
use-current-mode=true
EOF
    
    echo "Backing up current Weston service..."
    cp /etc/init.d/weston /etc/init.d/weston.backup.$(date +%Y%m%d_%H%M%S)
    
    echo "Creating Spotify hardware-optimized Chrome configuration..."
    
    # Create optimized Weston service with Spotify Car Thing specific flags
    cat > /etc/init.d/weston << "EOF"
#!/sbin/openrc-run
# shellcheck shell=ash

# Spotify Car Thing Optimized Weston service

# shellcheck disable=SC2034
name="Weston"
supervisor="supervise-daemon"
command="/usr/bin/weston"
command_args="--continue-without-input --config=/etc/weston/weston.ini -- chromium \
  --kiosk \
  --app=http://localhost:3000 \
  --ozone-platform=drm \
  --use-gl=egl \
  --enable-drm-atomic \
  --enable-hardware-overlays \
  --enable-zero-copy \
  --in-process-gpu \
  --no-sandbox \
  --disable-dev-shm-usage \
  --disable-software-rasterizer \
  --enable-gpu-rasterization \
  --max_old_space_size=256 \
  --memory-pressure-off \
  --js-flags=\"--max-old-space-size=256 --gc-interval=100\" \
  --aggressive-cache-discard \
  --purge-memory-button \
  --autoplay-policy=no-user-gesture-required \
  --use-fake-ui-for-media-stream \
  --use-fake-device-for-media-stream \
  --disable-sync \
  --force-device-scale-factor=1.0 \
  --disable-background-timer-throttling \
  --disable-backgrounding-occluded-windows \
  --disable-renderer-backgrounding \
  --disable-extensions \
  --disable-plugins \
  --disable-default-apps \
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
  --disable-features=OverlayScrollbar,TranslateUI,TouchpadOverscrollHistoryNavigation,OverscrollHistoryNavigation,VizDisplayCompositor \
  --enable-features=VaapiVideoDecoder \
  --force-dark-mode \
  --password-store=basic \
  --touch-events=enabled \
  --ignore-certificate-errors \
  --disk-cache-dir=/data/etc/chrome/cache \
  --user-data-dir=/data/etc/chrome/data \
  --disable-field-trial-config \
  --disable-ipc-flooding-protection"

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
  
  # Load Amlogic graphics environment
  if [ -f /etc/profile.d/amlogic-graphics.sh ]; then
    . /etc/profile.d/amlogic-graphics.sh
  fi
  
  # Run optimizations
  if [ -x /usr/bin/optimize-memory ]; then
    /usr/bin/optimize-memory
  fi
  
  if [ -x /usr/bin/optimize-cpu ]; then
    /usr/bin/optimize-cpu
  fi
  
  # Clear Chrome cache if it gets too large (memory constraint)
  if [ -d /data/etc/chrome/cache ]; then
    CACHE_SIZE=$(du -sm /data/etc/chrome/cache 2>/dev/null | cut -f1)
    if [ "$CACHE_SIZE" -gt 64 ]; then
      echo "Clearing Chrome cache (size: ${CACHE_SIZE}MB)"
      rm -rf /data/etc/chrome/cache/*
    fi
  fi
}
EOF
    
    chmod +x /etc/init.d/weston
    
    echo "Creating system optimization service..."
    
    # Create a service to run optimizations at boot
    cat > /etc/init.d/optimize-system << "EOF"
#!/sbin/openrc-run

name="System Optimization"
start() {
    ebegin "Running system optimizations"
    /usr/bin/optimize-memory > /dev/null 2>&1
    /usr/bin/optimize-cpu > /dev/null 2>&1
    eend $?
}

depend() {
  need modules
  before weston
}
EOF
    
    chmod +x /etc/init.d/optimize-system
    rc-update add optimize-system default 2>/dev/null || true
    
    echo "Syncing changes..."
    sync
    
    echo "Spotify Car Thing Chrome optimization completed!"
    echo "Configuration optimized for:"
    echo "  - Amlogic S905D2 SoC"
    echo "  - Mali T60x GPU (DRM mode)"
    echo "  - 512MB RAM constraint"
    echo "  - ARM Cortex-A53 quad-core"
    echo "Ready for deployment!"
'