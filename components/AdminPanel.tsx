import React, { useEffect, useState } from 'react';
import { MockFirebase } from '../services/mockFirebase';
import { User } from '../types';
import { Button } from './Button';
import { Trash2 } from 'lucide-react';

interface AdminPanelProps {
    onLogout: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
    const [users, setUsers] = useState<User[]>([]);

    const loadUsers = () => {
        // Fetch latest users from storage
        setUsers(MockFirebase.getAllUsers());
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Estás seguro de eliminar este usuario permanentemente?')) {
            try {
                // Optimistic update: Remove from UI immediately
                setUsers(prevUsers => prevUsers.filter(u => u.id !== id));
                
                // Perform actual deletion
                await MockFirebase.deleteUser(id);
                
                // Reload to ensure sync (optional given the optimistic update, but good for consistency)
                loadUsers();
            } catch (error) {
                console.error("Error al eliminar:", error);
                alert("Hubo un problema al eliminar el usuario.");
                loadUsers(); // Revert UI if failed
            }
        }
    };

    return (
        <div className="h-full w-full flex flex-col p-4 md:p-6 overflow-hidden">
            <div className="flex-shrink-0 flex justify-between items-center mb-6 gap-4">
                <h1 className="text-2xl md:text-3xl font-display text-red-400">Panel de Administrador</h1>
                <Button variant="secondary" onClick={onLogout} className="text-sm py-2 px-4">Cerrar Sesión</Button>
            </div>

            <div className="flex-1 flex flex-col bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden min-h-0">
                 <div className="flex-shrink-0 p-4 border-b border-slate-700 bg-slate-900/50">
                    <h2 className="font-bold text-gray-300">Gestión de Usuarios del Sistema</h2>
                 </div>
                 
                 <div className="flex-1 overflow-auto">
                    <table className="w-full text-left min-w-[600px] border-collapse">
                        <thead className="sticky top-0 bg-slate-900 text-gray-400 text-xs uppercase z-10">
                            <tr>
                                <th className="p-4">ID</th>
                                <th className="p-4">Usuario</th>
                                <th className="p-4">Rol</th>
                                <th className="p-4">Email</th>
                                <th className="p-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700 text-sm">
                            {users.length > 0 ? (
                                users.map(user => (
                                    <tr key={user.id} className="hover:bg-slate-700/50">
                                        <td className="p-4 font-mono text-xs text-gray-500">{user.id.substring(0, 8)}...</td>
                                        <td className="p-4 font-bold">{user.username}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                                user.role === 'admin' ? 'bg-red-900 text-red-200' :
                                                user.role === 'teacher' ? 'bg-yellow-900 text-yellow-200' :
                                                'bg-blue-900 text-blue-200'
                                            }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-400">{user.email}</td>
                                        <td className="p-4 text-right">
                                            {user.username !== 'Admin' && (
                                                <button 
                                                    type="button"
                                                    onClick={() => handleDelete(user.id)}
                                                    className="text-red-500 hover:text-red-400 p-2 rounded hover:bg-red-900/20 transition-colors"
                                                    title="Eliminar Usuario"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">
                                        No hay usuarios registrados en el sistema (aparte del Administrador).
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                 </div>
            </div>
        </div>
    );
};