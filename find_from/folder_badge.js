(function () {
    'use strict';

    if (!window.rcmail) {
        return;
    }

    function decodeHtml(value) {
        var textarea = document.createElement('textarea');
        textarea.innerHTML = value || '';

        return textarea.value;
    }

    function decorateRow(event) {
        if (typeof rcmail.is_multifolder_listing !== 'function'
            || !rcmail.is_multifolder_listing()) {
            return;
        }

        if (!event || !event.row || !event.row.obj || !event.row.folder) {
            return;
        }

        var row = event.row;
        var $row = $(row.obj);

        // Elastic widescreen:
        // <td class="subject">
        //     ...
        //     <span class="subject">...</span>
        // </td>
        var $subject = $row.find('td.subject > span.subject').first();

        if (!$subject.length) {
            return;
        }

        // Не создавать badge повторно при обновлении строки
        $subject.find('.find-folder-badge').remove();

        var folder = decodeHtml(String(row.folder));

        if (!folder) {
            return;
        }

        var $badge = $('<span/>', {
            'class': 'find-folder-badge',
            'text': folder,
            'title': rcmail.get_label(
                'infolder',
                null,
                { folder: folder }
            )
        });

        // Специальные папки — только дополнительные CSS-классы.
        if (row.mbox && row.mbox === rcmail.env.trash_mailbox) {
            $badge.addClass('folder-trash');
        }
        else if (row.mbox && row.mbox === rcmail.env.junk_mailbox) {
            $badge.addClass('folder-junk');
        }
        else if (row.mbox && row.mbox === rcmail.env.drafts_mailbox) {
            $badge.addClass('folder-drafts');
        }

        $subject.append($badge);
    }

    rcmail.addEventListener('init', function () {
        if (rcmail.task !== 'mail') {
            return;
        }

        // Новые строки, полученные после поиска
        rcmail.addEventListener('insertrow', decorateRow);

        // На случай, если какие-то строки уже появились к моменту init
        if (rcmail.message_list
            && rcmail.message_list.rows
            && rcmail.env.messages) {

            $.each(rcmail.message_list.rows, function (uid, rowref) {
                var message = rcmail.env.messages[uid];

                if (!message) {
                    return;
                }

                decorateRow({
                    uid: uid,
                    row: $.extend({}, rowref, message)
                });
            });
        }
    });
})();
