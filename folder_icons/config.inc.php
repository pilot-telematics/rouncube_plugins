<?php

// Folder Icons plugin configuration.
// Copy this file if it does not exist; it is safe to edit - the plugin
// never touches mail data, this file only drives the CSS/JS injection.

// ------------------------------------------------------------------
// Map folders to Font Awesome icons (see README.md for the full list
// of available icon names, all verified to exist in the Elastic skin
// font files).
//
// A map key matches a folder when it equals (case-insensitive):
//   - the full folder path,  e.g. "INBOX/Receipts" or "INBOX.Receipts"
//   - the visible folder name,
//   - the last path segment, e.g. "Receipts".
// Leading emoji/symbols of the folder name are ignored during matching.
//
// Special map keys (match by list class, independent of folder name):
//   "@inbox", "@drafts", "@sent", "@junk", "@trash"
//
// Regular expression keys are supported with a "re:" prefix, e.g.:
//   're:^INBOX/20\d\d$' => 'calendar-days',
//
// Optional color per folder:
//   'notes' => array('icon' => 'file-lines', 'color' => '#64748b'),
//
// NOTE: Roundcube applies its own icons to the special folders
// (Inbox, Drafts, Sent, Junk, Trash). Leave them out of the map to keep
// those icons, or override them with the "@..." keys.
// ------------------------------------------------------------------
$config['folder_icons_map'] = [
    // --- generic examples ---
    'reports'    => ['icon' => 'chart-line',      'color' => '#15803d'],
    'newsletter' => ['icon' => 'newspaper',       'color' => '#2563eb'],
    'travel'     => ['icon' => 'plane'],
    'receipts'   => ['icon' => 'receipt'],
    'finance'    => ['icon' => 'coins',           'color' => '#b45309'],
    'projects'   => ['icon' => 'diagram-project', 'color' => '#0369a1'],
    'photos'     => ['icon' => 'image'],
    'archive'    => ['icon' => 'box-archive',     'color' => '#64748b'],
    'notes'      => ['icon' => 'file-lines',      'color' => '#64748b'],
];

// Icon used for every folder that has no explicit map entry.
// Special folders (Inbox etc.) are never affected by the default.
// Set to null to keep the skin's standard folder icon ("\f07b").
//
// NOTE: per-user icon/color assignments made in the web UI
// (Settings -> Folders -> edit a folder) are stored in the user's
// preferences and take precedence over this map.
$config['folder_icons_default'] = 'folder-open';
