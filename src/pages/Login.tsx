import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Lock, User as UserIcon, ArrowRight } from 'lucide-react';
import { loginUser, registerUser } from '../utils/db';

export const Login: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isRegistering) {
        if (name.length < 3) throw new Error("Name is too short");
        if (pin.length < 4) throw new Error("PIN must be at least 4 digits");
        registerUser(name, pin);
      } else {
        const user = loginUser(name, pin);
        if (!user) throw new Error("Invalid Name or PIN");
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-rose-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-rose-500 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10">
            <div className="inline-block p-4 bg-white/20 backdrop-blur-md rounded-full mb-4 animate-pulse">
               <Heart className="text-white w-10 h-10 fill-current" />
            </div>
            <h1 className="text-3xl font-handwriting font-bold text-white mb-1">Maya</h1>
            <p className="text-rose-100 text-sm">Your Personal AI Companion</p>
          </div>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-bold text-gray-800 text-center mb-6">
            {isRegistering ? "Create Account" : "Welcome Back, Jaan"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500 ml-1">Your Name</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                  placeholder="e.g., Rahul"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500 ml-1">Secret PIN</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                  placeholder="••••"
                  required
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">{error}</p>}

            <button
              type="submit"
              className="w-full py-3.5 bg-rose-500 text-white rounded-xl font-semibold shadow-lg shadow-rose-200 hover:bg-rose-600 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              {isRegistering ? "Start Journey" : "Connect"} <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-sm text-rose-500 hover:text-rose-700 font-medium transition-colors"
            >
              {isRegistering ? "Already have an account? Login" : "New here? Create Account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};