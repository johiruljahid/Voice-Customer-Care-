import React, { useState, useEffect } from 'react';
import { Appointment } from '../types';
import { getAppointments, updateAppointmentStatus, deleteAppointment } from '../utils/db';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Trash2,
  ChevronLeft,
  User
} from 'lucide-react';
import { format, parseISO, isToday } from 'date-fns';
import { clsx } from 'clsx';

export const AdminDashboard: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filterDoctor, setFilterDoctor] = useState('');
  const [filterDate, setFilterDate] = useState('');
  
  useEffect(() => {
    // Initial Load
    setAppointments(getAppointments());

    // Listen for storage events (real-time updates from Voice Assistant in another tab)
    const handleStorageChange = () => {
      setAppointments(getAppointments());
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleStatusUpdate = (id: string, status: Appointment['status']) => {
    updateAppointmentStatus(id, status);
    setAppointments(getAppointments());
  };

  const handleDelete = (id: string) => {
      if(confirm('Are you sure you want to delete this record?')) {
          deleteAppointment(id);
          setAppointments(getAppointments());
      }
  }

  // Derived Statistics
  const totalAppointments = appointments.length;
  const todayAppointments = appointments.filter(a => isToday(parseISO(a.createdAt))).length;
  const uniqueDoctors = new Set(appointments.map(a => a.doctorName)).size;

  // Filter Logic
  const filteredAppointments = appointments.filter(apt => {
    const matchesDoctor = apt.doctorName.toLowerCase().includes(filterDoctor.toLowerCase());
    const matchesDate = filterDate ? apt.createdAt.startsWith(filterDate) : true;
    return matchesDoctor && matchesDate;
  });

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md z-10 hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 text-hospital-600 font-bold text-xl">
             <LayoutDashboard /> Admin Panel
          </div>
          <p className="text-xs text-gray-400 mt-1">Popular Diagnostic Center</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <div className="flex items-center gap-3 px-4 py-3 bg-hospital-50 text-hospital-700 rounded-lg cursor-pointer font-medium">
            <Calendar size={20} /> Appointments
          </div>
          <div className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
            <Users size={20} /> Doctors
          </div>
          <Link to="/" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors mt-8">
            <ChevronLeft size={20} /> Back to Assistant
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-100">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                 <User size={20} />
              </div>
              <div>
                 <p className="text-sm font-semibold text-gray-800">Admin User</p>
                 <p className="text-xs text-green-500">Online</p>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800">Appointment Management</h1>
            <div className="flex gap-4">
               <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3 pr-6">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Calendar size={20} /></div>
                  <div>
                    <p className="text-xs text-gray-500">Today</p>
                    <p className="text-lg font-bold text-gray-800">{todayAppointments}</p>
                  </div>
               </div>
               <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3 pr-6">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Users size={20} /></div>
                  <div>
                    <p className="text-xs text-gray-500">Doctors</p>
                    <p className="text-lg font-bold text-gray-800">{uniqueDoctors}</p>
                  </div>
               </div>
               <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3 pr-6">
                  <div className="p-2 bg-green-50 text-green-600 rounded-lg"><CheckCircle size={20} /></div>
                  <div>
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="text-lg font-bold text-gray-800">{totalAppointments}</p>
                  </div>
               </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2 text-gray-500">
              <Filter size={18} /> <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search Doctor..." 
                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hospital-500"
                value={filterDoctor}
                onChange={(e) => setFilterDoctor(e.target.value)}
              />
            </div>

            <input 
              type="date" 
              className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hospital-500"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
            
            <button 
                onClick={() => { setFilterDate(''); setFilterDoctor(''); }}
                className="text-sm text-red-500 hover:text-red-700 underline"
            >
                Clear
            </button>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">Time / Date</th>
                  <th className="p-4 font-semibold">Ticket</th>
                  <th className="p-4 font-semibold">Patient Name</th>
                  <th className="p-4 font-semibold">Doctor</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAppointments.length === 0 ? (
                    <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-400">
                            No appointments found.
                        </td>
                    </tr>
                ) : (
                    filteredAppointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                        <div className="flex flex-col">
                            <span className="font-medium text-gray-800">{apt.preferredTime}</span>
                            <span className="text-xs text-gray-400">{format(parseISO(apt.createdAt), 'MMM dd, yyyy')}</span>
                        </div>
                        </td>
                        <td className="p-4">
                            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded border border-gray-200">{apt.ticketNumber}</span>
                        </td>
                        <td className="p-4 font-medium text-gray-800">{apt.patientName}</td>
                        <td className="p-4 text-gray-600">{apt.doctorName}</td>
                        <td className="p-4">
                        <span className={clsx(
                            "px-2.5 py-0.5 rounded-full text-xs font-medium border",
                            apt.status === 'confirmed' && "bg-blue-50 text-blue-700 border-blue-100",
                            apt.status === 'completed' && "bg-green-50 text-green-700 border-green-100",
                            apt.status === 'cancelled' && "bg-red-50 text-red-700 border-red-100",
                        )}>
                            {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                        </span>
                        </td>
                        <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                            {apt.status !== 'completed' && (
                                <button 
                                    onClick={() => handleStatusUpdate(apt.id, 'completed')}
                                    title="Mark Completed"
                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                                >
                                <CheckCircle size={18} />
                                </button>
                            )}
                            {apt.status !== 'cancelled' && (
                                <button 
                                    onClick={() => handleStatusUpdate(apt.id, 'cancelled')}
                                    title="Cancel"
                                    className="p-1.5 text-orange-600 hover:bg-orange-50 rounded"
                                >
                                <XCircle size={18} />
                                </button>
                            )}
                            <button 
                                onClick={() => handleDelete(apt.id)}
                                title="Delete"
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            >
                            <Trash2 size={18} />
                            </button>
                        </div>
                        </td>
                    </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};