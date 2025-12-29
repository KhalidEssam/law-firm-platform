#!/bin/bash
# =============================================================================
# PostgreSQL Restore Script for Exoln Lex
# =============================================================================
# This script restores PostgreSQL databases from backup files.
# Supports restoration from local files or cloud storage (S3/GCS).
#
# Usage:
#   ./restore.sh [options] <backup_file_or_s3_path>
#
# Options:
#   --target-db     Target database name (default: PGDATABASE)
#   --drop-existing Drop existing database before restore
#   --schema-only   Restore schema only
#   --data-only     Restore data only
#   --dry-run       Show what would be done without executing
#   --list          List contents of backup file
#
# Environment Variables:
#   PGHOST          PostgreSQL host (default: localhost)
#   PGPORT          PostgreSQL port (default: 5432)
#   PGUSER          PostgreSQL user (required)
#   PGPASSWORD      PostgreSQL password (required)
#   PGDATABASE      PostgreSQL database (required)
#
# =============================================================================

set -euo pipefail

# =============================================================================
# Configuration
# =============================================================================

PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-}"
PGPASSWORD="${PGPASSWORD:-}"
PGDATABASE="${PGDATABASE:-}"

BACKUP_DIR="${BACKUP_DIR:-/backups}"
TEMP_DIR="${TEMP_DIR:-/tmp/restore_$$}"

# =============================================================================
# Functions
# =============================================================================

log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[${timestamp}] [${level}] ${message}"
}

log_info() { log "INFO" "$1"; }
log_warn() { log "WARN" "$1"; }
log_error() { log "ERROR" "$1"; }
log_success() { log "SUCCESS" "$1"; }

cleanup() {
    if [[ -d "${TEMP_DIR}" ]]; then
        rm -rf "${TEMP_DIR}"
    fi
}

trap cleanup EXIT

check_requirements() {
    log_info "Checking requirements..."

    if [[ -z "${PGUSER}" ]]; then
        log_error "PGUSER environment variable is required"
        exit 1
    fi

    if [[ -z "${PGPASSWORD}" ]]; then
        log_error "PGPASSWORD environment variable is required"
        exit 1
    fi

    for cmd in pg_restore psql; do
        if ! command -v "${cmd}" &> /dev/null; then
            log_error "Required command '${cmd}' not found"
            exit 1
        fi
    done

    mkdir -p "${TEMP_DIR}"
    log_success "Requirements check passed"
}

test_connection() {
    log_info "Testing database connection..."

    if PGPASSWORD="${PGPASSWORD}" psql -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "postgres" -c "SELECT 1" > /dev/null 2>&1; then
        log_success "Database connection successful"
        return 0
    else
        log_error "Failed to connect to database"
        return 1
    fi
}

download_from_s3() {
    local s3_path="$1"
    local local_file="${TEMP_DIR}/$(basename "${s3_path}")"

    log_info "Downloading from S3: ${s3_path}"

    if aws s3 cp "${s3_path}" "${local_file}"; then
        log_success "Download completed: ${local_file}"
        echo "${local_file}"
        return 0
    else
        log_error "Failed to download from S3"
        return 1
    fi
}

download_from_gcs() {
    local gcs_path="$1"
    local local_file="${TEMP_DIR}/$(basename "${gcs_path}")"

    log_info "Downloading from GCS: ${gcs_path}"

    if gsutil cp "${gcs_path}" "${local_file}"; then
        log_success "Download completed: ${local_file}"
        echo "${local_file}"
        return 0
    else
        log_error "Failed to download from GCS"
        return 1
    fi
}

