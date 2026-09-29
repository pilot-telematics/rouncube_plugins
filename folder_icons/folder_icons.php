<?php

/**
 +-----------------------------------------------------------------------+
 | Folder Icons plugin for Roundcube Webmail                             |
 |                                                                       |
 | Copyright (C) 2026                                                    |
 | License: MIT                                                          |
 +-----------------------------------------------------------------------+
 | Replaces the default folder icon (Font Awesome "\f07b") in the        |
 | mailbox/folder lists with per-folder icons. Works in the mail view    |
 | sidebar as well as in Settings -> Folders.                            |
 |                                                                       |
 | Icons and colors can be assigned in two ways:                         |
 |   1. Globally in config.inc.php ($config['folder_icons_map']),        |
 |   2. Per user, in Settings -> Folders -> edit a folder ("Folder icon" |
 |      section, stored in the user's preferences).                      |
 |                                                                       |
 | User settings take precedence over the global config map.             |
 | The plugin only injects CSS/JS and stores preferences; it never       |
 | modifies mail data.                                                   |
 +-----------------------------------------------------------------------+
*/

class folder_icons extends rcube_plugin
{
    // Load on the mail and settings tasks only (folder lists live there).
    public $task = 'mail|settings';

    /**
     * Plugin initialization
     */
    function init()
    {
        $rcmail = rcmail::get_instance();

        $this->load_config();

        if (is_dir($this->home . '/localization')) {
            $this->add_texts('localization/', true);
        }

        // Folder edit form (Settings -> Folders) and persistence.
        // Roundcube < 1.6 uses register_hook(), newer versions add_hook().
        $hooks = [
            ['folder_form', 'folder_form'],
            ['folder_create', 'folder_save'],
            ['folder_update', 'folder_save'],
            ['folder_delete', 'folder_delete'],
        ];
        foreach ($hooks as [$hook, $method]) {
            if (method_exists($this, 'add_hook')) {
                $this->add_hook($hook, [$this, $method]);
            } else {
                $this->register_hook($hook, [$this, $method]);
            }
        }

        // Register a hook for the direct asset injection (see render_page());
        // works regardless of plugin API asset handling and assets_url setups.
        if (method_exists($this, 'add_hook')) {
            $this->add_hook('render_page', [$this, 'render_page']);
        } else {
            $this->register_hook('render_page', [$this, 'render_page']);
        }

        // Also expose the config through the standard env (used as a fallback
        // by the client script when present).
        if (is_object($rcmail->output) && method_exists($rcmail->output, 'set_env')) {
            $rcmail->output->set_env('folder_icons', $this->client_config());
        }
    }

    /**
     * Configuration for the client side script
     */
    private function client_config()
    {
        $rcmail = rcmail::get_instance();

        return [
            'map'     => (array) $rcmail->config->get('folder_icons_map', []),
            'default' => $rcmail->config->get('folder_icons_default'),
            'prefs'   => (array) $rcmail->config->get('folder_icons_prefs', []),
            'search'  => $this->gettext('fi_search'),
            'terms'   => $this->terms_list(),
        ];
    }

    /**
     * Russian (and any extra) search synonyms for the icon picker
     */
    private function terms_list()
    {
        static $terms = null;

        if ($terms === null) {
            $terms = [];
            $file  = $this->home . '/icons_terms.php';
            if (is_file($file)) {
                $loaded = include $file;
                if (is_array($loaded)) {
                    $terms = $loaded;
                }
            }
        }

        return $terms;
    }

