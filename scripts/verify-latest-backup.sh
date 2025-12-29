#!/bin/bash
# =============================================================================
# Verify Latest Backup Script
# =============================================================================
# Lightweight script to verify the most recent backup is valid.
# Runs hourly to ensure backup integrity.
# =============================================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/backups}"
ALERT_WEBHOOK="${ALERT_WEBHOOK:-}"
MAX_BACKUP_AGE_HOURS="${MAX_BACKUP_AGE_HOURS:-26}"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

send_alert() {
    local message="$1"
    local severity="${2:-warning}"

    log "ALERT [${severity}]: ${message}"

    if [[ -n "${ALERT_WEBHOOK}" ]]; then
        curl -s -X POST "${ALERT_WEBHOOK}" \
            -H "Content-Type: application/json" \
            -d "{\"text\": \"[Exoln Lex Backup] ${severity}: ${message}\"}" \
            > /dev/null 2>&1 || true
    fi
}

# Find the latest backup
latest_backup=$(find "${BACKUP_DIR}/daily" -name "*.dump" -type f 2>/dev/null | sort -r | head -1)

if [[ -z "${latest_backup}" ]]; then
    send_alert "No backup files found in ${BACKUP_DIR}/daily" "critical"
    exit 1
fi

log "Latest backup: ${latest_backup}"

# Check backup age
backup_age_seconds=$(( $(date +%s) - $(stat -c %Y "${latest_backup}" 2>/dev/null || stat -f %m "${latest_backup}") ))
backup_age_hours=$(( backup_age_seconds / 3600 ))

log "Backup age: ${backup_age_hours} hours"

if [[ ${backup_age_hours} -gt ${MAX_BACKUP_AGE_HOURS} ]]; then
    send_alert "Latest backup is ${backup_age_hours} hours old (max: ${MAX_BACKUP_AGE_HOURS}h)" "critical"
    exit 1
fi

# Verify backup integrity
if pg_restore --list "${latest_backup}" > /dev/null 2>&1; then
    table_count=$(pg_restore --list "${latest_backup}" 2>/dev/null | grep -c "TABLE DATA" || echo "0")
    backup_size=$(du -h "${latest_backup}" | cut -f1)
    log "Backup verified: ${table_count} tables, ${backup_size}"
    exit 0
else
    send_alert "Backup verification failed: ${latest_backup}" "critical"
    exit 1
fi
