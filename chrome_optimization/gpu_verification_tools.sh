#!/bin/bash

# GPU Verification and Monitoring Tools for Nocturne Car Thing
# Creates comprehensive GPU testing and monitoring utilities

set -e

echo "=== GPU VERIFICATION TOOLS CREATION ==="
echo "Installing GPU verification and monitoring tools..."

# SSH into Car Thing and create verification tools
sshpass -p "nocturne" ssh root@172.16.42.2 '
    # Remount filesystem as read-write
    mount -o remount,rw /
    
    echo "Creating GPU status checker..."
    
    cat > /usr/bin/gpu-status << "EOF"
#!/bin/sh
# Comprehensive GPU status checker for Nocturne

echo "=== NOCTURNE GPU STATUS REPORT ==="
echo "Generated: $(date)"
echo "=========================================="

echo -e "\n--- Mali GPU Hardware Detection ---"
if [ -e /dev/mali0 ]; then
    echo "✓ Mali GPU device found: /dev/mali0"
    ls -la /dev/mali* 2>/dev/null
else
    echo "✗ Mali GPU device not found"
fi

if [ -d /dev/dri ]; then
    echo "✓ DRM devices found:"
    ls -la /dev/dri/ 2>/dev/null
else
    echo "✗ DRM devices not found"
fi

echo -e "\n--- GPU Frequency and Governor ---"
if [ -f /sys/class/devfreq/1c20000.gpu/cur_freq ]; then
    CUR_FREQ=$(cat /sys/class/devfreq/1c20000.gpu/cur_freq)
    MAX_FREQ=$(cat /sys/class/devfreq/1c20000.gpu/max_freq 2>/dev/null || echo "unknown")
    MIN_FREQ=$(cat /sys/class/devfreq/1c20000.gpu/min_freq 2>/dev/null || echo "unknown")
    GOVERNOR=$(cat /sys/class/devfreq/1c20000.gpu/governor 2>/dev/null || echo "unknown")
    
    echo "Current Frequency: ${CUR_FREQ} Hz"
    echo "Maximum Frequency: ${MAX_FREQ} Hz"
    echo "Minimum Frequency: ${MIN_FREQ} Hz"
    echo "Governor: ${GOVERNOR}"
    
    if [ -f /sys/class/devfreq/1c20000.gpu/load ]; then
        LOAD=$(cat /sys/class/devfreq/1c20000.gpu/load)
        echo "GPU Load: ${LOAD}%"
    fi
else
    echo "✗ GPU frequency information not available"
fi

echo -e "\n--- Thermal Status ---"
if [ -f /sys/class/thermal/thermal_zone0/temp ]; then
    TEMP=$(cat /sys/class/thermal/thermal_zone0/temp)
    TEMP_C=$((TEMP / 1000))
    echo "System Temperature: ${TEMP_C}°C (${TEMP} mC)"
    
    if [ $TEMP_C -gt 70 ]; then
        echo "⚠️  WARNING: High temperature detected!"
    elif [ $TEMP_C -lt 50 ]; then
        echo "✓ Temperature normal"
    else
        echo "⚠️  Temperature elevated but acceptable"
    fi
else
    echo "✗ Thermal information not available"
fi

echo -e "\n--- Environment Variables ---"
echo "MALI_SHARED_MEMORY_SIZE: $MALI_SHARED_MEMORY_SIZE"
echo "EGL_PLATFORM: $EGL_PLATFORM"
echo "GBM_BACKEND: $GBM_BACKEND"
echo "LIBGL_ALWAYS_SOFTWARE: $LIBGL_ALWAYS_SOFTWARE"

echo -e "\n--- Chrome/Weston Processes ---"
ps aux | grep -E "(weston|chromium)" | grep -v grep || echo "No Chrome/Weston processes found"

echo -e "\n--- Memory Usage ---"
free -h

echo -e "\n--- GPU Memory (if available) ---"
if [ -f /sys/kernel/debug/mali/gpu_memory ]; then
    cat /sys/kernel/debug/mali/gpu_memory 2>/dev/null || echo "GPU memory info not accessible"
else
    echo "GPU memory information not available"
fi

echo -e "\n--- OpenGL/EGL Testing ---"
if command -v eglinfo >/dev/null 2>&1; then
    echo "EGL Information:"
    eglinfo 2>/dev/null | head -20 || echo "EGL info not available"
else
    echo "eglinfo not available"
fi

if command -v glxinfo >/dev/null 2>&1; then
    echo "OpenGL Information:"
    glxinfo 2>/dev/null | grep -E "(OpenGL|Mali)" | head -10 || echo "OpenGL info not available"
else
    echo "glxinfo not available"
fi

echo -e "\n--- Service Status ---"
rc-status | grep -E "(weston|nocturned|optimize-gpu)" || echo "No relevant services found"

echo -e "\n=========================================="
echo "GPU Status Report Complete"
EOF
    
    chmod +x /usr/bin/gpu-status
    
    echo "Creating GPU benchmark tool..."
    
    cat > /usr/bin/gpu-benchmark << "EOF"
#!/bin/sh
# Simple GPU performance benchmark

echo "=== NOCTURNE GPU BENCHMARK ==="
echo "Starting GPU performance test..."

# Test 1: Memory allocation test
echo -e "\n--- Memory Allocation Test ---"
start_time=$(date +%s%N)
dd if=/dev/zero of=/tmp/gpu_test bs=1M count=50 2>/dev/null
end_time=$(date +%s%N)
duration=$(( (end_time - start_time) / 1000000 ))
echo "Memory test (50MB): ${duration}ms"
rm -f /tmp/gpu_test

