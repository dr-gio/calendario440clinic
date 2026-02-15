
import { CalendarConfig, CalendarEvent, CalendarType } from '../types';

/**
 * In a real Next.js environment, this would use the 'googleapis' package and
 * a service account from process.env.GOOGLE_SERVICE_ACCOUNT_JSON.
 * For this SPA, we simulate the logic of fetching and normalizing.
 */
export async function fetchCalendarBoard(
  configs: CalendarConfig[],
  date: string = new Date().toISOString().split('T')[0]
): Promise<CalendarEvent[]> {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 800));

  const allEvents: CalendarEvent[] = [];
  const startOfDay = new Date(`${date}T00:00:00`);
  const endOfDay = new Date(`${date}T23:59:59`);

  for (const config of configs) {
    if (!config.active) continue;

    // Simulated "events.list" or "freebusy" results
    const mockEvents = generateMockEvents(config, startOfDay);
    allEvents.push(...mockEvents);
  }

  return allEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

function generateMockEvents(config: CalendarConfig, baseDate: Date): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const hours = [9, 10, 11, 14, 15, 16];
  
  // Deterministic mocking based on ID string
  const seed = config.id.length % 3;
  const filteredHours = hours.filter((_, i) => (i + seed) % 2 === 0);

  filteredHours.forEach((hour, idx) => {
    const start = new Date(baseDate);
    start.setHours(hour, 0, 0);
    
    const end = new Date(start);
    end.setHours(hour + 1, 0, 0);

    events.push({
      id: `${config.id}-${idx}`,
      calendarId: config.id,
      calendarLabel: config.label,
      calendarType: config.type,
      title: config.showDetails ? (seed === 0 ? 'Consulta General' : 'Procedimiento Especial') : 'Ocupado',
      start: start.toISOString(),
      end: end.toISOString(),
      location: config.showDetails ? 'Piso 2, Ala B' : undefined,
      description: config.showDetails ? 'Paciente recurrente' : undefined,
      source: config.showDetails ? 'events' : 'freebusy'
    });
  });

  return events;
}
