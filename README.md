# Roundcube plugins

Плагины для Roundcube Webmail (iRedMail).

## folder_icons

Иконки и цвета для папок: заменяет стандартную иконку папки в дереве почты и
в Settings -> Folders на индивидуальную (Font Awesome) с произвольным цветом.

- Настройка через веб-интерфейс: Settings -> Folders -> секция «Folder icon»
  (хранится в персональных настройках пользователя), либо глобально через
  `folder_icons/config.inc.php`.
- 181 иконка, каждый кодпоинт проверен по фактическим файлам шрифта Elastic —
  пустых «квадратиков» не будет.
- Подробности: [folder_icons/README.md](folder_icons/README.md)

## find_from

Контекстное меню списка писем: «Найти письма от отправителя», «…этому
отправителю», «…с домена отправителя». Требует плагин `contextmenu`.
В комплекте аддон `folder_badge` — бейдж с именем папки в результатах
многопапочного поиска.
- Подробности: [find_from/README.md](find_from/README.md)

## Структура

- `folder_icons/` — плагин (копируется в `plugins/` Roundcube)
- `find_from/` — плагин (копируется в `plugins/` Roundcube)
- `demo/` — офлайн-демо-страницы для проверки
- `tools/gen_css.py` — генератор `css/folder_icons.css` и `icons.php` из
  метаданных Font Awesome с фильтрацией по глифам, реально присутствующим
  в шрифте скина

## Установка folder_icons

```bash
scp -r folder_icons/* root@mail.example.tld:/opt/www/roundcubemail/plugins/folder_icons/
```

и добавить `'folder_icons'` в `$config['plugins']` конфига Roundcube.
