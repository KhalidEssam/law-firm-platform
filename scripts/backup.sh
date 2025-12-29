#!/bin/bash
# =============================================================================
# PostgreSQL Backup Script for Exoln Lex
# =============================================================================
# This script creates compressed PostgreSQL backups and optionally uploads
# them to S3/GCS for disaster recovery.
#
# Usage:
#   ./backup.sh [options]
#
# Options:
#   --full          Create a full backup (default)
#   --schema-only   Backup schema only (no data)
#   --upload        Upload to cloud storage after backup
#   --verify        Verify backup integrity after creation
#   --cleanup       Remove old local backups based on retention policy
#
# Environment Variables:
#   PGHOST          PostgreSQL host (default: localhost)
#   PGPORT          PostgreSQL port (default: 5432)
#   PGUSER          PostgreSQL user (required)
#   PGPASSWORD      PostgreSQL password (required)
#   PGDATABASE      PostgreSQL database (required)
#   BACKUP_DIR      Local backup directory (default: /backups)
#   RETENTION_DAYS  Days to keep local backups (default: 30)
#   S3_BUCKET       S3 bucket for cloud backups (optional)
#   GCS_BUCKET      GCS bucket for cloud backups (optional)
#
# =============================================================================

set -euo pipefail

# =============================================================================
# Configuration
# =============================================================================

# Database connection
PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-}"
PGPASSWORD="${PGPASSWORD:-}"
PGDATABASE="${PGDATABASE:-}"

# Backup settings
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE_FOLDER=$(date +%Y/%m)

# Cloud storage
S3_BUCKET="${S3_BUCKET:-}"
GCS_BUCKET="${GCS_BUCKET:-}"
S3_PREFIX="${S3_PREFIX:-backups/daily}"

# Logging
LOG_FILE="${BACKUP_DIR}/logs/backup_${TIMESTAMP}.log"

# =============================================================================
# Functions
# =============================================================================

log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[${timestamp}] [${level}] ${message}" | tee -a "${LOG_FILE}" 2>/dev/null || echo "[${timestamp}] [${level}] ${message}"
}

log_info() { log "INFO" "$1"; }
log_warn() { log "WARN" "$1"; }
log_error() { log "ERROR" "$1"; }
log_success() { log "SUCCESS" "$1"; }

check_requirements() {
    log_info "Checking requirements..."

    # Check required environment variables
    if [[ -z "${PGUSER}" ]]; then
        log_error "PGUSER environment variable is required"
        exit 1
    fi

    if [[ -z "${PGPASSWORD}" ]]; then
        log_error "PGPASSWORD environment variable is required"
        exit 1
    fi

    if [[ -z "${PGDATABASE}" ]]; then
        log_error "PGDATABASE environment variable is required"
        exit 1
    fi

    # Check required commands
    for cmd in pg_dump gzip; do
        if ! command -v "${cmd}" &> /dev/null; then
            log_error "Required command '${cmd}' not found"
            exit 1
        fi
    done

    # Create backup directories
    mkdir -p "${BACKUP_DIR}/daily"
    mkdir -p "${BACKUP_DIR}/weekly"
    mkdir -p "${BACKUP_DIR}/monthly"
    mkdir -p "${BACKUP_DIR}/logs"
    mkdir -p "${BACKUP_DIR}/wal"

    log_success "All requirements satisfied"
}

test_connection() {
    log_info "Testing database connection to ${PGHOST}:${PGPORT}/${PGDATABASE}..."

    if PGPASSWORD="${PGPASSWORD}" psql -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "${PGDATABASE}" -c "SELECT 1" > /dev/null 2>&1; then
        log_success "Database connection successful"
        return 0
    else
        log_error "Failed to connect to database"
        return 1
    fi
}

get_database_size() {
    PGPASSWORD="${PGPASSWORD}" psql -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "${PGDATABASE}" -t -c \
        "SELECT pg_size_pretty(pg_database_size('${PGDATABASE}'));" 2>/dev/null | xargs
}

