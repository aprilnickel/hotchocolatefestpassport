# Backing Up the Database

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
