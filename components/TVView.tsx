
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
        <aside className="w-[240px] bg-[#020617] border-r border-slate-900 flex flex-col p-5 overflow-y-auto">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em]">IA ANALYTICS</h2>
              <span className="text-[8px] border border-blue-900 text-blue-500 px-2 py-0.5 rounded font-black">ACTIVO</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/50">
              <p className="text-[12px] leading-relaxed italic text-slate-300 font-medium">
                "Análisis en tiempo real habilitado para optimización de flujo médico."
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-[9px] font-black text-red-600 uppercase tracking-[0.2em] mb-4">CONFLICTOS</h2>
            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-red-900/20 bg-red-950/5">
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Conflicto Sharon: Consultorio + Hidrash (04:30)
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
              <div key={cal.id} className="min-w-[280px] flex-1 border-r border-slate-900 flex flex-col last:border-r-0">
                {/* Column Header */}
                <div className="p-5 border-b border-slate-900 bg-slate-900/10">
                  <h3 className="text-xl font-bold text-white tracking-tight mb-0.5 truncate">{cal.label}</h3>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest truncate">
                    {getSubLabel(cal.type)}
                  </p>
                </div>

                {/* EN CURSO / ESTADO ACTUAL */}
                <div className="space-y-4 p-5 pb-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">ESTADO</h4>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${current.length > 0 ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
                      {current.length > 0 ? 'OCUPADO' : 'LIBRE'}
                    </span>
                  </div>

                  {current.length > 0 ? (
                    current.map(e => (
                      <div key={e.id} className="p-5 rounded-2xl bg-blue-600 border-l-4 border-blue-400 shadow-lg flex flex-col justify-center min-h-[100px]">
                        <div className="text-[10px] font-mono text-blue-100 mb-1 font-bold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                          {new Date(e.start).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })} - {new Date(e.end).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </div>
                        <h5 className="text-lg font-black text-white leading-tight mb-1">{e.title}</h5>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/30 flex flex-col items-center justify-center min-h-[80px] text-center">
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Disponible</span>
                      {upcoming.length > 0 && (
                        <p className="mt-1 text-[9px] font-bold text-blue-400/60">
                          Prox: {new Date(upcoming[0].start).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* PRÓXIMOS */}
                <div className="space-y-3 p-5 pt-2 flex-1 overflow-y-auto no-scrollbar">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-widest">AGENDA</h4>
                    <div className="h-px flex-1 bg-slate-900"></div>
                  </div>
                  {upcoming.length > 0 ? (
                    <div className="space-y-2">
                      {upcoming.map((e, idx) => (
                        <div key={e.id} className={`p-3 rounded-xl border transition-all ${idx === 0 ? 'bg-slate-900/60 border-slate-700' : 'bg-slate-900/20 border-slate-800/40 opacity-50'}`}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[9px] font-mono text-blue-400 font-bold">
                              {new Date(e.start).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </span>
                          </div>
                          <h5 className="text-xs font-bold text-slate-300 leading-tight">{e.title}</h5>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-10 flex items-center justify-center">
                      <p className="text-[8px] font-black text-slate-800 uppercase tracking-widest italic text-center">Sin más citas</p>
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
