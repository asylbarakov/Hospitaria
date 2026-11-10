// Canvas игры 1280x720 растягивается под экран (Scale.FIT), и обычный текст
// на больших мониторах получается мутным. Здесь все новые Text по умолчанию
// получают удвоенное разрешение: буквы остаются чёткими, а код сцен не меняется.
const TEXT_RESOLUTION = 2;

export function applyTextQuality() {
  const factory = Phaser.GameObjects.GameObjectFactory.prototype;
  if (factory.textQualityPatched) {
    return;
  }

  const originalText = factory.text;
  factory.text = function patchedText(x, y, text, style) {
    const label = originalText.call(this, x, y, text, style);
    if (!style || !style.resolution) {
      label.setResolution(TEXT_RESOLUTION);
    }
    return label;
  };
  factory.textQualityPatched = true;
}

export default applyTextQuality;