create_backup() {
    local backup_type="${1:-full}"
    local backup_file=""
    local pg_dump_opts="-Fc -Z6"  # Custom format with compression level 6

    case "${backup_type}" in
        full)
            backup_file="${BACKUP_DIR}/daily/exoln_lex_full_${TIMESTAMP}.dump"
            ;;
        schema-only)
            backup_file="${BACKUP_DIR}/daily/exoln_lex_schema_${TIMESTAMP}.dump"
            pg_dump_opts="${pg_dump_opts} --schema-only"
            ;;
        data-only)
            backup_file="${BACKUP_DIR}/daily/exoln_lex_data_${TIMESTAMP}.dump"
            pg_dump_opts="${pg_dump_opts} --data-only"
            ;;
        *)
            log_error "Unknown backup type: ${backup_type}"
            exit 1
            ;;
    esac

    local db_size=$(get_database_size)
    log_info "Starting ${backup_type} backup of database (size: ${db_size})..."
    log_info "Backup file: ${backup_file}"

    local start_time=$(date +%s)

    # Create the backup
    if PGPASSWORD="${PGPASSWORD}" pg_dump \
        -h "${PGHOST}" \
        -p "${PGPORT}" \
        -U "${PGUSER}" \
        -d "${PGDATABASE}" \
        ${pg_dump_opts} \
        -f "${backup_file}" 2>> "${LOG_FILE}"; then

        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        local backup_size=$(du -h "${backup_file}" | cut -f1)

        log_success "Backup completed in ${duration}s (size: ${backup_size})"
        echo "${backup_file}"
        return 0
    else
        log_error "Backup failed!"
        rm -f "${backup_file}" 2>/dev/null
        return 1
    fi
}

verify_backup() {
    local backup_file="$1"

    log_info "Verifying backup integrity: ${backup_file}"

    if [[ ! -f "${backup_file}" ]]; then
        log_error "Backup file not found: ${backup_file}"
        return 1
    fi

    # Verify the backup can be read
    if pg_restore --list "${backup_file}" > /dev/null 2>&1; then
        local table_count=$(pg_restore --list "${backup_file}" 2>/dev/null | grep -c "TABLE DATA" || echo "0")
        log_success "Backup verified successfully (${table_count} tables)"
        return 0
    else
        log_error "Backup verification failed - file may be corrupted"
        return 1
    fi
}

upload_to_s3() {
    local backup_file="$1"
    local filename=$(basename "${backup_file}")

    if [[ -z "${S3_BUCKET}" ]]; then
        log_warn "S3_BUCKET not configured, skipping S3 upload"
        return 0
    fi

    if ! command -v aws &> /dev/null; then
        log_warn "AWS CLI not found, skipping S3 upload"
        return 0
    fi

    log_info "Uploading to S3: s3://${S3_BUCKET}/${S3_PREFIX}/${DATE_FOLDER}/${filename}"

    if aws s3 cp "${backup_file}" "s3://${S3_BUCKET}/${S3_PREFIX}/${DATE_FOLDER}/${filename}" \
        --storage-class STANDARD_IA 2>> "${LOG_FILE}"; then
        log_success "S3 upload completed"
        return 0
    else
        log_error "S3 upload failed"
        return 1
    fi
}

upload_to_gcs() {
    local backup_file="$1"
    local filename=$(basename "${backup_file}")

    if [[ -z "${GCS_BUCKET}" ]]; then
        log_warn "GCS_BUCKET not configured, skipping GCS upload"
        return 0
    fi

    if ! command -v gsutil &> /dev/null; then
        log_warn "gsutil not found, skipping GCS upload"
        return 0
    fi

    log_info "Uploading to GCS: gs://${GCS_BUCKET}/${S3_PREFIX}/${DATE_FOLDER}/${filename}"

    if gsutil cp "${backup_file}" "gs://${GCS_BUCKET}/${S3_PREFIX}/${DATE_FOLDER}/${filename}" 2>> "${LOG_FILE}"; then
        log_success "GCS upload completed"
        return 0
    else
        log_error "GCS upload failed"
        return 1
    fi
}

cleanup_old_backups() {
    log_info "Cleaning up local backups older than ${RETENTION_DAYS} days..."

    local deleted_count=0

    # Clean daily backups
    while IFS= read -r -d '' file; do
        rm -f "${file}"
        ((deleted_count++))
        log_info "Deleted: ${file}"
    done < <(find "${BACKUP_DIR}/daily" -name "*.dump" -type f -mtime +${RETENTION_DAYS} -print0 2>/dev/null)

    # Clean old log files (keep 7 days)
    find "${BACKUP_DIR}/logs" -name "*.log" -type f -mtime +7 -delete 2>/dev/null

    if [[ ${deleted_count} -gt 0 ]]; then
        log_success "Cleaned up ${deleted_count} old backup(s)"
    else
        log_info "No old backups to clean up"
    fi
}

create_weekly_backup() {
    # Check if it's Sunday (day 0)
    if [[ $(date +%u) -eq 7 ]]; then
        local latest_daily=$(ls -t "${BACKUP_DIR}/daily"/*.dump 2>/dev/null | head -1)
        if [[ -n "${latest_daily}" ]]; then
            local weekly_file="${BACKUP_DIR}/weekly/exoln_lex_weekly_$(date +%Y%m%d).dump"
            cp "${latest_daily}" "${weekly_file}"
            log_success "Created weekly backup: ${weekly_file}"
        fi
    fi
}

create_monthly_backup() {
    # Check if it's the 1st of the month
    if [[ $(date +%d) -eq "01" ]]; then
        local latest_daily=$(ls -t "${BACKUP_DIR}/daily"/*.dump 2>/dev/null | head -1)
        if [[ -n "${latest_daily}" ]]; then
            local monthly_file="${BACKUP_DIR}/monthly/exoln_lex_monthly_$(date +%Y%m).dump"
            cp "${latest_daily}" "${monthly_file}"
            log_success "Created monthly backup: ${monthly_file}"
        fi
    fi
}

generate_backup_report() {
    local backup_file="$1"
    local report_file="${BACKUP_DIR}/logs/backup_report_${TIMESTAMP}.json"

    local backup_size=$(stat -f%z "${backup_file}" 2>/dev/null || stat -c%s "${backup_file}" 2>/dev/null)
    local db_size=$(get_database_size)

    cat > "${report_file}" << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "database": "${PGDATABASE}",
    "host": "${PGHOST}",
    "backup_file": "${backup_file}",
    "backup_size_bytes": ${backup_size:-0},
    "database_size": "${db_size}",
    "retention_days": ${RETENTION_DAYS},
    "uploaded_to_s3": ${S3_BUCKET:+true}${S3_BUCKET:-false},
    "uploaded_to_gcs": ${GCS_BUCKET:+true}${GCS_BUCKET:-false},
    "status": "success"
}
EOF

    log_info "Backup report generated: ${report_file}"
}

print_usage() {
    cat << EOF
PostgreSQL Backup Script for Exoln Lex

Usage: $0 [OPTIONS]

Options:
    --full          Create a full database backup (default)
    --schema-only   Backup schema only (no data)
    --data-only     Backup data only (no schema)
    --upload        Upload backup to cloud storage (S3/GCS)
    --verify        Verify backup integrity after creation
    --cleanup       Remove old local backups
    --report        Generate JSON backup report
    --help          Show this help message

Examples:
    $0                              # Full backup with defaults
    $0 --full --upload --verify     # Full backup, upload, and verify
    $0 --schema-only                # Schema-only backup
    $0 --cleanup                    # Just cleanup old backups

Environment Variables:
    PGHOST          PostgreSQL host (default: localhost)
    PGPORT          PostgreSQL port (default: 5432)
    PGUSER          PostgreSQL user (required)
    PGPASSWORD      PostgreSQL password (required)
    PGDATABASE      PostgreSQL database (required)
    BACKUP_DIR      Backup directory (default: /backups)
    RETENTION_DAYS  Days to keep backups (default: 30)
    S3_BUCKET       S3 bucket for uploads (optional)
    GCS_BUCKET      GCS bucket for uploads (optional)
EOF
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    local backup_type="full"
    local do_upload=false
    local do_verify=false
    local do_cleanup=false
    local do_report=false

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --full)
                backup_type="full"
                shift
                ;;
            --schema-only)
                backup_type="schema-only"
                shift
                ;;
            --data-only)
                backup_type="data-only"
                shift
                ;;
            --upload)
                do_upload=true
                shift
                ;;
            --verify)
                do_verify=true
                shift
                ;;
            --cleanup)
                do_cleanup=true
                shift
                ;;
            --report)
                do_report=true
                shift
                ;;
            --help|-h)
                print_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                print_usage
                exit 1
                ;;
        esac
    done

    log_info "=========================================="
    log_info "Exoln Lex PostgreSQL Backup"
    log_info "=========================================="
    log_info "Timestamp: ${TIMESTAMP}"
    log_info "Backup Type: ${backup_type}"
    log_info "Database: ${PGDATABASE}@${PGHOST}:${PGPORT}"

    # Pre-flight checks
    check_requirements
    test_connection

    # Create backup
    backup_file=$(create_backup "${backup_type}")

    if [[ -z "${backup_file}" ]]; then
        log_error "Backup creation failed"
        exit 1
    fi

    # Verify if requested
    if [[ "${do_verify}" == true ]]; then
        if ! verify_backup "${backup_file}"; then
            log_error "Backup verification failed"
            exit 1
        fi
    fi

    # Upload if requested
    if [[ "${do_upload}" == true ]]; then
        upload_to_s3 "${backup_file}"
        upload_to_gcs "${backup_file}"
    fi

    # Create weekly/monthly copies
    create_weekly_backup
    create_monthly_backup

    # Cleanup if requested
    if [[ "${do_cleanup}" == true ]]; then
        cleanup_old_backups
    fi

    # Generate report if requested
    if [[ "${do_report}" == true ]]; then
        generate_backup_report "${backup_file}"
    fi

    log_info "=========================================="
    log_success "Backup process completed successfully!"
    log_info "=========================================="
}

main "$@"
