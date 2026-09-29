# Roundcube plugins

Plugins for Roundcube Webmail (iRedMail installs).

English | [Русский](README_RU.md)

## folder_icons

Per-folder icons and colors: replaces the standard folder icon in the mail
sidebar and in Settings -> Folders with an individual Font Awesome icon and
optional color.

- Configured in the web UI: Settings -> Folders -> the "Folder icon" section
  (stored per user in prefs), or globally via `folder_icons/config.inc.php`.
- 181 icons; every codepoint is verified against the actual Elastic skin font
  files, so no glyph can render as an empty box.
- Handles Cyrillic and emoji folder names (IMAP UTF-7 is converted internally).
- Details: [folder_icons/README.md](folder_icons/README.md)

## find_from

Message-list context menu: "Find emails from sender", "…to sender",
"…from the sender's domain". Requires the `contextmenu` plugin.
Ships the `folder_badge` addon — a folder-name badge in multi-folder
search results.
- Details: [find_from/README.md](find_from/README.md)

## Repository layout

- `folder_icons/` — plugin (copied into Roundcube's `plugins/`)
- `find_from/` — plugin (copied into Roundcube's `plugins/`)
- `demo/` — offline demo pages
- `tools/gen_css.py` — generates `css/folder_icons.css` and `icons.php` from
  Font Awesome metadata, filtered by the glyphs actually present in the skin font
- `deploy.sh` — one-command install/update on the mail server

## Installing folder_icons

```bash
scp -r folder_icons/* root@mail.example.tld:/opt/www/roundcubemail/plugins/folder_icons/
```

and add `'folder_icons'` to `$config['plugins']` in the Roundcube config.

## Updating the plugins on the server from this repository

One-time on the mail server (public clone, no authentication):

```bash
git clone https://github.com/pilot-telematics/rouncube_plugins.git /opt/roundcube_plugins
```

Installing and every later update is a single command:

```bash
/opt/roundcube_plugins/deploy.sh
```

The script runs `git pull`, deploys `folder_icons` and `find_from` into the
Roundcube `plugins/` directory, sets permissions and **never overwrites**
`folder_icons/config.inc.php` (your live settings survive updates; on first
install the file is created from the `.dist` template). Non-default Roundcube
path:

```bash
RC_DIR=/var/www/roundcube /opt/roundcube_plugins/deploy.sh
```

Alternative without git on the server — rsync from a workstation:

```bash
rsync -rv --exclude config.inc.php folder_icons/ root@mail.example.tld:/opt/www/roundcubemail/plugins/folder_icons/
```
