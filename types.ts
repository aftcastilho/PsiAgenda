export enum RecurrenceType {
  NONE = 'none',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly'
}

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show'
}

export enum PatientType {
  PRIVATE = 'private', // Particular
  INSURANCE = 'insurance' // Plano de Saúde
}

export interface Patient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  cpf?: string;
  address?: string;
  notes?: string;
  type: PatientType;
  createdAt: Date;
}

export interface Appointment {
  id: string;
  seriesId?: string; // Links recurring appointments together
  patientId: string;
  patientName: string; // Denormalized for display
  date: Date;
  startTime: string; // Format "HH:mm"
  durationMinutes: number;
  notes: string;
  recurrence: RecurrenceType;
  status: AppointmentStatus;
  patientType: PatientType;
}

export interface TimeSlot {
  time: string; // "08:00"
  label: string; // "08:00"
}

export const HOURS_START = 8;
export const HOURS_END = 19;