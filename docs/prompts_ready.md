# Промпты для самостоятельной генерации (готовы к копированию)

Каждый промпт полный: стиль уже вписан, ничего склеивать не нужно. Правила и палитра: `ART.md`, список файлов: `assets/manifest.md`.

## Параметры (для всех предметов)

`model: gpt_image_2_6`, `aspect_ratio: 1:1`, `quality: medium`, `background: transparent`, разрешение указано у каждого промпта. По одной генерации за раз. Безлимит до 14.11 ~06:56 UTC, затем 0,25 кредита за картинку.

**Референс:** прикладывайте к каждому предмету `doctor_desk.png` (он самый удачный по стилю) и добавляйте в конец промпта:

`Same style, palette and proportions as the reference image.`

## Что я увидел в первой партии (учтено в промптах ниже)

- **Свечение вокруг предметов.** На всех 6 файлах вокруг предмета широкий светлый ореол (halo). Либо это полупрозрачная тень, либо фон не полностью прозрачный. В новых промптах добавлено `NO glow, NO halo`. Проверьте файл на белом и на тёмном фоне; если ореол остаётся, уберите его через `remove_background` в Higgsfield.
- **Пол-плита не подходит.** `floor_wood_slab_ai` это толстая оранжевая плита со скруглёнными углами и свечением: такие плитки не стыкуются в сплошной пол. Поэтому полы теперь просим **плоской квадратной текстурой сверху**, а ромб 128x64 я сделаю кодом (поворот на 45° и сжатие по вертикали вдвое). Цвет дерева светлее: #E4D8BF, как в палитре.
- **Стены.** `wall_right` идёт сверху-слева вниз-вправо: это правая задняя стена, ориентация верная. **`wall_left` генерировать не нужно**: зеркалю `wall_right` в коде (свет чуть изменится, на стенах незаметно).
- **Ракурс** у мебели близок к изометрии, но чуть «круче» 2:1. Для игры годится, подгоню масштабом и якорем.
- **`exam_couch`**: в манифесте была 1×2, по картинке длинная сторона идёт вдоль оси x, значит 2×1 (как в вашем `spec.json`). Манифест поправлю.
- **`ward_bed_ref_whitebg.png`** на белом фоне, белые простыни сливаются с фоном. Либо `remove_background` в Higgsfield, либо перегенерировать промптом ниже (с референсом вашей кровати).

## Переименование уже загруженных файлов

| сейчас | должно быть |
|---|---|
| floor_wood_slab_ai.png | убрать (заменяется floor_hall) |
| ward_bed_ref_whitebg.png | ward_bed.png после удаления фона |
| reception_desk, hall_sofa, doctor_desk, exam_couch, wall_right | имена верные |

## P1: нужно для этапов 10-11 (делать первыми)

### 1. `floor_clinic.png` (1k)
```
Game floor texture in glossy soft 3D clay style, gentle top-left lighting, fully opaque, no transparency, no glow. A flat seamless top-down floor texture, perfectly square, filling the whole image edge to edge: soft white and pale teal checker tiles with thin light grout lines, subtle gloss. No perspective, no border, no shadow, no objects.
```

### 2. `floor_lab.png` (1k)
```
Game floor texture in glossy soft 3D clay style, gentle top-left lighting, fully opaque, no transparency, no glow. A flat seamless top-down floor texture, perfectly square, filling the whole image edge to edge: light grey-blue speckled lab tiles with thin grout lines. No perspective, no border, no shadow, no objects.
```

### 3. `floor_hall.png` (1k)
```
Game floor texture in glossy soft 3D clay style, gentle top-left lighting, fully opaque, no transparency, no glow. A flat seamless top-down floor texture, perfectly square, filling the whole image edge to edge: warm LIGHT beige wood planks (color about #E4D8BF), soft grain. No perspective, no border, no shadow, no objects.
```

### 4. `wall_corner.png` (1k)
```
Isometric 2:1 dimetric game asset, camera 30 degrees above, object seen from the front-right, in glossy soft 3D clay style like a premium mobile game icon: smooth rounded shapes, pearly white and soft mint-teal materials, gentle top-left lighting. Transparent background, NO glow, NO halo, NO outer light around the object, only a tiny soft contact shadow directly under it. Single object centered, fully visible with a small margin, no text, no watermark. Object: An inside corner of two indoor walls meeting at a right angle, as seen in an isometric room from outside the room: light teal upper part, white wainscot panels on the lower third, white baseboard, rounded white top cap, 3 tiles tall. No door, no window.
```

