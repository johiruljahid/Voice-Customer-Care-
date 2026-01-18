export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isError?: boolean;
}

export interface Appointment {
  id: string;
  ticketNumber: string;
  patientName: string;
  doctorName: string;
  preferredTime: string;
  createdAt: string; // ISO String
  status: 'confirmed' | 'completed' | 'cancelled';
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
}