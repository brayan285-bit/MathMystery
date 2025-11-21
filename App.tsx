import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { MockFirebase } from './services/mockFirebase';
import { StudentGame } from './components/StudentGame';
import { TeacherPanel } from './components/TeacherPanel';
import { AdminPanel } from './components/AdminPanel';
import { InputField } from './components/InputField';
import { Button } from './components/Button';
import { Eye, EyeOff, Rocket, ShieldCheck } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Auth State
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT); // Default reg role
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check session on mount
    const currentUser = MockFirebase.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmitting(true);
    try {
      const loggedUser = await MockFirebase.login(username, password);
      setUser(loggedUser);
    } catch (err: any) {
      setAuthError(err.message || 'Error al iniciar sesión');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setIsSubmitting(true);
    try {
      // Validate basic fields
      if (!username || !password || !email || !name) throw new Error("Todos los campos son obligatorios");

      await MockFirebase.register({
        username,
        password,
        email,
        name,
        role
      });
      setAuthSuccess('¡Registro exitoso! Ahora puedes iniciar sesión.');
      setIsLogin(true); // Switch to login tab
      setUsername(''); // Clear sensitive data but maybe keep username for UX? Let's clear for security.
      setPassword('');
    } catch (err: any) {
      setAuthError(err.message || 'Error al registrar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    MockFirebase.logout();
    setUser(null);
    setUsername('');
    setPassword('');
    setAuthError('');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center text-mystery-accent">Cargando Universo...</div>;
  }

  // --- Authenticated Views ---
  if (user) {
    // Container for authenticated views to ensure they fit the screen
    const ViewContainer = ({ children }: { children: React.ReactNode }) => (
       <div className="h-full w-full overflow-hidden bg-mystery-dark">
          {children}
       </div>
    );

    if (user.role === UserRole.ADMIN) {
      return <ViewContainer><AdminPanel onLogout={handleLogout} /></ViewContainer>;
    }
    if (user.role === UserRole.TEACHER) {
      return <ViewContainer><TeacherPanel user={user} onLogout={handleLogout} /></ViewContainer>;
    }
    return <ViewContainer><StudentGame user={user} onLogout={handleLogout} /></ViewContainer>;
  }

  // --- Auth Screen (Login/Register) ---
  return (
    <div className="h-screen w-full flex items-center justify-center p-4 bg-[url('https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center relative overflow-hidden">
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"></div>

      {/* Scrollable wrapper for small screens if content overflows vertically */}
      <div className="relative z-10 w-full h-full flex items-center justify-center overflow-y-auto">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-700 p-6 rounded-2xl shadow-2xl shadow-purple-900/50 my-auto">
          <div className="text-center mb-6">
            <div className="inline-block p-3 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 mb-4 shadow-lg shadow-purple-500/50">
              <Rocket size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold text-white mb-1">Math Mystery</h1>
            <p className="text-indigo-300 text-sm">El Misterio del Universo Matemático</p>
          </div>

          {/* Tabs */}
          <div className="flex mb-6 bg-slate-800 rounded-lg p-1">
            <button 
              onClick={() => { setIsLogin(true); setAuthError(''); setAuthSuccess(''); }}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${isLogin ? 'bg-slate-700 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Iniciar Sesión
            </button>
            <button 
              onClick={() => { setIsLogin(false); setAuthError(''); setAuthSuccess(''); }}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${!isLogin ? 'bg-slate-700 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Registrarse
            </button>
          </div>

          {/* Messages */}
          {authError && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-500/50 rounded text-red-200 text-sm text-center">
              {authError}
            </div>
          )}
          {authSuccess && (
            <div className="mb-4 p-3 bg-green-900/50 border border-green-500/50 rounded text-green-200 text-sm text-center animate-pulse">
              {authSuccess}
            </div>
          )}

          <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-3">
            {!isLogin && (
              <>
                  <InputField 
                    label="Nombre Completo" 
                    value={name} 
                    onChange={handleNameChange} 
                    placeholder="Ej. Juan Pérez"
                    required 
                    className="py-2"
                  />
                  <InputField 
                    label="Correo Electrónico" 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="correo@ejemplo.com"
                    required 
                    className="py-2"
                  />
                  <div className="mb-2">
                    <label className="block text-gray-300 text-sm font-bold mb-2 font-display">Perfil</label>
                    <div className="flex gap-4">
                      <label className="flex items-center cursor-pointer">
                          <input type="radio" checked={role === UserRole.STUDENT} onChange={() => setRole(UserRole.STUDENT)} className="mr-2 text-mystery-accent focus:ring-mystery-accent" />
                          <span className="text-sm">Estudiante</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                          <input type="radio" checked={role === UserRole.TEACHER} onChange={() => setRole(UserRole.TEACHER)} className="mr-2 text-mystery-accent focus:ring-mystery-accent" />
                          <span className="text-sm">Profesor</span>
                      </label>
                    </div>
                  </div>
              </>
            )}

            <div>
              <InputField 
                label="Usuario" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                placeholder="Usuario"
                required 
                className="py-2"
              />
            </div>

            <div className="relative">
              <InputField 
                label="Contraseña" 
                type={showPassword ? "text" : "password"}
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="••••••••"
                required 
                className="py-2"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <Button type="submit" isLoading={isSubmitting} className="w-full mt-4 py-2">
              {isLogin ? 'Entrar al Universo' : 'Crear Cuenta'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default App;