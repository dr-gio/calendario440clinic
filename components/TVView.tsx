
import React, { useState, useEffect, useMemo } from 'react';
import { CalendarConfig, CalendarEvent, AppRoute } from '../types';
import { storage } from '../lib/storage';
import { fetchCalendarBoard } from '../lib/google';

const TVView: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<CalendarConfig[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [hasError, setHasError] = useState(false);

  const loadData = async (dateToLoad: string = selectedDate) => {
    const configs = storage.getCalendars();
    setCalendars(configs.filter(c => c.active).sort((a, b) => a.sort - b.sort));
    try {
      const data = await fetchCalendarBoard(configs, dateToLoad);
      setEvents(data);
      setHasError(false);
    } catch (e) {
      console.error("Refresh Error", e);
      setHasError(true);
    }
  };

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    loadData(newDate);
  };

  const shiftDate = (days: number) => {
    const current = new Date(selectedDate + "T00:00:00");
    current.setDate(current.getDate() + days);
    const dateStr = current.toISOString().split('T')[0];
    handleDateChange(dateStr);
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
      <header className="h-20 flex items-center justify-between px-8 border-b border-slate-900 bg-[#020617] relative">
        <div className="flex items-center gap-6">
          <div className="bg-white px-2 py-1 rounded flex items-center justify-center">
            <span className="text-[#020617] font-black italic text-xl tracking-tighter">440CLINIC</span>
          </div>
          <div className="h-8 w-[1px] bg-slate-800"></div>
          <div>
            <h1 className="text-xl font-black tracking-widest text-white leading-none">MONITOR OPERATIVO</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${hasError ? 'bg-red-600' : 'bg-emerald-500'}`}></span>
              <span className={`text-[9px] font-bold uppercase tracking-widest ${hasError ? 'text-red-500' : 'text-emerald-500'}`}>
                {hasError ? 'ERROR DE CONEXIÓN' : 'SISTEMA CONECTADO'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-900/50 rounded-xl p-1 border border-slate-800 scale-90">
            <button
              onClick={() => shiftDate(-1)}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="relative px-3 flex flex-col items-center min-w-[100px]">
              <input type="date" value={selectedDate} onChange={(e) => handleDateChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
              <span className="text-[8px] font-black text-blue-500 tracking-[0.2em]">FECHA</span>
              <span className="text-sm font-black tracking-tight text-white uppercase italic">
                {selectedDate === new Date().toISOString().split('T')[0] ? 'HOY' : selectedDate.split('-').reverse().join('/')}
              </span>
            </div>
            <button
              onClick={() => shiftDate(1)}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="text-right border-l border-slate-800 pl-6">
            <div className="text-3xl font-black text-[#42a5f5] tabular-nums leading-none tracking-tight">
              {currentTime.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
            </div>
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">
              {currentTime.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside className="w-[200px] bg-[#020617] border-r border-slate-900 flex flex-col p-4 overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-[8px] font-black text-blue-500 uppercase tracking-[0.2em] mb-3">IA INSIGHT</h2>
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/50">
              <p className="text-[10px] leading-relaxed italic text-slate-400 font-medium">
                Optimización de flujo médico activa. Se detectan 2 conflictos potenciales de personal.
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-[8px] font-black text-red-600 uppercase tracking-[0.2em] mb-3">ALERTAS</h2>
            <div className="space-y-2">
              <div className="p-3 rounded-lg border border-red-900/20 bg-red-950/5">
                <p className="text-[9px] text-slate-500 leading-tight">
                  <span className="text-red-500 font-bold block mb-1">Conflicto Sharon:</span>
                  Cita duplicada en Consultorio e Hidrash (04:30)
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN GRID */}
        <main className="flex-1 flex overflow-x-auto bg-[#020617] no-scrollbar">
          {calendars.map(cal => {
            const { current, upcoming } = groupedEvents[cal.id] || { current: [], upcoming: [] };
            return (
              <div key={cal.id} className="min-w-[180px] flex-1 border-r border-slate-900 flex flex-col last:border-r-0">
                {/* Column Header */}
                <div className="p-3 border-b border-slate-900 bg-slate-900/20">
                  <h3 className="text-sm font-black text-white tracking-tight truncate uppercase italic">{cal.label}</h3>
                  <p className="text-[7px] text-slate-500 uppercase tracking-widest truncate font-bold">
                    {getSubLabel(cal.type)}
                  </p>
                </div>

                {/* EN CURSO / ESTADO ACTUAL */}
                <div className="space-y-3 p-3 pb-1">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[8px] font-black text-slate-600 uppercase tracking-widest">AHORA</h4>
                    <span className={`text-[7px] font-black px-1 py-0.5 rounded-sm ${current.length > 0 ? 'bg-red-500/20 text-red-400 border border-red-500/20' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'}`}>
                      {current.length > 0 ? 'OCUPADO' : 'LIBRE'}
                    </span>
                  </div>

                  {current.length > 0 ? (
                    current.map(e => (
                      <div key={e.id} className="p-3 rounded-xl bg-blue-600 border-l-2 border-blue-400 shadow-md flex flex-col justify-center min-h-[70px]">
                        <div className="text-[8px] font-mono text-blue-100 mb-0.5 font-bold">
                          {new Date(e.start).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })} - {new Date(e.end).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </div>
                        <h5 className="text-[11px] font-black text-white leading-tight truncate-2-lines">{e.title}</h5>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 rounded-lg bg-slate-900/20 border border-slate-800/20 flex flex-col items-center justify-center min-h-[60px] text-center">
                      <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">DISPONIBLE</span>
                    </div>
                  )}
                </div>

                {/* PRÓXIMOS */}
                <div className="space-y-2 p-3 pt-2 flex-1 overflow-y-auto no-scrollbar">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-[8px] font-black text-slate-700 uppercase tracking-widest">AGENDA</h4>
                    <div className="h-[1px] flex-1 bg-slate-900"></div>
                  </div>
                  {upcoming.length > 0 ? (
                    <div className="space-y-1.5 text-slate-400">
                      {upcoming.slice(0, 10).map((e, idx) => (
                        <div key={e.id} className={`p-2 rounded-lg border transition-all ${idx === 0 ? 'bg-slate-900/60 border-slate-700' : 'bg-slate-900/10 border-slate-800/30 opacity-60'}`}>
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="text-[8px] font-mono text-blue-500 font-bold">
                              {new Date(e.start).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </span>
                          </div>
                          <h5 className="text-[10px] font-bold leading-tight truncate">{e.title}</h5>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-8 flex items-center justify-center">
                      <p className="text-[7px] font-black text-slate-800 uppercase tracking-widest italic">FIN AGENDA</p>
                    </div>
                  )}
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
