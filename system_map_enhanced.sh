#!/bin/sh

# Enhanced System Information Map for Nocturne Car Thing
# This script gathers comprehensive system information with Nocturne-specific details
# Usage: ./system_map_enhanced.sh [--json] [--minimal] [--help]

# Parse command line arguments
JSON_OUTPUT=false
MINIMAL=false
HELP=false

for arg in "$@"; do
    case $arg in
        --json) JSON_OUTPUT=true ;;
        --minimal) MINIMAL=true ;;
        --help) HELP=true ;;
    esac
done

if [ "$HELP" = true ]; then
    echo "Enhanced System Information Map for Nocturne Car Thing"
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  --json     Output in JSON format"
    echo "  --minimal  Minimal output (key info only)"
    echo "  --help     Show this help message"
    exit 0
fi

# Helper function for JSON output
json_escape() {
    printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g; s/\n/\\n/g; s/\r/\\r/g; s/\t/\\t/g'
}

# Helper function for section headers
section_header() {
    if [ "$JSON_OUTPUT" = true ]; then
        echo "  \"$1\": {"
    else
        echo ""
        echo "--- $1 ---"
    fi
}

section_footer() {
    if [ "$JSON_OUTPUT" = true ]; then
        echo "  },"
    fi
}

# Start output
if [ "$JSON_OUTPUT" = true ]; then
    echo "{"
    echo "  \"timestamp\": \"$(date -Iseconds)\","
    echo "  \"hostname\": \"$(hostname)\","
else
    echo "=== NOCTURNE CAR THING SYSTEM MAP ==="
    echo "Generated: $(date)"
    echo "Hostname: $(hostname)"
    echo "========================================"
fi

# 1. System Overview
section_header "system_overview"
if [ "$JSON_OUTPUT" = true ]; then
    echo "    \"kernel\": \"$(json_escape "$(uname -a)")\","
    echo "    \"os_release\": \"$(json_escape "$(cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d'=' -f2 | tr -d '"')")\","
    echo "    \"uptime\": \"$(json_escape "$(uptime)")\","
    echo "    \"cpu\": \"$(json_escape "$(grep 'model name' /proc/cpuinfo | head -n 1 | cut -d':' -f2 | sed 's/^ *//')")\","
    echo "    \"memory_total\": \"$(free -h | grep Mem | awk '{print $2}')\","
    echo "    \"memory_used\": \"$(free -h | grep Mem | awk '{print $3}')\","
    echo "    \"memory_available\": \"$(free -h | grep Mem | awk '{print $7}')\","
    echo "    \"disk_usage\": \"$(df -h / | tail -n 1 | awk '{print $5}')\","
    echo "    \"load_average\": \"$(uptime | sed 's/.*load average: //')\""
else
    echo "Kernel: $(uname -a)"
    echo "OS: $(cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d'=' -f2 | tr -d '"')"
    echo "Uptime: $(uptime)"
    echo "CPU: $(grep 'model name' /proc/cpuinfo | head -n 1 | cut -d':' -f2 | sed 's/^ *//')"
    echo "Memory: $(free -h | grep Mem | awk '{print $3"/"$2" ("$5"% used)"}')"
    echo "Disk Usage: $(df -h / | tail -n 1 | awk '{print $3"/"$2" ("$5" used)"}')"
    echo "Load Average: $(uptime | sed 's/.*load average: //')"
fi
section_footer

# 2. Nocturne-specific Services
section_header "nocturne_services"
if [ "$JSON_OUTPUT" = true ]; then
    echo "    \"nocturned_status\": \"$(rc-service nocturned status 2>/dev/null | grep -o 'started\|stopped\|crashed' || echo 'unknown')\","
    echo "    \"nocturned_pid\": \"$(pgrep nocturned || echo 'not running')\","
    echo "    \"caddy_status\": \"$(rc-service caddy status 2>/dev/null | grep -o 'started\|stopped\|crashed' || echo 'unknown')\","
    echo "    \"weston_status\": \"$(rc-service weston status 2>/dev/null | grep -o 'started\|stopped\|crashed' || echo 'unknown')\","
    echo "    \"chromium_running\": \"$(pgrep chromium >/dev/null && echo 'true' || echo 'false')\""
else
    echo "Nocturned Service: $(rc-service nocturned status 2>/dev/null | head -n 1 || echo 'Service not found')"
    echo "Caddy Service: $(rc-service caddy status 2>/dev/null | head -n 1 || echo 'Service not found')"
    echo "Weston Service: $(rc-service weston status 2>/dev/null | head -n 1 || echo 'Service not found')"
    echo "Chromium Process: $(pgrep chromium >/dev/null && echo 'Running' || echo 'Not running')"
    echo "Active OpenRC Services:"
    rc-status 2>/dev/null | grep -E '(started|stopped|crashed)' | head -n 10
fi
section_footer

# 3. Network and Connectivity
section_header "network_connectivity"
if [ "$JSON_OUTPUT" = true ]; then
    echo "    \"interfaces\": ["
    ip -o link show | while read -r line; do
        iface=$(echo "$line" | cut -d':' -f2 | tr -d ' ')
        state=$(echo "$line" | grep -o 'state [A-Z]*' | cut -d' ' -f2)
        echo "      {\"name\": \"$iface\", \"state\": \"$state\"},"
    done | sed '$ s/,$//'
    echo "    ],"
    echo "    \"bluetooth_adapter\": \"$(hciconfig 2>/dev/null | grep -o 'hci[0-9]*' | head -n 1 || echo 'none')\","
    echo "    \"wifi_connected\": \"$(iwconfig 2>/dev/null | grep -q 'Access Point' && echo 'true' || echo 'false')\","
    echo "    \"listening_ports\": ["
    ss -tulnp 2>/dev/null | grep LISTEN | while read -r line; do
        port=$(echo "$line" | awk '{print $5}' | cut -d':' -f2)
        echo "      \"$port\","
    done | sed '$ s/,$//'
    echo "    ]"
else
    echo "Network Interfaces:"
    ip -o link show | while read -r line; do
        iface=$(echo "$line" | cut -d':' -f2 | tr -d ' ')
        state=$(echo "$line" | grep -o 'state [A-Z]*' | cut -d' ' -f2)
        echo "  $iface: $state"
    done
    echo "Bluetooth Adapter: $(hciconfig 2>/dev/null | grep -o 'hci[0-9]*' | head -n 1 || echo 'None found')"
    echo "WiFi Status: $(iwconfig 2>/dev/null | grep -q 'Access Point' && echo 'Connected' || echo 'Not connected')"
    echo "Listening Ports: $(ss -tulnp 2>/dev/null | grep LISTEN | awk '{print $5}' | cut -d':' -f2 | tr '\n' ' ')"
fi
section_footer

# 4. Hardware Information
section_header "hardware_info"
if [ "$JSON_OUTPUT" = true ]; then
    echo "    \"cpu_count\": \"$(nproc)\","
    echo "    \"cpu_temp\": \"$(cat /sys/class/thermal/thermal_zone*/temp 2>/dev/null | head -n 1 | awk '{print $1/1000"°C"}' || echo 'N/A')\","
    echo "    \"brightness\": \"$(cat /sys/class/backlight/*/brightness 2>/dev/null | head -n 1 || echo 'N/A')\","
    echo "    \"max_brightness\": \"$(cat /sys/class/backlight/*/max_brightness 2>/dev/null | head -n 1 || echo 'N/A')\","
    echo "    \"storage_devices\": ["
    lsblk -J 2>/dev/null | grep -o '"name":"[^"]*"' | while read -r device; do
        echo "      $device,"
    done | sed '$ s/,$//'
    echo "    ]"