### 5. `wall_door_right.png` (1k)
```
Isometric 2:1 dimetric game asset, camera 30 degrees above, object seen from the front-right, in glossy soft 3D clay style like a premium mobile game icon: smooth rounded shapes, pearly white and soft mint-teal materials, gentle top-left lighting. Transparent background, NO glow, NO halo, NO outer light around the object, only a tiny soft contact shadow directly under it. Single object centered, fully visible with a small margin, no text, no watermark. Object: A straight indoor wall segment running from upper-left to lower-right (isometric right axis), light teal upper part, white wainscot on the lower third, rounded white top cap, with a tall doorway opening in the middle: white door frame, NO door leaf, the opening is empty and transparent.
```

### 6. `wall_window_right.png` (1k)
```
Isometric 2:1 dimetric game asset, camera 30 degrees above, object seen from the front-right, in glossy soft 3D clay style like a premium mobile game icon: smooth rounded shapes, pearly white and soft mint-teal materials, gentle top-left lighting. Transparent background, NO glow, NO halo, NO outer light around the object, only a tiny soft contact shadow directly under it. Single object centered, fully visible with a small margin, no text, no watermark. Object: A straight indoor wall segment running from upper-left to lower-right (isometric right axis), light teal upper part, white wainscot on the lower third, rounded white top cap, with a large window in the upper part: white frame, pale blue sky behind the glass.
```

### 7. `waiting_chair.png` (1k)
```
Isometric 2:1 dimetric game asset, camera 30 degrees above, object seen from the front-right, in glossy soft 3D clay style like a premium mobile game icon: smooth rounded shapes, pearly white and soft mint-teal materials, gentle top-left lighting. Transparent background, NO glow, NO halo, NO outer light around the object, only a tiny soft contact shadow directly under it. Single object centered, fully visible with a small margin, no text, no watermark. Object: A single cute waiting-room chair, mint-teal padded seat and back, slim metal legs, small white armrests.
```

### 8. `doctor_chair.png` (1k)
```
Isometric 2:1 dimetric game asset, camera 30 degrees above, object seen from the front-right, in glossy soft 3D clay style like a premium mobile game icon: smooth rounded shapes, pearly white and soft mint-teal materials, gentle top-left lighting. Transparent background, NO glow, NO halo, NO outer light around the object, only a tiny soft contact shadow directly under it. Single object centered, fully visible with a small margin, no text, no watermark. Object: A cute rolling doctor office chair with five wheels, white and mint-teal padded seat and backrest, chrome central post.
```

Примечание: `reception_computer` не нужен, монитор уже есть на стойке регистратуры.

## P2: остальные комнаты

### 9. `ward_bed.png` (1k)
```
Isometric 2:1 dimetric game asset, camera 30 degrees above, object seen from the front-right, in glossy soft 3D clay style like a premium mobile game icon: smooth rounded shapes, pearly white and soft mint-teal materials, gentle top-left lighting. Transparent background, NO glow, NO halo, NO outer light around the object, only a tiny soft contact shadow directly under it. Single object centered, fully visible with a small margin, no text, no watermark. Object: A cute hospital ward bed, white sheets, light teal blanket, small pillow, metal frame, long side running from upper-left to lower-right, footprint 1 tile wide and 2 long.
```

### 10. `water_cooler.png` (1k)
```
Isometric 2:1 dimetric game asset, camera 30 degrees above, object seen from the front-right, in glossy soft 3D clay style like a premium mobile game icon: smooth rounded shapes, pearly white and soft mint-teal materials, gentle top-left lighting. Transparent background, NO glow, NO halo, NO outer light around the object, only a tiny soft contact shadow directly under it. Single object centered, fully visible with a small margin, no text, no watermark. Object: A water cooler with a big blue water bottle on a white body with a mint-teal front panel and a small cup holder, tall and slim.
```

### 11. `plant_big.png` (1k)
```
Isometric 2:1 dimetric game asset, camera 30 degrees above, object seen from the front-right, in glossy soft 3D clay style like a premium mobile game icon: smooth rounded shapes, pearly white and soft mint-teal materials, gentle top-left lighting. Transparent background, NO glow, NO halo, NO outer light around the object, only a tiny soft contact shadow directly under it. Single object centered, fully visible with a small margin, no text, no watermark. Object: A big leafy indoor plant in a round white pot, glossy green leaves, tall.
```

