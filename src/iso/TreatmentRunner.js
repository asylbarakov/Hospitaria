// Этап 18: связывает TreatmentSession с камерой изометрии и потоком пациентов.
// Сцена создаёт один объект; камера наезжает на комнату, затем открывается мини-игра.

import { tileCenter } from './IsoMath.js';
import TreatmentSession from '../systems/TreatmentSession.js';
import {
  TREATMENT_CAMERA_FOCUS_MS,
  TREATMENT_CAMERA_RETURN_MS,
  TREATMENT_CAMERA_ZOOM,
} from '../data/treatmentConfig.js';

export default function createTreatment(scene, options = {}) {
  const { iso, world, patients } = options;
  const notify = typeof options.notify === 'function' ? options.notify : () => {};

  return new TreatmentSession({
    scene,
    focus: (roomId, done) => {
      const room = world.roomById(roomId);
      if (!room) {
        done();
        return;
      }
      const point = tileCenter(room.x + room.w / 2, room.y + room.h / 2);
      iso.focusOn(point.x, point.y, TREATMENT_CAMERA_ZOOM, TREATMENT_CAMERA_FOCUS_MS, done);
    },
    restore: () => iso.restore(TREATMENT_CAMERA_RETURN_MS),
    onFinish: (agent, result) => {
      const applied = patients.flow.finishPlayerTreatment(agent, result);
      if (!applied.ok && applied.hint) {
        notify(applied.hint);
      }
    },
    notify,
  });
}
