import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { MockFirebase } from './services/mockFirebase';
import { StudentGame } from './components/StudentGame';
import { TeacherPanel } from './components/TeacherPanel';
import { AdminPanel } from './components/AdminPanel';
import { InputField } from './components/InputField';
import { Button } from './components/Button';
import { Eye, EyeOff, Rocket, ShieldCheck, GraduationCap } from 'lucide-react';

// Container for authenticated views with Vivid Futuristic Background
const ViewContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="h-full w-full overflow-hidden bg-[url('https://images.unsplash.com/photo-1535295972055-1c762f4483e5?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center relative">
    {/* Darker overlay for better text contrast against vivid background */}
    <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-[3px]"></div>
    <div className="relative z-10 h-full w-full animate-fade-in">
        {children}
    </div>
  </div>
);

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Auth State
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check session on mount
    const checkSession = () => {
        const currentUser = MockFirebase.getCurrentUser();
        if (currentUser) {
            setUser(currentUser);
        }
        setLoading(false);
    };
    checkSession();
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

    if (!username || !password || !name || !email) {
        setAuthError('Todos los campos son obligatorios');
        setIsSubmitting(false);
        return;
    }

    try {
        const newUser = await MockFirebase.register({
            name,
            username,
            email,
            password,
            role
        });
        setUser(newUser);
        setAuthSuccess('Cuenta creada exitosamente');
    } catch (err: any) {
        setAuthError(err.message || 'Error al registrarse');
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

  if (loading) {
      return <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white">Cargando...</div>;
  }

  if (user) {
      return (
          <ViewContainer>
              {user.role === UserRole.STUDENT && <StudentGame user={user} onLogout={handleLogout} />}
              {user.role === UserRole.TEACHER && <TeacherPanel user={user} onLogout={handleLogout} />}
              {user.role === UserRole.ADMIN && <AdminPanel onLogout={handleLogout} />}
          </ViewContainer>
      );
  }

  return (
      <div className="min-h-screen w-full bg-[url('https://images.unsplash.com/photo-1535295972055-1c762f4483e5?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center flex items-center justify-center p-4 relative overflow-hidden">
          {/* Background Overlay */}
          <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-sm"></div>

          {/* Background Elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
              <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse-slow"></div>
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
          </div>

          <div className="w-full max-w-md bg-slate-800/90 p-8 rounded-2xl shadow-2xl border border-slate-700 relative z-10 backdrop-blur-md animate-slide-up">
              <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 mb-4 shadow-lg shadow-purple-500/30">
                      <Rocket className="text-white" size={32} />
                  </div>
                  <h1 className="text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                      Math Mystery
                  </h1>
                  <p className="text-gray-400 mt-2">
                      {isLogin ? 'Ingresa para continuar tu aventura' : 'Crea tu cuenta y comienza el viaje'}
                  </p>
              </div>

              {authError && (
                  <div className="bg-red-900/30 border border-red-500 text-red-200 p-3 rounded-lg mb-6 text-sm text-center animate-fade-in">
                      {authError}
                  </div>
              )}
               {authSuccess && (
                  <div className="bg-green-900/30 border border-green-500 text-green-200 p-3 rounded-lg mb-6 text-sm text-center animate-fade-in">
                      {authSuccess}
                  </div>
              )}

              <form onSubmit={isLogin ? handleLogin : handleRegister} className="animate-fade-in">
                  {!isLogin && (
                      <>
                        <InputField 
                            label="Nombre Completo" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            placeholder="Ej. Juan Pérez"
                        />
                        <InputField 
                            label="Correo Electrónico" 
                            type="email"
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            placeholder="juan@ejemplo.com"
                        />
                         <div className="mb-4">
                            <label className="block text-gray-300 text-sm font-bold mb-2 font-display">Rol</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button 
                                    type="button"
                                    onClick={() => setRole(UserRole.STUDENT)}
                                    className={`p-2 rounded border flex items-center justify-center gap-2 transition-all ${role === UserRole.STUDENT ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-700 border-slate-600 text-gray-400 hover:bg-slate-600'}`}
                                >
                                    <GraduationCap size={16} /> Estudiante
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setRole(UserRole.TEACHER)}
                                    className={`p-2 rounded border flex items-center justify-center gap-2 transition-all ${role === UserRole.TEACHER ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-700 border-slate-600 text-gray-400 hover:bg-slate-600'}`}
                                >
                                    <ShieldCheck size={16} /> Profesor
                                </button>
                            </div>
                        </div>
                      </>
                  )}

                  <InputField 
                      label="Usuario" 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)} 
                      placeholder="Nombre de usuario"
                  />

                  <div className="mb-6 relative">
                      <InputField 
                          label="Contraseña" 
                          type={showPassword ? "text" : "password"}
                          value={password} 
                          onChange={(e) => setPassword(e.target.value)} 
                          placeholder="••••••••"
                      />
                      <button 
                        type="button"
                        className="absolute right-3 top-[38px] text-gray-400 hover:text-white"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                  </div>

                  <Button className="w-full" type="submit" isLoading={isSubmitting}>
                      {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
                  </Button>
              </form>

              <div className="mt-6 text-center">
                  <button 
                      onClick={() => {
                          setIsLogin(!isLogin);
                          setAuthError('');
                          setAuthSuccess('');
                      }}
                      className="text-sm text-indigo-400 hover:text-indigo-300 underline transition-colors"
                  >
                      {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia Sesión'}
                  </button>
              </div>
          </div>
      </div>
  );
};