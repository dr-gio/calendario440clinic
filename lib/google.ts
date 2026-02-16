
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
      const params = new URLSearchParams({
        date,
        calendarId: config.googleCalendarId || 'primary'
      });

      try {
        const response = await fetch(`/api/calendar?${params.toString()}`);

        if (!response.ok) {
          console.warn(`Failed to fetch for calendar ${config.label}: ${response.statusText}`);
          return [];
        }

        const data = await response.json();

        // Normalize events and tag with local config metadata
        return data.map((event: any) => ({
          id: event.id,
          calendarId: config.id, // Use our internal ID for mapping colors/rows
          calendarLabel: config.label,
          calendarType: config.type,
          title: event.summary || 'Sin título',
          start: event.start.dateTime || event.start.date,
          end: event.end.dateTime || event.end.date,
          location: event.location,
          description: event.description,
          source: 'events'
        }));
      } catch (err) {
        console.error(`Error fetching calendar ${config.label}`, err);
        return [];
      }
    });

    const nestedEvents = await Promise.all(eventPromises);
    return nestedEvents.flat();
  } catch (error) {
    console.error("Failed to fetch calendar events:", error);
    return []; // Return empty array on error to prevent app crash
  }
}

