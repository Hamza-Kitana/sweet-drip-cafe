#!/bin/bash
# Run on VPS as root — fixes admin image upload "fetch failed" (nginx 1 MB limit)
set -euo pipefail

CONF="/etc/nginx/sites-available/api.sweetdrip.cafe"

if [ ! -f "$CONF" ]; then
  echo "Config not found: $CONF"
  echo "Find your api config: ls /etc/nginx/sites-available/"
  exit 1
fi

if grep -q "client_max_body_size" "$CONF"; then
  echo "client_max_body_size already set in $CONF"
else
  sed -i '/server {/a\
    client_max_body_size 50m;\
    proxy_read_timeout 120s;\
    proxy_send_timeout 120s;
' "$CONF"
  echo "Added upload limits to $CONF"
fi

nginx -t
systemctl reload nginx
echo "Done. Test upload in Admin again (Ctrl+Shift+R on the site first)."
