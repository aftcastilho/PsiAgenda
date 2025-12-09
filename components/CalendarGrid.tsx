import React, { useRef, useState } from 'react';
import { startOfWeek, addDays, format, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Appointment, HOURS_START, HOURS_END, RecurrenceType, PatientType } from '../types';
import { ChevronLeft, ChevronRight, RepeatIcon, Clock, MessageSquareText } from 'lucide-react';

interface CalendarGridProps {
  currentDate: Date;
  appointments: Appointment[];
  onDateChange: (date: Date) => void;
  onSlotClick: (date: Date, time: string) => void;
  onAppointmentClick: (appointment: Appointment) => void;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  appointments,
  onDateChange,
  onSlotClick,
  onAppointmentClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [startY, setStartY] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const isDragging = useRef(false);
  const dragThreshold = 5; // pixels to consider a drag

  // Generate days of the week
  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 6 }).map((_, i) => addDays(startDate, i));

  // Generate time slots
  const timeSlots = Array.from({ length: HOURS_END - HOURS_START + 1 }).map((_, i) => {
    const hour = HOURS_START + i;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  const getAppointmentsForSlot = (date: Date, timeStr: string) => {
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.date);
      if (!isSameDay(aptDate, date)) return false;
      const aptHour = parseInt(apt.startTime.split(':')[0]);
      const slotHour = parseInt(timeStr.split(':')[0]);
      return aptHour === slotHour;
    });
  };

  // Drag to Scroll Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    isDragging.current = false;
    setStartY(e.pageY - containerRef.current.offsetTop);
    setScrollTop(containerRef.current.scrollTop);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // We don't check isDragging.current here to start logic, we calculate distance first
    if (e.buttons !== 1 || !containerRef.current) return;

    const y = e.pageY - containerRef.current.offsetTop;
    const distance = Math.abs(y - startY);

    if (distance > dragThreshold) {
      isDragging.current = true;
      e.preventDefault();
      const walk = (y - startY) * 1.5; // Scroll speed multiplier
      containerRef.current.scrollTop = scrollTop - walk;
    }
  };

  const handleSlotClickInternal = (date: Date, time: string) => {
    if (!isDragging.current) {
      onSlotClick(date, time);
    }
  };

  const handleAppointmentClickInternal = (e: React.MouseEvent, apt: Appointment) => {
    e.stopPropagation();
    if (!isDragging.current) {
      onAppointmentClick(apt);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Calendar Header Controls */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-2">
           <h2 className="text-lg font-semibold text-slate-800 capitalize">
            {format(currentDate, "MMMM yyyy", { locale: ptBR })}
          </h2>
        </div>
        <div className="flex items-center bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => onDateChange(addDays(currentDate, -7))}
            className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="px-3 text-sm font-medium text-slate-600">
             {format(startDate, "d MMM", { locale: ptBR })} - {format(weekDays[5], "d MMM", { locale: ptBR })}
          </span>
          <button
            onClick={() => onDateChange(addDays(currentDate, 7))}
            className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Grid Header (Days) */}
      <div className="grid grid-cols-[60px_repeat(6,1fr)] bg-slate-50 border-b border-slate-200 flex-shrink-0 min-w-[600px]">
        <div className="p-3 border-r border-slate-200"></div>
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className={`p-3 text-center border-r border-slate-100 last:border-r-0 ${
              isToday(day) ? 'bg-indigo-50/50' : ''
            }`}
          >
            <p className="text-xs font-semibold uppercase text-slate-500">
              {format(day, 'EEE', { locale: ptBR })}
            </p>
            <p
              className={`text-lg font-bold mt-1 inline-flex items-center justify-center w-8 h-8 rounded-full ${
                isToday(day) ? 'bg-indigo-600 text-white' : 'text-slate-800'
              }`}
            >
              {format(day, 'd')}
            </p>
          </div>
        ))}
      </div>

      {/* Grid Body */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-auto min-w-[600px] cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      >
        <div className="grid grid-cols-[60px_repeat(6,1fr)] min-w-[600px]">
          {timeSlots.map((time) => (
            <React.Fragment key={time}>
              {/* Time Label */}
              <div className="h-28 border-r border-b border-slate-100 p-2 text-xs font-medium text-slate-400 text-right sticky left-0 bg-white z-10 pointer-events-none">
                <span className="-mt-3 block">{time}</span>
              </div>

              {/* Day Columns for this Time */}
              {weekDays.map((day) => {
                 const slotAppointments = getAppointmentsForSlot(day, time);
                 
                 return (
                  <div
                    key={`${day.toISOString()}-${time}`}
                    className={`h-28 border-r border-b border-slate-100 relative group transition-colors ${
                       isToday(day) ? 'bg-indigo-50/10' : ''
                    } hover:bg-slate-50`}
                    onMouseUp={() => handleSlotClickInternal(day, time)}
                  >
                    {/* Add Button on Hover (Empty Slot) */}
                    {slotAppointments.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                        <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-md font-medium">
                          + Agendar
                        </span>
                      </div>
                    )}

                    {/* Render Appointments */}
                    {slotAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        onMouseUp={(e) => handleAppointmentClickInternal(e, apt)}
                        className={`absolute inset-x-1 top-1 bottom-1 rounded-md p-2 shadow-sm border-l-4 cursor-pointer hover:brightness-95 transition-all flex flex-col justify-between overflow-hidden
                          ${apt.patientType === PatientType.INSURANCE 
                            ? 'bg-emerald-50 border-emerald-500' 
                            : 'bg-indigo-50 border-indigo-500'
                          }
                        `}
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-700 truncate">{apt.startTime} - {apt.patientName}</p>
                          {apt.notes && (
                             <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500">
                               <MessageSquareText size={10} />
                               <span className="truncate">{apt.notes}</span>
                             </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1">
                          {apt.recurrence !== RecurrenceType.NONE && (
                            <RepeatIcon size={12} className={apt.patientType === PatientType.INSURANCE ? 'text-emerald-600' : 'text-indigo-600'} />
                          )}
                           <div className="flex items-center gap-1 text-[10px] text-slate-500">
                             <Clock size={10} /> {apt.durationMinutes}m
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarGrid;