
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
      <header className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-6 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <img src="/logo.png" alt="440 Clinic Logo" className="h-16 sm:h-24 w-auto object-contain" />
          <div className="border-t sm:border-t-0 sm:border-l border-slate-200 pt-4 sm:pt-0 sm:pl-6">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">Agenda Diaria</h1>
            <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-[0.2em]">Operating Control Center</p>
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

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-6 items-stretch lg:items-center justify-between">
          <div className="flex bg-slate-100 p-1 rounded-2xl overflow-x-auto no-scrollbar">
            {(['resource', 'professional', 'general', 'all'] as const).map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`flex-1 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black uppercase whitespace-nowrap transition-all ${selectedType === type ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                {type === 'resource' ? 'Salas' : type === 'professional' ? 'Doctores' : type === 'general' ? 'Otros' : 'Ver Todo'}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none text-sm font-bold text-slate-900"
            />
            <div className="relative flex-1">
              <input
                placeholder="Buscar por nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none text-sm font-bold text-slate-900"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredCalendars.map(cal => (
            <div key={cal.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-blue-400 transition-all hover:shadow-xl hover:shadow-blue-500/5 group">
              <div className="p-5 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100 text-blue-600 group-hover:scale-110 transition-transform">
                    {cal.type === 'resource' ? <ICONS.Resource className="w-5 h-5" /> : cal.type === 'professional' ? <ICONS.Professional className="w-5 h-5" /> : <ICONS.General className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 leading-tight">{cal.label}</h3>
                    <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black">{cal.type}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`${hasError ? 'text-red-500' : 'text-emerald-500'} text-[9px] font-black uppercase tracking-tighter flex items-center gap-1`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${hasError ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                    {hasError ? 'ERROR' : 'SINC'}
                  </span>
                </div>
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
