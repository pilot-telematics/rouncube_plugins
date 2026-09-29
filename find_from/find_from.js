(function () {
if (!window.rcmail) {
    return;
}

rcmail.addEventListener('init', function () {
    if (rcmail.task !== 'mail') {
        return;
    }

    function getSelectedEmail() {
        var uid = rcmail.env.context_menu_source_id;

        if (!uid && typeof rcmail.get_single_uid === 'function') {
            uid = rcmail.get_single_uid();
        }

        if (!uid || !rcmail.env.messages || !rcmail.env.messages[uid]) {
            return null;
        }

        var message = rcmail.env.messages[uid];
        var flags = message.flags || {};

        return flags.find_from ||
            (flags.extra_flags && flags.extra_flags.find_from) ||
            null;
    }

    function runSearch(query) {
        // Roundcube 1.7.4: qsearch() очищает env.messages раньше selection.
        // Поэтому снимаем выделение заранее и без события select.
        if (rcmail.message_list &&
            rcmail.message_list.selection &&
            rcmail.message_list.selection.length) {
            rcmail.message_list.clear_selection(null, true);
        }

        if (typeof rcmail.set_searchscope === 'function') {
            rcmail.set_searchscope('all');
        }
        else {
            rcmail.env.search_scope = 'all';
        }

        if ($('#s_scope').length) {
            $('#s_scope').val('all');
        }

        if (rcmail.gui_objects.qsearchbox) {
            $(rcmail.gui_objects.qsearchbox).val(query);
        }

        rcmail.qsearch(query);
    }

    function senderOrWarn() {
        var email = getSelectedEmail();

        if (!email) {
            rcmail.display_message(
                rcmail.gettext('nosender', 'find_from'),
                'warning'
            );
            return null;
        }

        return email;
    }

    // Найти письма ОТ отправителя
    rcmail.register_command('plugin.find_from', function () {
        var email = senderOrWarn();

        if (email) {
            runSearch('from:' + email);
        }

        return false;
    }, true);

    // Найти письма ЭТОМУ отправителю
    rcmail.register_command('plugin.find_to_sender', function () {
        var email = senderOrWarn();

        if (email) {
            runSearch('to:' + email);
        }

        return false;
    }, true);

    // Найти письма от всего домена отправителя
    rcmail.register_command('plugin.find_domain', function () {
        var email = senderOrWarn();

        if (!email) {
            return false;
        }

        var pos = email.lastIndexOf('@');

        if (pos < 0 || pos === email.length - 1) {
            rcmail.display_message(
                rcmail.gettext('nodomain', 'find_from'),
                'warning'
            );
            return false;
        }

        runSearch('from:@' + email.substring(pos + 1));

        return false;
    }, true);

    rcmail.addEventListener('contextmenu_init', function (menu) {
        if (menu.menu_name !== 'messagelist') {
            return;
        }

        menu.menu_source.push({
            label: rcmail.gettext('findfrom', 'find_from'),
            command: 'plugin.find_from',
            props: '',
            classes: 'addressbook rcm-active'
        });

        menu.menu_source.push({
            label: rcmail.gettext('findtosender', 'find_from'),
            command: 'plugin.find_to_sender',
            props: '',
            classes: 'recipient rcm-active'
        });

        menu.menu_source.push({
            label: rcmail.gettext('finddomain', 'find_from'),
            command: 'plugin.find_domain',
            props: '',
            classes: 'showurl rcm-active'
        });
    });
});

})();