get_backup_file() {
    local input_path="$1"

    if [[ "${input_path}" == s3://* ]]; then
        download_from_s3 "${input_path}"
    elif [[ "${input_path}" == gs://* ]]; then
        download_from_gcs "${input_path}"
    elif [[ -f "${input_path}" ]]; then
        echo "${input_path}"
    else
        log_error "Backup file not found: ${input_path}"
        return 1
    fi
}

list_backup_contents() {
    local backup_file="$1"

    log_info "Listing contents of: ${backup_file}"
    echo ""
    echo "=== Backup Contents ==="
    pg_restore --list "${backup_file}" 2>/dev/null | head -100
    echo ""
    echo "=== Summary ==="
    echo "Tables: $(pg_restore --list "${backup_file}" 2>/dev/null | grep -c 'TABLE DATA' || echo 0)"
    echo "Indexes: $(pg_restore --list "${backup_file}" 2>/dev/null | grep -c 'INDEX' || echo 0)"
    echo "Constraints: $(pg_restore --list "${backup_file}" 2>/dev/null | grep -c 'CONSTRAINT' || echo 0)"
    echo "Functions: $(pg_restore --list "${backup_file}" 2>/dev/null | grep -c 'FUNCTION' || echo 0)"
}

check_database_exists() {
    local db_name="$1"

    if PGPASSWORD="${PGPASSWORD}" psql -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "postgres" -tAc \
        "SELECT 1 FROM pg_database WHERE datname='${db_name}'" | grep -q 1; then
        return 0
    else
        return 1
    fi
}

drop_database() {
    local db_name="$1"

    log_warn "Dropping database: ${db_name}"

    # Terminate existing connections
    PGPASSWORD="${PGPASSWORD}" psql -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "postgres" -c \
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${db_name}' AND pid <> pg_backend_pid();" \
        > /dev/null 2>&1 || true

    # Drop the database
    if PGPASSWORD="${PGPASSWORD}" psql -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "postgres" -c \
        "DROP DATABASE IF EXISTS \"${db_name}\""; then
        log_success "Database dropped: ${db_name}"
        return 0
    else
        log_error "Failed to drop database: ${db_name}"
        return 1
    fi
}

create_database() {
    local db_name="$1"

    log_info "Creating database: ${db_name}"

    if PGPASSWORD="${PGPASSWORD}" psql -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "postgres" -c \
        "CREATE DATABASE \"${db_name}\" WITH ENCODING='UTF8'"; then
        log_success "Database created: ${db_name}"
        return 0
    else
        log_error "Failed to create database: ${db_name}"
        return 1
    fi
}

restore_backup() {
    local backup_file="$1"
    local target_db="$2"
    local restore_opts="$3"

    log_info "Restoring backup to database: ${target_db}"
    log_info "Backup file: ${backup_file}"
    log_info "Restore options: ${restore_opts}"

    local start_time=$(date +%s)

    # Perform the restore
    if PGPASSWORD="${PGPASSWORD}" pg_restore \
        -h "${PGHOST}" \
        -p "${PGPORT}" \
        -U "${PGUSER}" \
        -d "${target_db}" \
        ${restore_opts} \
        "${backup_file}" 2>&1; then

        local end_time=$(date +%s)
        local duration=$((end_time - start_time))

        log_success "Restore completed in ${duration}s"
        return 0
    else
        log_warn "Restore completed with warnings (some objects may already exist)"
        return 0
    fi
}

verify_restore() {
    local target_db="$1"

    log_info "Verifying restore..."

    # Count tables
    local table_count=$(PGPASSWORD="${PGPASSWORD}" psql -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "${target_db}" -tAc \
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'")

    # Count rows in key tables
    local user_count=$(PGPASSWORD="${PGPASSWORD}" psql -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "${target_db}" -tAc \
        "SELECT COUNT(*) FROM \"User\"" 2>/dev/null || echo "0")

    echo ""
    echo "=== Restore Verification ==="
    echo "Tables restored: ${table_count}"
    echo "Users in database: ${user_count}"
    echo ""

    if [[ "${table_count}" -gt 0 ]]; then
        log_success "Restore verification passed"
        return 0
    else
        log_error "Restore verification failed - no tables found"
        return 1
    fi
}

print_usage() {
    cat << EOF
PostgreSQL Restore Script for Exoln Lex

Usage: $0 [OPTIONS] <backup_file>

Arguments:
    backup_file     Path to backup file (local, s3://, or gs://)

Options:
    --target-db DB  Target database name (default: \$PGDATABASE)
    --drop-existing Drop existing database before restore
    --schema-only   Restore schema only (no data)
    --data-only     Restore data only (assumes schema exists)
    --no-owner      Do not restore ownership
    --no-privileges Do not restore privileges
    --dry-run       Show what would be done
    --list          List backup contents without restoring
    --verify        Verify restore after completion
    --help          Show this help message

Examples:
    $0 /backups/daily/exoln_lex_full_20250101.dump
    $0 --drop-existing --verify /backups/daily/backup.dump
    $0 --list s3://my-bucket/backups/backup.dump
    $0 --target-db exoln_lex_test /backups/backup.dump

Environment Variables:
    PGHOST          PostgreSQL host (default: localhost)
    PGPORT          PostgreSQL port (default: 5432)
    PGUSER          PostgreSQL user (required)
    PGPASSWORD      PostgreSQL password (required)
    PGDATABASE      Default target database

WARNING: This script can DROP and recreate databases!
         Always verify you have a valid backup before restoring.
EOF
}

confirm_action() {
    local message="$1"

    echo ""
    log_warn "${message}"
    read -p "Are you sure you want to continue? (yes/no): " confirm

    if [[ "${confirm}" != "yes" ]]; then
        log_info "Operation cancelled by user"
        exit 0
    fi
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    local backup_input=""
    local target_db="${PGDATABASE}"
    local drop_existing=false
    local schema_only=false
    local data_only=false
    local no_owner=false
    local no_privileges=false
    local dry_run=false
    local list_only=false
    local do_verify=false

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --target-db)
                target_db="$2"
                shift 2
                ;;
            --drop-existing)
                drop_existing=true
                shift
                ;;
            --schema-only)
                schema_only=true
                shift
                ;;
            --data-only)
                data_only=true
                shift
                ;;
            --no-owner)
                no_owner=true
                shift
                ;;
            --no-privileges)
                no_privileges=true
                shift
                ;;
            --dry-run)
                dry_run=true
                shift
                ;;
            --list)
                list_only=true
                shift
                ;;
            --verify)
                do_verify=true
                shift
                ;;
            --help|-h)
                print_usage
                exit 0
                ;;
            -*)
                log_error "Unknown option: $1"
                print_usage
                exit 1
                ;;
            *)
                backup_input="$1"
                shift
                ;;
        esac
    done

    if [[ -z "${backup_input}" ]]; then
        log_error "Backup file path is required"
        print_usage
        exit 1
    fi

    log_info "=========================================="
    log_info "Exoln Lex PostgreSQL Restore"
    log_info "=========================================="

    check_requirements
    test_connection

    # Get the backup file (download if needed)
    backup_file=$(get_backup_file "${backup_input}")

    if [[ -z "${backup_file}" ]]; then
        log_error "Failed to get backup file"
        exit 1
    fi

    # List only mode
    if [[ "${list_only}" == true ]]; then
        list_backup_contents "${backup_file}"
        exit 0
    fi

    # Build restore options
    restore_opts="--verbose --no-acl"

    if [[ "${schema_only}" == true ]]; then
        restore_opts="${restore_opts} --schema-only"
    fi

    if [[ "${data_only}" == true ]]; then
        restore_opts="${restore_opts} --data-only"
    fi

    if [[ "${no_owner}" == true ]]; then
        restore_opts="${restore_opts} --no-owner"
    fi

    if [[ "${no_privileges}" == true ]]; then
        restore_opts="${restore_opts} --no-privileges"
    fi

    # Dry run mode
    if [[ "${dry_run}" == true ]]; then
        echo ""
        echo "=== DRY RUN ==="
        echo "Would restore: ${backup_file}"
        echo "To database: ${target_db}"
        echo "Options: ${restore_opts}"
        echo "Drop existing: ${drop_existing}"
        echo ""
        list_backup_contents "${backup_file}"
        exit 0
    fi

    # Confirmation for destructive operations
    if [[ "${drop_existing}" == true ]]; then
        confirm_action "This will DROP the database '${target_db}' and all its data!"
    else
        confirm_action "This will restore data to database '${target_db}'"
    fi

    # Drop and recreate if requested
    if [[ "${drop_existing}" == true ]]; then
        if check_database_exists "${target_db}"; then
            drop_database "${target_db}"
        fi
        create_database "${target_db}"
    elif ! check_database_exists "${target_db}"; then
        create_database "${target_db}"
    fi

    # Perform restore
    restore_backup "${backup_file}" "${target_db}" "${restore_opts}"

    # Verify if requested
    if [[ "${do_verify}" == true ]]; then
        verify_restore "${target_db}"
    fi

    log_info "=========================================="
    log_success "Restore process completed!"
    log_info "=========================================="
}

main "$@"
