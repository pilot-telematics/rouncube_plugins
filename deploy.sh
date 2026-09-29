#!/bin/sh
# Deploys the plugins from this repository into a local Roundcube install.
#
# One-time setup (on the mail server, as root):
#   git clone https://github.com/pilot-telematics/rouncube_plugins.git /opt/roundcube_plugins
#
# Then, to install or update:
#   /opt/roundcube_plugins/deploy.sh
#   RC_DIR=/var/www/roundcube /opt/roundcube_plugins/deploy.sh   # custom path
#
# Notes:
#   - folder_icons/config.inc.php is NEVER overwritten: your live settings
#     survive updates (on first install it is created from the .dist template)
#   - browser cache: hard-refresh the webmail page after deploying

set -e

RC_DIR="${RC_DIR:-/opt/www/roundcubemail}"
REPO_DIR=$(cd "$(dirname "$0")" && pwd)
PLUGINS="$RC_DIR/plugins"

echo "Roundcube root: $RC_DIR"
[ -d "$PLUGINS" ] || { echo "ERROR: $PLUGINS not found"; exit 1; }

# pull the latest version of this repository
cd "$REPO_DIR"
git pull --ff-only

for p in folder_icons find_from; do
    [ -d "$REPO_DIR/$p" ] || continue
    mkdir -p "$PLUGINS/$p"
    # --delete removes stale files, --exclude protects the live config
    rsync -a --delete \
        --exclude 'config.inc.php' \
        --exclude 'README.md' \
        "$REPO_DIR/$p/" "$PLUGINS/$p/"
    echo "deployed: $p"
done

# first install: create the config from the shipped template
if [ ! -f "$PLUGINS/folder_icons/config.inc.php" ]; then
    cp "$PLUGINS/folder_icons/config.inc.php.dist" "$PLUGINS/folder_icons/config.inc.php"
    echo "created folder_icons/config.inc.php from the template"
fi

# permissions: readable by the web server/PHP
find "$PLUGINS/folder_icons" "$PLUGINS/find_from" -type d -exec chmod 755 {} + 2>/dev/null || true
find "$PLUGINS/folder_icons" "$PLUGINS/find_from" -type f -exec chmod 644 {} + 2>/dev/null || true

echo
echo "Done. Hard-refresh the webmail page (Ctrl+F5)."
echo "If assets seem stale: systemctl reload php*-fpm"