### 12. `cash_desk.png` (1k)
```
Isometric 2:1 dimetric game asset, camera 30 degrees above, object seen from the front-right, in glossy soft 3D clay style like a premium mobile game icon: smooth rounded shapes, pearly white and soft mint-teal materials, gentle top-left lighting. Transparent background, NO glow, NO halo, NO outer light around the object, only a tiny soft contact shadow directly under it. Single object centered, fully visible with a small margin, no text, no watermark. Object: A small cash desk counter, white with a teal front, a tiny cash register and a card terminal on top, long side from upper-left to lower-right, 2 by 1 tiles.
```

### 13. `microscope_table.png` (1k)
```
Isometric 2:1 dimetric game asset, camera 30 degrees above, object seen from the front-right, in glossy soft 3D clay style like a premium mobile game icon: smooth rounded shapes, pearly white and soft mint-teal materials, gentle top-left lighting. Transparent background, NO glow, NO halo, NO outer light around the object, only a tiny soft contact shadow directly under it. Single object centered, fully visible with a small margin, no text, no watermark. Object: A white lab table with a microscope and a test tube rack on top, 2 by 1 tiles, long side from upper-left to lower-right.
```

### 14. `sample_table.png` (1k)
```
Isometric 2:1 dimetric game asset, camera 30 degrees above, object seen from the front-right, in glossy soft 3D clay style like a premium mobile game icon: smooth rounded shapes, pearly white and soft mint-teal materials, gentle top-left lighting. Transparent background, NO glow, NO halo, NO outer light around the object, only a tiny soft contact shadow directly under it. Single object centered, fully visible with a small margin, no text, no watermark. Object: A metal-top lab table with colorful test tubes in a rack and a small sample tray, 2 by 1 tiles, long side from upper-left to lower-right.
```

### 15. `xray_machine.png` (2k)
```
Isometric 2:1 dimetric game asset, camera 30 degrees above, object seen from the front-right, in glossy soft 3D clay style like a premium mobile game icon: smooth rounded shapes, pearly white and soft mint-teal materials, gentle top-left lighting. Transparent background, NO glow, NO halo, NO outer light around the object, only a tiny soft contact shadow directly under it. Single object centered, fully visible with a small margin, no text, no watermark. Object: A friendly pastel X-ray device: a white and mint-teal arm with a rounded detector head above a padded flat table, 2 by 2 tiles.
```

### 16. `ultrasound_machine.png` (1k)
```
Isometric 2:1 dimetric game asset, camera 30 degrees above, object seen from the front-right, in glossy soft 3D clay style like a premium mobile game icon: smooth rounded shapes, pearly white and soft mint-teal materials, gentle top-left lighting. Transparent background, NO glow, NO halo, NO outer light around the object, only a tiny soft contact shadow directly under it. Single object centered, fully visible with a small margin, no text, no watermark. Object: An ultrasound machine on a wheeled cart with a flat monitor and a probe holder, white and mint-teal, 1 tile.
```

### 17. `iv_chair.png` (1k)
```
Isometric 2:1 dimetric game asset, camera 30 degrees above, object seen from the front-right, in glossy soft 3D clay style like a premium mobile game icon: smooth rounded shapes, pearly white and soft mint-teal materials, gentle top-left lighting. Transparent background, NO glow, NO halo, NO outer light around the object, only a tiny soft contact shadow directly under it. Single object centered, fully visible with a small margin, no text, no watermark. Object: A comfy white and mint-teal medical recliner chair with a padded footrest and a small IV stand attached, 1 tile.
```

### 18. `iv_stand.png` (1k)
```
Isometric 2:1 dimetric game asset, camera 30 degrees above, object seen from the front-right, in glossy soft 3D clay style like a premium mobile game icon: smooth rounded shapes, pearly white and soft mint-teal materials, gentle top-left lighting. Transparent background, NO glow, NO halo, NO outer light around the object, only a tiny soft contact shadow directly under it. Single object centered, fully visible with a small margin, no text, no watermark. Object: A tall thin metal IV pole with a hook, a clear fluid bag with pale blue liquid and a tiny drip chamber, on a five-leg round base, 1 tile.
```

