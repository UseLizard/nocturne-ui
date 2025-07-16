#!/bin/bash

# Incremental GPU Acceleration for Spotify Car Thing
# Step-by-step approach to enable safe GPU acceleration

set -e

echo "=== INCREMENTAL GPU ACCELERATION FOR SPOTIFY CAR THING ==="
echo "Applying GPU acceleration step by step..."

STEP="${1:-1}"

case $STEP in
    1)
        echo "STEP 1: Enable basic GPU acceleration with software fallback"
        sshpass -p "nocturne" ssh root@172.16.42.2 '
            mount -o remount,rw /
            
            # Backup current config
            cp /etc/init.d/weston /etc/init.d/weston.backup.step1.$(date +%Y%m%d_%H%M%S)
            
            # Step 1: Basic GPU with software fallback
            sed -i "s/--no-gpu --disable-gpu --disable-gpu-compositing/--use-gl=swiftshader/" /etc/init.d/weston
            
            sync
            echo "Step 1 applied: Software GPU acceleration enabled"
        '
        ;;
    2)
        echo "STEP 2: Enable hardware GPU with EGL"
        sshpass -p "nocturne" ssh root@172.16.42.2 '
            mount -o remount,rw /
            
            # Backup current config
            cp /etc/init.d/weston /etc/init.d/weston.backup.step2.$(date +%Y%m%d_%H%M%S)
            
            # Step 2: Hardware GPU with EGL
            sed -i "s/--use-gl=swiftshader/--use-gl=egl --enable-gpu-acceleration/" /etc/init.d/weston
            
            sync
            echo "Step 2 applied: Hardware GPU acceleration with EGL enabled"
        '
        ;;
    3)
        echo "STEP 3: Add hardware overlays and zero-copy"
        sshpass -p "nocturne" ssh root@172.16.42.2 '
            mount -o remount,rw /
            
            # Backup current config
            cp /etc/init.d/weston /etc/init.d/weston.backup.step3.$(date +%Y%m%d_%H%M%S)
            
            # Step 3: Add hardware overlays
            sed -i "s/--enable-gpu-acceleration/--enable-gpu-acceleration --enable-hardware-overlays --enable-zero-copy/" /etc/init.d/weston
            
            sync
            echo "Step 3 applied: Hardware overlays and zero-copy enabled"
        '
        ;;
    4)
        echo "STEP 4: Enable GPU rasterization"
        sshpass -p "nocturne" ssh root@172.16.42.2 '
            mount -o remount,rw /
            
            # Backup current config
            cp /etc/init.d/weston /etc/init.d/weston.backup.step4.$(date +%Y%m%d_%H%M%S)
            
            # Step 4: GPU rasterization
            sed -i "s/--enable-zero-copy/--enable-zero-copy --enable-gpu-rasterization --disable-software-rasterizer/" /etc/init.d/weston
            
            sync
            echo "Step 4 applied: GPU rasterization enabled"
        '
        ;;
    5)
        echo "STEP 5: Add WebGL support"
        sshpass -p "nocturne" ssh root@172.16.42.2 '
            mount -o remount,rw /
            
            # Backup current config
            cp /etc/init.d/weston /etc/init.d/weston.backup.step5.$(date +%Y%m%d_%H%M%S)
            
            # Step 5: WebGL support
            sed -i "s/--disable-software-rasterizer/--disable-software-rasterizer --enable-webgl --enable-webgl2/" /etc/init.d/weston
            
            sync
            echo "Step 5 applied: WebGL support enabled"
        '
        ;;
    test)
        echo "TESTING: Current GPU acceleration status"
        sshpass -p "nocturne" ssh root@172.16.42.2 '
            echo "Current Chrome GPU flags:"
            ps aux | grep chromium | grep -o -- "--use-gl=[a-zA-Z]*\|--enable-gpu[a-z-]*\|--disable-gpu[a-z-]*" | sort | uniq
            
            echo -e "\nWeston using DRM:"
            lsof /dev/dri/card0 | grep weston || echo "Weston not using DRM"
            
            echo -e "\nChrome processes:"
            pgrep chromium | wc -l
            
            echo -e "\nMemory usage:"
            free -h | grep Mem
            
            echo -e "\nService status:"
            rc-status | grep weston
        '
        ;;
    rollback)
        echo "ROLLBACK: Restoring conservative configuration"
        sshpass -p "nocturne" ssh root@172.16.42.2 '
            mount -o remount,rw /
            
            # Find most recent backup
            BACKUP=$(ls -1t /etc/init.d/weston.backup.* | head -1)
            if [ -n "$BACKUP" ]; then
                cp "$BACKUP" /etc/init.d/weston
                echo "Restored from: $BACKUP"
            else
                echo "No backup found"
            fi
            
            sync
        '
        ;;
    *)
        echo "Usage: $0 [1|2|3|4|5|test|rollback]"
        echo ""
        echo "Steps:"
        echo "  1 - Enable software GPU (SwiftShader)"
        echo "  2 - Enable hardware GPU with EGL"
        echo "  3 - Add hardware overlays and zero-copy"
        echo "  4 - Enable GPU rasterization"
        echo "  5 - Add WebGL support"
        echo "  test - Check current GPU status"
        echo "  rollback - Restore previous configuration"
        exit 1
        ;;
esac

if [ "$STEP" != "test" ] && [ "$STEP" != "rollback" ]; then
    echo ""
    echo "Now restart Weston to apply changes:"
    echo "  sshpass -p \"nocturne\" ssh root@172.16.42.2 \"mount -o remount,rw /; rc-service weston restart; mount -o remount,ro /\""
    echo ""
    echo "Then test with:"
    echo "  $0 test"
fi