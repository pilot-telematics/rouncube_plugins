# folder_icons — per-folder icons for Roundcube Webmail

A Roundcube plugin that replaces the standard folder icon
(`.folderlist li a:before { content: "\f07b" }`) with a dedicated Font Awesome
icon — and optional color — per folder, in both places folder lists appear:

* the mail view sidebar (`#mailboxlist`),
* *Settings → Folders* (`#folders-list`).

Icons can be assigned in two ways:

1. **Per user, in the web UI** — *Settings → Folders* → click a folder →
   new **"Folder icon"** section with an icon dropdown (with live preview)
   and a color picker. Stored in the user's preferences; survives folder
   renames, cleaned up on folder delete.
2. **Globally by the admin** — `$config['folder_icons_map']` in the plugin
   config. Per-user settings take precedence over the global map.

It works on the stock **Elastic** skin as shipped by Roundcube **1.7.x**
(incl. the Roundcube bundled with iRedMail) and reuses the icon font
(`Icons` / fa-solid-900, fa-regular-400) that the skin already loads —
**no font files are shipped or downloaded by the plugin**. Every icon
codepoint shipped in `css/folder_icons.css` was verified against the actual
`fa-solid-900.woff2` / `fa-regular-400.woff2` files of the Elastic skin, so
no icon can render as an empty box.

The plugin only injects CSS/JS into the page. It does not touch mail data,
does not add database tables and has no UI — everything is configured in one
PHP file.

## Install (iRedMail server)

The Roundcube shipped by iRedMail is a standard Roundcube install, iRedAdmin
needs no changes. The Roundcube directory is (find yours with
`ls -d /opt/www/* /var/www/*`):

* Debian / Ubuntu: `/opt/www/roundcube` **or** `/opt/www/roundcubemail`
* CentOS / Rocky / Alma: `/var/www/roundcube` (or `roundcubemail`)
* FreeBSD: `/usr/local/www/roundcube`

All commands below use `/opt/www/roundcubemail` — replace with your actual
path. Enabling a plugin whose folder does not exist makes Roundcube fail
every request with "An internal error has occurred".

1. Upload the `folder_icons` directory into the `plugins/` directory, e.g.
   from your workstation:

   ```bash
   scp -r folder_icons root@mail.example.tld:/opt/www/roundcube/plugins/
   ```

2. Enable the plugin in the Roundcube config
   (`/opt/www/roundcube/config/config.inc.php`) by adding it to the
   `plugins` array:

   ```php
   $config['plugins'] = [
       // ... existing plugins ...
       'archive',
       'zipdownload',
       'folder_icons',   // <-- add this line
   ];
   ```

3. Fix permissions and reload PHP if you run opcache:

   ```bash
   chown -R root: /opt/www/roundcube/plugins/folder_icons
   systemctl reload php*-fpm   # or: systemctl reload httpd / nginx
   ```

4. Hard-refresh the browser (Ctrl+F5) — the folder lists now show the
   configured icons.

If you serve Roundcube static assets through a wrapper (e.g. `static.php`)
make sure `plugins/folder_icons/css/folder_icons.css` and
`plugins/folder_icons/js/folder_icons.js` are reachable like the skin files.

## Configure icons

### Per user (web UI)

Open *Settings → Folders*, select a folder and use the **Folder icon**
section of the edit form:

* **Icon** — dropdown of all 181 available icons; the selected icon is shown
  live next to the dropdown. `(theme default)` restores the skin's icon.
* **Color** — tick *Custom color* and pick a color; the preview updates
  instantly. Untick to keep the theme color.
* If the folder already has a custom icon/color, a **Remove custom icon and
  color** checkbox is shown to reset it.

Settings are stored per user (Roundcube prefs), keyed by full folder name.
They survive folder renames (including subfolders) and are removed when the
folder is deleted. The list updates after the next page (re)load.

### Global (admin, config.inc.php)

Edit `plugins/folder_icons/config.inc.php` (keep your copy when upgrading;
`config.inc.php.dist` is the shipped template):

```php
$config['folder_icons_map'] = [
    'receipts' => ['icon' => 'receipt'],
    'notes'    => ['icon' => 'file-lines', 'color' => '#64748b'],
    // regex example: every year folder
    're:^INBOX/20\d\d$' => 'calendar-days',
];
```

A map key matches a folder (case-insensitive) when it equals

* the full folder path — `INBOX/Receipts` or `INBOX.Receipts`,
* the visible folder name, or
* the last path segment — `Receipts`.

