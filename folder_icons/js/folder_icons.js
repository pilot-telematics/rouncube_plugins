/**
 * Roundcube plugin: folder_icons
 *
 * Applies per-folder icon classes (fi-<name>) to folder list items,
 * see css/folder_icons.css for the generated icon classes.
 *
 * Icon sources, in order of precedence:
 *   1. User preferences assigned in Settings -> Folders (env.prefs),
 *   2. The global config map (env.map),
 *   3. The default icon (env.default) for folders without a special class.
 *
 * Folder names are matched case-insensitively against:
 *   - the anchor's title attribute (full folder path),
 *   - the visible link text (without counters),
 *   - the last path segment of both ("INBOX/logs" -> "logs").
 *
 * Special folders can additionally be addressed by their list class
 * using "@inbox", "@drafts", "@sent", "@junk", "@trash" as map keys.
 */
(function() {
    'use strict';

    var env = window.rcmail && rcmail.env ? rcmail.env : {},
        // config arrives either via the injected inline script (window.folder_icons_config)
        // or through rcmail.env (set by the plugin PHP)
        cfg = window.folder_icons_config || env.folder_icons || {},
        SPECIAL = ['inbox', 'drafts', 'sent', 'junk', 'trash'];

    function slug(name) {
        return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }

    // Unicode-aware stripping of leading symbols/emoji ("📁 Projects" -> "Projects").
    var UNI = (function() {
        try {
            return new RegExp('\\p{L}').test('a');
        } catch (e) {
            return false;
        }
    })();

    function plainName(s) {
        s = String(s).trim();
        if (UNI) {
            return s.replace(/^[^\p{L}\p{N}]+/gu, '').trim();
        }
        // fallback: strip leading characters outside letters/digits ranges
        return s.replace(/^([^\x20-\x7E\u00A0-\u024F\u0400-\u04FF])+/g, '').trim();
    }

    function pushUnique(arr, val) {
        if (val && arr.indexOf(val) === -1) {
            arr.push(val);
        }
        return arr;
    }

    function asEntry(val) {
        return val !== null && typeof val === 'object' ? val : { icon: val };
    }

    // Normalize all sources into [{keys, re, cls, icon, color}],
    // user preferences first (they win over the global config map).
    var entries = [];

    function rebuildEntries() {
        entries.length = 0;

        Object.keys(cfg.prefs || {}).forEach(function(fullname) {
            var val = asEntry(cfg.prefs[fullname] || {}),
                raw = String(fullname).toLowerCase(),
                keys = pushUnique([], raw),
                seg = raw.split(/[\/.]/).pop().trim();

            pushUnique(keys, seg);
            pushUnique(keys, plainName(raw));
            pushUnique(keys, plainName(seg));

            entries.push({
                keys: keys,
                icon: val.icon ? slug(val.icon) : null,
                color: val.color || null
            });
        });

        Object.keys(cfg.map || {}).forEach(function(key) {
            var val = asEntry(cfg.map[key] || {});
            if (!val || !val.icon) {
                return;
            }
            entries.push({
                keys: pushUnique([], plainName(String(key).toLowerCase())),
                re: String(key).indexOf('re:') === 0 ? key.slice(3) : null,
                cls: String(key).charAt(0) === '@' ? key.slice(1).toLowerCase() : null,
                icon: slug(val.icon),
                color: val.color || null
            });
        });
    }

    rebuildEntries();

    // The folder edit form runs in an iframe. After a save the iframe gets a
    // fresh config from the server; push it to the parent page so the folder
    // trees update immediately, without a manual reload.
    window.folder_icons_refresh = function(newCfg) {
        if (newCfg && typeof newCfg === 'object') {
            cfg = newCfg;
        }
        rebuildEntries();
        apply();
    };

    document.addEventListener('folder_icons:config', function() {
        if (window.folder_icons_config) {
            window.folder_icons_refresh(window.folder_icons_config);
        }
    });

    // Visible link text without counters/toggles.
    function linkText(a) {
        var clone = a.cloneNode(true),
            strip = clone.querySelectorAll('.unreadcount, .badge, .count, .input-toggle, input'),
            i;
        for (i = 0; i < strip.length; i++) {
            if (strip[i].parentNode) {
                strip[i].parentNode.removeChild(strip[i]);
            }
        }
        return (clone.textContent || '').replace(/\s+/g, ' ').trim();
    }

    // All names this folder can be matched by.
    function namesOf(li) {
        var a = li.querySelector(':scope > a'),
            out = [], i, name, seg;
        if (!a) {
            return { names: [], a: null };
        }
        [a.getAttribute('title') || '', linkText(a)].forEach(function(n) {
            n = (n || '').trim();
            if (!n) {
                return;
            }
            pushUnique(out, n);
            pushUnique(out, plainName(n));
            seg = n.split(/[\/.]/).pop().trim();
            pushUnique(out, seg);
            pushUnique(out, plainName(seg));
        });
        return { names: out, a: a };
    }

    function entryMatches(e, names, classes) {
        var i, j, re;

        if (e.cls && classes.indexOf(e.cls) !== -1) {
            return true;
        }
        if (e.re) {
            try {
                re = new RegExp(e.re, 'i');
            } catch (err) {
                re = null;
            }
            for (i = 0; re && i < names.length; i++) {
                if (re.test(names[i])) {
                    return true;
                }
            }
        }
        for (i = 0; i < e.keys.length; i++) {
            for (j = 0; j < names.length; j++) {
                if (names[j].toLowerCase() === e.keys[i]) {
                    return true;
                }
            }
        }
        return false;
    }

    function match(names, classes) {
        for (var i = 0; i < entries.length; i++) {
            if (entryMatches(entries[i], names, classes)) {
                return entries[i];
            }
        }
        return null;
    }

    function apply() {
        var lists = document.querySelectorAll('.folderlist, #mailboxlist, #folderslist'),
            items = [], seen = new Set(), i, j, lis;

        for (i = 0; i < lists.length; i++) {
            lis = lists[i].querySelectorAll('li');
            for (j = 0; j < lis.length; j++) {
                if (!seen.has(lis[j])) {
                    seen.add(lis[j]);
                    items.push(lis[j]);
                }
            }
        }

        items.forEach(function(li) {
            var info = namesOf(li),
                classes = SPECIAL.filter(function(s) { return li.classList.contains(s); }),
                m = match(info.names, classes),
                icon = m ? m.icon : (cfg.default && classes.length === 0 ? slug(cfg.default) : null),
                color = m ? m.color : null,
                prev = li.getAttribute('data-fi');

            if (prev && prev !== icon) {
                li.classList.remove('fi-' + prev);
            }
            if (icon) {
                li.classList.add('fi-' + icon);
                li.setAttribute('data-fi', icon);
            } else if (prev) {
                li.removeAttribute('data-fi');
            }
            if (color) {
                li.style.setProperty('--fi-color', color);
            } else {
                li.style.removeProperty('--fi-color');
            }
        });
    }

    // Visual icon picker: replaces the plain <select> (kept hidden in the form)
    // with a button + searchable dropdown showing the actual icons.
    function iconPicker() {
        var sel = document.querySelector('select[name="_fi_icon"]');
        if (!sel || sel.getAttribute('data-fi-picker')) {
            return;
        }
        sel.setAttribute('data-fi-picker', '1');

        var options = [];
        Array.prototype.forEach.call(sel.options, function(o) {
            // searchable text: icon name + localized synonyms (e.g. Russian)
            var hay = (o.textContent + ' ' + (cfg.terms && cfg.terms[o.value] || ''))
                .toLowerCase().replace(/ё/g, 'е');
            options.push({ value: o.value, label: o.textContent, hay: hay });
        });

        var wrap = document.createElement('div');
        wrap.className = 'fi-picker';

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'fi-picker-btn form-control';

        var btnIcon = document.createElement('span');
        btnIcon.className = 'fi-live-preview';
        var btnLabel = document.createElement('span');
        btnLabel.className = 'fi-picker-label';
        var btnCaret = document.createElement('span');
        btnCaret.className = 'fi-picker-caret';
        btnCaret.setAttribute('aria-hidden', 'true');
        btn.appendChild(btnIcon);
        btn.appendChild(btnLabel);
        btn.appendChild(btnCaret);

        var panel = document.createElement('div');
        panel.className = 'fi-picker-panel';
        var search = document.createElement('input');
        search.type = 'text';
        search.className = 'fi-picker-search form-control';
        search.placeholder = (cfg.search || 'Search') + '…';
        var list = document.createElement('div');
        list.className = 'fi-picker-list';
        panel.appendChild(search);
        panel.appendChild(list);

        wrap.appendChild(btn);
        // The panel is portaled to <body> and positioned fixed, so ancestor
        // containers with overflow hidden/scroll cannot clip it.
        document.body.appendChild(panel);
        sel.parentNode.insertBefore(wrap, sel);
        sel.style.display = 'none';

        function updateBtn() {
            var o = options.filter(function(x) { return x.value === sel.value; })[0] || options[0];
            btnIcon.className = 'fi-live-preview' + (o && o.value ? ' fi-' + o.value : '');
            btnLabel.textContent = o ? o.label : '';
            Array.prototype.forEach.call(list.children, function(item) {
                item.className = 'fi-picker-item'
                    + (item.getAttribute('data-value') === sel.value ? ' selected' : '');
            });
        }

        function renderList(filter) {
            var f = (filter || '').toLowerCase().replace(/ё/g, 'е');
            list.innerHTML = '';
            options.forEach(function(o) {
                if (f && o.hay.indexOf(f) === -1) {
                    return;
                }
                var item = document.createElement('div');
                item.className = 'fi-picker-item';
                item.setAttribute('data-value', o.value);
                var ic = document.createElement('span');
                ic.className = 'fi-live-preview' + (o.value ? ' fi-' + o.value : '');
                var lb = document.createElement('span');
                lb.className = 'fi-picker-label';
                lb.textContent = o.label;
                item.appendChild(ic);
                item.appendChild(lb);
                item.addEventListener('click', function() {
                    sel.value = o.value;
                    updateBtn();
                    close();
                    sel.dispatchEvent(new Event('change'));
                });
                list.appendChild(item);
            });
        }

        function close() {
            panel.classList.remove('open');
        }

        // Place the fixed panel right below (or above) the button, within the viewport
        function position() {
            var r = btn.getBoundingClientRect(),
                below = window.innerHeight - r.bottom - 8,
                maxH;
            panel.style.left = r.left + 'px';
            panel.style.width = Math.max(r.width, 280) + 'px';
            if (below < 160 && r.top > below) {
                maxH = Math.min(340, r.top - 16);
                panel.style.top = 'auto';
                panel.style.bottom = (window.innerHeight - r.top + 2) + 'px';
            } else {
                maxH = Math.min(340, below);
                panel.style.top = (r.bottom + 2) + 'px';
                panel.style.bottom = 'auto';
            }
            list.style.maxHeight = Math.max(120, maxH - search.offsetHeight - 8) + 'px';
        }

        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var willOpen = !panel.classList.contains('open');
            if (willOpen) {
                search.value = '';
                renderList('');
                updateBtn();
                panel.classList.add('open');
                position();
                search.focus();
            } else {
                close();
            }
        });
        // While the panel is open, keep it anchored to the button: scrolling
        // the page (wheel or scrollbar) repositions instead of closing.
        // Scrolling inside the panel list is a no-op (the button does not move).
        window.addEventListener('scroll', function() {
            if (panel.classList.contains('open')) {
                position();
            }
        }, true);
        window.addEventListener('resize', function() {
            if (panel.classList.contains('open')) {
                position();
            }
        });
        search.addEventListener('input', function() {
            renderList(search.value);
        });
        search.addEventListener('click', function(e) { e.stopPropagation(); });
        panel.addEventListener('click', function(e) { e.stopPropagation(); });
        document.addEventListener('click', close);
        document.addEventListener('keyup', function(e) {
            if (e.key === 'Escape') {
                close();
            }
        });

        renderList('');
        updateBtn();
    }

    // Live preview of icon/color in the folder edit form (Settings -> Folders).
    function formPreview() {
        var iconSel = document.querySelector('select[name="_fi_icon"]'),
            preview = document.getElementById('folder-icons-preview'),
            colorOn = document.querySelector('input[name="_fi_color_on"]'),
            colorIn = document.querySelector('input[name="_fi_color"]');
        if (!iconSel) {
            return;
        }
        iconPicker();
        if (!preview) {
            return;
        }
        var update = function() {
            var v = slug(iconSel.value),
                color = colorOn && colorOn.checked && colorIn && colorIn.value ? colorIn.value : '';
            preview.className = 'fi-live-preview' + (v ? ' fi-' + v : '');
            preview.style.color = color;
        };
        iconSel.addEventListener('change', update);
        if (colorIn) {
            colorIn.addEventListener('input', update);
        }
        if (colorOn) {
            colorOn.addEventListener('change', update);
        }
        update();
    }

    // Folder lists are rebuilt client-side (subscribe, drag&drop, create...),
    // re-apply on any DOM change, debounced.
    function start() {
        // Folder edit form runs in an iframe: hand the fresh config (it
        // includes the just-saved prefs) to the parent page and let it refresh.
        if (window.parent && window.parent !== window && window.folder_icons_config) {
            try {
                window.parent.window.folder_icons_config = window.folder_icons_config;
                window.parent.document.dispatchEvent(new CustomEvent('folder_icons:config'));
            } catch (e) { /* cross-origin parent, ignore */ }
        }

        apply();
        formPreview();
        var timer = null;
        new MutationObserver(function() {
            clearTimeout(timer);
            timer = setTimeout(apply, 100);
        }).observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    }
    else {
        start();
    }
})();
