
import React, { useState } from 'react';

interface LoginProps {
  onLogin: (user: string, role: 'admin' | 'viewer') => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // In a real app, these are env vars VIEWER_USER/PASS and ADMIN_USER/PASS
    // For demo purposes, we check static values:
    if (username === 'admin' && password === 'admin440') {
      onLogin(username, 'admin');
    } else if (username === 'viewer' && password === 'clinic440') {
      onLogin(username, 'viewer');
    } else {
      setError('Credenciales incorrectas');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">440 Clinic</h1>
          <p className="text-slate-500 mt-2">Operational Board Login</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Usuario</label>
            <input
              type="text"
              required
              className="mt-1 block w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Contraseña</label>
            <input
              type="password"
              required
              className="mt-1 block w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full bg-slate-900 text-white font-semibold py-3 rounded-lg hover:bg-slate-800 transition-colors shadow-lg active:scale-[0.98]"
          >
            Entrar
          </button>
        </form>

        <div className="text-xs text-slate-400 text-center space-y-1">
          <p>Demo Admin: admin / admin440</p>
          <p>Demo Viewer: viewer / clinic440</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
