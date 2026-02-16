
import React, { useState, useEffect, useMemo } from 'react';
import { AuthSession, CalendarConfig, CalendarEvent, CalendarType, AppRoute } from '../types';
import { storage } from '../lib/storage';
import { fetchCalendarBoard } from '../lib/google';
import { ICONS, TIMEZONE } from '../constants';

interface BoardViewProps {
  session: AuthSession | null;
  onLogout: () => void;
}

const BoardView: React.FC<BoardViewProps> = ({ session, onLogout }) => {
  const [calendars, setCalendars] = useState<CalendarConfig[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<CalendarType | 'all'>('resource');
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [hasError, setHasError] = useState(false);

  const loadEvents = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const configs = storage.getCalendars();
      setCalendars(configs.sort((a, b) => a.sort - b.sort));
      const data = await fetchCalendarBoard(configs, selectedDate);
      setEvents(data);
      setHasError(false);
    } catch (error) {
      console.error("Load Events Error", error);
      setHasError(true);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();

    // Configurar refresco periódico cada 60 segundos
    const intervalId = setInterval(() => {
      loadEvents(true);
    }, 60000);

    return () => clearInterval(intervalId);
  }, [selectedDate]);

  const filteredCalendars = useMemo(() => {
    return calendars.filter(c => {
      const matchType = selectedType === 'all' || c.type === selectedType;
      const matchSearch = c.label.toLowerCase().includes(search.toLowerCase());
      return matchType && matchSearch && c.active;
    });
  }, [calendars, selectedType, search]);

  const groupedEvents = useMemo(() => {
    const groups: Record<string, CalendarEvent[]> = {};
    events.forEach(e => {
      if (!groups[e.calendarId]) groups[e.calendarId] = [];
      groups[e.calendarId].push(e);
    });
    return groups;
  }, [events]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="440 Clinic Logo" className="h-24 w-auto object-contain" />
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Agenda Diaria</h1>
            <p className="text-slate-500 font-medium">440 Clinic — Operational Board</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {session?.role === 'admin' && (
            <button
              onClick={() => window.location.hash = AppRoute.ADMIN}
              className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-white transition-all text-sm font-medium shadow-sm text-slate-700"
            >
              Configuración
            </button>
          )}
          <button
            onClick={() => window.location.hash = AppRoute.TV}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all text-sm font-medium shadow-md flex items-center gap-2"
          >
            <span>Modo TV</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
          </button>
          <button onClick={onLogout} className="text-slate-400 hover:text-red-500 text-sm font-medium px-2 py-2">Salir</button>
        </div>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
          <div className="flex bg-slate-100 p-1 rounded-xl w-full lg:w-auto">
            {(['resource', 'professional', 'general', 'all'] as const).map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${selectedType === type ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                {type === 'resource' ? 'Recursos' : type === 'professional' ? 'Profesionales' : type === 'general' ? 'General' : 'Todos'}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none text-sm text-slate-900"
            />
            <input
              placeholder="Buscar calendario..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none text-sm min-w-[200px] text-slate-900"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCalendars.map(cal => (
            <div key={cal.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col hover:border-cyan-200 transition-colors">
              <div className="p-4 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100 text-cyan-600">
                    {cal.type === 'resource' ? <ICONS.Resource className="w-5 h-5" /> : cal.type === 'professional' ? <ICONS.Professional className="w-5 h-5" /> : <ICONS.General className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 truncate max-w-[150px]">{cal.label}</h3>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{cal.type}</p>
                  </div>
                </div>
                <span className={`${hasError ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'} text-[10px] px-2 py-0.5 rounded-full font-bold uppercase`}>
                  {hasError ? 'Offline' : 'Online'}
                </span>
              </div>

              <div className="p-4 space-y-3 flex-grow min-h-[120px]">
                {groupedEvents[cal.id]?.length > 0 ? (
                  groupedEvents[cal.id].map(event => (
                    <div key={event.id} className="group p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold text-slate-900">{event.title}</span>
                        <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-500">
                          {new Date(event.start).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </span>
                      </div>
                      {cal.showDetails && (
                        <div className="text-[10px] text-slate-500 flex flex-col">
                          {event.location && <span className="truncate">📍 {event.location}</span>}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-slate-300">
                    <svg className="w-8 h-8 mb-2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    <span className="text-sm font-medium">Disponible</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BoardView;
