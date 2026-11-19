// Диалог диагноза в изометрии (этап 14): симптомы и три варианта болезни.
// Отдельный модуль, чтобы PatientRunner оставался про движение и шкалу терпения.

import { DISEASES } from '../data/diseases.js';
import { openDialog } from '../ui/Dialog.js';

function shuffled(list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default class PatientDialog {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.root = null;
    this.agent = null;
  }

  get isOpen() {
    return !!this.root;
  }

  /**
   * @param {object} agent
   * @param {(disease:object)=>void} onChoose
   * @param {Function} [onClose]
   */
  open(agent, onChoose, onClose = null) {
    if (this.root) {
      return;
    }
    const disease = agent.disease;
    const others = shuffled(DISEASES.filter((item) => item.id !== disease.id)).slice(0, 2);
    const options = shuffled([disease, ...others]);
    // Диалог без заголовка и подсказок: пациент сам идёт в нужный кабинет,
    // а варианты внизу — это и есть выбор диагноза.
    const text = [
      '«Здравствуйте! Мне нездоровится. Помогите, пожалуйста.»',
      '',
      'Жалобы:',
      disease.symptoms.map((item) => `• ${item}`).join('\n'),
    ].join('\n');

    this.scene.modalOpen = true;
    this.agent = agent;
    // Окно рисуется в HUD-сцене: у мировой сцены камера прокручена и увеличена,
    // и модалка 1280x720 уезжает за экран.
    const uiScene = this.scene.hud && this.scene.hud.add ? this.scene.hud : this.scene;
    this.root = openDialog(uiScene, {
      text,
      accent: disease.color,
      // Окно ниже обычного: текста немного, а кнопки должны стоять под ним.
      height: 500,
      buttons: options.map((item) => ({
        label: item.name,
        color: 0x3f9b4a,
        hoverColor: 0x55b963,
        onClick: () => onChoose(item),
      })),
      onClose: () => {
        this.root = null;
        this.agent = null;
        this.scene.modalOpen = false;
        if (onClose) {
          onClose();
        }
      },
    });
  }

  close() {
    if (this.root) {
      this.root.close();
    }
  }
}
