
import React, { useState, useEffect, useMemo } from 'react';
import { CalendarConfig, CalendarEvent, AppRoute } from '../types';
import { storage } from '../lib/storage';
import { fetchCalendarBoard } from '../lib/google';

const TVView: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<CalendarConfig[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hasError, setHasError] = useState(false);

  const loadData = async () => {
    const configs = storage.getCalendars();
    setCalendars(configs.filter(c => c.active).sort((a, b) => a.sort - b.sort));
    try {
      const data = await fetchCalendarBoard(configs);
      setEvents(data);
      setHasError(false);
    } catch (e) {
      console.error("Refresh Error", e);
      setHasError(true);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, []);

  const groupedEvents = useMemo(() => {
    const groups: Record<string, { current: CalendarEvent[], upcoming: CalendarEvent[] }> = {};
    calendars.forEach(cal => {
      const calEvents = events.filter(e => e.calendarId === cal.id);
      const now = currentTime.getTime();
      groups[cal.id] = {
        current: calEvents.filter(e => {
          const start = new Date(e.start).getTime();
          const end = new Date(e.end).getTime();
          return now >= start && now <= end;
        }),
        upcoming: calEvents.filter(e => new Date(e.start).getTime() > now)
      };
    });
    return groups;
  }, [events, calendars, currentTime]);

  const getSubLabel = (type: string) => {
    switch (type) {
      case 'professional': return 'ESPECIALISTA';
      case 'general': return 'EQUIPAMIENTO';
      case 'resource':
      default: return 'SALA DE CONSULTA';
    }
  };

  return (
    <div className="h-screen w-screen bg-[#020617] text-white flex flex-col overflow-hidden font-sans">
      {/* TOP BAR */}
      <div className="h-1 text-center text-[8px] text-slate-700 tracking-[1em] font-black uppercase py-4">440CLINIC Display System</div>

      {/* HEADER */}
      <header className="h-28 flex items-center justify-between px-10 border-b border-slate-900 bg-[#020617] relative">
        <div className="flex items-center gap-10">
          <div className="bg-white px-3 py-1.5 rounded flex items-center justify-center">
            <span className="text-[#020617] font-black italic text-3xl tracking-tighter">440CLINIC</span>
          </div>
          <div className="h-10 w-[2px] bg-slate-800"></div>
          <div>
            <h1 className="text-3xl font-black tracking-widest text-white leading-none">MONITOR OPERATIVO</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className={`w-2 h-2 rounded-full animate-pulse ${hasError ? 'bg-red-600' : 'bg-emerald-500'}`}></span>
              <span className={`text-[11px] font-bold uppercase tracking-widest ${hasError ? 'text-red-500' : 'text-emerald-500'}`}>
                {hasError ? 'ERROR DE CONEXIÓN' : 'SISTEMA CONECTADO'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-12">
          <button className="bg-[#2563eb] text-white text-[12px] font-black py-3 px-8 rounded-full flex items-center gap-3 shadow-2xl shadow-blue-900/40 hover:bg-blue-500 transition-all active:scale-95">
            <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold text-[10px]">G</span>
            </div>
            SINCRONIZAR CLÍNICA
          </button>

          <div className="text-right">
            <div className="text-6xl font-black text-[#42a5f5] tabular-nums leading-none tracking-tight">
              {currentTime.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
            </div>
            <div className="text-[12px] font-extrabold text-slate-400 uppercase tracking-widest mt-1">
              {currentTime.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside className="w-[320px] bg-[#020617] border-r border-slate-900 flex flex-col p-8 overflow-y-auto">
          <div className="mb-10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[11px] font-black text-blue-500 uppercase tracking-[0.2em]">OPERATIONAL INSIGHT</h2>
              <span className="text-[10px] border border-blue-900 text-blue-500 px-3 py-0.5 rounded font-black tracking-widest">ACTIVO</span>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900/20 border border-slate-800/50">
              <p className="text-[14px] leading-relaxed italic text-slate-300 font-medium">
                "Se han detectado conflictos críticos de duplicidad de tareas para la Dra. Sharon y Katherine Peralta. Es imperativo reasignar estos servicios a los profesionales disponibles (Lia o Roxana) para garantizar la atención al paciente y el uso eficiente de los boxes de Hidrash y Consultorio."
              </p>
            </div>
          </div>

          <div className="mb-10">
            <h2 className="text-[11px] font-black text-red-600 uppercase tracking-[0.2em] mb-6">ALERTAS CRÍTICAS</h2>
            <div className="space-y-4">
              <div className="p-5 rounded-xl border border-red-900/20 bg-red-950/5">
                <p className="text-[12px] text-slate-400 leading-relaxed font-medium">
                  <span className="text-red-500 block mb-1">Conflicto de personal:</span>
                  Dra. Sharon (p2) tiene citas simultáneas en Consultorio (r1) e Hidrash (r7) de 04:32 a 05:17
                </p>
              </div>
              <div className="p-5 rounded-xl border border-red-900/20 bg-red-950/5">
                <p className="text-[12px] text-slate-400 leading-relaxed font-medium">
                  <span className="text-red-500 block mb-1">Conflicto de personal:</span>
                  Katherine Peralta (p3) tiene citas simultáneas en Consultorio (r1) e Hidrash (r7) de 05:32 a 06:17
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-[11px] font-black text-slate-600 uppercase tracking-[0.2em] mb-6">RECOMENDACIONES</h2>
          </div>
        </aside>

        {/* MAIN GRID */}
        <main className="flex-1 flex overflow-x-auto bg-[#020617]">
          {calendars.map(cal => {
            const { current, upcoming } = groupedEvents[cal.id] || { current: [], upcoming: [] };
            return (
              <div key={cal.id} className="min-w-[400px] flex-1 border-r border-slate-900 flex flex-col last:border-r-0">
                {/* Column Header */}
                <div className="p-8 border-b border-slate-900">
                  <h3 className="text-3xl font-bold text-white tracking-tight mb-1">{cal.label}</h3>
                  <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.1em]">
                    {getSubLabel(cal.type)}
                  </p>
                </div>

                <div className="flex-1 p-8 space-y-12">
                  {/* EN CURSO */}
                  <div className="space-y-6">
                    <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-widest">EN CURSO</h4>
                    {current.length > 0 ? (
                      current.map(e => (
                        <div key={e.id} className="p-8 rounded-3xl bg-blue-600/10 border-2 border-blue-500/40 shadow-[0_0_50px_-10px_rgba(37,99,235,0.2)]">
                          <div className="text-sm font-mono text-blue-400 mb-2 font-bold">
                            {new Date(e.start).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })}
                          </div>
                          <h5 className="text-2xl font-bold text-white mb-2">{e.title}</h5>
                        </div>
                      ))
                    ) : (
                      <div className="h-44 rounded-3xl border-2 border-dashed border-slate-800 flex items-center justify-center opacity-40">
                        <span className="text-lg font-bold text-slate-500 uppercase tracking-[0.3em] italic">Disponible</span>
                      </div>
                    )}
                  </div>

                  {/* PRÓXIMOS */}
                  <div className="space-y-6">
                    <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-widest">PRÓXIMOS</h4>
                    {upcoming.length > 0 ? (
                      <div className="space-y-4">
                        {upcoming.map(e => (
                          <div key={e.id} className="p-6 rounded-2xl bg-slate-900/10 border border-slate-800/50">
                            <span className="text-xs font-mono text-slate-500 block mb-1 font-bold">
                              {new Date(e.start).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </span>
                            <h5 className="text-lg font-bold text-slate-300">{e.title}</h5>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm font-bold text-slate-800 uppercase tracking-widest italic">Sin más citas hoy</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </main>
      </div>

      {/* FOOTER BAR */}
      <footer className="h-8 bg-[#020617] border-t border-slate-900 flex items-center px-8">
        <div className="w-full bg-slate-900/50 h-3 rounded-full overflow-hidden relative">
          <div className="absolute inset-0 bg-slate-800/50 w-1/4 animate-[pulse_2s_infinite]"></div>
        </div>
      </footer>
    </div>
  );
};

export default TVView;
