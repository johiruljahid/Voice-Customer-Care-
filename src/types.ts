export interface User {
  id: string;
  name: string;
  pin: string;
  createdAt: string;
}

export interface RoutineTask {
  time: string;
  activity: string;
}

export interface DailyRoutine {
  id: string;
  userId: string;
  title: string; // e.g., "Monday Productivity"
  tasks: RoutineTask[];
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}