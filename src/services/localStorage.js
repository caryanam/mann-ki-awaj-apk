import AsyncStorage from '@react-native-async-storage/async-storage';

export const localStorage = {
  _data: {},
  _initialized: false,

  async init() {
    if (this._initialized) return;
    try {
      const keys = await AsyncStorage.getAllKeys();
      const pairs = await AsyncStorage.multiGet(keys);
      pairs.forEach(([key, value]) => {
        this._data[key] = value;
      });
    } catch (e) {
      console.warn('[localStorage] Initialization failed:', e);
    }
    this._initialized = true;
  },

  setItem(key, value) {
    const strVal = String(value);
    this._data[key] = strVal;
    AsyncStorage.setItem(key, strVal).catch(err => {
      console.warn('[localStorage] setItem failed:', err);
    });
  },

  getItem(key) {
    return this._data[key] || null;
  },

  removeItem(key) {
    delete this._data[key];
    AsyncStorage.removeItem(key).catch(err => {
      console.warn('[localStorage] removeItem failed:', err);
    });
  },

  clear() {
    this._data = {};
    AsyncStorage.clear().catch(err => {
      console.warn('[localStorage] clear failed:', err);
    });
  }
};
