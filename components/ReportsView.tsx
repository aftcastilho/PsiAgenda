import React, { useState } from 'react';
import { User, FileText, Sparkles, Calendar, Search, Download, ChevronRight, Stethoscope, BrainCircuit } from 'lucide-react';
import { Patient, Appointment } from '../types';
import { generateTechnicalReport, generateSupervisionReport } from '../services/geminiService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReportsViewProps {
  patients: Patient[];
  appointments: Appointment[];
}

type ReportType = 'technical' | 'supervision' | null;

const ReportsView: React.FC<ReportsViewProps> = ({ patients, appointments }) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [generatedReport, setGeneratedReport] = useState<string>('');
  const [reportType, setReportType] = useState<ReportType>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedPatient = patients.find(p => p.id === selectedPatientId);
  
  // Get appointments for selected patient, sorted by date (newest first)
  const patientHistory = appointments
    .filter(a => a.patientId === selectedPatientId && a.notes) // Only show appointments with notes or history
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleGenerate = async (type: 'technical' | 'supervision') => {
    if (!selectedPatient || patientHistory.length === 0) return;
    
    setIsGenerating(true);
    setGeneratedReport('');
    setReportType(type);
    
    const sessionData = patientHistory.map(apt => ({
      date: format(new Date(apt.date), 'dd/MM/yyyy'),
      notes: apt.notes
    }));

    let report = '';
    if (type === 'technical') {
      report = await generateTechnicalReport(selectedPatient.name, sessionData);
    } else {
      report = await generateSupervisionReport(selectedPatient.name, sessionData);
    }

    setGeneratedReport(report);
    setIsGenerating(false);
  };

  return (
    <div className="flex flex-col md:flex-row h-full bg-slate-50 gap-4">
      {/* Left Sidebar: Patient List */}
      <div className="w-full md:w-1/3 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
            <User size={18} /> Selecione o Paciente
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredPatients.map(patient => (
            <button
              key={patient.id}
              onClick={() => {
                setSelectedPatientId(patient.id);
                setGeneratedReport('');
                setReportType(null);
              }}
              className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-colors ${
                selectedPatientId === patient.id 
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                  : 'hover:bg-slate-50 text-slate-600 border border-transparent'
              }`}
            >
              <span className="font-medium truncate">{patient.name}</span>
              <ChevronRight size={16} className={`text-slate-400 ${selectedPatientId === patient.id ? 'text-indigo-500' : ''}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Right Content: Report & History */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        {!selectedPatient ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <FileText size={64} className="mb-4 opacity-50" />
            <p className="text-lg">Selecione um paciente para visualizar o histórico e gerar relatórios.</p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Header with Actions */}
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">{selectedPatient.name}</h2>
                <p className="text-sm text-slate-500">Histórico de Sessões e Ferramentas IA</p>
              </div>
              
              <div className="flex gap-2 w-full xl:w-auto">
                <button
                  onClick={() => handleGenerate('technical')}
                  disabled={isGenerating || patientHistory.length === 0}
                  className="flex-1 xl:flex-none flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 hover:border-slate-400 transition-all disabled:opacity-50 text-sm shadow-sm"
                  title="Gera um relatório formal para encaminhamento ou prontuário."
                >
                  <FileText size={16} />
                  {isGenerating && reportType === 'technical' ? 'Gerando...' : 'Relatório Técnico'}
                </button>

                <button
                  onClick={() => handleGenerate('supervision')}
                  disabled={isGenerating || patientHistory.length === 0}
                  className="flex-1 xl:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-all disabled:opacity-50 text-sm shadow-sm"
                  title="Gera uma análise de supervisão baseada em psicanálise."
                >
                  <BrainCircuit size={16} />
                  {isGenerating && reportType === 'supervision' ? 'Analisando...' : 'Supervisão de Caso'}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              
              {/* Generated AI Report Section */}
              {generatedReport && (
                <div className="mb-8 animate-fade-in-up">
                  <div className={`border rounded-xl p-6 shadow-sm ${
                    reportType === 'technical' 
                      ? 'bg-slate-50 border-slate-200' 
                      : 'bg-indigo-50/50 border-indigo-100'
                  }`}>
                    <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${
                      reportType === 'technical' ? 'text-slate-800' : 'text-indigo-900'
                    }`}>
                      {reportType === 'technical' ? <Stethoscope size={20} /> : <Sparkles size={20} />}
                      {reportType === 'technical' ? 'Relatório Técnico Gerado' : 'Supervisão de Caso (IA)'}
                    </h3>
                    <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {generatedReport}
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-200/60 flex justify-end">
                      <button className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1">
                        <Download size={14} /> Copiar Texto
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Session Timeline */}
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Calendar size={20} className="text-slate-400" /> Linha do Tempo (Evolução)
              </h3>
              
              {patientHistory.length === 0 ? (
                <p className="text-slate-500 italic">Nenhuma anotação de sessão encontrada para este paciente.</p>
              ) : (
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                  {patientHistory.map((apt) => (
                    <div key={apt.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      {/* Icon */}
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 translate-x-0 z-10">
                        <FileText size={18} />
                      </div>
                      
                      {/* Content */}
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <time className="font-bold text-indigo-600 text-sm">
                            {format(new Date(apt.date), "d 'de' MMMM, yyyy", { locale: ptBR })}
                          </time>
                          <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            {apt.startTime}
                          </span>
                        </div>
                        <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                          {apt.notes || <span className="italic text-slate-400">Sem anotações.</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsView;