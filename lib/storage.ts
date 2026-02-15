
import { CalendarConfig } from '../types';
import { KV_KEY, DEFAULT_CALENDARS } from '../constants';

const API_KEY_STORAGE_KEY = 'gemini_api_key';

export const storage = {
  getCalendars: (): CalendarConfig[] => {
    const data = localStorage.getItem(KV_KEY);
    if (!data) return DEFAULT_CALENDARS;
    try {
      return JSON.parse(data);
    } catch {
      return DEFAULT_CALENDARS;
    }
  },

  saveCalendars: (calendars: CalendarConfig[]) => {
    localStorage.setItem(KV_KEY, JSON.stringify(calendars));
  },

  seedDefaults: () => {
    localStorage.setItem(KV_KEY, JSON.stringify(DEFAULT_CALENDARS));
    return DEFAULT_CALENDARS;
  },

  getApiKey: (): string => {
    return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
  },

  saveApiKey: (key: string) => {
    localStorage.setItem(API_KEY_STORAGE_KEY, key);
  }
};
