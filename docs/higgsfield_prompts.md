# Промпты для Higgsfield + план на 3 дня

Работаем в интерфейсе Higgsfield (коннектор в Claude умеет только смотреть историю). Правила стиля и геометрии: `ART.md`. Список файлов и приоритеты: `assets/manifest.md`.

Везде ниже `[STYLE]` это общий префикс из `ART.md`, раздел 4. Вставляйте его целиком в начало каждого запроса.

## Перед стартом (15 минут)

1. Проверьте в интерфейсе стоимость генерации для `gpt_image_2` и `soul_2` на вашем тарифе (на аккаунте сейчас 10 кредитов, модели помечены как unlim, но это нужно подтвердить глазами).
2. Загрузите 2-3 референса (Аватария, Two Point Hospital, Hay Day).
3. Сделайте **эталонный предмет** (запрос 1 ниже) и **эталонного персонажа** (запрос 20). Не переходите дальше, пока не нравится.

## План по дням

| День | Что | Результат |
|---|---|---|
| 1 | Эталоны; пол, стены, двери (P1); мебель холла, регистратуры, терапевта (P1) | Хватает для этапов 10-11 |
| 2 | Остальная мебель (P2); эскизы персонажей (8 пациентов, 6 сотрудников) | Все комнаты оформлены |
| 3 | AutoSprite для утверждённых персонажей; листы иконок; UI; вывески; нарезка и подготовка файлов | Пакет `assets/final/` |

Не тратьте последний день подписки на мелочи (постеры, ковры): они P3.

## Пол и стены (P1)

1. **Эталон: кровать** (сделайте первой, она задаёт стиль)
   `[STYLE] A cute hospital ward bed, white sheets, light teal blanket, small pillow, metal frame, footprint 1 tile wide and 2 tiles long.`
2. **Пол холла:** `[STYLE] A single isometric floor tile, exactly a 2:1 diamond, warm light wood-look floor with subtle tile lines, flat, no walls, no objects.`
3. **Пол кабинетов:** то же, `soft white-teal checker tiles`.
4. **Пол лаборатории:** то же, `light grey-blue speckled lab tiles`.
5. **Левая стена:** `[STYLE] A straight indoor wall segment running along the isometric left axis, light teal upper part, white wainscot on the lower third, white baseboard, tall 3 tiles, flat color, no door, no window.`
6. **Правая стена:** то же, но вдоль правой оси.
7. **Угол:** `... an inside corner where a left wall and a right wall meet ...`
8. **Стена с проёмом двери:** `... wall segment with a doorway opening, white door frame, no door leaf ...` (левая и правая версии).
9. **Окно:** `... wall segment with a large window, white frame, pale blue sky outside ...` (левая и правая).

## Мебель

Для каждой: `[STYLE] A [объект], footprint [w] by [d] tiles, [детали].`

| № | Объект | Детали |
|---|---|---|
| 10 | reception desk | long white desk with teal front panel, small bell, 3 by 1 tiles |
| 11 | desktop computer | flat monitor and keyboard, 1 tile |
| 12 | waiting room sofa | two-seat teal sofa, 2 by 1 |
| 13 | waiting chair | single teal chair with metal legs |
| 14 | doctor desk | wooden desk, white top, stethoscope and papers, 2 by 1 |
| 15 | examination couch | white padded couch with paper roll, 1 by 2 |
| 16 | doctor office chair | rolling chair, 1 tile |
| 17 | microscope on lab table | white table, microscope, test tube rack, 2 by 1 |
| 18 | sample table | metal table with colorful test tubes, 2 by 1 |
| 19 | x-ray machine | friendly pastel x-ray device with arm over a table, 2 by 2 |
| 19a | ultrasound machine | cart with monitor and probe, 1 tile |
| 19b | IV chair | comfy recliner with IV stand attached, 1 tile |
| 19c | IV stand | metal pole with a bag, 1 tile, tall and thin |
| 19d | pharmacy counter | counter with green cross sign, 3 by 1 |
| 19e | pharmacy shelf | shelf with colorful medicine boxes, 2 by 1 |
| 19f | cafe table with two stools | round white table, 1 tile |
| 19g | vending machine | snack machine with pastel front, 1 tile |
| 19h | water cooler, big plant, cash desk | по одному запросу на предмет |

## Персонажи

**Шаг 1. Эталон (запрос 20):**
`Cute cartoon full-body [роль: patient adult woman / doctor man / nurse woman ...], big head, short body, standing in a neutral pose, seen from a three-quarter isometric angle facing the lower-right, simple clothes, pastel colors, thin darker outline, solid bright green #00FF00 background, no text.`

Роли пациентов: взрослый мужчина, женщина, пожилой, подросток, ребёнок, женщина с коляской или шарфом, мужчина в куртке, бабушка с тростью (главное: **разные силуэты и цвета одежды**). Сотрудники: врач, медсестра, регистратор, лаборант, уборщик, администратор.

**Шаг 2. Анимация (модель `autosprite`):** подайте утверждённую картинку как `medias`, затем для каждого персонажа запустите пресеты:

- `iso_idle_southeast`, `iso_idle_northeast`
- `iso_walk_southeast`, `iso_walk_northeast`

Рекомендуемые параметры: `frame_size` 128 (если качество приемлемо, иначе 256), `frame_count` 4 для idle и 8 для walk, `remove_bg` ultra, `video_tier` turbo (самый дешёвый). **Сначала проверьте цену и результат на одном персонаже**, и только потом гоните остальных. Эту модель я не тестировал, поэтому если выход не совпадает с описанием, подправьте параметры по месту.

## Иконки (листом)

`[STYLE without "single object"] A 4 by 3 grid of cute icons on a solid green background, each icon in its own equal cell, same style: fever thermometer, cough, sore throat, runny nose, headache, stomach ache, skin rash, sprained ankle, broken bone, tired face, gold coin, blue crystal.`

Отдельный лист: статусы (терпение, ожидание, ошибка), роли сотрудников (7), квесты (4).

## UI

`[STYLE] A set of game UI frames: rounded button in three states, a large window frame with a header strip, a bottom panel frame, a progress bar frame. Teal and white, soft shadow, flat, on a green background.`
Попросите 9-slice-совместимые края: `uniform borders, no gradients on the edges`.

## Вывески

`[STYLE] A blank wall sign plate, rounded rectangle, teal with white border, no text.` (10 цветовых вариантов: можно перекрасить кодом, одной картинки достаточно).

## После генерации

1. Сложите всё в `assets/raw/` с именами из `manifest.md`.
2. Запустите `python3 tools/prepare_assets.py` (вырежет зелёный фон, обрежет поля, сложит в `assets/final/`, посчитает вес).
3. Заполните колонки `anchorY` и статусы в `manifest.md` (проверьте якорь с ромбом 128×64, см. `ART.md`, раздел 6).
4. Вес `assets/` меньше 8 МБ, иначе уменьшите кадры персонажей до 128 px и пережмите (PNG-8 или WebP).
5. Коммит `stage 9: assets`.

## Если стиль «плывёт»

- Всегда подавайте эталон как reference и повторяйте: `same style, palette and proportions as reference`.
- Просите по одному предмету за запрос, а не «набор мебели».
- Слишком реалистично: добавьте `chibi proportions, toy-like, matte plastic look`.
- Не тот ракурс: `exact isometric 2:1 dimetric view, camera 30 degrees above, not top-down, not side view`.