# Test 2: Graphics rendering test (if available)
echo -e "\n--- Graphics Rendering Test ---"
if command -v glxgears >/dev/null 2>&1; then
    timeout 10 glxgears 2>/dev/null || echo "Graphics rendering test not available"
else
    echo "glxgears not available for rendering test"
fi

# Test 3: System responsiveness
echo -e "\n--- System Responsiveness Test ---"
start_time=$(date +%s%N)
for i in $(seq 1 100); do
    echo "test" > /dev/null
done
end_time=$(date +%s%N)
duration=$(( (end_time - start_time) / 1000000 ))
echo "System responsiveness (100 operations): ${duration}ms"

# Test 4: Temperature monitoring during load
echo -e "\n--- Temperature Under Load ---"
if [ -f /sys/class/thermal/thermal_zone0/temp ]; then
    temp_before=$(cat /sys/class/thermal/thermal_zone0/temp)
    echo "Temperature before load: $((temp_before / 1000))°C"
    
    # Create some CPU/GPU load
    dd if=/dev/zero of=/dev/null bs=1M count=100 2>/dev/null &
    pid=$!
    sleep 5
    kill $pid 2>/dev/null || true
    
    temp_after=$(cat /sys/class/thermal/thermal_zone0/temp)
    echo "Temperature after load: $((temp_after / 1000))°C"
    temp_diff=$(( (temp_after - temp_before) / 1000 ))
    echo "Temperature increase: ${temp_diff}°C"
else
    echo "Temperature monitoring not available"
fi

echo -e "\n--- Benchmark Complete ---"
EOF
    
    chmod +x /usr/bin/gpu-benchmark
    
    echo "Creating Chrome GPU testing tool..."
    
    cat > /usr/bin/test-chrome-gpu << "EOF"
#!/bin/sh
# Test Chrome GPU acceleration status

echo "=== CHROME GPU ACCELERATION TEST ==="

# Check if Chrome is running
if ! pgrep chromium >/dev/null; then
    echo "Chrome is not running. Please start Weston service first."
    exit 1
fi

echo "Chrome process found. Checking GPU acceleration..."

# Get Chrome GPU status via internal chrome://gpu page
# Note: This requires Chrome to be accessible, which may not always be possible in kiosk mode

echo -e "\n--- Chrome Process Information ---"
ps aux | grep chromium | grep -v grep

echo -e "\n--- Chrome GPU Process ---"
ps aux | grep "type=gpu-process" | grep -v grep || echo "No dedicated GPU process found"

echo -e "\n--- Chrome Renderer Process ---"
ps aux | grep "type=renderer" | grep -v grep || echo "No renderer process found"

echo -e "\n--- Chrome Memory Usage ---"
total_chrome_mem=$(ps aux | grep chromium | awk "{sum += \$6} END {print sum/1024}")
echo "Total Chrome memory usage: ${total_chrome_mem:-0} MB"

echo -e "\n--- Chrome Cache Size ---"
if [ -d /data/etc/chrome/cache ]; then
    cache_size=$(du -sm /data/etc/chrome/cache 2>/dev/null | cut -f1)
    echo "Chrome cache size: ${cache_size} MB"
else
    echo "Chrome cache directory not found"
fi

echo -e "\n--- Chrome Data Size ---"
if [ -d /data/etc/chrome/data ]; then
    data_size=$(du -sm /data/etc/chrome/data 2>/dev/null | cut -f1)
    echo "Chrome data size: ${data_size} MB"
else
    echo "Chrome data directory not found"
fi

echo -e "\n--- Chrome Command Line ---"
cat /proc/$(pgrep chromium | head -1)/cmdline 2>/dev/null | tr "\0" " " | fold -w 80 || echo "Could not read Chrome command line"

echo -e "\n=== TEST COMPLETE ==="
EOF
    
    chmod +x /usr/bin/test-chrome-gpu
    
    echo "Creating monitoring script..."
    
    cat > /usr/bin/gpu-monitor << "EOF"
#!/bin/sh
# Continuous GPU monitoring

echo "=== GPU CONTINUOUS MONITORING ==="
echo "Press Ctrl+C to stop monitoring"
echo "Monitoring interval: 5 seconds"
echo ""

while true; do
    clear
    echo "=== GPU Monitor - $(date) ==="
    
    # GPU Frequency
    if [ -f /sys/class/devfreq/1c20000.gpu/cur_freq ]; then
        freq=$(cat /sys/class/devfreq/1c20000.gpu/cur_freq)
        echo "GPU Frequency: ${freq} Hz"
    fi
    
    # Temperature
    if [ -f /sys/class/thermal/thermal_zone0/temp ]; then
        temp=$(cat /sys/class/thermal/thermal_zone0/temp)
        temp_c=$((temp / 1000))
        echo "Temperature: ${temp_c}°C"
    fi
    
    # Memory usage
    mem_info=$(free | grep Mem | awk "{printf \"Memory: %s/%s MB (%.1f%%)\", \$3/1024, \$2/1024, \$3/\$2*100}")
    echo "$mem_info"
    
    # Chrome process count
    chrome_procs=$(pgrep chromium | wc -l)
    echo "Chrome processes: $chrome_procs"
    
    # Load average
    load=$(uptime | sed "s/.*load average: //")
    echo "Load average: $load"
    
    echo "---"
    sleep 5
done
EOF
    
    chmod +x /usr/bin/gpu-monitor
    
    sync
    
    echo "GPU verification tools installed successfully!"
    echo ""
    echo "Available commands:"
    echo "  gpu-status        - Complete GPU status report"
    echo "  gpu-benchmark     - Simple GPU performance test"
    echo "  test-chrome-gpu   - Chrome GPU acceleration test"
    echo "  gpu-monitor       - Continuous GPU monitoring"
'