import React, { useEffect, useState } from 'react';
import { MockFirebase } from '../services/mockFirebase';
import { User, UserRole } from '../types';
import { Button } from './Button';
import { Download, User as UserIcon, Edit, Trash2, Search } from 'lucide-react';

interface TeacherPanelProps {
    user: User;
    onLogout: () => void;
}

export const TeacherPanel: React.FC<TeacherPanelProps> = ({ user, onLogout }) => {
    const [students, setStudents] = useState<User[]>([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const allUsers = MockFirebase.getAllUsers();
        setStudents(allUsers.filter(u => u.role === UserRole.STUDENT));
    }, []);

    const handleDownloadExcel = () => {
        // Mock Excel download using CSV format
        const headers = ["ID,Nombre,Usuario,Correo,Puntaje,Nivel,Vidas"];
        const rows = students.map(s => 
            `${s.id},"${s.name}",${s.username},${s.email},${s.score || 0},${s.level || 1},${s.lives || 5}`
        );
        const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "reporte_estudiantes_math_mystery.csv"); // CSV opens in Excel
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredStudents = students.filter(s => 
        s.name.toLowerCase().includes(search.toLowerCase()) || 
        s.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="h-full w-full flex flex-col p-4 md:p-6 overflow-hidden">
            <div className="flex-shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-display text-white">Panel de Profesor</h1>
                    <p className="text-gray-400 text-sm">Bienvenido, {user.name}</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button onClick={handleDownloadExcel} variant="success" className="flex items-center gap-2 flex-1 md:flex-none text-xs md:text-sm py-2 px-4">
                        <Download size={16} /> <span className="hidden sm:inline">Descargar Excel</span><span className="sm:hidden">Excel</span>
                    </Button>
                    <Button variant="secondary" onClick={onLogout} className="flex-1 md:flex-none text-xs md:text-sm py-2 px-4">Cerrar Sesión</Button>
                </div>
            </div>

            <div className="flex-1 flex flex-col bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg min-h-0">
                <div className="flex-shrink-0 p-4 border-b border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/50">
                    <h2 className="text-lg font-bold w-full sm:w-auto text-gray-200">Estudiantes Registrados</h2>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
                        <input 
                            type="text" 
                            placeholder="Buscar estudiante..." 
                            className="w-full pl-9 pr-4 py-2 bg-slate-900 rounded-lg border border-slate-600 text-sm focus:border-mystery-accent outline-none text-white placeholder-gray-600"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead className="sticky top-0 bg-slate-900 text-gray-400 text-xs uppercase z-10 shadow-sm">
                            <tr>
                                <th className="p-4">Estudiante</th>
                                <th className="p-4">Usuario</th>
                                <th className="p-4 text-center">Nivel</th>
                                <th className="p-4 text-center">Puntaje</th>
                                <th className="p-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700 text-sm">
                            {filteredStudents.length > 0 ? filteredStudents.map(student => (
                                <tr key={student.id} className="hover:bg-slate-700/50 transition-colors">
                                    <td className="p-4 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                                            <UserIcon size={14} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-white">{student.name}</div>
                                            <div className="text-xs text-gray-500">{student.email}</div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-300">{student.username}</td>
                                    <td className="p-4 text-center">
                                        <span className="bg-purple-900/50 text-purple-300 px-2 py-1 rounded text-xs font-bold">
                                            Lvl {student.level || 1}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center font-mono text-mystery-gold">
                                        {student.score || 0}
                                    </td>
                                    <td className="p-4 text-center">
                                        <button className="text-blue-400 hover:text-blue-300 mx-2 transition-colors" title="Editar (Simulado)">
                                            <Edit size={16} />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">
                                        No se encontraron estudiantes.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className="flex-shrink-0 grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                 <div className="bg-gradient-to-r from-blue-900/50 to-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                    <h3 className="text-gray-400 text-xs uppercase">Total Estudiantes</h3>
                    <p className="text-2xl font-bold text-white">{students.length}</p>
                 </div>
                 <div className="bg-gradient-to-r from-purple-900/50 to-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                    <h3 className="text-gray-400 text-xs uppercase">Promedio de Nivel</h3>
                    <p className="text-2xl font-bold text-white">
                        {students.length > 0 
                           ? (students.reduce((acc, curr) => acc + (curr.level || 1), 0) / students.length).toFixed(1) 
                           : 0}
                    </p>
                 </div>
            </div>
        </div>
    );
};