else
    echo "CPU Cores: $(nproc)"
    echo "CPU Temperature: $(cat /sys/class/thermal/thermal_zone*/temp 2>/dev/null | head -n 1 | awk '{print $1/1000"°C"}' || echo 'N/A')"
    echo "Display Brightness: $(cat /sys/class/backlight/*/brightness 2>/dev/null | head -n 1 || echo 'N/A')/$(cat /sys/class/backlight/*/max_brightness 2>/dev/null | head -n 1 || echo 'N/A')"
    echo "Storage Devices:"
    lsblk 2>/dev/null | grep -E '(disk|part)' | head -n 10
fi
section_footer

# 5. File System and Storage
section_header "filesystem_storage"
if [ "$JSON_OUTPUT" = true ]; then
    echo "    \"mounts\": ["
    df -h | tail -n +2 | while read -r line; do
        fs=$(echo "$line" | awk '{print $1}')
        size=$(echo "$line" | awk '{print $2}')
        used=$(echo "$line" | awk '{print $3}')
        avail=$(echo "$line" | awk '{print $4}')
        use_pct=$(echo "$line" | awk '{print $5}')
        mount=$(echo "$line" | awk '{print $6}')
        echo "      {\"filesystem\": \"$fs\", \"size\": \"$size\", \"used\": \"$used\", \"available\": \"$avail\", \"use_percent\": \"$use_pct\", \"mount\": \"$mount\"},"
    done | sed '$ s/,$//'
    echo "    ],"
    echo "    \"nocturne_paths\": {"
    echo "      \"binary_exists\": \"$(test -f /usr/local/bin/nocturned && echo 'true' || echo 'false')\","
    echo "      \"ui_path_exists\": \"$(test -d /etc/nocturne/ui && echo 'true' || echo 'false')\","
    echo "      \"data_path_exists\": \"$(test -d /data/etc/nocturne && echo 'true' || echo 'false')\","
    echo "      \"config_files\": ["
    find /etc/nocturne /data/etc/nocturne -type f 2>/dev/null | while read -r file; do
        echo "        \"$file\","
    done | sed '$ s/,$//'
    echo "      ]"
    echo "    }"
else
    echo "File System Usage:"
    df -h
    echo ""
    echo "Nocturne-specific Paths:"
    echo "  Binary: $(test -f /usr/local/bin/nocturned && echo '✓ /usr/local/bin/nocturned' || echo '✗ /usr/local/bin/nocturned missing')"
    echo "  UI Path: $(test -d /etc/nocturne/ui && echo '✓ /etc/nocturne/ui' || echo '✗ /etc/nocturne/ui missing')"
    echo "  Data Path: $(test -d /data/etc/nocturne && echo '✓ /data/etc/nocturne' || echo '✗ /data/etc/nocturne missing')"
    echo "  Config Files:"
    find /etc/nocturne /data/etc/nocturne -type f 2>/dev/null | head -n 10 | sed 's/^/    /'
fi
section_footer

# 6. Process Information (skip if minimal)
if [ "$MINIMAL" = false ]; then
    section_header "process_info"
    if [ "$JSON_OUTPUT" = true ]; then
        echo "    \"top_cpu_processes\": ["
        ps aux | sort -rnk 3 | head -n 6 | tail -n +2 | while read -r line; do
            pid=$(echo "$line" | awk '{print $2}')
            cpu=$(echo "$line" | awk '{print $3}')
            mem=$(echo "$line" | awk '{print $4}')
            cmd=$(echo "$line" | awk '{for(i=11;i<=NF;i++) printf "%s ", $i; print ""}' | sed 's/ $//')
            echo "      {\"pid\": \"$pid\", \"cpu\": \"$cpu\", \"memory\": \"$mem\", \"command\": \"$(json_escape "$cmd")\"},"
        done | sed '$ s/,$//'
        echo "    ],"
        echo "    \"top_memory_processes\": ["
        ps aux | sort -rnk 4 | head -n 6 | tail -n +2 | while read -r line; do
            pid=$(echo "$line" | awk '{print $2}')
            cpu=$(echo "$line" | awk '{print $3}')
            mem=$(echo "$line" | awk '{print $4}')
            cmd=$(echo "$line" | awk '{for(i=11;i<=NF;i++) printf "%s ", $i; print ""}' | sed 's/ $//')
            echo "      {\"pid\": \"$pid\", \"cpu\": \"$cpu\", \"memory\": \"$mem\", \"command\": \"$(json_escape "$cmd")\"},"
        done | sed '$ s/,$//'
        echo "    ]"
    else
        echo "Top CPU Processes:"
        ps aux | sort -rnk 3 | head -n 6 | awk 'NR==1 {print "  PID    CPU%  MEM%  COMMAND"} NR>1 {printf "  %-6s %-5s %-5s %s\n", $2, $3, $4, substr($0, index($0, $11))}'
        echo ""
        echo "Top Memory Processes:"
        ps aux | sort -rnk 4 | head -n 6 | awk 'NR==1 {print "  PID    CPU%  MEM%  COMMAND"} NR>1 {printf "  %-6s %-5s %-5s %s\n", $2, $3, $4, substr($0, index($0, $11))}'
    fi
    section_footer
