# Steps for a Manual Deploy (not via Github Actions)

## On local machine:

1. Login to Github Container Registry:

   `docker login ghcr.io`

2. Ensure your .env file contains production values.

3. Build & push:

   `docker buildx build --build-arg NEXT_PUBLIC_APP_URL=https://cocoa-dev.aprildawne.com --platform linux/amd64 --push -t ghcr.io/aprilnickel/hotchocolatefestpassport:latest .`

## On server:

4. Run the following:

   ```
   su - deploy
   cd /srv/hotchocolatefestpassport
   docker login ghcr.io
   docker compose pull app
   docker compose up -d app
   ```

### Remember:

- If changes are made to the Caddyfile (`/etc/caddy/Caddyfile`), must reload the caddy service: `sudo systemctl reload caddy`
- If exposing new ports, must allow through firewall: `sudo ufw allow <port>`
