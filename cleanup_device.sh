#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Configuration ---
REMOTE_USER="root"
REMOTE_HOST="172.16.42.2"
REMOTE_PASS="nocturne"
# Create a dedicated backup directory in your home folder
LOCAL_BACKUP_PARENT_DIR="$HOME/nocturne_device_backups"

# --- Script Start ---
echo "Connecting to remote device to find temporary files..."

# Define the commands to find files on the remote device.
# This is intentionally conservative to avoid deleting important files.
# - Old log files
# - Alpine Linux package cache
# - Files in /tmp older than 7 days
FIND_COMMANDS="\
find /var/log -name '*.gz' -type f; \
find /var/log -name '*.1' -type f; \
find /var/cache/apk -name '*.apk' -type f; \
find /tmp -mtime +7 -type f; \
"

# Execute find commands on the remote and store the list in a temporary file
sshpass -p "$REMOTE_PASS" ssh -T ${REMOTE_USER}@${REMOTE_HOST} "sh -c \"$FIND_COMMANDS\" > /tmp/cleanup_file_list.txt"

# Create a temporary local file to hold the list
LOCAL_FILE_LIST=$(mktemp)
# Copy the list of files from the remote device to the local machine
sshpass -p "$REMOTE_PASS" scp -q ${REMOTE_USER}@${REMOTE_HOST}:/tmp/cleanup_file_list.txt "$LOCAL_FILE_LIST"

# Check if any files were found
if [ ! -s "$LOCAL_FILE_LIST" ]; then
  echo "No temporary or old files found to clean up. Exiting."
  rm "$LOCAL_FILE_LIST"
  exit 0
fi

# --- Calculate and Display File Information ---
echo -e "\nFound the following files that can be deleted:"

# Read the file list into a variable for remote processing
REMOTE_FILES_TO_PROCESS=$(cat "$LOCAL_FILE_LIST")

# Get the total size from the remote device
TOTAL_SIZE=$(sshpass -p "$REMOTE_PASS" ssh -T ${REMOTE_USER}@${REMOTE_HOST} "du -ch $REMOTE_FILES_TO_PROCESS 2>/dev/null | tail -n 1 | awk '{print \$1}'")

echo "--------------------------------------------------"
cat "$LOCAL_FILE_LIST"
echo "--------------------------------------------------"
echo "Total size of deletable files: $TOTAL_SIZE"
echo ""

# --- Backup Prompt ---
read -p "Do you want to back up these files locally before deleting? (y/n) " -n 1 -r REPLY_BACKUP
echo
if [ "$REPLY_BACKUP" = "y" ] || [ "$REPLY_BACKUP" = "Y" ]; then
  BACKUP_DIR="$LOCAL_BACKUP_PARENT_DIR/backup_$(date +%Y-%m-%d_%H-%M-%S)"
  echo "Backing up files to: $BACKUP_DIR"
  mkdir -p "$BACKUP_DIR"
  
  # Use rsync to copy files and preserve directory structure
  # The -R flag is crucial for preserving paths.
  rsync -a -R --info=progress2 \
    --files-from="$LOCAL_FILE_LIST" \
    -e "sshpass -p '$REMOTE_PASS' ssh -o StrictHostKeyChecking=no" \
    ${REMOTE_USER}@${REMOTE_HOST}:/ "$BACKUP_DIR"

  echo "Backup complete."

  # Create restore information file
  RESTORE_INFO_FILE="$BACKUP_DIR/restore_info.txt"
  echo "RESTORE INSTRUCTIONS:" > "$RESTORE_INFO_FILE"
  echo "" >> "$RESTORE_INFO_FILE"
  echo "If you need to restore the files backed up in this folder," >> "$RESTORE_INFO_FILE"
  echo "copy the contents of this backup directory back to the root (/)" >> "$RESTORE_INFO_FILE"
  echo "of your remote device ($REMOTE_HOST)." >> "$RESTORE_INFO_FILE"
  echo "" >> "$RESTORE_INFO_FILE"
  echo "Example command to restore:" >> "$RESTORE_INFO_FILE"
  echo "sshpass -p \"$REMOTE_PASS\" scp -r \"$BACKUP_DIR\"/* ${REMOTE_USER}@${REMOTE_HOST}:/" >> "$RESTORE_INFO_FILE"
  echo "" >> "$RESTORE_INFO_FILE"
  echo "Files originally located at:" >> "$RESTORE_INFO_FILE"
  cat "$LOCAL_FILE_LIST" >> "$RESTORE_INFO_FILE"
  echo "Restore information saved to $RESTORE_INFO_FILE"
fi

# --- Deletion Prompt ---
FILES_TO_DELETE_STR=""
read -p "Choose deletion method: (A)ll, (N)one, (I)nteractive? " -n 1 -r REPLY_DELETE
echo

case "$REPLY_DELETE" in
  [Aa]*)
    echo "Preparing to delete all found files..."
    FILES_TO_DELETE_STR=$(cat "$LOCAL_FILE_LIST")
    ;;
  [Ii]*)
    echo "Entering interactive deletion mode..."
    while IFS= read -r file; do
      read -p "Delete '$file'? (y/n) " -n 1 -r REPLY_INTERACTIVE
      echo
      if [ "$REPLY_INTERACTIVE" = "y" ] || [ "$REPLY_INTERACTIVE" = "Y" ]; then
        FILES_TO_DELETE_STR="$FILES_TO_DELETE_STR '$file'"
      fi
    done < "$LOCAL_FILE_LIST"
    ;;
  *)
    echo "No files will be deleted. Exiting."
    rm "$LOCAL_FILE_LIST"
    exit 0
    ;;
esac

# --- Perform Deletion ---
if [ -n "$FILES_TO_DELETE_STR" ]; then
  echo "Deleting selected files on the remote device..."
  # Execute the delete command on the remote
  sshpass -p "$REMOTE_PASS" ssh -T ${REMOTE_USER}@${REMOTE_HOST} "rm -f $FILES_TO_DELETE_STR"
  
  echo "Deletion complete."
else
  echo "No files were selected for deletion."
fi

# --- Final Cleanup ---
# Clean up the local temporary file
rm "$LOCAL_FILE_LIST"
echo "Cleanup script finished."
