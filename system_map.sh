#!/bin/sh

# This script gathers comprehensive system information from a Linux device.
# It's designed to be run remotely via SSH.

echo "--- System Information Map ---"
echo "Date: $(date)"
echo "Hostname: $(hostname)"
echo "-----------------------------"

echo -e "\n--- 1. Basic System Information ---"
echo "Kernel: $(uname -a)"
echo "OS Release: $(cat /etc/os-release 2>/dev/null || echo 'N/A')"
echo "Uptime: $(uptime)"
echo "CPU Info: $(grep 'model name' /proc/cpuinfo | head -n 1)"
echo "Memory Info:"
free -h
echo "Disk Usage:"
df -h

echo -e "\n--- 2. Running Processes and Services ---"
echo "Top 10 CPU Consumers (snapshot):"
ps aux | sort -rnk 3 | head -n 11
echo "Top 10 Memory Consumers (snapshot):"
ps aux | sort -rnk 4 | head -n 11
echo "All Running Processes (first 20 lines):"
ps aux | head -n 21
echo "OpenRC Services (first 20 lines):"
rc-service -l | head -n 20 2>/dev/null || echo "rc-service not found or no services listed."
echo "Open Ports and Listening Services (TCP/UDP):"
(ss -tulnp 2>/dev/null || netstat -tulnp 2>/dev/null) || echo "netstat/ss not found."

echo -e "\n--- 3. File System Layout (Top-level directories) ---"
echo "Root Directory Contents:"
ls -F /
echo "Configuration Directory Contents (/etc):"
ls -F /etc
echo "Variable Data Directory Contents (/var):"
ls -F /var
echo "Optional Software Directory Contents (/opt):"
ls -F /opt
echo "User Binaries/Libraries Directory Contents (/usr):"
ls -F /usr

echo -e "\n--- 4. Log Files ---"
echo "Log Directory Contents (/var/log):"
ls -F /var/log
echo "Last 20 lines of system log (if available):"
(cat /var/log/messages 2>/dev/null || journalctl -b -n 20 2>/dev/null) | tail -n 20 || echo "No system log found or journalctl not available."
echo "Last 20 lines of dmesg (kernel ring buffer):"
dmesg | tail -n 20

echo -e "\n--- 5. Init/Startup Files ---"
echo "Init.d scripts (SysVinit style):"
ls -F /etc/init.d 2>/dev/null || echo "init.d not found."
echo "Runlevel directories (OpenRC style):"
ls -F /etc/runlevels 2>/dev/null || echo "runlevels not found."
echo "Crontab entries (root):"
crontab -l 2>/dev/null || echo "No crontab for root."
echo "Startup scripts for X (if graphical environment):"
ls -F /etc/X11/xinit/xinitrc.d 2>/dev/null || echo "Xinit scripts not found."

echo -e "\n--- 6. User Information ---"
echo "User Accounts (from /etc/passwd, first 20 lines):"
head -n 20 /etc/passwd
echo "Home Directories:"
ls -F /home

echo -e "\n--- 7. Network Configuration ---"
echo "Network Interfaces:"
ip a
echo "Routing Table:"
ip r
echo "DNS Resolvers (/etc/resolv.conf):"
cat /etc/resolv.conf

echo -e "\n--- 8. Installed Packages (Alpine Linux specific) ---"
echo "List of installed packages (first 20 lines):"
apk info 2>/dev/null | head -n 20 || echo "apk not found (not Alpine Linux?)."

echo -e "\n--- 9. Environment Variables (first 20 lines) ---"
env | head -n 20

echo -e "\n--- End of System Information Map ---"
