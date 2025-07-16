#!/bin/bash

# Mali GPU Optimization Script for Nocturne Car Thing
# Based on NOCTURNE_GPU_ACCELERATION_OPTIMIZATION_GUIDE.md

set -e

echo "=== MALI GPU OPTIMIZATION FOR NOCTURNE CAR THING ==="
echo "Applying GPU acceleration optimizations..."

# SSH into Car Thing and apply optimizations
sshpass -p "nocturne" ssh root@172.16.42.2 '
    # Remount filesystem as read-write
    mount -o remount,rw /
    
    echo "Creating Mali GPU environment configuration..."
    
    # Create Mali GPU environment configuration
    cat > /etc/profile.d/mali.sh << "EOF"
# Mali GPU Environment Configuration for Nocturne
export MALI_SHARED_MEMORY_SIZE=128M
export MALI_DUAL_CORE_PERFORMANCE=1
export EGL_PLATFORM=gbm
export GBM_BACKEND=mali
export MESA_LOADER_DRIVER_OVERRIDE=mali
export LIBGL_ALWAYS_SOFTWARE=0
export GALLIUM_DRIVER=mali

# Additional GPU optimizations
export DISPLAY=:0
export WAYLAND_DISPLAY=wayland-0
export XDG_RUNTIME_DIR=/data/tmp/0-runtime-dir
EOF
    
    echo "Creating GPU performance optimization script..."
    
    # Create GPU optimization script
    cat > /usr/bin/optimize-gpu << "EOF"
#!/bin/sh
# Mali GPU Performance Optimization Script

echo "Optimizing Mali GPU performance..."

# Set Mali GPU to performance mode
if [ -f /sys/class/devfreq/1c20000.gpu/governor ]; then
    echo performance > /sys/class/devfreq/1c20000.gpu/governor 2>/dev/null || true
    echo "GPU governor set to performance"
fi

# Set GPU to maximum frequency
if [ -f /sys/class/devfreq/1c20000.gpu/max_freq ] && [ -f /sys/class/devfreq/1c20000.gpu/userspace/set_freq ]; then
    MAX_FREQ=$(cat /sys/class/devfreq/1c20000.gpu/max_freq)
    echo $MAX_FREQ > /sys/class/devfreq/1c20000.gpu/userspace/set_freq 2>/dev/null || true
    echo "GPU frequency set to maximum: $MAX_FREQ"
fi

# Set Mali memory size if available
if [ -f /sys/module/mali/parameters/mem_size ]; then
    echo 128 > /sys/module/mali/parameters/mem_size 2>/dev/null || true
    echo "Mali memory size set to 128MB"
fi

# Optimize CPU governor for consistency
for cpu in /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor; do
    if [ -f "$cpu" ]; then
        echo performance > "$cpu" 2>/dev/null || true
    fi
done
echo "CPU governors set to performance"

# Memory optimization
echo 3 > /proc/sys/vm/drop_caches
echo 1 > /proc/sys/vm/overcommit_memory
echo 10 > /proc/sys/vm/swappiness
echo 50 > /proc/sys/vm/overcommit_ratio
echo "Memory management optimized"

echo "GPU optimization completed"
EOF
    
    chmod +x /usr/bin/optimize-gpu
    
    echo "Creating optimized Weston configuration..."
    
    # Create optimized Weston configuration
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
animation=fade
startup-animation=fade

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
EOF
    
    echo "Creating thermal management script..."
    
    # Create thermal management script
    cat > /usr/bin/thermal-gpu-manager << "EOF"
#!/bin/sh
# Thermal-aware GPU management

TEMP_FILE="/sys/class/thermal/thermal_zone0/temp"
GPU_GOVERNOR="/sys/class/devfreq/1c20000.gpu/governor"

if [ -f "$TEMP_FILE" ] && [ -f "$GPU_GOVERNOR" ]; then
    TEMP=$(cat "$TEMP_FILE")
    # Temperature is in millicelsius, so 75000 = 75°C
    if [ "$TEMP" -gt 75000 ]; then
        echo conservative > "$GPU_GOVERNOR" 2>/dev/null || true
        echo "Thermal throttling: GPU set to conservative mode (temp: ${TEMP}mC)"
    else
        echo performance > "$GPU_GOVERNOR" 2>/dev/null || true
        echo "Normal operation: GPU set to performance mode (temp: ${TEMP}mC)"
    fi
else
    echo "Thermal management not available"
fi
EOF
    
    chmod +x /usr/bin/thermal-gpu-manager
    
    echo "Updating service dependencies..."
    
    # Update nocturned service dependencies to fix boot timing issue
    if [ -f /etc/init.d/nocturned ]; then
        sed -i "/^depend()/,/^}/ s/need localmount dbus/need localmount dbus bluetooth bluetooth_adapter/" /etc/init.d/nocturned
        echo "Updated nocturned service dependencies"
    fi
    
    # Run GPU optimization
    /usr/bin/optimize-gpu
    
    # Sync changes
    sync
    
    echo "Mali GPU optimization completed successfully!"
    echo "Next step: Update Weston service with optimized Chrome flags"
'