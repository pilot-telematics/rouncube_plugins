<?php

class find_from extends rcube_plugin
{
    public $task = 'mail';

    public function init()
    {
        $this->add_texts('localization', true);
        $this->include_script('find_from.js');
        $this->include_script('folder_badge.js');
        $this->include_stylesheet('folder_badge.css');

        $this->add_hook('messages_list', [$this, 'messages_list']);
    }

    public function messages_list($args)
    {
        if (empty($args['messages'])) {
            return $args;
        }

        foreach ($args['messages'] as $message) {
            if (empty($message->from)) {
                continue;
            }

            $addresses = rcube_mime::decode_address_list(
                $message->from,
                1,
                true,
                $message->charset ?? null,
                true
            );

            $email = reset($addresses);

            if (!$email || !rcube_utils::check_email($email, false)) {
                continue;
            }

            if (empty($message->list_flags) || !is_array($message->list_flags)) {
                $message->list_flags = [];
            }

            if (empty($message->list_flags['extra_flags'])
                || !is_array($message->list_flags['extra_flags'])) {
                $message->list_flags['extra_flags'] = [];
            }

            $message->list_flags['extra_flags']['find_from'] = $email;
        }

        return $args;
    }
}
