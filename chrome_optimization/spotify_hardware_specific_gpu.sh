#!/bin/bash

# Spotify Car Thing Hardware-Specific GPU Acceleration
# Uses the actual Amlogic Meson and Mali drivers found on the system

set -e

echo "=== SPOTIFY CAR THING HARDWARE-SPECIFIC GPU ACCELERATION ==="
echo "Configuring for Amlogic Meson DRM with Mali drivers..."

sshpass -p "nocturne" ssh root@172.16.42.2 '
    mount -o remount,rw /
    
    echo "Creating hardware-specific graphics environment..."
    
    # Create Amlogic Meson + Mali specific environment
    cat > /etc/profile.d/meson-mali-graphics.sh << "EOF"
# Amlogic Meson + Mali Graphics Environment for Spotify Car Thing
export DISPLAY=:0
export WAYLAND_DISPLAY=wayland-0
export XDG_RUNTIME_DIR=/data/tmp/0-runtime-dir

# Force specific DRI drivers
export LIBGL_DRIVERS_PATH=/usr/lib/xorg/modules/dri
export DRI_PRIME=0
export MESA_LOADER_DRIVER_OVERRIDE=meson

# EGL/DRM configuration for Amlogic Meson
export EGL_PLATFORM=drm
export GBM_BACKEND=
export LIBGL_ALWAYS_SOFTWARE=0

# Disable software fallbacks
export GALLIUM_DRIVER=
export LIBGL_ALWAYS_INDIRECT=0
EOF
    
    echo "Backing up current Weston configuration..."
    cp /etc/init.d/weston /etc/init.d/weston.backup.hardware.$(date +%Y%m%d_%H%M%S)
    
    echo "Creating hardware-optimized Weston configuration..."
    
    # Update Weston to use DRM backend with Meson driver
    cat > /etc/weston/weston.ini << "EOF"
[core]
backend=drm-backend.so
require-input=false
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

# Force DRM backend to use Meson driver
[drm]
use-current-mode=true
pageflip-timeout=0
EOF
    
    echo "Creating hardware-optimized Chrome configuration..."
    
    # Create Weston service with proper hardware GPU acceleration
    cat > /etc/init.d/weston << "EOF"
#!/sbin/openrc-run
# shellcheck shell=ash

# Hardware-optimized Weston for Spotify Car Thing (Amlogic Meson + Mali)

# shellcheck disable=SC2034
name="Weston"
supervisor="supervise-daemon"
command="/usr/bin/weston"
command_args="--continue-without-input --config=/etc/weston/weston.ini -- chromium \
  --kiosk \
  --app=http://localhost:3000 \
  --use-gl=egl \
  --enable-gpu-acceleration \
  --enable-hardware-overlays \
  --enable-zero-copy \
  --ozone-platform=drm \
  --disable-software-rasterizer \
  --enable-gpu-rasterization \
  --enable-oop-rasterization \
  --ignore-gpu-blocklist \
  --disable-gpu-sandbox \
  --enable-webgl \
  --enable-webgl2 \
  --no-sandbox \
  --max_old_space_size=256 \
  --memory-pressure-off \
  --js-flags=\"--max-old-space-size=256\" \
  --aggressive-cache-discard \
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
  --disable-features=OverlayScrollbar,TranslateUI,TouchpadOverscrollHistoryNavigation,OverscrollHistoryNavigation \
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
  
  # Load hardware-specific graphics environment
  if [ -f /etc/profile.d/meson-mali-graphics.sh ]; then
    . /etc/profile.d/meson-mali-graphics.sh
  fi
  
  # Run memory optimization
  if [ -x /usr/bin/optimize-memory-conservative ]; then
    /usr/bin/optimize-memory-conservative
  fi
  
  # Verify DRI drivers are accessible
  if [ ! -f /usr/lib/xorg/modules/dri/meson_dri.so ]; then
    ewarn "Meson DRI driver not found"
  fi
  
  # Clear cache if too large
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
    
    sync
    
    echo "Hardware-specific GPU acceleration configured!"
    echo ""
    echo "Configuration summary:"
    echo "  ✓ Amlogic Meson DRM driver targeting"
    echo "  ✓ Mali DRI driver support"  
    echo "  ✓ EGL hardware acceleration"
    echo "  ✓ DRM backend for Weston"
    echo "  ✓ Hardware overlays and zero-copy"
    echo "  ✓ GPU rasterization enabled"
    echo "  ✓ WebGL support"
    echo ""
    echo "Ready to test!"
'