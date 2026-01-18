import { Appointment } from '../types';

const STORAGE_KEY = 'pop_diag_appointments';

export const getAppointments = (): Appointment[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to load appointments", error);
    return [];
  }
};

export const saveAppointment = (appointment: Appointment) => {
  const appointments = getAppointments();
  // Add new appointment to the beginning
  const updated = [appointment, ...appointments];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  // Dispatch event for real-time updates across tabs/components
  window.dispatchEvent(new Event('storage'));
};

export const updateAppointmentStatus = (id: string, status: Appointment['status']) => {
  const appointments = getAppointments();
  const updated = appointments.map(apt => 
    apt.id === id ? { ...apt, status } : apt
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('storage'));
};

export const deleteAppointment = (id: string) => {
    const appointments = getAppointments();
    const updated = appointments.filter(apt => apt.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
}