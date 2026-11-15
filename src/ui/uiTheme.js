// Общие цвета и шрифт UI-кита (этап 19). Отдельный модуль, чтобы IsoUi и его
// части не импортировали друг друга по кругу.

export const UI_FONT = 'Arial, "Segoe UI", sans-serif';
export const UI_INK = '#1b4b5a';
export const UI_MUTED = '#4d7b8a';

export const BUTTON_COLORS = {
  green: 0x1f6f4f,
  blue: 0x1f5688,
  orange: 0x7a4608,
  purple: 0x4f3f74,
  red: 0x8f2f2a,
  gray: 0x4d6670,
};

export function colorCss(color, alpha = 1) {
  const r = (color >> 16) & 255;
  const g = (color >> 8) & 255;
  const b = color & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
