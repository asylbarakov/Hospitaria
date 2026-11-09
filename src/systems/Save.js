const SAVE_KEY = 'hospital_save_v1';

function readRaw() {
  try {
    return window.localStorage.getItem(SAVE_KEY);
  } catch (error) {
    return null;
  }
}

const Save = {
  exists() {
    return readRaw() !== null;
  },

  load() {
    const raw = readRaw();
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  },

  save(data) {
    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      return false;
    }
  },

  clear() {
    try {
      window.localStorage.removeItem(SAVE_KEY);
    } catch (error) {
      // Хранилище недоступно — просто игнорируем.
    }
  },
};

export default Save;