Folder names may start with emoji or symbols (e.g. "📁 Projects"); leading
non-letter characters are ignored during matching, so the map key `Projects`
matches the folder "📁 Projects".

Special map keys match by list class regardless of the folder name:
`@inbox`, `@drafts`, `@sent`, `@junk`, `@trash`. Roundcube already gives
those folders their own icons; leave them out of the map to keep them.

`folder_icons_default` sets the icon for every other folder (special folders
are never affected by the default); `null` keeps the skin's standard icon.

## Available icon names (181, verified against the skin fonts)

<!-- ICONS:START -->
`address-book` `address-card` `anchor` `arrows-rotate` `bag-shopping` `ban`
`barcode` `basket-shopping` `bell` `bicycle` `bolt` `book` `book-open`
`bookmark` `box` `box-archive` `box-open` `boxes-stacked` `bug` `building`
`building-columns` `bullhorn` `calendar` `calendar-check` `calendar-days`
`camera` `car` `cart-shopping` `chart-line` `chart-pie` `circle-check`
`circle-exclamation` `circle-info` `circle-question` `circle-xmark`
`clipboard-list` `clock` `cloud` `code` `coins` `comment` `comment-dots`
`comments` `credit-card` `cube` `cubes` `database` `diagram-project`
`download` `droplet` `envelope` `envelope-open` `envelope-open-text` `eye`
`eye-slash` `file` `file-code` `file-csv` `file-excel` `file-invoice`
`file-invoice-dollar` `file-lines` `file-pdf` `file-powerpoint` `file-word`
`file-zipper` `film` `filter` `fire` `fire-flame-curved` `folder`
`folder-minus` `folder-open` `folder-plus` `gear` `gears` `gem` `gift`
`globe` `graduation-cap` `hand-holding-dollar` `handshake` `hard-drive`
`headphones` `heart` `home` `hospital` `hourglass-half` `id-card` `image`
`images` `inbox` `industry` `key` `laptop` `leaf` `lightbulb` `link`
`list-check` `list-ol` `list-ul` `location-dot` `lock` `lock-open`
`magnifying-glass` `map` `map-location` `microchip` `microphone` `money-bill`
`money-bill-1` `money-check-dollar` `moon` `mug-hot` `mug-saucer` `music`
`network-wired` `newspaper` `note-sticky` `paintbrush` `paper-plane`
`paperclip` `paw` `pen` `pen-nib` `pen-to-square` `pencil` `phone`
`phone-volume` `piggy-bank` `plane` `play` `plug` `print` `puzzle-piece`
`qrcode` `receipt` `rocket` `rss` `scale-balanced` `scissors`
`screwdriver-wrench` `seedling` `server` `share-nodes` `shield-halved` `ship`
`shirt` `sitemap` `sliders` `snowflake` `star` `stopwatch` `store` `suitcase`
`sun` `tag` `tags` `terminal` `thumbs-up` `thumbtack` `trash`
`trash-arrow-up` `trash-can` `tree` `triangle-exclamation` `trophy` `truck`
`truck-fast` `umbrella` `upload` `user` `user-group` `user-tie` `users`
`utensils` `video` `wallet` `wifi` `wine-glass` `wrench`
<!-- ICONS:END -->

## How it works

* `folder_icons.php` loads `css/folder_icons.css` + `js/folder_icons.js` on
  `mail` and `settings` pages and passes the icon sources to the client via
  `set_env` (user prefs first, then the global map, then the default icon).
* The **Folder icon** section in the folder edit form is added through the
  `folder_form` hook; values are persisted through the `folder_create`,
  `folder_update` and `folder_delete` hooks (Roundcube 1.6+).
* `js/folder_icons.js` walks every `.folderlist` item, identifies the folder
  (anchor title, visible text without counters, last path segment, special
  folder classes), adds class `fi-<icon>` to the `<li>` and optionally sets
  `--fi-color` for the icon color. A `MutationObserver` re-applies icons
  after the list is rebuilt (subscribe, drag & drop, folder create/rename,
  page changes).

## Troubleshooting

* **Icons don't change** — browser cache: Ctrl+F5. Then check that the plugin
  is listed without errors in `logs/errors.log`.
* **Only some icons changed** — the icon name is not in the list above or was
  mistyped; unmatched folders keep the skin default.
* **Everything looks the same** — check that `css/folder_icons.css` is served
  correctly (view-source of the page, look for `folder_icons.css` in `<head>`).

## Requirements

* Roundcube 1.5 – 1.7.x with the Elastic skin (tested against 1.7.x assets)
* PHP 7.3+
