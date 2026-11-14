// Простая шина игровых событий (этап 16).
// Системы без Phaser (Quests) подписываются на события, а сцена только пересылает их.
// Использование: bus.on('patientTreated', handler) -> bus.emit('patientTreated', payload).

export default class EventBus {
  constructor() {
    this.handlers = new Map();
  }

  /** @returns {Function} отписка */
  on(type, handler) {
    if (typeof handler !== 'function') {
      return () => {};
    }
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type).add(handler);
    return () => this.off(type, handler);
  }

  off(type, handler) {
    const set = this.handlers.get(type);
    if (set) {
      set.delete(handler);
      if (set.size === 0) {
        this.handlers.delete(type);
      }
    }
  }

  emit(type, payload = null) {
    const set = this.handlers.get(type);
    if (!set) {
      return 0;
    }
    let count = 0;
    set.forEach((handler) => {
      try {
        handler(payload, type);
        count += 1;
      } catch (err) {
        // Один сломанный подписчик не должен останавливать остальные события.
        if (typeof console !== 'undefined') {
          console.error(`EventBus: ошибка обработчика "${type}"`, err);
        }
      }
    });
    return count;
  }

  clear() {
    this.handlers.clear();
  }
}
