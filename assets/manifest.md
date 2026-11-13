# assets/manifest.md: список спрайтов

Код (этап 10+) грузит ассеты **по этому списку**, имена угадывать нельзя. Если переименовали файл, исправьте здесь.

- **Размер в тайлах** = footprint на полу (ширина × глубина в тайлах 128×64).
- **Ориентировочный размер PNG**: `ширина ≈ (w + d) · 64`, `высота основания ≈ (w + d) · 32` + высота предмета.
- **anchorY**: доля высоты спрайта (0 = верх, 1 = низ), где лежит нижняя вершина ромба основания. Заполняется при подготовке файлов; `anchorX` всегда 0,5.
- **P1** нужно для этапов 10-11, **P2** остальные комнаты и персонажи, **P3** иконки, UI, декор.
- Статус: `[ ]` не сделано, `[g]` сгенерировано (в `raw/`), `[x]` готово (в `final/`, anchorY записан).

## Статус партии 1-2 (12.11.2026)

- Размеры в таблицах теперь **в масштабе 2x** (в игре `scale 0.5`). Размер, `anchorY` каждого файла лежит в `assets/final/anchors.json`, код грузит их оттуда.
- `wall_*_left` не генерируются: `prepare_assets.py` зеркалит `*_right`.
- Одна картинка стены покрывает **около 4 тайлов** длины. В этапе 11 её режем на сегменты по 1 тайлу (вертикальные срезы по 128 px), крайние срезы со скруглёнными торцами не берём.
- Альтернативные варианты (в игре пока не используются): `doctor_chair_2`, `waiting_sofa`, `doctor_table`.
- Персонажи (`staff_doctor`, `patient_01..08`) пока статичные, анфас, с контуром. Для ходьбы нужен AutoSprite (4 направления); либо идти без анимации ходьбы (покачивание кодом).
- Партия 3 (13.11): 5 ролей персонала, кровать с прозрачным фоном, 24 иконки (нарезка `tools/slice_sheets.py`), UI-рамки, заготовка вывески. Не делали (P3, не нужны до этапа 18): постеры, картины, ковры.
- Файл `raw/_unused/floor_wood_slab_ai.png` заменён `floor_hall`.

## Пол и стены

| id | файл | тайлы | ориент. размер | anchorY | P | статус |
|---|---|---|---|---|---|---|
| floor_hall | final/floor_hall.png | 1×1 | 256×128 (2x) | 1,0 (ромб 256x128) | P1 | [x] |
| floor_clinic | final/floor_clinic.png | 1×1 | 256×128 (2x) | 1,0 (ромб 256x128) | P1 | [x] |
| floor_lab | final/floor_lab.png | 1×1 | 256×128 (2x) | 1,0 (ромб 256x128) | P1 | [x] |
| wall_left | final/wall_left.png | 1×0 (левая стена) | 308×384 (2x) | 0,995 | P1 | [x] |
| wall_right | final/wall_right.png | 0×1 (правая стена) | 308×384 (2x) | 0,995 | P1 | [x] |
| wall_corner | final/wall_corner.png | угол | 366×384 (2x) | 0,979 | P1 | [x] |
| wall_door_left | final/wall_door_left.png | проём в левой стене | 381×384 (2x) | 0,982 | P1 | [x] |
| wall_door_right | final/wall_door_right.png | проём в правой стене | 381×384 (2x) | 0,982 | P1 | [x] |
| wall_window_left | final/wall_window_left.png | окно в левой стене | 332×384 (2x) | 1,0 | P2 | [x] |
| wall_window_right | final/wall_window_right.png | окно в правой стене | 332×384 (2x) | 1,0 | P2 | [x] |

## Холл и регистратура

| id | файл | тайлы | ориент. размер | anchorY | P | статус |
|---|---|---|---|---|---|---|
| reception_desk | final/reception_desk.png | 3×1 | 512×349 (2x) | 0,963 | P1 | [x] |
| reception_computer | final/reception_computer.png | 1×1 (ставится на стойку) | 100×100 |  | P1 | не нужен (монитор уже на стойке) |
| hall_sofa | final/hall_sofa.png | 2×1 | 384×305 (2x) | 0,97 | P1 | [x] |
| waiting_chair | final/waiting_chair.png | 1×1 | 170×224 (2x) | 0,991 | P1 | [x] |
| water_cooler | final/water_cooler.png | 1×1 | 150×286 (2x) | 0,979 | P2 | [x] |
| plant_big | final/plant_big.png | 1×1 | 190×246 (2x) | 0,972 | P2 | [x] |
| cash_desk | final/cash_desk.png | 2×1 | 384×261 (2x) | 0,973 | P2 | [x] |

## Кабинеты

| id | файл | тайлы | ориент. размер | anchorY | P | статус |
|---|---|---|---|---|---|---|
| doctor_desk | final/doctor_desk.png | 2×1 | 384×368 (2x) | 0,984 | P1 | [x] |
| exam_couch | final/exam_couch.png | 2×1 | 384×369 (2x) | 0,976 | P1 | [x] |
| doctor_chair | final/doctor_chair.png | 1×1 | 170×288 (2x) | 0,99 | P1 | [x] |
| microscope_table | final/microscope_table.png | 2×1 | 384×318 (2x) | 0,969 | P2 | [x] |
| sample_table | final/sample_table.png | 2×1 | 384×295 (2x) | 0,983 | P2 | [x] |
| xray_machine | final/xray_machine.png | 2×2 | 512×482 (2x) | 0,975 | P2 | [x] |
| ultrasound_machine | final/ultrasound_machine.png | 1×1 | 190×296 (2x) | 0,983 | P2 | [x] |
| iv_chair | final/iv_chair.png | 1×1 | 230×260 (2x) | 0,981 | P2 | [x] |
| iv_stand | final/iv_stand.png | 1×1 | 130×307 (2x) | 0,984 | P2 | [x] |
| ward_bed | final/ward_bed.png | 2×1 | 384×362 (2x) | 0,994 | P2 | [x] |
| pharmacy_counter | final/pharmacy_counter.png | 3×1 | 512×347 (2x) | 0,971 | P2 | [x] |
| pharmacy_shelf | final/pharmacy_shelf.png | 2×1 | 384×358 (2x) | 0,978 | P2 | [x] |
| cafe_table | final/cafe_table.png | 1×1 | 230×194 (2x) | 0,979 | P2 | [x] |
| vending_machine | final/vending_machine.png | 1×1 | 190×253 (2x) | 0,98 | P2 | [x] |

## Персонажи (кадр 128×128, 8 направлений получаются зеркалированием)

Из AutoSprite нужны минимум `iso_idle_northeast`, `iso_idle_southeast`, `iso_walk_northeast`, `iso_walk_southeast`: зеркалом получаются NW и SW. Остальные пресеты (`up`, `right`, `down`) по желанию.

| id | файл | P | статус |
|---|---|---|---|
| patient_01 ... patient_08 | final/patient_NN.png (статичные, анфас, 224 px высотой) | P2 | [x] |
| staff_doctor | final/staff_doctor.png (статичный, анфас, 224 px) | P2 | [x] |
| staff_nurse | final/staff_nurse.png (статичный, анфас, 224 px) | P2 | [x] |
| staff_receptionist | final/staff_receptionist.png (статичный, анфас, 224 px) | P2 | [x] |
| staff_labtech | final/staff_labtech.png (статичный, анфас, 224 px) | P3 | [x] |
| staff_janitor | final/staff_janitor.png (статичный, анфас, 224 px) | P3 | [x] |
| staff_admin | final/staff_admin.png (статичный, анфас, 224 px) | P3 | [x] |

Аватар игрока остаётся слоёным и рисуется кодом (см. todo v2, «Принятые решения»).

## Иконки (лист 4×3 → нарезка по 96×96)

| группа | файлы | P | статус |
|---|---|---|---|
| Симптомы (10) | icon_fever, icon_cough, icon_sore_throat, icon_runny_nose, icon_headache, icon_stomach, icon_rash, icon_sprain, icon_fracture, icon_fatigue | P3 (final/icons/, 192x192) | [x] |
| Валюты | icon_coin, icon_crystal | P3 (final/icons/, 192x192) | [x] |
| Статусы | icon_patience, icon_waiting, icon_error | P3 (final/icons/, 192x192) | [x] |
| Роли | icon_role_{doctor,nurse,receptionist,labtech,janitor,admin,specialist} | P3 (final/icons/, 192x192) | [x] |
| Квесты | icon_quest_daily, icon_quest_weekly, icon_quest_story, icon_quest_event | P3 (final/icons/, 192x192) | [x] |

## UI-рамки

| id | файл | заметка | P | статус |
|---|---|---|---|---|
| ui_button, ui_button_hover, ui_button_down | final/ui/ (3 состояния) | 9-slice по горизонтали | P3 | [x] |
| ui_window | final/ui/ui_window.png (с шапкой, стетоскоп и блокнот в углах) | 9-slice | P3 | [x] |
| ui_panel | final/ui/ui_panel.png | 9-slice, нижняя панель | P3 | [x] |
| ui_bar, ui_bar_fill | final/ui/ (рамка 559x68 и заливка 458x55) | полоска прогресса | P3 | [x] |

## Декор и вывески

| id | файл | P | статус |
|---|---|---|---|
| sign_hall, sign_reception, sign_therapist, sign_lab, sign_xray, sign_ultrasound, sign_procedure, sign_ward, sign_pharmacy, sign_cafeteria | final/sign_*.png (табличка без текста, **текст рисует код**, чтобы можно было переводить) | P2 | [g] одна заготовка `final/sign_blank.png` (текст рисует код) |
| poster_01 ... poster_03 | final/poster_NN.png | P3 | [ ] |
| painting_01, painting_02 | final/painting_NN.png | P3 | [ ] |
| rug_01, rug_02 | final/rug_NN.png (плоские, лежат на полу) | P3 | [ ] |

**Важно про вывески:** просите табличку **без надписей** (`blank sign plate`). ИИ плохо рисует кириллицу, а надписи удобнее подставлять кодом.
