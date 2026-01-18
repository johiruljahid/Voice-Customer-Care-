import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === 'Mishela') { // Updated PIN
      navigate('/admin/dashboard');
    } else {
      setError('Invalid PIN. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-hospital-50 rounded-full text-hospital-600">
            <Lock size={32} />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Admin Access</h2>
        <p className="text-center text-gray-500 mb-8">Enter PIN to access appointment dashboard</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-hospital-500 text-center text-2xl tracking-widest"
              placeholder="•••••••"
              autoFocus
            />
          </div>
          
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            className="w-full py-3 bg-hospital-600 text-white rounded-lg font-semibold hover:bg-hospital-700 transition-colors"
          >
            Login
          </button>
          
          <div className="text-center mt-4">
             <a href="/" className="text-sm text-gray-400 hover:text-hospital-600">Back to Assistant</a>
          </div>
        </form>
      </div>
    </div>
  );
};