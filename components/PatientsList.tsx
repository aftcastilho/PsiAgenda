import React, { useState } from 'react';
import { Search, User, Phone, Mail, CalendarClock, History, Plus, Trash2, MapPin, Pencil, AlertTriangle } from 'lucide-react';
import { Appointment, Patient, PatientType } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PatientsListProps {
  patients: Patient[];
  appointments: Appointment[];
  onAddPatient: () => void;
  onEditPatient: (patient: Patient) => void;
  onDeletePatient: (id: string) => void;
}

const PatientsList: React.FC<PatientsListProps> = ({ patients, appointments, onAddPatient, onEditPatient, onDeletePatient }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getPatientStats = (patientId: string) => {
    const patientApts = appointments.filter(a => a.patientId === patientId).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const now = new Date();
    const lastVisit = patientApts.filter(a => new Date(a.date) < now).pop();
    const nextVisit = patientApts.find(a => new Date(a.date) >= now);
    
    return {
      lastVisit: lastVisit ? new Date(lastVisit.date) : null,
      nextVisit: nextVisit ? new Date(nextVisit.date) : null,
      totalVisits: patientApts.length
    };
  };

  const confirmDelete = () => {
    if (patientToDelete) {
      onDeletePatient(patientToDelete.id);
      setPatientToDelete(null);
    }
  };

  return (
    <>
      <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in relative">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
             <h2 className="text-xl font-bold text-slate-800">Meus Pacientes</h2>
             <p className="text-sm text-slate-500">Gerenciamento completo da base de pacientes</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar paciente..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full sm:w-64 transition-all bg-white"
              />
            </div>
            <button 
              onClick={onAddPatient}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Plus size={20} /> <span className="hidden sm:inline">Adicionar</span>
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredPatients.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <User size={48} className="mx-auto mb-3 opacity-50" />
              <p>{searchTerm ? 'Nenhum paciente encontrado.' : 'Nenhum paciente cadastrado.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPatients.map((patient) => {
                const stats = getPatientStats(patient.id);
                const isInsurance = patient.type === PatientType.INSURANCE;
                
                return (
                  <div key={patient.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow group relative">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-colors ${
                        isInsurance 
                          ? 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white' 
                          : 'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'
                      }`}>
                        {patient.name.charAt(0)}
                      </div>
                      <div className="overflow-hidden flex-1">
                        <h3 className="font-semibold text-slate-800 truncate">{patient.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            isInsurance ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}>
                            {isInsurance ? 'Convênio' : 'Particular'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-slate-600 mb-4">
                      {patient.phone && (
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-slate-400" />
                          <span>{patient.phone}</span>
                        </div>
                      )}
                      {patient.email && (
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="text-slate-400" />
                          <span className="truncate">{patient.email}</span>
                        </div>
                      )}
                      {patient.address && (
                         <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-slate-400" />
                          <span className="truncate">{patient.address}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 mb-2">
                       <div className="bg-slate-50 p-2 rounded-lg">
                          <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                            <History size={12} /> Última visita
                          </div>
                          <p className="font-medium text-slate-800 text-sm">
                            {stats.lastVisit ? format(stats.lastVisit, "d MMM", { locale: ptBR }) : '-'}
                          </p>
                       </div>
                       <div className="bg-slate-50 p-2 rounded-lg">
                          <div className="flex items-center gap-1 text-xs text-indigo-600 mb-1">
                            <CalendarClock size={12} /> Próxima
                          </div>
                          <p className="font-medium text-indigo-900 text-sm">
                            {stats.nextVisit ? format(stats.nextVisit, "d MMM", { locale: ptBR }) : '-'}
                          </p>
                       </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2 justify-end mt-2 pt-2 border-t border-slate-50">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditPatient(patient);
                        }}
                        className="flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600 px-3 py-1.5 bg-slate-50 rounded-md transition-colors"
                      >
                        <Pencil size={14} /> Editar
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setPatientToDelete(patient);
                        }}
                        className="flex items-center gap-1 text-sm text-slate-500 hover:text-red-600 px-3 py-1.5 bg-slate-50 rounded-md transition-colors"
                      >
                        <Trash2 size={14} /> Excluir
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {patientToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Excluir Paciente?</h3>
              <p className="text-slate-600 text-sm mb-6">
                Você está prestes a excluir <strong>{patientToDelete.name}</strong>. 
                <br/><br/>
                <span className="font-semibold text-red-600">Atenção:</span> Isso removerá permanentemente o cadastro e todas as consultas agendadas e passadas deste paciente.
              </p>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => setPatientToDelete(null)}
                  className="px-4 py-2 rounded-lg text-slate-700 font-medium hover:bg-slate-100 transition-colors border border-slate-200"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDelete}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors shadow-sm"
                >
                  Sim, Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PatientsList;