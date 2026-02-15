
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
  const [form, setForm] = useState<Partial<CalendarConfig>>({
    id: '', label: '', type: 'resource', active: true, showDetails: true, sort: 1, timezone: TIMEZONE
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
      timezone: TIMEZONE 
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
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Panel de Control</h1>
          <p className="text-slate-500 font-medium">Gestiona salas, profesionales y la IA operativa</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => window.location.hash = AppRoute.HOME} 
            className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-sm font-bold shadow-sm transition-all"
          >
            Volver al Tablero
          </button>
          <button onClick={onLogout} className="text-red-500 text-sm font-bold hover:underline">Cerrar Sesión</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1 space-y-8">
          {/* FORMULARIO DE CALENDARIO */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <h2 className="text-2xl font-black mb-6 text-slate-800">
              {editingId ? 'Editar Calendario' : 'Añadir Calendario'}
            </h2>
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Google Calendar ID</label>
                <input 
                  required
                  placeholder="ej: clinic.recursos@gmail.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-slate-900 transition-all font-medium"
                  value={form.id}
                  disabled={!!editingId}
                  onChange={(e) => setForm({...form, id: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Nombre del Box / Especialista</label>
                <input 
                  required
                  placeholder="ej: Consultorio 1"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-slate-900 transition-all font-medium"
                  value={form.label}
                  onChange={(e) => setForm({...form, label: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Categoría / Tipo</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-900 font-bold focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer"
                    value={form.type}
                    onChange={(e) => setForm({...form, type: e.target.value as CalendarType})}
                  >
                    <option value="resource">Sala / Recurso (SALA DE CONSULTA)</option>
                    <option value="professional">Profesional (ESPECIALISTA)</option>
                    <option value="general">General (EQUIPAMIENTO)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    checked={form.active} 
                    onChange={(e) => setForm({...form, active: e.target.checked})} 
                  />
                  <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900">Activo</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    checked={form.showDetails} 
                    onChange={(e) => setForm({...form, showDetails: e.target.checked})} 
                  />
                  <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900">Ver Detalles</span>
                </label>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="submit" className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10">
                  {editingId ? 'GUARDAR CAMBIOS' : 'AÑADIR A LA LISTA'}
                </button>
                {editingId && (
                  <button 
                    type="button" 
                    onClick={() => { setEditingId(null); setForm({ id: '', label: '', type: 'resource', active: true, showDetails: true, sort: calendars.length + 1, timezone: TIMEZONE }); }}
                    className="px-4 bg-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-300"
                  >
                    X
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* CONFIGURACIÓN IA */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <h2 className="text-xl font-black mb-6 flex items-center gap-3 text-blue-600">
              <div className="p-2 bg-blue-50 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </div>
              Google AI (Gemini)
            </h2>
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Google Gemini API Key</label>
                <input 
                  type="password"
                  placeholder="Introduce tu clave secreta de Google AI"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-900 font-mono"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>
              <button 
                onClick={handleSaveApiKey}
                className="w-full bg-blue-600 text-white font-black py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 text-sm"
              >
                ACTUALIZAR API KEY
              </button>
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                Requerido para el análisis inteligente de conflictos y recomendaciones operativas en tiempo real.
              </p>
            </div>
          </div>
        </div>

        {/* LISTADO DE CALENDARIOS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Descripción</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Tipo de Recurso</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {calendars.map((cal, idx) => (
                  <tr key={cal.id} className={`${!cal.active ? 'opacity-40' : ''} hover:bg-slate-50/50 transition-colors group`}>
                    <td className="px-8 py-5">
                      <div className="font-bold text-slate-900 text-lg">{cal.label}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{cal.id}</div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${
                        cal.type === 'professional' ? 'bg-purple-100 text-purple-600' :
                        cal.type === 'resource' ? 'bg-blue-100 text-blue-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {cal.type === 'professional' ? 'Profesional' : cal.type === 'resource' ? 'Sala' : 'General'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end items-center gap-3">
                        <div className="flex flex-col gap-1 mr-4">
                          <button onClick={() => moveItem(idx, 'up')} className="p-1 hover:bg-slate-200 rounded text-slate-400 disabled:opacity-0" disabled={idx === 0}>▲</button>
                          <button onClick={() => moveItem(idx, 'down')} className="p-1 hover:bg-slate-200 rounded text-slate-400 disabled:opacity-0" disabled={idx === calendars.length - 1}>▼</button>
                        </div>
                        <button 
                          onClick={() => { setEditingId(cal.id); setForm(cal); }} 
                          className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-black hover:bg-blue-600 hover:text-white transition-all"
                        >
                          EDITAR
                        </button>
                        <button 
                          onClick={() => handleDelete(cal.id)} 
                          className="px-4 py-2 bg-red-50 text-red-500 rounded-xl text-xs font-black hover:bg-red-500 hover:text-white transition-all"
                        >
                          BORRAR
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {calendars.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-8 py-20 text-center text-slate-400 font-medium">
                      No hay calendarios configurados. Empieza añadiendo uno a la izquierda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={handleSeed} 
              className="px-8 py-4 bg-white text-slate-500 rounded-2xl font-bold hover:bg-slate-100 border border-slate-200 transition-all text-sm shadow-sm"
            >
              Cargar Configuración Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminView;
