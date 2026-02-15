
export type CalendarType = 'resource' | 'professional' | 'general';

export interface CalendarConfig {
  id: string;
  label: string;
  type: CalendarType;
  timezone: string;
  active: boolean;
  showDetails: boolean;
  sort: number;
}

export interface CalendarEvent {
  id: string;
  calendarId: string;
  calendarLabel: string;
  calendarType: CalendarType;
  title: string;
  start: string; // ISO
  end: string;   // ISO
  location?: string;
  description?: string;
  source: 'events' | 'freebusy';
  isCurrent?: boolean;
}

export interface AuthSession {
  user: string;
  role: 'admin' | 'viewer';
  expiresAt: number;
}

export enum AppRoute {
  HOME = 'home',
  TV = 'tv',
  ADMIN = 'admin',
  LOGIN = 'login'
}
