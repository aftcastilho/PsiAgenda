import React, { useState, useEffect } from 'react';
import { Plus, Users, Calendar as CalendarIcon, LogOut, FileText } from 'lucide-react';
import { addWeeks, addMonths } from 'date-fns';
import CalendarGrid from './components/CalendarGrid';
import PatientsList from './components/PatientsList';
import ReportsView from './components/ReportsView';
import AppointmentModal from './components/AppointmentModal';
import PatientModal from './components/PatientModal';
import { Appointment, RecurrenceType, AppointmentStatus, Patient, PatientType } from './types';
import { getLacanianInsight } from './services/geminiService';

type ViewType = 'calendar' | 'patients' | 'reports';

// Custom SVG Logo for "Psi (Ψ) + Alpha (α)"
const PsiLogo = () => (
  <svg width="45" height="45" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Background circle hint (optional, kept minimal) */}
    {/* Psi (Ψ) - Uppercase Serif */}
    <text x="10" y="75" fontFamily="serif" fontSize="70" fill="white" fontWeight="bold">Ψ</text>
    {/* Alpha (α) - Lowercase Serif */}
    <text x="65" y="75" fontFamily="serif" fontSize="55" fill="rgba(255,255,255,0.8)" fontWeight="normal">α</text>
  </svg>
);

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  
  // Modals
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);

  // Selections
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  
  const [lacanianInsight, setLacanianInsight] = useState<string>("Carregando pílula de saber...");
  const [currentView, setCurrentView] = useState<ViewType>('calendar');

  // Initialize Data
  useEffect(() => {
    const today = new Date();
    
    // Initial Patients
    const initialPatients: Patient[] = [
      { id: 'p1', name: 'Mariana Souza', phone: '(11) 99999-1111', createdAt: new Date(), type: PatientType.PRIVATE },
      { id: 'p2', name: 'Carlos Oliveira', phone: '(11) 99999-2222', createdAt: new Date(), type: PatientType.INSURANCE }
    ];
    setPatients(initialPatients);

    // Initial Appointments
    const seriesId1 = 'series-1';
    const mockAppointments: Appointment[] = [
      {
        id: '1',
        seriesId: seriesId1,
        patientId: 'p1',
        patientName: 'Mariana Souza',
        date: today,
        startTime: '10:00',
        durationMinutes: 50,
        notes: 'Sessão 1: Paciente traz demanda sobre ansiedade no trabalho.',
        recurrence: RecurrenceType.WEEKLY,
        status: AppointmentStatus.SCHEDULED,
        patientType: PatientType.PRIVATE
      },
      {
        id: '1-2',
        seriesId: seriesId1,
        patientId: 'p1',
        patientName: 'Mariana Souza',
        date: addWeeks(today, 1),
        startTime: '10:00',
        durationMinutes: 50,
        notes: 'Sessão 2: Relato de sonho envolvendo figura paterna.',
        recurrence: RecurrenceType.WEEKLY,
        status: AppointmentStatus.SCHEDULED,
        patientType: PatientType.PRIVATE
      },
      {
        id: '2',
        seriesId: 'series-2',
        patientId: 'p2',
        patientName: 'Carlos Oliveira',
        date: addWeeks(today, 0), 
        startTime: '14:00',
        durationMinutes: 50,
        notes: 'Primeira entrevista. Queixa de insônia.',
        recurrence: RecurrenceType.NONE,
        status: AppointmentStatus.SCHEDULED,
        patientType: PatientType.INSURANCE
      }
    ];
    setAppointments(mockAppointments);

    // Initial fetch
    fetchInsight();
    
    // Interval for Insight (5 minutes to keep it fresh but not too frantic)
    const interval = setInterval(fetchInsight, 300000); 
    return () => clearInterval(interval);
  }, []);

  const fetchInsight = async () => {
    const text = await getLacanianInsight();
    setLacanianInsight(text);
  };

  const handleSaveAppointment = (aptData: Partial<Appointment>) => {
    let newAppointments: Appointment[] = [];
    
    // Determine patient type for coloring
    let patientType = PatientType.PRIVATE;
    const patient = patients.find(p => p.id === aptData.patientId);
    if (patient) {
      patientType = patient.type;
    }

    // Generate a series ID if it's a new recurring appointment or doesn't have one
    const seriesId = aptData.seriesId || (aptData.recurrence !== RecurrenceType.NONE ? Math.random().toString(36).substr(2, 9) : undefined);

    const baseApt: Appointment = {
      id: aptData.id || Math.random().toString(36).substr(2, 9),
      seriesId: seriesId,
      patientId: aptData.patientId!,
      patientName: aptData.patientName!,
      date: aptData.date!,
      startTime: aptData.startTime!,
      durationMinutes: aptData.durationMinutes!,
      notes: aptData.notes || '',
      recurrence: aptData.recurrence || RecurrenceType.NONE,
      status: aptData.status || AppointmentStatus.SCHEDULED,
      patientType: patientType
    };

    newAppointments.push(baseApt);

    // Ensure patient exists in our list if it was a temporary "new" or typed name
    if (!patient) {
      const newP: Patient = {
        id: baseApt.patientId,
        name: baseApt.patientName,
        createdAt: new Date(),
        type: PatientType.PRIVATE // Default for ad-hoc
      };
      setPatients(prev => [...prev, newP]);
    }

    // Handle creation of Recurring Appointments (Only if it's a NEW appointment or creating a NEW series)
    // If editing, we currently treat it as editing the single instance unless complex logic is added.
    // For this MVP, we will only generate future slots if it's a new insertion.
    if (!aptData.id && baseApt.recurrence !== RecurrenceType.NONE) {
      const occurrences = 12; // Generate 12 sessions ahead
      for (let i = 1; i < occurrences; i++) {
        let nextDate = new Date(baseApt.date);
        if (baseApt.recurrence === RecurrenceType.WEEKLY) nextDate = addWeeks(baseApt.date, i);
        else if (baseApt.recurrence === RecurrenceType.BIWEEKLY) nextDate = addWeeks(baseApt.date, i * 2);
        else if (baseApt.recurrence === RecurrenceType.MONTHLY) nextDate = addMonths(baseApt.date, i);

        newAppointments.push({
          ...baseApt,
          id: Math.random().toString(36).substr(2, 9),
          date: nextDate,
          recurrence: baseApt.recurrence, 
        });
      }
    }

    if (editingAppointment) {
       // If editing, we update the specific appointment
       // NOTE: A more complex app would ask "Update this or all?", but for simplicity we update this one instance.
       setAppointments(prev => prev.map(a => a.id === baseApt.id ? baseApt : a));
    } else {
       setAppointments(prev => [...prev, ...newAppointments]);
    }
  };

  const handleDeleteAppointment = (id: string, mode: 'single' | 'series' = 'single') => {
    if (mode === 'single') {
      setAppointments(prev => prev.filter(a => a.id !== id));
    } else {
      // Find the reference appointment
      const referenceApt = appointments.find(a => a.id === id);
      if (!referenceApt || !referenceApt.seriesId) {
        // Fallback to single delete if no series found
        setAppointments(prev => prev.filter(a => a.id !== id));
        return;
      }

      // Delete this and all future appointments with same seriesId
      setAppointments(prev => prev.filter(a => {
        // Keep if it's a different series
        if (a.seriesId !== referenceApt.seriesId) return true;
        
        // If same series, keep only if it is historically BEFORE the selected one
        // (i.e., delete the selected one and everything after it)
        return new Date(a.date) < new Date(referenceApt.date) && a.id !== id;
      }));
    }
  };

  const handleSavePatient = (patientData: Partial<Patient>) => {
    const newPatient: Patient = {
      id: patientData.id || Math.random().toString(36).substr(2, 9),
      name: patientData.name!,
      email: patientData.email,
      phone: patientData.phone,
      cpf: patientData.cpf,
      address: patientData.address,
      notes: patientData.notes,
      type: patientData.type || PatientType.PRIVATE,
      createdAt: patientData.createdAt || new Date()
    };

    setPatients(prev => {
      if (patientData.id) {
        // Update existing
        return prev.map(p => p.id === patientData.id ? newPatient : p);
      }
      return [...prev, newPatient];
    });

    // Update appointments color if patient type changed
    if (patientData.id) {
      setAppointments(prev => prev.map(a => {
        if (a.patientId === patientData.id) {
          return { ...a, patientType: newPatient.type };
        }
        return a;
      }));
    }
  };

  const handleDeletePatient = (id: string) => {
    // 1. Delete the patient
    setPatients(prev => prev.filter(p => p.id !== id));
    
    // 2. Cascade delete: Remove all appointments for this patient
    setAppointments(prev => prev.filter(a => a.patientId !== id));
  };

  const handleSlotClick = (date: Date, time: string) => {
    setEditingAppointment(null);
    setSelectedDate(date);
    setSelectedTime(time);
    setIsAppointmentModalOpen(true);
  };

  const handleAppointmentClick = (apt: Appointment) => {
    setEditingAppointment(apt);
    setIsAppointmentModalOpen(true);
  };

  const getPageTitle = () => {
    switch(currentView) {
      case 'calendar': return 'Visão Geral';
      case 'patients': return 'Gerenciar Pacientes';
      case 'reports': return 'Relatórios e Evolução';
      default: return 'PsiAgenda';
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex z-10">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-indigo-900">
          <div className="w-12 h-12 flex items-center justify-center shrink-0">
            <PsiLogo />
          </div>
          <div className="text-white overflow-hidden">
            <h1 className="font-bold text-lg leading-tight">PsiAgenda</h1>
            <p className="text-xs text-indigo-200 truncate">Dr. Arthur Castilho</p>
            <p className="text-[10px] text-indigo-300 font-mono mt-0.5">CRP 01/24909</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setCurrentView('calendar')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
              currentView === 'calendar' 
                ? 'bg-indigo-50 text-indigo-700' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <CalendarIcon size={20} />
            Agenda
          </button>
          <button 
            onClick={() => setCurrentView('patients')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
              currentView === 'patients' 
                ? 'bg-indigo-50 text-indigo-700' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Users size={20} />
            Pacientes
          </button>
          <button 
            onClick={() => setCurrentView('reports')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
              currentView === 'reports' 
                ? 'bg-indigo-50 text-indigo-700' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FileText size={20} />
            Relatórios
          </button>
        </nav>

        <div className="p-4">
           <div className="bg-gradient-to-br from-indigo-900 to-slate-800 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-2 opacity-10">
               <PsiLogo />
             </div>
             <div className="flex items-center gap-2 mb-2 opacity-90">
               <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">Insight & Estudo</span>
             </div>
             <div className="text-sm font-medium italic font-serif leading-relaxed h-32 overflow-y-auto pr-1 custom-scrollbar-dark">
               {lacanianInsight.split('\n').map((line, i) => (
                 <p key={i} className="mb-2 last:mb-0">{line}</p>
               ))}
             </div>
           </div>
        </div>
        
        <div className="p-4 border-t border-slate-100">
           <button className="flex items-center gap-2 text-slate-400 hover:text-red-500 text-sm font-medium transition-colors px-2">
             <LogOut size={16} /> Sair do sistema
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <div className="md:hidden bg-indigo-900 p-4 border-b border-indigo-800 flex justify-between items-center text-white">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 flex items-center justify-center">
                   <PsiLogo />
                </div>
                <div className="flex flex-col">
                   <span className="font-bold leading-none">PsiAgenda</span>
                   <span className="text-[10px] text-indigo-300">CRP 01/24909</span>
                </div>
             </div>
             <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentView('calendar')}
                  className={`p-2 rounded-lg ${currentView === 'calendar' ? 'bg-white/20' : 'text-indigo-200'}`}
                >
                  <CalendarIcon size={20} />
                </button>
                <button 
                  onClick={() => setCurrentView('patients')}
                  className={`p-2 rounded-lg ${currentView === 'patients' ? 'bg-white/20' : 'text-indigo-200'}`}
                >
                  <Users size={20} />
                </button>
                 <button 
                  onClick={() => setCurrentView('reports')}
                  className={`p-2 rounded-lg ${currentView === 'reports' ? 'bg-white/20' : 'text-indigo-200'}`}
                >
                  <FileText size={20} />
                </button>
             </div>
        </div>

        {/* Action Bar */}
        <div className="px-6 py-4 flex justify-between items-center bg-slate-50">
          <h2 className="text-2xl font-bold text-slate-800 hidden md:block">
            {getPageTitle()}
          </h2>
          {currentView !== 'reports' && (
            <button 
              onClick={() => {
                if (currentView === 'patients') {
                  setEditingPatient(null);
                  setIsPatientModalOpen(true);
                } else {
                  setEditingAppointment(null);
                  setSelectedDate(new Date());
                  setSelectedTime('09:00');
                  setIsAppointmentModalOpen(true);
                }
              }}
              className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-full font-medium shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all active:scale-95"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">
                {currentView === 'patients' ? 'Novo Paciente' : 'Novo Agendamento'}
              </span>
              <span className="sm:hidden">Novo</span>
            </button>
          )}
        </div>

        {/* Content Wrapper */}
        <div className="flex-1 px-4 pb-4 md:px-6 md:pb-6 overflow-hidden">
          {currentView === 'calendar' && (
            <CalendarGrid 
              currentDate={currentDate}
              appointments={appointments}
              onDateChange={setCurrentDate}
              onSlotClick={handleSlotClick}
              onAppointmentClick={handleAppointmentClick}
            />
          )}
          
          {currentView === 'patients' && (
            <PatientsList 
              patients={patients}
              appointments={appointments}
              onAddPatient={() => {
                setEditingPatient(null);
                setIsPatientModalOpen(true);
              }}
              onEditPatient={(patient) => {
                setEditingPatient(patient);
                setIsPatientModalOpen(true);
              }}
              onDeletePatient={handleDeletePatient}
            />
          )}

          {currentView === 'reports' && (
            <ReportsView
              patients={patients}
              appointments={appointments}
            />
          )}
        </div>
      </main>

      {/* Modals */}
      <AppointmentModal 
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        onSave={handleSaveAppointment}
        onDelete={handleDeleteAppointment}
        initialDate={selectedDate}
        initialTime={selectedTime}
        existingAppointment={editingAppointment}
        patients={patients}
      />

      <PatientModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        onSave={handleSavePatient}
        existingPatient={editingPatient}
      />
    </div>
  );
};

export default App;