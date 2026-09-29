# Generates folder_icons/css/folder_icons.css and folder_icons/icons.php.
#
# Run from a working directory that contains:
#   icons.json             - Font Awesome metadata (from the fontawesome-free
#                            npm package or the Font-Awesome GitHub repo)
#   fa-solid-900.woff2     - the Elastic skin font files to verify against
#   fa-regular-400.woff2     (download them from your Roundcube install,
#                            skins/elastic/fonts/*)
import json, sys, os

META = 'icons.json'
SOLID = 'fa-solid-900.woff2'
REG = 'fa-regular-400.woff2'
OUT_CSS = 'folder_icons/css/folder_icons.css'
OUT_PALETTE = 'palette.json'

# Curated icon names (Font Awesome 6 names; aliases of FA5/FA4 are resolved too)
NAMES = [
    # special / mail
    'inbox','envelope','envelope-open','envelope-open-text','paper-plane','pencil','pen',
    'pen-to-square','pen-nib','fire','fire-flame-curved','trash','trash-can','trash-arrow-up',
    'box-archive','folder','folder-open','folder-tree','folder-minus','folder-plus',
    # documents / office
    'bookmark','star','tag','tags','receipt','file','file-lines','file-invoice',
    'file-invoice-dollar','file-pdf','file-word','file-excel','file-powerpoint','file-zipper',
    'file-code','file-csv','clipboard-list','list-check','list-ul','list-ol','print',
    'note-sticky','paperclip','scissors','thumbtack',
    # charts / money
    'chart-line','chart-column','chart-pie','chart-simple','coins','money-bill','money-bill-1',
    'money-check-dollar','credit-card','wallet','piggy-bank','hand-holding-dollar','sack-dollar',
    'scale-balanced',
    # shopping / logistics
    'cart-shopping','bag-shopping','basket-shopping','store','box','boxes-stacked','box-open',
    'truck','truck-fast','plane','car','ship','bicycle','anchor','industry','percentage',
    # communication
    'comment','comment-dots','comments','phone','phone-volume','at','bullhorn','bell','rss',
    'share-nodes','qrcode','barcode','link',
    # time
    'calendar','calendar-days','calendar-check','clock','hourglass-half','watch','stopwatch',
    # tech
    'database','server','terminal','code','bug','shield-halved','shield','lock','lock-open',
    'key','cloud','cloud-arrow-up','wifi','laptop','mobile-screen','download','upload',
    'arrows-rotate','gear','gears','wrench','screwdriver-wrench','plug','network-wired',
    'hard-drive','microchip',
    # media
    'camera','image','images','video','film','music','headphones','microphone','play','book',
    'book-open','newspaper','paintbrush',
    # people
    'users','user-group','user-tie','user','id-card','address-book','address-card','handshake',
    # misc
    'heart','thumbs-up','globe','map','map-location','location-dot','home','seedling','leaf',
    'snowflake','sun','moon','droplet','bolt','gem','puzzle-piece','gift','ticket','trophy',
    'utensils','mug-hot','mug-saucer','wine-glass','paw','rocket','lightbulb','graduation-cap',
    'circle-info','circle-check','circle-exclamation','triangle-exclamation','circle-question',
    'circle-xmark','ban','eye','eye-slash','magnifying-glass','sliders','filter','sitemap',
    'diagram-project','cube','cubes','shirt','building','building-columns','building-flag',
    'hospital','suitcase','umbrella','tree','bicycle',
]

meta = json.load(open(META, encoding='utf-8'))

def resolve(name):
    """Return (unicode_hex, styles) for an FA name, following aliases."""
    key = name
    entry = meta.get(key)
    if entry is None:
        for k, v in meta.items():
            aliases = (v.get('aliases') or {}).get('names') or []
            if name in aliases:
                key, entry = k, v
                break
    if entry is None:
        return None, None, None
    return key, entry['unicode'], entry.get('styles') or []

def cmap(path):
    from fontTools.ttLib import TTFont
    f = TTFont(path)
    cps = set()
    for t in f['cmap'].tables:
        if t.isUnicode():
            cps |= set(t.cmap.keys())
    return cps

solid, reg = cmap(SOLID), cmap(REG)

palette = []   # (name, codepoint, weight)
dropped = []
seen = set()
for name in NAMES:
    if name in seen:
        continue
    seen.add(name)
    key, cp, styles = resolve(name)
    if cp is None:
        dropped.append((name, 'not found in FA metadata'))
        continue
    v = int(cp, 16)
    if v in reg:
        weight = 400
    elif v in solid:
        weight = 900
    else:
        dropped.append((name, f'glyph {cp} missing from skin font'))
        continue
    palette.append({'name': name, 'codepoint': cp, 'weight': weight})

palette.sort(key=lambda r: r['name'])

def css():
    lines = []
    lines.append('/*')
    lines.append(' * Folder Icons plugin - generated file, do not edit by hand.')
    lines.append(' *')
    lines.append(' * Uses the icon font (family "Icons") already shipped by the Elastic skin:')
    lines.append(' *   weight 400 -> fa-regular-400, weight 900 -> fa-solid-900.')
    lines.append(' * Every codepoint below is verified to exist in the skin font files.')
    lines.append(' *')
    lines.append(' * Icon classes: .fi-<name> assigned to folderlist <li> elements by js/folder_icons.js.')
    lines.append(' */')
    lines.append('')
    lines.append('/* base: only folders that got an icon class are switched to the plugin font/style */')
    lines.append('.folderlist li[class*="fi-"] > a:before {')
    lines.append('    font-family: Icons !important;')
    lines.append('    font-style: normal;')
    lines.append('    color: var(--fi-color, currentColor);')
    lines.append('}')
    lines.append('')
    for r in palette:
        lines.append(f'.folderlist li.fi-{r["name"]} > a:before {{')
        lines.append(f'    content: "\\{r["codepoint"]}" !important;')
        lines.append(f'    font-weight: {r["weight"]} !important;')
        lines.append('}')
    lines.append('')
    lines.append('/* live preview in the folder edit form (Settings -> Folders) */')
    lines.append('.fi-live-preview:before {')
    lines.append('    font-family: Icons;')
    lines.append('    font-style: normal;')
    lines.append('    font-size: 1.4em;')
    lines.append('    line-height: 1;')
    lines.append('    vertical-align: middle;')
    lines.append('}')
    for r in palette:
        lines.append(f'.fi-live-preview.fi-{r["name"]}:before {{')
        lines.append(f'    content: "\\{r["codepoint"]}";')
        lines.append(f'    font-weight: {r["weight"]};')
        lines.append('}')
    lines.append('')
    return '\n'.join(lines)

