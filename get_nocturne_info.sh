#!/bin/bash

# =============================================================================
#
#                            INSTRUCTIONS & NOTES
#
# 1. Install sshpass:
#    This script requires the 'sshpass' utility to automate the SSH login.
#    Install it on your computer (not the Car Thing).
#    - For Debian/Ubuntu: sudo apt-get install sshpass
#
# 2. Save the Script:
#    Save this entire file as a shell script (e.g., get_nocturne_info.sh).
#
# 3. Make it Executable:
#    Open your terminal, navigate to where you saved the file, and run:
#    chmod +x get_nocturne_info.sh
#
# 4. Run the Script:
#    Execute the script from your terminal:
#    ./get_nocturne_info.sh
#
#    A timestamped text file with the full report will be saved in the same
#    directory.
#
# =============================================================================

# --- Configuration ---
TARGET_HOST="172.16.42.2"
TARGET_USER="root"
TARGET_PASS="nocturne"

# Generate a timestamped filename
TIMESTAMP=$(date "+%Y-%m-%d_%H-%M-%S")
OUTPUT_FILE="nocturne_final_report_${TIMESTAMP}.txt"

echo "Gathering definitive system report from ${TARGET_HOST}..."

# Use sshpass to run the discovery commands on the remote device
sshpass -p "$TARGET_PASS" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "${TARGET_USER}@${TARGET_HOST}" <<'EOF' > "${OUTPUT_FILE}"

# --- Header ---
printf "====================================================\n"
printf "      NOCTURNE - IN-DEPTH SYSTEM REPORT\n"
printf "====================================================\n\n"
printf "Generated on: $(date)\n\n"

# --- System Startup Analysis ---
printf "## System Startup & Service Initialization Map\n"
printf "Runit starts services by running everything linked in /var/service.\n"
printf "Dependencies are handled within the individual 'run' scripts (e.g., 'sv check <service> || exit 1').\n\n"
printf "1. General System Configuration (loaded early from /etc/rc.conf):\n"
printf "--------------------------------------------------\n"
if [ -f /etc/rc.conf ]; then cat /etc/rc.conf; else echo "/etc/rc.conf not found."; fi
printf "\n--------------------------------------------------\n\n"
printf "2. Enabled Services (symlinks in /var/service point to definitions in /etc/sv):\n"
ls -l /var/service/
printf "\n"
printf "3. Local Startup Script (runs after core services from /etc/rc.local):\n"
printf "--------------------------------------------------\n"
if [ -f /etc/rc.local ]; then cat /etc/rc.local; else echo "/etc/rc.local not found."; fi
printf "\n--------------------------------------------------\n\n"

# --- System & Hardware Details ---
printf "## System & Hardware\n"
echo "Hostname: $(hostname)"
echo "Kernel: $(uname -a)"
printf "\n"
echo "Memory Usage:"
free -h
printf "\n"
echo "Disk & Filesystem Mounts:"
df -h
printf "\n"
echo "Uptime: $(uptime -p)"
printf "\n"

# --- Runit Service Analysis ---
printf "## Runit Service Status & Definitions\n"
echo "Listing status of all enabled services in /var/service/..."
sv status /var/service/*
printf "\n"

# --- Process Tree & Interactions ---
printf "## Process Tree & Interactions\n"
echo "Full process tree showing parent/child relationships:"
ps -ejH
printf "\n"
echo "--- Weston (Display Server) ---"
ps aux | grep '[w]eston'
cat /etc/sv/weston/run
printf "\n"
echo "--- Chromium (UI Renderer) ---"
ps aux | grep '[c]hromium'
cat /etc/sv/chromium/run
printf "\n"
echo "--- Nocturne-UI (Web Server) ---"
ps aux | grep '[s]tatic-web-server'
cat /etc/sv/nocturne-ui/run
printf "\n"

# --- Filesystem & UI Path Details ---
printf "## UI Files & Configuration Paths\n"
UI_DIR="/etc/nocturne/ui"
echo "UI files are served from: ${UI_DIR}"
echo "Listing contents..."
ls -lR "${UI_DIR}"
printf "\n"
CHROME_DATA_DIR="/var/cache/chrome_storage"
echo "Chromium user data is stored at: ${CHROME_DATA_DIR}"
echo "Listing contents..."
ls -l "${CHROME_DATA_DIR}"
printf "\n"

# --- Network Analysis ---
printf "## Network Configuration & Connections\n"
echo "IP Addresses:"
ip addr
printf "\n"
echo "Active Network Sockets (TCP/UDP):"
echo "Proto  Local Address          Foreign Address        State      PID/Program name"
ss -tunap
printf "\n"
echo "DNS Configuration:"
cat /etc/resolv.conf
printf "\n"

# --- Bluetooth Analysis ---
printf "## Bluetooth Details\n"
echo "Bluetooth Service (bluetoothd) Status:"
ps aux | grep '[b]luetoothd'
printf "\n"
echo "bluetoothd Service Configuration:"
cat /etc/sv/bluetoothd/run
printf "\n"
echo "Bluetooth Hardware Adapter Info (using 'btmgmt' as it is available):"
btmgmt info
printf "\n"
echo "Paired & Connected Devices (via bluetoothctl):"
# Use a timeout to prevent bluetoothctl from hanging
timeout 20s bluetoothctl <<'BT_CMDS'
devices
info
exit
BT_CMDS
printf "\n"

printf "====================================================\n"
printf "                 END OF REPORT\n"
printf "====================================================\n"

EOF

echo "Done. Report saved to ${OUTPUT_FILE}"