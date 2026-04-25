# Backing Up the Database

## Manual Backups

1. Choose where you want to save the database dumps on your server.

   ```
   mkdir /var/hotchocolatefestpassport && cd /var/hotchocolatefestpassport
   ```

2. Ensure you have the postgres version installed that matches the supabase instance. I needed to follow the instructions here (https://www.postgresql.org/download/linux/ubuntu/#apt) to install version 17.

   ```
   sudo apt install -y postgresql-common
   sudo /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh
   sudo apt install postgresql-client-17
   ```

3. Run the following `pg_dump` command into a tmp file, then move it where you want it to be.

   ```
   pg_dump --inserts --column-inserts -h [host] -p [port] -d [dbname] -U [username] > /tmp/db_dump_$(date -d "today" +"%Y%m%d%H%M%S").sql
   sudo mv /tmp/db_dump_20260416235158.sql .
   ```

   Note: You can find your existing DB connection info in the DATABASE_URL ENV variable, which is in the format: `"postgresql://[username]:[password]@[host]:[port]/[dbname]"`, or by logging into your Supabase Dashboard.

## Automatic Backups

Follow this guide for cron setup & useful info: https://cronitor.io/guides/cron-jobs

1. Install & enable cron.

   ```
   sudo apt update && sudo apt install cron
   sudo systemctl enable cron
   ```

   Verify cron is running with: `ps aux | grep cron`

2. Copy the `ops/backups.sh` script file to `/var/hotchocolatefestpassport/backups.sh` on the server. Don't forget to give the script execute permissions: `chmod +x /var/hotchocolatefestpassport/backups.sh`

3. Start cron. Run `crontab -e`, select an editor, and add the following line to your crontab:

   ```
   0 12 * * * set -a; . /srv/hotchocolatefestpassport/.env; set +a; PARENT_DIR=/var/hotchocolatefestpassport /var/hotchocolatefestpassport/backups.sh
   ```

### Cron

This runs the cron every day at 12PM UTC (5AM Pacific).
The script puts backup files into the following directory structure: /var/hotchocolatefestpassport/backups/[year]/[month]/

#### Debugging Cron

https://www.baeldung.com/linux/cron-job-testing-debugging

1. Uncomment debug lines in backups.sh

2. Append `> /tmp/cron-debug.log 2>&1` to the end of the crontab entry. ie:

   ```
   0 12 * * * set -a; . /srv/hotchocolatefestpassport/.env; set +a; PARENT_DIR=/var/hotchocolatefestpassport /var/hotchocolatefestpassport/backups.sh > /tmp/cron-hcfpassport-db-backup-debug.log 2>&1
   ```

### Monitoring

1. To enable monitoring, set up a free account at [healthchecks.io](https://healthchecks.io/).

2. Setup a check matching the cron above.

3. Add your ping URL to your .env (DB_BACKUP_HEALTHCHECK_URL)

# Restoring the Database

1. Create a new Postgres DB, save DB password somewhere secure.

   Using Supabase:
   - Region: West US (Oregon)
   - Security: Enable Data API: enabled
   - Security: Enable Automatic RLS: enabled

2. Run the following `psql` command to restore the DB from a backup .sql file.

   ```
   psql -h [host] -p [port] -d [dbname] -U [username] < db_dump_20260416235158.sql
   ```

   Note: You can find your DB connection info for a Supabase project in your Supabase Dashboard:
   Connect > Direct (connection string) > Connection Method: Session pooler > Type: PSQL

3. Update the DATABASE_URL in your .env and restart the app. It should now be using the newly restored DB!
