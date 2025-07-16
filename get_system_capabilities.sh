#!/bin/bash

# =============================================================================
#
#                            INSTRUCTIONS & NOTES
#
# This script connects to the Nocturne device and generates a report of all
# installed commands, packages, and services. This helps in understanding
# what tools are available for use in other scripts.
#
# 1. Install sshpass on your computer if you haven't already.
# 2. Save this file as 'get_system_capabilities.sh'.
# 3. Make it executable: chmod +x get_system_capabilities.sh
# 4. Run it: ./get_system_capabilities.sh
#
# The output will be saved to a timestamped file.
#
# =============================================================================

# --- Configuration ---
TARGET_HOST="172.16.42.2"
TARGET_USER="root"
TARGET_PASS="nocturne"

# Generate a timestamped filename
TIMESTAMP=$(date "+%Y-%m-%d_%H-%M-%S")
OUTPUT_FILE="nocturne_capabilities_${TIMESTAMP}.txt"

echo "Generating system capabilities report from ${TARGET_HOST}..."

# Use sshpass to run the discovery commands on the remote device
sshpass -p "$TARGET_PASS" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "${TARGET_USER}@${TARGET_HOST}" <<'EOF' > "${OUTPUT_FILE}"

# --- Header ---
printf "====================================================\n"
printf "      NOCTURNE - SYSTEM CAPABILITIES REPORT\n"
printf "====================================================\n\n"
printf "Generated on: $(date)\n\n"

# --- Installed Packages (XBPS) ---
printf "## INSTALLED PACKAGES (via xbps-query -l) ##\n"
printf "This is the definitive list of all software installed on the system.\n\n"
xbps-query -l
printf "\n\n"

# --- Available Commands ---
printf "## AVAILABLE COMMANDS (in system PATH) ##\n"
printf "The system's PATH variable is: %s\n\n" "$PATH"
# Loop through each directory in the PATH and list its contents
IFS=':'
for dir in $PATH; do
    printf "--- Commands in %s ---\n" "$dir"
    ls -l "$dir"
    printf "\n"
done
unset IFS
printf "\n"

# --- Service Definitions ---
printf "## SERVICE DEFINITIONS ##\n"
printf "All available services are defined in /etc/sv/.\n"
printf "Services enabled at boot are symlinked in /var/service/.\n\n"
printf "--- Available Services (/etc/sv) ---\n"
ls -l /etc/sv/
printf "\n"
printf "--- Enabled Services (/var/service) ---\n"
ls -l /var/service/
printf "\n"

printf "====================================================\n"
printf "                 END OF REPORT\n"
printf "====================================================\n"

EOF

echo "Done. Capabilities report saved to ${OUTPUT_FILE}"