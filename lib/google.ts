
/**
 * In a real Next.js environment, this would use the 'googleapis' package and
 * a service account from process.env.GOOGLE_SERVICE_ACCOUNT_JSON.
 * For this SPA, we simulate the logic of fetching and normalizing.
 */

import { CalendarConfig, CalendarEvent } from '../types';

export async function fetchCalendarBoard(
  configs: CalendarConfig[],
  date: string = new Date().toISOString().split('T')[0],
  endDate?: string
): Promise<CalendarEvent[]> {
  try {
    // In passing queries to our Vercel function:
    // We can fetch events for a specific calendar ID (if configured)
    // or we might want to iterate through configs if each config maps to a calendar ID.
    // For now, let's assume we fetch events from the PRIMARY calendar or a specific one in env.

    // Fetch events for all active calendars in parallel
    const eventPromises = configs.filter(c => c.active).map(async (config) => {
      try {
        const queryOptions: any = {
          date,
          calendarId: config.googleCalendarId || 'primary'
        };
        if (endDate) {
          queryOptions.endDate = endDate;
        }

        const params = new URLSearchParams(queryOptions);

        const response = await fetch(`/api/calendar?${params.toString()}`);
        if (!response.ok) {
          console.warn(`Failed to fetch calendar ${config.label}: ${response.statusText}`);
          return [];
        }

        const data = await response.json();

        return data.map((event: any) => {
          let title = event.summary || 'Sin título';
          let finalBooker = '';

          // Si el calendario es tipo 'resource' (sala o equipo), extraer qué profesional lo utiliza
          if (config.type === 'resource' || config.type === 'general') {

            // 1. Buscar si algún profesional asignado está en los invitados (attendees)
            const professionalAtt = event.attendees?.find((att: any) => {
              const matchedConfig = configs.find(c => c.googleCalendarId === att.email);
              return matchedConfig && (matchedConfig.type === 'professional' || matchedConfig.type === 'aesthetic');
            });

            if (professionalAtt) {
              const matchedConfig = configs.find(c => c.googleCalendarId === professionalAtt.email);
              finalBooker = matchedConfig?.label || professionalAtt.displayName || professionalAtt.email.split('@')[0];
            } else {
              // 2. Si no hay profesionales conocidos, buscar cualquier humano que no sea la sala misma
              const humanAtt = event.attendees?.find((att: any) =>
                !att.resource && att.email !== config.googleCalendarId && !att.self
              );

              if (humanAtt) {
                finalBooker = humanAtt.displayName || humanAtt.email.split('@')[0];
              } else {
                // 3. Como último recurso, el organizador (que podría ser recepción)
                const creatorName = event.creator?.displayName || event.organizer?.displayName;
                const creatorEmail = event.creator?.email || event.organizer?.email;
                finalBooker = creatorName || (creatorEmail ? creatorEmail.split('@')[0] : '');
              }
            }

            // Si el título ya incluía a mano el nombre del doctor (ej. "Dr Gio - Juan Perez"), limpiarlo
            if (finalBooker && title.toLowerCase().startsWith(finalBooker.toLowerCase() + ' - ')) {
              title = title.substring(finalBooker.length + 3);
            }
          }

          return {
            id: event.id,
            calendarId: config.id,
            calendarLabel: config.label,
            calendarType: config.type,
            title: title,
            booker: finalBooker,
            start: event.start.dateTime || event.start.date,
            end: event.end.dateTime || event.end.date,
            location: event.location,
            description: event.description,
            source: 'events'
          };
        });
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

