import React, { useState, useEffect } from 'react';
import { X, Sparkles, Calendar, Clock, Repeat, User, Trash2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Appointment, AppointmentStatus, RecurrenceType, Patient } from '../types';
import { refinePatientNotes } from '../services/geminiService';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointment: Partial<Appointment>) => void;
  onDelete: (id: string, mode: 'single' | 'series') => void;
  initialDate?: Date;
  initialTime?: string;
  existingAppointment?: Appointment | null;
  patients: Patient[]; // List of existing patients to select from
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialDate,
  initialTime,
  existingAppointment,
  patients
}) => {
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState(''); // Fallback if manually typing
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(50);
  const [notes, setNotes] = useState('');
  const [recurrence, setRecurrence] = useState<RecurrenceType>(RecurrenceType.NONE);
  const [isRefining, setIsRefining] = useState(false);
  
  // State for delete confirmation view
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowDeleteOptions(false); // Reset UI state on open
      if (existingAppointment) {
        setPatientId(existingAppointment.patientId);
        setPatientName(existingAppointment.patientName);
        setDate(existingAppointment.date.toISOString().split('T')[0]);
        setTime(existingAppointment.startTime);
        setDuration(existingAppointment.durationMinutes);
        setNotes(existingAppointment.notes);
        setRecurrence(existingAppointment.recurrence);
      } else {
        setPatientId('');
        setPatientName('');
        setDate(initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
        setTime(initialTime || '09:00');
        setDuration(50);
        setNotes('');
        setRecurrence(RecurrenceType.NONE);
      }
    }
  }, [isOpen, existingAppointment, initialDate, initialTime]);

  const handleSave = () => {
    if ((!patientId && !patientName) || !date || !time) return;

    // Find name if ID selected
    const selectedPatient = patients.find(p => p.id === patientId);
    const finalName = selectedPatient ? selectedPatient.name : patientName;

    const appointmentData: Partial<Appointment> = {
      id: existingAppointment?.id,
      patientId: patientId || Math.random().toString(36).substr(2, 9),
      patientName: finalName,
      date: new Date(date + 'T00:00:00'),
      startTime: time,
      durationMinutes: duration,
      notes,
      recurrence,
      status: existingAppointment?.status || AppointmentStatus.SCHEDULED,
      seriesId: existingAppointment?.seriesId
      // Color/Type will be handled in App.tsx based on the patient
    };

    onSave(appointmentData);
    onClose();
  };

  const handleInitialDeleteClick = () => {
    if (existingAppointment) {
      if (existingAppointment.recurrence !== RecurrenceType.NONE || existingAppointment.seriesId) {
        // Show options for recurring
        setShowDeleteOptions(true);
      } else {
        // Direct delete for single
        if (confirm('Tem certeza que deseja excluir esta consulta?')) {
            onDelete(existingAppointment.id, 'single');
            onClose();
        }
      }
    }
  };

  const confirmDelete = (mode: 'single' | 'series') => {
    if (existingAppointment) {
      onDelete(existingAppointment.id, mode);
      onClose();
    }
  };

  const handleRefineNotes = async () => {
    if (!notes.trim()) return;
    setIsRefining(true);
    const selectedPatient = patients.find(p => p.id === patientId);
    const nameToUse = selectedPatient ? selectedPatient.name : patientName;
    const refined = await refinePatientNotes(notes, nameToUse);
    setNotes(refined);
    setIsRefining(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
        
        {/* VIEW: DELETE OPTIONS */}
        {showDeleteOptions ? (
           <div className="p-6 space-y-4">
             <div className="flex items-center gap-3 text-red-600 mb-2">
               <AlertTriangle size={24} />
               <h3 className="text-lg font-bold">Excluir Recorrência</h3>
             </div>
             <p className="text-slate-600">
               Esta é uma consulta recorrente. O que você deseja excluir?
             </p>
             
             <button 
               onClick={() => confirmDelete('single')}
               className="w-full flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-red-300 hover:bg-red-50 transition-all group text-left"
             >
               <div>
                 <span className="block font-semibold text-slate-800 group-hover:text-red-700">Apenas esta consulta</span>
                 <span className="text-xs text-slate-500">Exclui apenas o agendamento de {new Date(date + 'T00:00:00').toLocaleDateString()}.</span>
               </div>
               <ArrowRight size={18} className="text-slate-300 group-hover:text-red-500" />
             </button>

             <button 
                onClick={() => confirmDelete('series')}
                className="w-full flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-red-300 hover:bg-red-50 transition-all group text-left"
             >
               <div>
                 <span className="block font-semibold text-slate-800 group-hover:text-red-700">Esta e todas as futuras</span>
                 <span className="text-xs text-slate-500">Exclui este agendamento e todos os próximos da série.</span>
               </div>
               <ArrowRight size={18} className="text-slate-300 group-hover:text-red-500" />
             </button>

             <button 
               onClick={() => setShowDeleteOptions(false)}
               className="w-full py-2 text-center text-slate-500 hover:text-slate-700 text-sm font-medium mt-2"
             >
               Cancelar
             </button>
           </div>
        ) : (
          /* VIEW: NORMAL FORM */
          <>
            {/* Header */}
            <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center text-white flex-shrink-0">
              <h2 className="text-xl font-semibold">
                {existingAppointment ? 'Editar Consulta' : 'Novo Agendamento'}
              </h2>
              <button onClick={onClose} className="hover:bg-indigo-700 p-1 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Patient Selection */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700 flex items-center gap-2">
                  <User size={16} /> Paciente
                </label>
                {patients.length > 0 ? (
                  <div className="relative">
                    <select
                      value={patientId}
                      onChange={(e) => {
                        setPatientId(e.target.value);
                        const p = patients.find(p => p.id === e.target.value);
                        if (p) setPatientName(p.name);
                      }}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                    >
                      <option value="">Selecione um paciente...</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                      <option value="new">+ Novo paciente (Temporário)</option>
                    </select>
                  </div>
                ) : null}
                
                {/* Fallback or manual entry if 'new' or no patients */}
                {(!patients.length || patientId === 'new' || (existingAppointment && !patients.find(p => p.id === existingAppointment.patientId))) && (
                  <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Nome do Paciente"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all mt-2 bg-white"
                />
                )}
              </div>

              {/* Date & Time Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Calendar size={16} /> Data
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Clock size={16} /> Horário
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  />
                </div>
              </div>

              {/* Recurrence & Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Repeat size={16} /> Repetição
                  </label>
                  <select
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value={RecurrenceType.NONE}>Não repete</option>
                    <option value={RecurrenceType.WEEKLY}>Semanalmente</option>
                    <option value={RecurrenceType.BIWEEKLY}>Quinzenalmente</option>
                    <option value={RecurrenceType.MONTHLY}>Mensalmente</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Duração (min)</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value={30}>30 min</option>
                    <option value={50}>50 min (Padrão)</option>
                    <option value={60}>60 min</option>
                    <option value={90}>90 min</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-slate-700">Anotações / Observações</label>
                  <button
                    onClick={handleRefineNotes}
                    disabled={isRefining || !notes.trim()}
                    className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50 transition-colors"
                    type="button"
                  >
                    <Sparkles size={12} />
                    {isRefining ? 'Refinando...' : 'Refinar com IA'}
                  </button>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Digite observações sobre o paciente..."
                  rows={5}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none text-sm bg-white text-slate-900"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-4 flex justify-between gap-3 border-t border-slate-200 flex-shrink-0">
              <div>
                {existingAppointment && (
                  <button
                    onClick={handleInitialDeleteClick}
                    className="px-4 py-2 rounded-lg text-red-600 font-medium hover:bg-red-50 transition-colors flex items-center gap-2"
                    title="Excluir Consulta"
                  >
                    <Trash2 size={18} /> <span className="hidden sm:inline">Excluir</span>
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-slate-600 font-medium hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={(!patientName && !patientId) || !date || !time}
                  className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-md hover:shadow-lg"
                >
                  Salvar
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AppointmentModal;