import { brand } from '../config/brand';

const key = (name: string) => `${brand.storagePrefix}.${name}`;

/** Safe localStorage read: returns the fallback if storage is blocked or the value is corrupted. */
export function readStorage<T>(name: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key(name)) || '') as T;
  } catch {
    return fallback;
  }
}

export function writeStorage(name: string, value: unknown) {
  try {
    localStorage.setItem(key(name), JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode, quota): the demo keeps working without persistence */
  }
}
