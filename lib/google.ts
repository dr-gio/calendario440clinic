
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

    // Construct the URL with query params
    const params = new URLSearchParams({ date });

    // If you have multiple calendars to fetch, you might need to iterate or change the API to accept multiple IDs.
    // For this implementation, we'll fetch from the default/primary env configured calendar.
    const response = await fetch(`/api/calendar?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();

    // Normalize Google Calendar events to our app's structure
    return data.map((event: any) => ({
      id: event.id,
      calendarId: 'primary', // or map from event organizer
      calendarLabel: 'Agenda Clínica', // Default label
      calendarType: 'general', // Default type
      title: event.summary || 'Sin título',
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
      location: event.location,
      description: event.description,
      source: 'events'
    }));
  } catch (error) {
    console.error("Failed to fetch calendar events:", error);
    return []; // Return empty array on error to prevent app crash
  }
}