### 19. `pharmacy_counter.png` (1k)
```
Isometric 2:1 dimetric game asset, camera 30 degrees above, object seen from the front-right, in glossy soft 3D clay style like a premium mobile game icon: smooth rounded shapes, pearly white and soft mint-teal materials, gentle top-left lighting. Transparent background, NO glow, NO halo, NO outer light around the object, only a tiny soft contact shadow directly under it. Single object centered, fully visible with a small margin, no text, no watermark. Object: A pharmacy counter, white with a mint-green front panel with a green cross symbol, small scale and a few medicine boxes on top, 3 by 1 tiles, long side from upper-left to lower-right.
```

### 20. `pharmacy_shelf.png` (1k)
```
Isometric 2:1 dimetric game asset, camera 30 degrees above, object seen from the front-right, in glossy soft 3D clay style like a premium mobile game icon: smooth rounded shapes, pearly white and soft mint-teal materials, gentle top-left lighting. Transparent background, NO glow, NO halo, NO outer light around the object, only a tiny soft contact shadow directly under it. Single object centered, fully visible with a small margin, no text, no watermark. Object: A tall white shelf unit filled with colorful rounded medicine boxes and bottles, 2 by 1 tiles, long side from upper-left to lower-right.
```

### 21. `cafe_table.png` (1k)
```
Isometric 2:1 dimetric game asset, camera 30 degrees above, object seen from the front-right, in glossy soft 3D clay style like a premium mobile game icon: smooth rounded shapes, pearly white and soft mint-teal materials, gentle top-left lighting. Transparent background, NO glow, NO halo, NO outer light around the object, only a tiny soft contact shadow directly under it. Single object centered, fully visible with a small margin, no text, no watermark. Object: A round white cafe table with two mint-teal stools and a small cup on the table, 1 tile.
```

### 22. `vending_machine.png` (1k)
```
Isometric 2:1 dimetric game asset, camera 30 degrees above, object seen from the front-right, in glossy soft 3D clay style like a premium mobile game icon: smooth rounded shapes, pearly white and soft mint-teal materials, gentle top-left lighting. Transparent background, NO glow, NO halo, NO outer light around the object, only a tiny soft contact shadow directly under it. Single object centered, fully visible with a small margin, no text, no watermark. Object: A snack vending machine with a pastel mint front, glass window with colorful snacks, a tiny coin slot, 1 tile, tall.
```

## Персонажи

Сначала сделайте **одного** (`staff_doctor`), утвердите, затем остальных с ним как референсом. Параметры те же (`gpt_image_2_6`, 1:1, 1k, medium, transparent). Анимацию (`autosprite`) запускаем только для утверждённых, перед запуском смотрите цену (на счёте 10 кредитов).

### `patient_01.png`
```
Cute cartoon full-body game character, big head, short body, soft 3D clay look, standing in a neutral pose, seen from a three-quarter isometric angle facing the lower-right, simple pastel clothes, no outline, transparent background, no glow, no text. Character: adult man in a light blue shirt and beige trousers.
```

### `patient_02.png`
```
Cute cartoon full-body game character, big head, short body, soft 3D clay look, standing in a neutral pose, seen from a three-quarter isometric angle facing the lower-right, simple pastel clothes, no outline, transparent background, no glow, no text. Character: adult woman in a coral cardigan and white skirt.
```

### `patient_03.png`
```
Cute cartoon full-body game character, big head, short body, soft 3D clay look, standing in a neutral pose, seen from a three-quarter isometric angle facing the lower-right, simple pastel clothes, no outline, transparent background, no glow, no text. Character: elderly man with grey hair, a green sweater and a walking cane.
```

### `patient_04.png`
```
Cute cartoon full-body game character, big head, short body, soft 3D clay look, standing in a neutral pose, seen from a three-quarter isometric angle facing the lower-right, simple pastel clothes, no outline, transparent background, no glow, no text. Character: teenage girl with a yellow hoodie and a backpack.
```

### `patient_05.png`
```
Cute cartoon full-body game character, big head, short body, soft 3D clay look, standing in a neutral pose, seen from a three-quarter isometric angle facing the lower-right, simple pastel clothes, no outline, transparent background, no glow, no text. Character: small child in a red t-shirt holding a teddy bear.
```

### `patient_06.png`
```
Cute cartoon full-body game character, big head, short body, soft 3D clay look, standing in a neutral pose, seen from a three-quarter isometric angle facing the lower-right, simple pastel clothes, no outline, transparent background, no glow, no text. Character: woman in a purple coat with a warm scarf.
```

