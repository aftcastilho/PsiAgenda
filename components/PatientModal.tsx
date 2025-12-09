import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, MapPin, FileText, CreditCard, Banknote } from 'lucide-react';
import { Patient, PatientType } from '../types';

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: Partial<Patient>) => void;
  existingPatient?: Patient | null;
}

const PatientModal: React.FC<PatientModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingPatient
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [type, setType] = useState<PatientType>(PatientType.PRIVATE);

  useEffect(() => {
    if (isOpen) {
      if (existingPatient) {
        setName(existingPatient.name);
        setEmail(existingPatient.email || '');
        setPhone(existingPatient.phone || '');
        setCpf(existingPatient.cpf || '');
        setAddress(existingPatient.address || '');
        setNotes(existingPatient.notes || '');
        setType(existingPatient.type || PatientType.PRIVATE);
      } else {
        setName('');
        setEmail('');
        setPhone('');
        setCpf('');
        setAddress('');
        setNotes('');
        setType(PatientType.PRIVATE);
      }
    }
  }, [isOpen, existingPatient]);

  const handleSave = () => {
    if (!name.trim()) return;

    const patientData: Partial<Patient> = {
      id: existingPatient?.id,
      name,
      email,
      phone,
      cpf,
      address,
      notes,
      type
    };

    onSave(patientData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center text-white">
          <h2 className="text-xl font-semibold">
            {existingPatient ? 'Editar Paciente' : 'Novo Paciente'}
          </h2>
          <button onClick={onClose} className="hover:bg-indigo-700 p-1 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
          {/* Name */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700 flex items-center gap-2">
              <User size={16} /> Nome Completo
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Maria Silva"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            />
          </div>

          {/* Type Selection */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700 flex items-center gap-2">
              <Banknote size={16} /> Modalidade
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as PatientType)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            >
              <option value={PatientType.PRIVATE}>Particular</option>
              <option value={PatientType.INSURANCE}>Plano de Saúde / Convênio</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700 flex items-center gap-2">
                <Phone size={16} /> Telefone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700 flex items-center gap-2">
                <CreditCard size={16} /> CPF
              </label>
              <input
                type="text"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                placeholder="000.000.000-00"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700 flex items-center gap-2">
              <Mail size={16} /> Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemplo@email.com"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            />
          </div>

          <div className="space-y-1">
             <label className="block text-sm font-medium text-slate-700 flex items-center gap-2">
              <MapPin size={16} /> Endereço
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua, Número, Bairro"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            />
          </div>

           <div className="space-y-1">
             <label className="block text-sm font-medium text-slate-700 flex items-center gap-2">
              <FileText size={16} /> Observações Iniciais
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Histórico, encaminhamento, etc."
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-white"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-600 font-medium hover:bg-slate-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!name}
            className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-md hover:shadow-lg"
          >
            Salvar Paciente
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientModal;