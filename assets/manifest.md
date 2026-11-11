# assets/manifest.md: список спрайтов

Код (этап 10+) грузит ассеты **по этому списку**, имена угадывать нельзя. Если переименовали файл, исправьте здесь.

- **Размер в тайлах** = footprint на полу (ширина × глубина в тайлах 128×64).
- **Ориентировочный размер PNG**: `ширина ≈ (w + d) · 64`, `высота основания ≈ (w + d) · 32` + высота предмета.
- **anchorY**: доля высоты спрайта (0 = верх, 1 = низ), где лежит нижняя вершина ромба основания. Заполняется при подготовке файлов; `anchorX` всегда 0,5.
- **P1** нужно для этапов 10-11, **P2** остальные комнаты и персонажи, **P3** иконки, UI, декор.
- Статус: `[ ]` не сделано, `[g]` сгенерировано (в `raw/`), `[x]` готово (в `final/`, anchorY записан).

## Пол и стены

| id | файл | тайлы | ориент. размер | anchorY | P | статус |
|---|---|---|---|---|---|---|
| floor_hall | final/floor_hall.png | 1×1 | 128×64 | 1,0 (ромб целиком) | P1 | [ ] |
| floor_clinic | final/floor_clinic.png | 1×1 | 128×64 | 1,0 | P1 | [ ] |
| floor_lab | final/floor_lab.png | 1×1 | 128×64 | 1,0 | P1 | [ ] |
| wall_left | final/wall_left.png | 1×0 (левая стена) | 128×(64+192) | | P1 | [ ] |
| wall_right | final/wall_right.png | 0×1 (правая стена) | 128×(64+192) | | P1 | [ ] |
| wall_corner | final/wall_corner.png | угол | 128×(64+192) | | P1 | [ ] |
| wall_door_left | final/wall_door_left.png | проём в левой стене | 128×(64+192) | | P1 | [ ] |
| wall_door_right | final/wall_door_right.png | проём в правой стене | 128×(64+192) | | P1 | [ ] |
| wall_window_left | final/wall_window_left.png | окно в левой стене | 128×(64+192) | | P2 | [ ] |
| wall_window_right | final/wall_window_right.png | окно в правой стене | 128×(64+192) | | P2 | [ ] |

## Холл и регистратура

| id | файл | тайлы | ориент. размер | anchorY | P | статус |
|---|---|---|---|---|---|---|
| reception_desk | final/reception_desk.png | 3×1 | 256×200 | | P1 | [ ] |
| reception_computer | final/reception_computer.png | 1×1 (ставится на стойку) | 100×100 | | P1 | [ ] |
| hall_sofa | final/hall_sofa.png | 2×1 | 192×150 | | P1 | [ ] |
| waiting_chair | final/waiting_chair.png | 1×1 | 100×110 | | P1 | [ ] |
| water_cooler | final/water_cooler.png | 1×1 | 90×150 | | P2 | [ ] |
| plant_big | final/plant_big.png | 1×1 | 100×160 | | P2 | [ ] |
| cash_desk | final/cash_desk.png | 2×1 | 192×150 | | P2 | [ ] |

## Кабинеты

| id | файл | тайлы | ориент. размер | anchorY | P | статус |
|---|---|---|---|---|---|---|
| doctor_desk | final/doctor_desk.png | 2×1 | 192×150 | | P1 | [ ] |
| exam_couch | final/exam_couch.png | 1×2 | 192×130 | | P1 | [ ] |
| doctor_chair | final/doctor_chair.png | 1×1 | 90×110 | | P1 | [ ] |
| microscope_table | final/microscope_table.png | 2×1 | 192×150 | | P2 | [ ] |
| sample_table | final/sample_table.png | 2×1 | 192×150 | | P2 | [ ] |
| xray_machine | final/xray_machine.png | 2×2 | 256×230 | | P2 | [ ] |
| ultrasound_machine | final/ultrasound_machine.png | 1×1 | 110×150 | | P2 | [ ] |
| iv_chair | final/iv_chair.png | 1×1 | 110×130 | | P2 | [ ] |
| iv_stand | final/iv_stand.png | 1×1 | 70×170 | | P2 | [ ] |
| ward_bed | final/ward_bed.png | 1×2 | 192×130 | | P2 | [ ] |
| pharmacy_counter | final/pharmacy_counter.png | 3×1 | 256×170 | | P2 | [ ] |
| pharmacy_shelf | final/pharmacy_shelf.png | 2×1 | 192×190 | | P2 | [ ] |
| cafe_table | final/cafe_table.png | 1×1 | 100×100 | | P2 | [ ] |
| vending_machine | final/vending_machine.png | 1×1 | 100×170 | | P2 | [ ] |

## Персонажи (кадр 128×128, 8 направлений получаются зеркалированием)

Из AutoSprite нужны минимум `iso_idle_northeast`, `iso_idle_southeast`, `iso_walk_northeast`, `iso_walk_southeast`: зеркалом получаются NW и SW. Остальные пресеты (`up`, `right`, `down`) по желанию.

| id | файл | P | статус |
|---|---|---|---|
| patient_01 ... patient_08 | final/patient_NN_{idle,walk}_{ne,se}.png | P2 (хотя бы 3 для этапа 12) | [ ] |
| staff_doctor | final/staff_doctor_{idle,walk}_{ne,se}.png | P2 | [ ] |
| staff_nurse | final/staff_nurse_{idle,walk}_{ne,se}.png | P2 | [ ] |
| staff_receptionist | final/staff_receptionist_{idle,walk}_{ne,se}.png | P2 | [ ] |
| staff_labtech | final/staff_labtech_{idle,walk}_{ne,se}.png | P3 | [ ] |
| staff_janitor | final/staff_janitor_{idle,walk}_{ne,se}.png | P3 | [ ] |
| staff_admin | final/staff_admin_{idle,walk}_{ne,se}.png | P3 | [ ] |

Аватар игрока остаётся слоёным и рисуется кодом (см. todo v2, «Принятые решения»).

## Иконки (лист 4×3 → нарезка по 96×96)

| группа | файлы | P | статус |
|---|---|---|---|
| Симптомы (10) | icon_fever, icon_cough, icon_sore_throat, icon_runny_nose, icon_headache, icon_stomach, icon_rash, icon_sprain, icon_fracture, icon_fatigue | P3 | [ ] |
| Валюты | icon_coin, icon_crystal | P3 | [ ] |
| Статусы | icon_patience, icon_waiting, icon_error | P3 | [ ] |
| Роли | icon_role_{doctor,nurse,receptionist,labtech,janitor,admin,specialist} | P3 | [ ] |
| Квесты | icon_quest_daily, icon_quest_weekly, icon_quest_story, icon_quest_event | P3 | [ ] |

## UI-рамки

| id | файл | заметка | P | статус |
|---|---|---|---|---|
| ui_button | final/ui_button.png | 9-slice, 3 состояния (обычная, hover, нажата) | P3 | [ ] |
| ui_window | final/ui_window.png | 9-slice, с заголовком | P3 | [ ] |
| ui_panel | final/ui_panel.png | 9-slice, нижняя панель | P3 | [ ] |
| ui_bar | final/ui_bar.png | рамка + заполнение для полосок | P3 | [ ] |

## Декор и вывески

| id | файл | P | статус |
|---|---|---|---|
| sign_hall, sign_reception, sign_therapist, sign_lab, sign_xray, sign_ultrasound, sign_procedure, sign_ward, sign_pharmacy, sign_cafeteria | final/sign_*.png (табличка без текста, **текст рисует код**, чтобы можно было переводить) | P2 | [ ] |
| poster_01 ... poster_03 | final/poster_NN.png | P3 | [ ] |
| painting_01, painting_02 | final/painting_NN.png | P3 | [ ] |
| rug_01, rug_02 | final/rug_NN.png (плоские, лежат на полу) | P3 | [ ] |

**Важно про вывески:** просите табличку **без надписей** (`blank sign plate`). ИИ плохо рисует кириллицу, а надписи удобнее подставлять кодом.