### `patient_07.png`
```
Cute cartoon full-body game character, big head, short body, soft 3D clay look, standing in a neutral pose, seen from a three-quarter isometric angle facing the lower-right, simple pastel clothes, no outline, transparent background, no glow, no text. Character: man in a dark jacket and a cap.
```

### `patient_08.png`
```
Cute cartoon full-body game character, big head, short body, soft 3D clay look, standing in a neutral pose, seen from a three-quarter isometric angle facing the lower-right, simple pastel clothes, no outline, transparent background, no glow, no text. Character: grandmother with a round cardigan, glasses and a handbag.
```

### `staff_doctor.png`
```
Cute cartoon full-body game character, big head, short body, soft 3D clay look, standing in a neutral pose, seen from a three-quarter isometric angle facing the lower-right, simple pastel clothes, no outline, transparent background, no glow, no text. Character: friendly doctor in a white coat with a stethoscope, teal shirt.
```

### `staff_nurse.png`
```
Cute cartoon full-body game character, big head, short body, soft 3D clay look, standing in a neutral pose, seen from a three-quarter isometric angle facing the lower-right, simple pastel clothes, no outline, transparent background, no glow, no text. Character: nurse in teal scrubs with a small white nurse cap.
```

### `staff_receptionist.png`
```
Cute cartoon full-body game character, big head, short body, soft 3D clay look, standing in a neutral pose, seen from a three-quarter isometric angle facing the lower-right, simple pastel clothes, no outline, transparent background, no glow, no text. Character: receptionist with a headset, white blouse and a teal vest.
```

### `staff_labtech.png`
```
Cute cartoon full-body game character, big head, short body, soft 3D clay look, standing in a neutral pose, seen from a three-quarter isometric angle facing the lower-right, simple pastel clothes, no outline, transparent background, no glow, no text. Character: lab technician in a white lab coat, safety glasses on forehead.
```

### `staff_janitor.png`
```
Cute cartoon full-body game character, big head, short body, soft 3D clay look, standing in a neutral pose, seen from a three-quarter isometric angle facing the lower-right, simple pastel clothes, no outline, transparent background, no glow, no text. Character: janitor in a light blue uniform holding a small mop.
```

### `staff_admin.png`
```
Cute cartoon full-body game character, big head, short body, soft 3D clay look, standing in a neutral pose, seen from a three-quarter isometric angle facing the lower-right, simple pastel clothes, no outline, transparent background, no glow, no text. Character: hospital administrator in a navy blazer with a tablet.
```

## Иконки и UI (листами, зелёный фон)

Здесь фон **зелёный #00FF00** (листы режет `prepare_assets.py`), `background: transparent` не ставить.

### `icons_symptoms.png`
```
A 4 by 3 grid of cute glossy soft 3D clay icons, each in its own equal cell, same style, solid bright green #00FF00 background, no text: fever thermometer, cough, sore throat, runny nose, headache, stomach ache, skin rash, sprained ankle, broken bone, tired face, gold coin, blue crystal.
```

### `icons_status_roles.png`
```
A 4 by 3 grid of cute glossy soft 3D clay icons, each in its own equal cell, same style, solid bright green #00FF00 background, no text: patience heart, waiting clock, error exclamation, doctor badge, nurse badge, receptionist badge, lab technician badge, janitor badge, administrator badge, daily quest scroll, weekly quest calendar, story quest book.
```

### `ui_frames.png`
```
A set of game UI frames on a solid bright green #00FF00 background, flat front view, mint-teal and white, soft shadow, uniform borders with no gradients on the edges (9-slice friendly): a rounded button in three states, a large window frame with a header strip, a bottom panel frame, a progress bar frame. No text.
```

### `sign_blank.png`
```
A blank wall sign plate, rounded rectangle, teal with a white border, glossy soft 3D clay, isometric 2:1, transparent background, no text.
```

## Если не получается

- Слишком реалистично: добавить `chibi proportions, toy-like, matte plastic look`.
- Не тот ракурс: добавить `exact isometric 2:1 dimetric view, not top-down, not side view`.
- Опять ореол: добавить `isolated cutout on fully transparent background, hard clean edges`.
- Просите один предмет за запрос, не набор.

## После генерации

Положите файлы в `assets/raw/` с указанными именами, сделайте коммит и напишите мне: я обработаю (`prepare_assets.py`), проставлю якоря в манифесте и перейду к этапу 10.
