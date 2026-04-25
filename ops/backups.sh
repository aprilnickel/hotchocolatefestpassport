#!/usr/bin/env bash

# UNCOMMENT TO DEBUG:
# printenv
# set -x

set -euo pipefail

if [[ -n "${DB_BACKUP_HEALTHCHECK_URL:-}" ]]; then
  curl -m 10 --retry 5 "$DB_BACKUP_HEALTHCHECK_URL/start"
fi

# Optional settings.
TMP_DIR="${TMP_DIR:-/tmp}"
PARENT_DIR="${1:-${PARENT_DIR:-.}}"
BACKUP_DIR="$PARENT_DIR/backups"
CURRENT_BACKUP_SUBDIR="$BACKUP_DIR/$(date +"%Y/%m")"
TIMESTAMP="$(date +"%Y%m%d%H%M%S")"
CURRENT_BACKUP_FILENAME="db_dump_${TIMESTAMP}.sql"
TMP_FILE="${TMP_DIR}/${CURRENT_BACKUP_FILENAME}"

mkdir -p "$CURRENT_BACKUP_SUBDIR"

if [[ -n "${DB_BACKUP_HEALTHCHECK_URL:-}" ]]; then
  curl -m 10 --retry 5 -X POST "$DB_BACKUP_HEALTHCHECK_URL/log" \
    -H "Content-Type: application/json" \
    -d "{\"message\": \"Creating backup at ${TMP_FILE}\"}"
fi

pg_dump --inserts --column-inserts \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -d "$DB_NAME" \
  -U "$DB_USER" > "$TMP_FILE"

mv "$TMP_FILE" "$CURRENT_BACKUP_SUBDIR/"

if [[ -n "${DB_BACKUP_HEALTHCHECK_URL:-}" ]]; then
  curl -m 10 --retry 5 -X POST "$DB_BACKUP_HEALTHCHECK_URL/log" \
    -H "Content-Type: application/json" \
    -d "{\"message\": \"Backup complete: ${CURRENT_BACKUP_SUBDIR}/${CURRENT_BACKUP_FILENAME}\"}"
fi

# Clean up old backups with rolling retention tiers:
# - keep all backups from the last 7 days
# - keep newest backup per month for the 12 months before that
# - keep newest backup per year for anything older

DAILY_CUTOFF_EPOCH="$(date -d '7 days ago' +%s)"
MONTHLY_CUTOFF_EPOCH="$(date -d '7 days ago 12 months ago' +%s)"
DRY_RUN="${DRY_RUN:-0}"

shopt -s globstar nullglob
ALL_BACKUPS=( "$BACKUP_DIR"/**/db_dump_*.sql )
shopt -u globstar nullglob

if [ "${#ALL_BACKUPS[@]}" -eq 0 ]; then
  if [[ -n "${DB_BACKUP_HEALTHCHECK_URL:-}" ]]; then
    curl -m 10 --retry 5 -X POST "$DB_BACKUP_HEALTHCHECK_URL" \
      -H "Content-Type: application/json" \
      -d "{\"message\": \"No backups found under ${BACKUP_DIR}; skipping retention.\"}"
  fi
  exit 0
fi

# Collect backup metadata in sortable form: epoch|path
SORTABLE_BACKUPS=()
for backup_path in "${ALL_BACKUPS[@]}"; do
  backup_file="$(basename "$backup_path")"
  if [[ "$backup_file" =~ ^db_dump_([0-9]{14})\.sql$ ]]; then
    ts="${BASH_REMATCH[1]}"
    backup_epoch="$(date -d "${ts:0:4}-${ts:4:2}-${ts:6:2} ${ts:8:2}:${ts:10:2}:${ts:12:2}" +%s)"
    SORTABLE_BACKUPS+=( "${backup_epoch}|${backup_path}" )
  fi
done

if [ "${#SORTABLE_BACKUPS[@]}" -eq 0 ]; then
  if [[ -n "${DB_BACKUP_HEALTHCHECK_URL:-}" ]]; then
    curl -m 10 --retry 5 -X POST "$DB_BACKUP_HEALTHCHECK_URL" \
      -H "Content-Type: application/json" \
      -d "{\"message\": \"No timestamped backup files matched expected pattern; skipping retention.\"}"
  fi
  exit 0
fi

declare -A KEEP_PATHS=()
declare -A KEPT_MONTH=()
declare -A KEPT_YEAR=()

while IFS='|' read -r backup_epoch backup_path; do
  if [ "$backup_epoch" -ge "$DAILY_CUTOFF_EPOCH" ]; then
    KEEP_PATHS["$backup_path"]=1
    continue
  fi

  if [ "$backup_epoch" -ge "$MONTHLY_CUTOFF_EPOCH" ]; then
    month_key="$(date -d "@${backup_epoch}" +%Y-%m)"
    if [ -z "${KEPT_MONTH[$month_key]+x}" ]; then
      KEPT_MONTH["$month_key"]=1
      KEEP_PATHS["$backup_path"]=1
    fi
    continue
  fi

  year_key="$(date -d "@${backup_epoch}" +%Y)"
  if [ -z "${KEPT_YEAR[$year_key]+x}" ]; then
    KEPT_YEAR["$year_key"]=1
    KEEP_PATHS["$backup_path"]=1
  fi
done < <(printf '%s\n' "${SORTABLE_BACKUPS[@]}" | sort -t'|' -k1,1nr)

deleted_count=0
kept_count=0

for backup_path in "${ALL_BACKUPS[@]}"; do
  if [ -n "${KEEP_PATHS[$backup_path]+x}" ]; then
    kept_count=$((kept_count + 1))
    continue
  fi

  if [ "$DRY_RUN" = "1" ]; then
    if [[ -n "${DB_BACKUP_HEALTHCHECK_URL:-}" ]]; then
      curl -m 10 --retry 5 -X POST "$DB_BACKUP_HEALTHCHECK_URL/log" \
        -H "Content-Type: application/json" \
        -d "{\"message\": \"DRY_RUN: would delete: ${backup_path}\"}"
    fi
  else
    rm -f "$backup_path"
    if [[ -n "${DB_BACKUP_HEALTHCHECK_URL:-}" ]]; then
      curl -m 10 --retry 5 -X POST "$DB_BACKUP_HEALTHCHECK_URL/log" \
        -H "Content-Type: application/json" \
        -d "{\"message\": \"Deleted old backup: ${backup_path}\"}"
    fi
  fi
  deleted_count=$((deleted_count + 1))
done

if [[ -n "${DB_BACKUP_HEALTHCHECK_URL:-}" ]]; then
  curl -m 10 --retry 5 -X POST "$DB_BACKUP_HEALTHCHECK_URL" \
    -H "Content-Type: application/json" \
    -d "{\"message\": \"Retention complete. Kept ${kept_count}, deleted ${deleted_count}\"}"
fi

# UNCOMMENT TO DEBUG:
# set +x
