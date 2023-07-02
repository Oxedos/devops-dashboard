import localforage from 'localforage';

export function replacer(key, value) {
  if (value instanceof Map) {
    return {
      dataType: 'Map',
      value: Array.from(value.entries()), // or with spread: value: [...value]
    };
  } else {
    return value;
  }
}

export function reviver(key, value) {
  if (typeof value === 'object' && value !== null) {
    if (value.dataType === 'Map') {
      return new Map(value.value);
    }
  }
  return value;
}

export async function saveToStorage(key: string, state: any) {
  try {
    const serialized = JSON.stringify(state, replacer);
    localforage.setItem(key, serialized);
    return Promise.resolve();
  } catch (error) {
    return Promise.resolve();
  }
}

export async function loadFromStorage(key: string) {
  try {
    const serialized = await localforage.getItem<any>(key);
    if (serialized === null) {
      return undefined;
    }
    return JSON.parse(serialized, reviver);
  } catch (error) {
    return undefined;
  }
}

export async function saveToLocalStorage(key: string, state: any) {
  try {
    const serialized = JSON.stringify(state, replacer);
    localStorage.setItem(key, serialized);
    return Promise.resolve();
  } catch (error) {
    return Promise.resolve();
  }
}

export function loadFromLocalStorage(key: string) {
  try {
    const serialized = localStorage.getItem(key);
    if (serialized === null) {
      return undefined;
    }
    return JSON.parse(serialized, reviver);
  } catch (error) {
    return undefined;
  }
}

export async function clearLocalStorage(key: string) {
  try {
    localStorage.removeItem(key);
    return Promise.resolve();
  } catch (error) {
    return Promise.resolve();
  }
}
