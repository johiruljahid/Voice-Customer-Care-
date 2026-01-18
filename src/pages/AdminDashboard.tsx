import React, { useState, useEffect } from 'react';
import { DailyRoutine } from '../types';
import { getUserRoutines, deleteRoutine, getCurrentUser } from '../utils/db';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Trash2,
  ChevronLeft,
  Clock,
  Sparkles
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [routines, setRoutines] = useState<DailyRoutine[]>([]);
  const user = getCurrentUser();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!user) {
        navigate('/login');
        return;
    }
    setRoutines(getUserRoutines(user.id));

    const handleStorageChange = () => {
      setRoutines(getUserRoutines(user.id));
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user, navigate]);

  const handleDelete = (id: string) => {
      if(confirm('Delete this routine?')) {
          deleteRoutine(id);
      }
  }

  return (
    <div className="flex min-h-screen bg-rose-50 font-sans">
      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
          
          <div className="flex items-center justify-between mb-8">
             <div>
                <Link to="/" className="text-gray-500 hover:text-rose-600 flex items-center gap-1 mb-2 text-sm">
                    <ChevronLeft size={16} /> Back to Maya
                </Link>
                <h1 className="text-3xl font-bold text-gray-800">My Routines</h1>
                <p className="text-rose-600 font-medium">Plans created by Maya for you</p>
             </div>
             <div className="bg-white p-3 rounded-2xl shadow-sm border border-rose-100">
                <LayoutDashboard className="text-rose-400" />
             </div>
          </div>

          {routines.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-rose-200">
                <Sparkles className="w-12 h-12 text-rose-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600">No routines yet</h3>
                <p className="text-gray-400 text-sm mt-1">Ask Maya: "Make a daily routine for me"</p>
             </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {routines.map(routine => (
                    <div key={routine.id} className="bg-white rounded-2xl shadow-sm border border-rose-100 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="p-5 border-b border-rose-50 bg-rose-50/50 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="bg-white p-2 rounded-lg text-rose-500">
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">{routine.title}</h3>
                                    <p className="text-xs text-gray-400">{new Date(routine.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleDelete(routine.id)}
                                className="text-gray-300 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                        <div className="p-5">
                            <ul className="space-y-4">
                                {routine.tasks.map((task, idx) => (
                                    <li key={idx} className="flex gap-4 items-start group">
                                        <div className="w-16 pt-0.5 text-xs font-bold text-rose-400 text-right flex-shrink-0 flex items-center justify-end gap-1">
                                           <Clock size={10} /> {task.time}
                                        </div>
                                        <div className="flex-1 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg group-hover:bg-rose-50 transition-colors">
                                           {task.activity}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
             </div>
          )}
      </main>
    </div>
  );
};