# Russian search synonyms for the icon picker (search matches these too)
RU_TERMS = {
    'address-book': 'адресная книга контакты', 'address-card': 'визитка контакт',
    'anchor': 'якорь', 'arrows-rotate': 'обновить синхронизация',
    'bag-shopping': 'сумка покупки', 'ban': 'запрет блокировка',
    'barcode': 'штрихкод', 'basket-shopping': 'корзина покупки',
    'bell': 'колокольчик уведомление звонок', 'bicycle': 'велосипед',
    'bolt': 'молния энергия', 'book': 'книга', 'book-open': 'книга чтение',
    'bookmark': 'закладка', 'box': 'коробка', 'box-archive': 'архив',
    'box-open': 'коробка распаковка', 'boxes-stacked': 'коробки склад',
    'bug': 'жук ошибка баг вирус', 'building': 'здание офис компания',
    'building-columns': 'банк колонны', 'bullhorn': 'рупор объявление',
    'calendar': 'календарь дата', 'calendar-check': 'календарь встреча',
    'calendar-days': 'календарь расписание дата', 'camera': 'камера фотоаппарат фото',
    'car': 'машина автомобиль', 'cart-shopping': 'магазин покупки корзина',
    'chart-line': 'график статистика', 'chart-pie': 'диаграмма круговая',
    'circle-check': 'галочка выполнено успех', 'circle-exclamation': 'внимание восклицательный',
    'circle-info': 'информация инфо', 'circle-question': 'вопрос помощь',
    'circle-xmark': 'крестик отмена ошибка', 'clipboard-list': 'список заметки',
    'clock': 'часы время', 'cloud': 'облако', 'code': 'код программирование',
    'coins': 'монеты деньги', 'comment': 'комментарий',
    'comment-dots': 'чат обсуждение комментарий', 'comments': 'переписка чат комментарии',
    'credit-card': 'карта оплата банк', 'cube': 'куб', 'cubes': 'кубы',
    'database': 'база данных бд', 'diagram-project': 'схема проект',
    'download': 'скачать загрузка', 'droplet': 'капля вода',
    'envelope': 'письмо почта конверт', 'envelope-open': 'письмо почта открыто',
    'envelope-open-text': 'письмо текст чтение', 'eye': 'глаз просмотр',
    'eye-slash': 'скрыть невидимый', 'file': 'файл документ',
    'file-code': 'код файл скрипт', 'file-csv': 'таблица csv',
    'file-excel': 'эксель таблица excel', 'file-invoice': 'инвойс счёт накладная',
    'file-invoice-dollar': 'инвойс счёт оплата', 'file-lines': 'документ текст лог файл',
    'file-pdf': 'пдф pdf', 'file-powerpoint': 'презентация',
    'file-word': 'ворд документ', 'file-zipper': 'архив zip',
    'film': 'кино фильм', 'filter': 'фильтр', 'fire': 'огонь пожар',
    'fire-flame-curved': 'пламя спам', 'folder': 'папка',
    'folder-minus': 'папка удалить', 'folder-open': 'папка открыта',
    'folder-plus': 'папка создать', 'gear': 'шестерёнка настройки',
    'gears': 'настройки шестерёнки', 'gem': 'самоцвет алмаз',
    'gift': 'подарок', 'globe': 'глобус интернет сайт мир',
    'graduation-cap': 'образование учёба диплом', 'hand-holding-dollar': 'оплата деньги',
    'handshake': 'сделка партнёрство', 'hard-drive': 'диск жёсткий',
    'headphones': 'наушники аудио', 'heart': 'сердце нравится любовь',
    'home': 'дом главная', 'hospital': 'больница',
    'hourglass-half': 'песочные часы ожидание', 'id-card': 'удостоверение личность',
    'image': 'картинка фото изображение', 'images': 'галерея фото изображения',
    'inbox': 'входящие', 'industry': 'завод производство',
    'key': 'ключ', 'laptop': 'ноутбук компьютер', 'leaf': 'лист природа',
    'lightbulb': 'лампочка идея', 'link': 'ссылка',
    'list-check': 'чеклист задачи список', 'list-ol': 'нумерованный список',
    'list-ul': 'список', 'location-dot': 'адрес метка геолокация',
    'lock': 'замок закрыто', 'lock-open': 'замок доступ открыто',
    'magnifying-glass': 'поиск лупа', 'map': 'карта',
    'map-location': 'карта маршрут', 'microchip': 'процессор чип',
    'microphone': 'микрофон запись', 'money-bill': 'деньги наличные',
    'money-bill-1': 'деньги наличные', 'money-check-dollar': 'чек деньги оплата',
    'moon': 'луна ночь', 'mug-hot': 'кофе чай кружка', 'mug-saucer': 'кофе чашка',
    'music': 'музыка', 'network-wired': 'сеть подключение',
    'newspaper': 'новости газета', 'note-sticky': 'заметка стикер',
    'paintbrush': 'кисть дизайн рисование', 'paper-plane': 'отправить самолётик',
    'paperclip': 'скрепка вложение', 'paw': 'животное лапа',
    'pen': 'ручка писать', 'pen-nib': 'перо писать',
    'pen-to-square': 'редактировать изменить', 'pencil': 'карандаш редактировать',
    'phone': 'телефон звонок', 'phone-volume': 'звонок телефон связь',
    'piggy-bank': 'копилка накопления', 'plane': 'самолёт',
    'play': 'воспроизведение пуск', 'plug': 'подключение питание',
    'print': 'печать принтер', 'puzzle-piece': 'пазл модуль',
    'qrcode': 'qr код', 'receipt': 'чек квитанция', 'rocket': 'ракета запуск',
    'rss': 'лента подписка', 'scale-balanced': 'весы баланс',
    'scissors': 'ножницы вырезать', 'screwdriver-wrench': 'инструменты ремонт настройка',
    'seedling': 'росток экология рассада', 'server': 'сервер хостинг',
    'share-nodes': 'поделиться соцсеть', 'shield-halved': 'щит защита безопасность',
    'ship': 'корабль судно', 'shirt': 'одежда футболка',
    'sitemap': 'структура карта сайта', 'sliders': 'ползунки эквалайзер настройки',
    'snowflake': 'снежинка зима', 'star': 'звезда избранное',
    'stopwatch': 'секундомер таймер', 'store': 'магазин',
    'suitcase': 'чемодан командировка', 'sun': 'солнце',
    'tag': 'тег метка ярлык', 'tags': 'теги метки',
    'terminal': 'терминал консоль', 'thumbs-up': 'лайк нравится',
    'thumbtack': 'закрепить канцелярская кнопка', 'trash': 'корзина удалить мусор',
    'trash-arrow-up': 'восстановить корзина', 'trash-can': 'корзина удалить',
    'tree': 'дерево', 'triangle-exclamation': 'предупреждение ошибка внимание',
    'trophy': 'кубок победа награда', 'truck': 'грузовик доставка',
    'truck-fast': 'быстрая доставка', 'umbrella': 'зонт',
    'upload': 'выгрузить загрузить', 'user': 'пользователь профиль',
    'user-group': 'группа пользователи', 'user-tie': 'менеджер сотрудник',
    'users': 'люди пользователи группа', 'utensils': 'еда ресторан приборы',
    'video': 'видео камера', 'wallet': 'кошелёк',
    'wifi': 'вайфай сеть беспроводная', 'wine-glass': 'бокал вино',
    'wrench': 'инструмент гаечный ремонт',
}

import os
os.makedirs(os.path.dirname(OUT_CSS), exist_ok=True)
open(OUT_CSS, 'w', encoding='utf-8', newline='\n').write(css())
json.dump(palette, open(OUT_PALETTE, 'w'), indent=1)

# PHP icon list for the folder-edit form select (folder_form hook)
names_php = ', '.join("'{}'".format(r['name']) for r in palette)
icons_php = ("<?php\n"
             "/* Generated by gen_css.py - icon names available in css/folder_icons.css */\n"
             "return [\n    " + names_php + "\n];\n")
open('folder_icons/icons.php', 'w', encoding='utf-8', newline='\n').write(icons_php)

# PHP map of Russian search synonyms for the icon picker
known = {r['name'] for r in palette}
terms = {n: t for n, t in RU_TERMS.items() if n in known}
items = ',\n'.join("    '{}' => '{}'".format(n, t) for n, t in sorted(terms.items()))
terms_php = ("<?php\n"
             "/* Generated by gen_css.py - Russian search synonyms for the icon picker */\n"
             "return [\n" + items + "\n];\n")
open('folder_icons/icons_terms.php', 'w', encoding='utf-8', newline='\n').write(terms_php)

print(f'generated {len(palette)} icons -> {OUT_CSS} + folder_icons/icons.php + folder_icons/icons_terms.php ({len(terms)} terms)')
if dropped:
    print(f'\ndropped {len(dropped)}:')
    for n, why in dropped:
        print(f'  - {n}: {why}')
