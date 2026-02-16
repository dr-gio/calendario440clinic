
import React, { useState, useEffect } from 'react';
import { AuthSession, CalendarConfig, CalendarType, AppRoute } from '../types';
import { storage } from '../lib/storage';
import { TIMEZONE } from '../constants';

interface AdminViewProps {
  session: AuthSession | null;
  onLogout: () => void;
}

const AdminView: React.FC<AdminViewProps> = ({ session, onLogout }) => {
  const [calendars, setCalendars] = useState<CalendarConfig[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'calendars' | 'settings'>('calendars');
  const [form, setForm] = useState<Partial<CalendarConfig>>({
    id: '', label: '', type: 'resource', active: true, showDetails: true, sort: 1, timezone: TIMEZONE, googleCalendarId: ''
  });
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    setCalendars(storage.getCalendars().sort((a, b) => a.sort - b.sort));
    setApiKey(storage.getApiKey());
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    let newCals;
    if (editingId) {
      newCals = calendars.map(c => c.id === editingId ? { ...c, ...form } : c);
    } else {
      if (calendars.find(c => c.id === form.id)) {
        alert("El ID de calendario ya existe. Por favor usa uno único.");
        return;
      }
      newCals = [...calendars, form as CalendarConfig];
    }

    storage.saveCalendars(newCals);
    setCalendars(newCals.sort((a, b) => a.sort - b.sort));
    setEditingId(null);
    setForm({
      id: '',
      label: '',
      type: 'resource',
      active: true,
      showDetails: true,
      sort: calendars.length + 1,
      timezone: TIMEZONE,
      googleCalendarId: ''
    });
  };

  const handleSaveApiKey = () => {
    storage.saveApiKey(apiKey);
    alert('Google API Key guardada correctamente.');
  };

  const handleDelete = (id: string) => {
    if (!confirm("¿Eliminar este calendario definitivamente?")) return;
    const newCals = calendars.filter(c => c.id !== id);
    storage.saveCalendars(newCals);
    setCalendars(newCals);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newCals = [...calendars];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= newCals.length) return;

    const tempSort = newCals[index].sort;
    newCals[index].sort = newCals[target].sort;
    newCals[target].sort = tempSort;

    storage.saveCalendars(newCals);
    setCalendars(newCals.sort((a, b) => a.sort - b.sort));
  };

  const handleSeed = () => {
    if (confirm("¿Restaurar la configuración inicial? Esto sobrescribirá tus cambios.")) {
      const defaults = storage.seedDefaults();
      setCalendars(defaults);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 bg-slate-50 min-h-screen">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Panel de Control</h1>
          <div className="flex items-center gap-6 mt-4 bg-slate-200/50 p-1.5 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab('calendars')}
              className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${activeTab === 'calendars' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              CALENDARIOS
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${activeTab === 'settings' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              AJUSTES GLOBALES
            </button>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={() => window.location.hash = AppRoute.HOME}
            className="px-6 py-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 text-sm font-black shadow-sm transition-all"
          >
            VOLVER AL TABLERO
          </button>
          <button onClick={onLogout} className="text-red-500 text-sm font-black hover:bg-red-50 px-4 py-2 rounded-xl">SALIR</button>
        </div>
      </header>

      {activeTab === 'calendars' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-1">
            {/* FORMULARIO DE CALENDARIO */}
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm sticky top-8">
              <h2 className="text-2xl font-black mb-6 text-slate-800">
                {editingId ? 'Editar Calendario' : 'Añadir Calendario'}
              </h2>
              <form onSubmit={handleSave} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">ID Interno</label>
                  <input
                    required
                    placeholder="ej: consultorio_1"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-slate-900 transition-all font-medium"
                    value={form.id}
                    disabled={!!editingId}
                    onChange={(e) => setForm({ ...form, id: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-blue-600 mb-2 tracking-widest">Google Calendar ID</label>
                  <input
                    required
                    placeholder="ej: c_xxxxxxxxxx@group.calendar.google.com"
                    className="w-full px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-slate-900 transition-all font-medium"
                    value={form.googleCalendarId}
                    onChange={(e) => setForm({ ...form, googleCalendarId: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Nombre Visible</label>
                  <input
                    required
                    placeholder="ej: Consultorio 1"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-slate-900 transition-all font-medium"
                    value={form.label}
                    onChange={(e) => setForm({ ...form, label: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Categoría</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-900 font-bold appearance-none cursor-pointer"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as CalendarType })}
                  >
                    <option value="resource">Sala / Recurso</option>
                    <option value="professional">Profesional</option>
                    <option value="general">Equipo / Equipo</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-5 h-5 rounded border-slate-300 pointer-events-none" checked={form.active} readOnly />
                    <span className="text-sm font-bold text-slate-700" onClick={() => setForm({ ...form, active: !form.active })}>Activo</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-5 h-5 rounded border-slate-300 pointer-events-none" checked={form.showDetails} readOnly />
                    <span className="text-sm font-bold text-slate-700" onClick={() => setForm({ ...form, showDetails: !form.showDetails })}>Detalles</span>
                  </label>
                </div>

                <button type="submit" className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-slate-800 transition-all">
                  {editingId ? 'GUARDAR CAMBIOS' : 'AÑADIR CALENDARIO'}
                </button>
                {editingId && (
                  <button type="button" onClick={() => setEditingId(null)} className="w-full text-slate-400 font-bold py-2">Cancelar Edición</button>
                )}
              </form>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 overflow-x-auto shadow-sm">
              <table className="w-full text-left min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Recurso / Especialista</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Tipo</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {calendars.map((cal, idx) => (
                    <tr key={cal.id} className={`${!cal.active ? 'opacity-40' : ''} hover:bg-slate-50/50 transition-colors`}>
                      <td className="px-8 py-5">
                        <div className="font-bold text-slate-900">{cal.label}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-1">{cal.googleCalendarId}</div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${cal.type === 'professional' ? 'bg-purple-100 text-purple-600' :
                            cal.type === 'resource' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                          }`}>
                          {cal.type}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => { setEditingId(cal.id); setForm(cal); }} className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg></button>
                          <button onClick={() => handleDelete(cal.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={handleSeed} className="text-slate-400 text-xs font-bold hover:text-slate-600 uppercase tracking-widest">Restaurar Valores por Defecto</button>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="bg-white rounded-3xl border border-slate-200 p-10 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 bg-blue-50 rounded-2xl text-blue-600">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">Configuración de Inteligencia Artificial</h2>
                <p className="text-slate-500 font-medium">Google Gemini — Operational Refinement</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-3 tracking-widest">API KEY SECRETA (GEMINI 1.5 PRO)</label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Introduce tu clave secreta de Google AI"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-900 font-mono text-lg transition-all"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                </div>
              </div>
              <button
                onClick={handleSaveApiKey}
                className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 uppercase tracking-widest"
              >
                Actualizar y Probar Conexión
              </button>
              <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
                <p className="text-sm text-blue-800 font-medium leading-relaxed">
                  Esta clave permite que la IA analice los conflictos entre salas y doctores para darte recomendaciones inteligentes en el Modo TV.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminView;
