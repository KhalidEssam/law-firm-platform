#!/bin/bash
# =============================================================================
# Backup Cron Wrapper for Docker/Kubernetes
# =============================================================================
# This script runs the backup on a schedule using crond.
# It's designed to be the entrypoint for a backup container.
#
# Schedule: Daily at 2:00 AM UTC
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="${SCRIPT_DIR}/backup.sh"

# Ensure backup script is executable
chmod +x "${BACKUP_SCRIPT}"

# Create cron job file
cat > /etc/crontabs/root << EOF
# PostgreSQL Backup Schedule for Exoln Lex
#
# Daily full backup at 2:00 AM UTC
0 2 * * * /scripts/backup.sh --full --upload --verify --cleanup --report >> /backups/logs/cron.log 2>&1

# Hourly backup verification (lightweight check)
0 * * * * /scripts/verify-latest-backup.sh >> /backups/logs/verify.log 2>&1
EOF

echo "=== Exoln Lex Backup Service ==="
echo "Schedule: Daily at 2:00 AM UTC"
echo "Backup directory: ${BACKUP_DIR:-/backups}"
echo "Retention: ${RETENTION_DAYS:-30} days"
echo ""
echo "Cloud Storage:"
echo "  S3: ${S3_BUCKET:-not configured}"
echo "  GCS: ${GCS_BUCKET:-not configured}"
echo ""
echo "Starting cron daemon..."

# Run initial backup on startup (optional)
if [[ "${RUN_ON_STARTUP:-false}" == "true" ]]; then
    echo "Running initial backup..."
    "${BACKUP_SCRIPT}" --full --verify --report
fi

# Start cron in foreground
exec crond -f -l 2
