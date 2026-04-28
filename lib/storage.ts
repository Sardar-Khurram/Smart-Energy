import { createMMKV } from "react-native-mmkv";

export const storage = createMMKV();

export const mmkvJSONStorage = {
  setItem: (name: string, value: string) => storage.set(name, value),
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  removeItem: (name: string) => storage.remove(name),
};