fi

# 7. API Health Check
section_header "api_health"
if [ "$JSON_OUTPUT" = true ]; then
    echo "    \"nocturned_api\": {"
    echo "      \"media_status\": \"$(wget -q -O - --timeout=5 http://localhost:5000/media/status 2>/dev/null && echo 'accessible' || echo 'not accessible')\","
    echo "      \"bluetooth_status\": \"$(wget -q -O - --timeout=5 http://localhost:5000/bluetooth/status 2>/dev/null && echo 'accessible' || echo 'not accessible')\","
    echo "      \"port_5000_open\": \"$(netstat -tlnp 2>/dev/null | grep -q ':5000 ' && echo 'true' || echo 'false')\""
    echo "    },"
    echo "    \"ui_accessibility\": \"$(wget -q -O - --timeout=5 http://localhost:3000 2>/dev/null && echo 'accessible' || echo 'not accessible')\""
else
    echo "API Health Check:"
    echo "  Nocturned API (port 5000): $(netstat -tlnp 2>/dev/null | grep -q ':5000 ' && echo '✓ Listening' || echo '✗ Not listening')"
    echo "  Media Status: $(wget -q -O - --timeout=5 http://localhost:5000/media/status >/dev/null 2>&1 && echo '✓ Accessible' || echo '✗ Not accessible')"
    echo "  Bluetooth Status: $(wget -q -O - --timeout=5 http://localhost:5000/bluetooth/status >/dev/null 2>&1 && echo '✓ Accessible' || echo '✗ Not accessible')"
    echo "  UI (port 3000): $(wget -q -O - --timeout=5 http://localhost:3000 >/dev/null 2>&1 && echo '✓ Accessible' || echo '✗ Not accessible')"
fi
section_footer

# 8. Recent Logs (skip if minimal)
if [ "$MINIMAL" = false ]; then
    section_header "recent_logs"
    if [ "$JSON_OUTPUT" = true ]; then
        echo "    \"dmesg_last_10\": ["
        dmesg | tail -n 10 | while read -r line; do
            echo "      \"$(json_escape "$line")\","
        done | sed '$ s/,$//'
        echo "    ],"
        echo "    \"system_log_last_10\": ["
        (tail -n 10 /var/log/messages 2>/dev/null || echo "No system log available") | while read -r line; do
            echo "      \"$(json_escape "$line")\","
        done | sed '$ s/,$//'
        echo "    ]"
    else
        echo "Recent Kernel Messages (last 10):"
        dmesg | tail -n 10 | sed 's/^/  /'
        echo ""
        echo "Recent System Log (last 10):"
        (tail -n 10 /var/log/messages 2>/dev/null || echo "  No system log available") | sed 's/^/  /'
    fi
    section_footer
fi

# End output
if [ "$JSON_OUTPUT" = true ]; then
    echo "  \"generation_complete\": true"
    echo "}"
else
    echo ""
    echo "=== END OF SYSTEM MAP ==="
    echo "Generated at: $(date)"
fi