    /**
     * CSS for the icon picker widget (injected together with the assets)
     */
    private function picker_css()
    {
        return <<<'CSS'
<style type="text/css">
.fi-picker { position: relative; display: inline-block; min-width: 16rem; vertical-align: middle; }
.fi-picker-btn { display: flex !important; align-items: center; gap: .5rem; width: 100%;
    text-align: left; cursor: pointer; background: #fff; }
.fi-picker-btn .fi-live-preview { font-size: 1.25em; width: 1.4em; flex: 0 0 auto; }
.fi-picker-label { flex: 1 1 auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fi-picker-caret { flex: 0 0 auto; width: 0; height: 0; border-left: .25em solid transparent;
    border-right: .25em solid transparent; border-top: .3em solid #666; }
.fi-picker-panel { display: none; position: fixed; z-index: 2000;
    background: #fff; border: 1px solid #ccc; border-radius: .25rem;
    box-shadow: 0 .2rem .6rem rgba(0,0,0,.25); }
.fi-picker-panel.open { display: block; }
.fi-picker-search { width: 100%; border: 0; border-bottom: 1px solid #ddd;
    border-radius: .25rem .25rem 0 0; padding: .4rem .5rem; }
.fi-picker-list { overflow-y: auto; padding: .15rem 0; }
.fi-picker-item { display: flex; align-items: center; gap: .6rem; padding: .3rem .7rem; cursor: pointer; }
.fi-picker-item:hover { background: #e8f4fa; }
.fi-picker-item.selected { background: #d5ebf7; }
.fi-picker-item.selected .fi-picker-label { font-weight: 700; }
.fi-picker-item .fi-live-preview { width: 1.4em; flex: 0 0 auto; font-size: 1.15em; text-align: center; }
</style>
CSS;
    }

    /**
     * render_page hook: inject the plugin stylesheet and script directly
     * into the page head.
     *
     * This bypasses the plugin API asset handling (include_stylesheet etc.)
     * which can silently drop files depending on install layout
     * (public_html, assets_url/static.php serving, .min rewrites).
     */
    function render_page($args)
    {
        try {
            if (empty($args['content']) || stripos($args['content'], '</head>') === false) {
                return $args;
            }

            $rcmail = rcmail::get_instance();

            // Base URL for static assets; on hardened installs assets are
            // served through a wrapper, e.g. $config['assets_url'] = 'static.php/'
            $base = (string) $rcmail->config->get('assets_url', './');
            if ($base === '' || $base === '/') {
                $base = './';
            }
            if (substr($base, -1) !== '/') {
                $base .= '/';
            }

            $ver = @filemtime($this->home . '/css/folder_icons.css');
            $suffix = $ver ? '?v=' . $ver : '';

            $css_url = $base . 'plugins/folder_icons/css/folder_icons.css' . $suffix;
            $js_url  = $base . 'plugins/folder_icons/js/folder_icons.js' . $suffix;

            $config = json_encode($this->client_config(),
                JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);

            $tag = $this->picker_css()
                . '<link rel="stylesheet" type="text/css" href="' . $css_url . "\">\n"
                . '<script>window.folder_icons_config = ' . $config . ';</script>' . "\n"
                . '<script type="text/javascript" src="' . $js_url . '"></script>' . "\n";

            $args['content'] = str_ireplace('</head>', $tag . '</head>', $args['content']);
        } catch (Throwable $e) {
            rcube::raise_error($e, true, false);
        }

        return $args;
    }

    /**
     * folder_form hook: add the "Folder icon" section to the folder edit form
     */
    function folder_form($args)
    {
        try {
            return $this->folder_form_build($args);
        } catch (Throwable $e) {
            rcube::raise_error($e, true, false);
            return $args;
        }
    }

    /**
     * Build the "Folder icon" form section
     */
    private function folder_form_build($args)
    {
        $rcmail  = rcmail::get_instance();
        // The tree displays UTF-8 names while the hook receives the internal
        // (IMAP UTF-7) name; use the UTF-8 form for preference lookups.
        $raw     = (string) $args['name'];
        $name    = $this->folder_name_utf8($raw);
        $prefs   = (array) $rcmail->config->get('folder_icons_prefs', []);
        $current = (array) ($prefs[$name] ?? $prefs[$raw] ?? []);

        // Icon names available in css/folder_icons.css (verified glyphs)
        $icons = $this->icons_list();
        if (empty($icons)) {
            return $args;
        }

        // Re-display submitted values after validation errors
        $cur_icon  = trim((string) rcube_utils::get_input_string('_fi_icon', rcube_utils::INPUT_GPC));
        $cur_color = trim((string) rcube_utils::get_input_string('_fi_color', rcube_utils::INPUT_GPC));
        if ($cur_icon === '' && $cur_color === '' && !isset($_POST['_fi_icon'])) {
            $cur_icon  = (string) ($current['icon'] ?? '');
            $cur_color = (string) ($current['color'] ?? '');
        }

        $cur_color    = $this->sanitize_color($cur_color);
        $cur_color_on = $cur_color !== null || rcube_utils::get_input_string('_fi_color_on', rcube_utils::INPUT_GPC) !== '';

        // Icon select
        $select = new html_select(['name' => '_fi_icon', 'id' => '_fi_icon', 'class' => 'form-control']);
        $select->add($this->gettext('fi_icon_default'), '');
        foreach ($icons as $icon) {
            $select->add($icon, $icon);
        }

        // Live preview of the chosen icon
        $preview_style = null;
        if ($cur_color_on && $cur_color !== null) {
            $preview_style = 'color:' . $cur_color;
        }

        $preview = html::span([
            'id'    => 'folder-icons-preview',
            'class' => 'fi-live-preview' . ($cur_icon !== '' ? ' fi-' . $cur_icon : ''),
            'style' => $preview_style,
        ], '');

        // Custom color
        $color_input = new html_inputfield([
            'name'  => '_fi_color',
            'id'    => '_fi_color',
            'type'  => 'color',
            'value' => $cur_color !== null ? $cur_color : '#1c1c1c',
            'class' => 'form-control',
        ]);
        $color_check = new html_checkbox(['name' => '_fi_color_on', 'id' => '_fi_color_on', 'value' => '1']);

        $icon_field = html::div(null,
            $select->show($cur_icon)
            . '&nbsp; ' . $preview
        );
        $color_field = html::div(null,
            $color_check->show($cur_color_on ? '1' : '')
            . '&nbsp; ' . html::label(['for' => '_fi_color_on'], $this->gettext('fi_color_on'))
            . '&nbsp; ' . $color_input->show($cur_color !== null ? $cur_color : '#1c1c1c')
        );

        $fields = [
            'icon'  => ['label' => $this->gettext('fi_icon'), 'value' => $icon_field],
            'color' => ['label' => $this->gettext('fi_color'), 'value' => $color_field],
        ];

        // "Remove" option only makes sense when something is assigned
        if ($name !== '' && !empty($current)) {
            $remove_check = new html_checkbox(['name' => '_fi_remove', 'id' => '_fi_remove', 'value' => '1']);
            $fields['remove'] = [
                'label' => $this->gettext('fi_remove'),
                'value' => $remove_check->show(''),
            ];
        }

        $args['form']['props']['fieldsets']['folder_icons'] = [
            'name'    => $this->gettext('fi_settings'),
            'content' => $fields,
        ];

        return $args;
    }

    /**
     * folder_create/folder_update hook: persist the chosen icon/color
     * in the user's preferences
     */
    function folder_save($args)
    {
        try {
            return $this->folder_save_prefs($args);
        } catch (Throwable $e) {
            rcube::raise_error($e, true, false);
            return $args;
        }
    }

    /**
     * Store icon/color preferences for the saved folder
     */
    private function folder_save_prefs($args)
    {
        $rcmail = rcmail::get_instance();

        $record = (array) ($args['record'] ?? []);
        $raw    = (string) ($record['name'] ?? '');
        $name   = $this->folder_name_utf8($raw);
        if ($name === '') {
            return $args;
        }

        $prefs = (array) $rcmail->config->get('folder_icons_prefs', []);

        // On rename, move the setting (including subfolders) to the new name
        $oldRaw = (string) ($record['oldname'] ?? '');
        $old    = $oldRaw !== '' ? $this->folder_name_utf8($oldRaw) : '';
        if ($old !== '' && $old !== $name) {
            if (isset($prefs[$old])) {
                $prefs[$name] = $prefs[$old];
                unset($prefs[$old]);
            }

            $delimiter = '.';
            try {
                $delimiter = $rcmail->get_storage()->get_hierarchy_delimiter();
            } catch (Throwable $e) { /* keep default */ }

            $prefix = $old . $delimiter;
            foreach (array_keys($prefs) as $key) {
                if (strpos($key, $prefix) === 0) {
                    $prefs[$name . substr($key, strlen($old))] = $prefs[$key];
                    unset($prefs[$key]);
                }
            }
        }

        $icon     = trim((string) rcube_utils::get_input_string('_fi_icon', rcube_utils::INPUT_POST));
        $color    = rcube_utils::get_input_string('_fi_color', rcube_utils::INPUT_POST);
        $color_on = rcube_utils::get_input_string('_fi_color_on', rcube_utils::INPUT_POST);
        $remove   = rcube_utils::get_input_string('_fi_remove', rcube_utils::INPUT_POST);

        if ($remove !== '') {
            unset($prefs[$name]);
        } else {
            $entry = [];

            if ($icon !== '' && in_array($icon, $this->icons_list())) {
                $entry['icon'] = $icon;
            }

            $color = $this->sanitize_color($color);
            if ($color_on !== '' && $color !== null) {
                $entry['color'] = $color;
            }

            if (empty($entry)) {
                unset($prefs[$name]);
            } else {
                $prefs[$name] = $entry;
            }
        }

        // Drop legacy entries stored under the internal (IMAP UTF-7) names
        foreach (array_unique([$raw, $oldRaw]) as $legacy) {
            if ($legacy !== '' && $legacy !== $name && isset($prefs[$legacy])) {
                unset($prefs[$legacy]);
            }
        }

        $rcmail->user->save_prefs(['folder_icons_prefs' => $prefs]);

        return $args;
    }

    /**
     * folder_delete hook: drop the stored icon/color for the deleted folder
     */
    function folder_delete($args)
    {
        try {
            $rcmail = rcmail::get_instance();
            $name   = (string) ($args['name'] ?? '');
            $prefs  = (array) $rcmail->config->get('folder_icons_prefs', []);

            if ($name !== '' && isset($prefs[$name])) {
                unset($prefs[$name]);
                $rcmail->user->save_prefs(['folder_icons_prefs' => $prefs]);
            }
        } catch (Throwable $e) {
            rcube::raise_error($e, true, false);
        }

        return $args;
    }

    /**
     * Valid icon names (verified against the skin font)
     */
    private function icons_list()
    {
        static $icons = null;

        if ($icons === null) {
            $icons = [];
            $file  = $this->home . '/icons.php';
            if (is_file($file)) {
                $loaded = include $file;
                if (is_array($loaded)) {
                    $icons = $loaded;
                }
            }
        }

        return $icons;
    }

    /**
     * Roundcube keeps IMAP folder names in modified UTF-7 internally while
     * the folder trees display UTF-8 ("&BCgEOgQ+BDsEMA-" is "Школа").
     * Convert so preference keys match the displayed names.
     */
    private function folder_name_utf8($name)
    {
        $name = (string) $name;

        if (strpos($name, '&') !== false && preg_match('/&[A-Za-z0-9+,-]*-/', $name)) {
            $utf8 = rcube_charset::convert($name, 'UTF7-IMAP', 'UTF-8');
            if ($utf8 !== null && $utf8 !== '' && $utf8 !== $name) {
                return $utf8;
            }
        }

        return $name;
    }

    /**
     * Validate a hex color, return null if invalid
     */
    private function sanitize_color($color)
    {
        $color = trim((string) $color);
        if (preg_match('/^#[0-9a-f]{6}$/i', $color)) {
            return strtolower($color);
        }

        return null;
    }
}
