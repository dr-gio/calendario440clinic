
/**
 * In a real Next.js environment, this would use the 'googleapis' package and
 * a service account from process.env.GOOGLE_SERVICE_ACCOUNT_JSON.
 * For this SPA, we simulate the logic of fetching and normalizing.
 */

import { CalendarConfig, CalendarEvent } from '../types';

export async function fetchCalendarBoard(
  configs: CalendarConfig[],
  date: string = new Date().toISOString().split('T')[0]
): Promise<CalendarEvent[]> {
  try {
    // In passing queries to our Vercel function:
    // We can fetch events for a specific calendar ID (if configured)
    // or we might want to iterate through configs if each config maps to a calendar ID.
    // For now, let's assume we fetch events from the PRIMARY calendar or a specific one in env.

    // Fetch events for all active calendars in parallel
    const eventPromises = configs.filter(c => c.active).map(async (config) => {
      try {
        const params = new URLSearchParams({
          date,
          calendarId: config.googleCalendarId || 'primary'
        });

        const response = await fetch(`/api/calendar?${params.toString()}`);
        if (!response.ok) {
          console.warn(`Failed to fetch calendar ${config.label}: ${response.statusText}`);
          return [];
        }

        const data = await response.json();

        return data.map((event: any) => ({
          id: event.id,
          calendarId: config.id,
          calendarLabel: config.label,
          calendarType: config.type,
          title: event.summary || 'Sin título',
          start: event.start.dateTime || event.start.date,
          end: event.end.dateTime || event.end.date,
          location: event.location,
          description: event.description,
          source: 'events'
        }));
      } catch (e) {
        console.error(`Error fetching calendar ${config.label}:`, e);
        return [];
      }
    });

    const nestedEvents = await Promise.all(eventPromises);
    return nestedEvents.flat();
  } catch (error) {
    throw error;
  }
}

