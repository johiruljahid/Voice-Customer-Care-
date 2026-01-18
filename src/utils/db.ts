import { User, DailyRoutine } from '../types';

const USERS_KEY = 'maya_users';
const ROUTINES_KEY = 'maya_routines';
const SESSION_KEY = 'maya_session';

// --- Auth System ---
export const loginUser = (name: string, pin: string): User | null => {
  const usersStr = localStorage.getItem(USERS_KEY);
  const users: User[] = usersStr ? JSON.parse(usersStr) : [];
  
  const user = users.find(u => u.name.toLowerCase() === name.toLowerCase() && u.pin === pin);
  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  }
  return null;
};

export const registerUser = (name: string, pin: string): User => {
  const usersStr = localStorage.getItem(USERS_KEY);
  const users: User[] = usersStr ? JSON.parse(usersStr) : [];
  
  const existing = users.find(u => u.name.toLowerCase() === name.toLowerCase());
  if (existing) throw new Error("User already exists!");

  const newUser: User = {
    id: crypto.randomUUID(),
    name,
    pin,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
  return newUser;
};

export const getCurrentUser = (): User | null => {
  const session = localStorage.getItem(SESSION_KEY);
  return session ? JSON.parse(session) : null;
};

export const logoutUser = () => {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = '/login';
};

// --- Routine System ---
export const saveRoutine = (routine: DailyRoutine) => {
  const routinesStr = localStorage.getItem(ROUTINES_KEY);
  const routines: DailyRoutine[] = routinesStr ? JSON.parse(routinesStr) : [];
  
  const updated = [routine, ...routines];
  localStorage.setItem(ROUTINES_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('storage'));
};

export const getUserRoutines = (userId: string): DailyRoutine[] => {
  const routinesStr = localStorage.getItem(ROUTINES_KEY);
  const routines: DailyRoutine[] = routinesStr ? JSON.parse(routinesStr) : [];
  return routines.filter(r => r.userId === userId);
};

export const deleteRoutine = (id: string) => {
    const routinesStr = localStorage.getItem(ROUTINES_KEY);
    const routines: DailyRoutine[] = routinesStr ? JSON.parse(routinesStr) : [];
    const updated = routines.filter(r => r.id !== id);
    localStorage.setItem(ROUTINES_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
}