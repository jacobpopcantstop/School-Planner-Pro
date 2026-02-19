
import React, { useState, useEffect, useMemo } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isWeekend, 
  addDays, 
  subDays,
  getDay,
  parseISO
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon,
  Sun,
  Printer,
  CheckCircle2,
  Trash2,
  RefreshCcw,
  X,
  Clock,
  GripVertical,
  Palette,
  Download,
  Upload,
  Keyboard,
  Copy,
  LayoutGrid
} from 'lucide-react';
import { DayData, CalendarState, ICON_OPTIONS, Activity, RepeatType, SCHOOL_COLORS } from './types';

const App: React.FC = () => {
  const [state, setState] = useState<CalendarState>(() => {
    const saved = localStorage.getItem('school_planner_v5_days');
    return {
      currentDate: new Date(),
      days: saved ? JSON.parse(saved) : {},
    };
  });

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draggedActivity, setDraggedActivity] = useState<{ activity: Activity, fromDate: string } | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('school_planner_v5_days', JSON.stringify(state.days));
  }, [state.days]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      if (e.key === 'n') setIsModalOpen(true);
      if (e.key === 'p') window.print();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  const currentDayData = state.days[dateKey] || { date: dateKey, activities: [] };

  const addActivities = (title: string, time: string, isAllDay: boolean, icon: string, color: string, customColor: string, repeat: RepeatType, selectedDays: number[] = []) => {
    const seriesId = repeat !== 'none' ? Math.random().toString(36).substr(2, 9) : undefined;
    const newDays = { ...state.days };
    
    let targetDates = [selectedDate];
    if (repeat !== 'none') {
      // Populate for next 12 weeks
      for (let i = 1; i < 90; i++) {
        const d = addDays(selectedDate, i);
        if (isWeekend(d)) continue;
        const dayIdx = getDay(d);
        if (repeat === 'daily') targetDates.push(d);
        else if (repeat === 'weekly' && dayIdx === getDay(selectedDate)) targetDates.push(d);
        else if (repeat === 'custom' && selectedDays.includes(dayIdx)) targetDates.push(d);
      }
    }

    targetDates.forEach(date => {
      const key = format(date, 'yyyy-MM-dd');
      const dayData = newDays[key] || { date: key, activities: [] };
      newDays[key] = {
        ...dayData,
        activities: [...dayData.activities, {
          id: Math.random().toString(36).substr(2, 9),
          seriesId, title, time, isAllDay, icon, color, customColor, completed: false
        }]
      };
    });

    setState(prev => ({ ...prev, days: newDays }));
  };

  const removeActivity = (activity: Activity, dateString: string) => {
    if (activity.seriesId && confirm("Delete the ENTIRE RECURRING SERIES? (Cancel for just this one)")) {
      const newDays = { ...state.days };
      Object.keys(newDays).forEach(k => {
        newDays[k].activities = newDays[k].activities.filter(a => a.seriesId !== activity.seriesId);
      });
      setState(prev => ({ ...prev, days: newDays }));
      return;
    }
    const dayData = state.days[dateString];
    if (dayData) {
      const newDays = { ...state.days, [dateString]: { ...dayData, activities: dayData.activities.filter(a => a.id !== activity.id) } };
      setState(prev => ({ ...prev, days: newDays }));
    }
  };

  // Fix: Added toggleActivity function to handle task completion status
  const toggleActivity = (id: string) => {
    const dayData = state.days[dateKey];
    if (dayData) {
      const newActivities = dayData.activities.map(a => 
        a.id === id ? { ...a, completed: !a.completed } : a
      );
      setState(prev => ({
        ...prev,
        days: {
          ...prev.days,
          [dateKey]: { ...dayData, activities: newActivities }
        }
      }));
    }
  };

  const cloneActivity = (activity: Activity) => {
    const newActivity = { ...activity, id: Math.random().toString(36).substr(2, 9), completed: false, seriesId: undefined };
    setState(prev => ({ 
      ...prev, 
      days: { 
        ...prev.days, 
        [dateKey]: { ...currentDayData, activities: [...currentDayData.activities, newActivity] } 
      } 
    }));
  };

  const onDrop = (e: React.DragEvent, toDate: string) => {
    e.preventDefault();
    setDropTarget(null);
    if (!draggedActivity) return;
    
    const isCopy = e.altKey || e.ctrlKey || e.metaKey;
    const { activity, fromDate } = draggedActivity;
    const newDays = { ...state.days };
    
    if (!isCopy && fromDate !== toDate) {
      newDays[fromDate] = { 
        ...newDays[fromDate], 
        activities: newDays[fromDate].activities.filter(a => a.id !== activity.id) 
      };
    }

    const targetDay = newDays[toDate] || { date: toDate, activities: [] };
    const newActivity = { ...activity, id: Math.random().toString(36).substr(2, 9), seriesId: isCopy ? undefined : activity.seriesId };
    newDays[toDate] = { ...targetDay, activities: [...targetDay.activities, newActivity] };

    setState(prev => ({ ...prev, days: newDays }));
    setDraggedActivity(null);
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state.days)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `school-schedule-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        setState(prev => ({ ...prev, days: { ...prev.days, ...imported } }));
        alert("Schedule imported successfully!");
      } catch (err) { alert("Invalid file format."); }
    };
    reader.readAsText(file);
  };

  const printPages = useMemo(() => {
    const monthStart = startOfMonth(state.currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 });
    const allWeekdays = eachDayOfInterval({ start: startDate, end: endDate }).filter(d => !isWeekend(d));
    const pages = [];
    for (let i = 0; i < allWeekdays.length; i += 10) pages.push(allWeekdays.slice(i, i + 10));
    return pages;
  }, [state.currentDate]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col select-none">
      {/* Navbar */}
      <header className="no-print h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm shrink-0 z-40">
        <div className="flex items-center gap-4">
          <CalendarIcon className="text-indigo-600 w-6 h-6" />
          <h1 className="text-sm font-black text-slate-800 uppercase tracking-tighter">SchoolPlanner <span className="text-indigo-600">Pro</span></h1>
          <div className="hidden md:flex items-center gap-4 border-l border-slate-200 pl-4 ml-4">
            <button onClick={exportData} title="Export Schedule" className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-all"><Download className="w-4 h-4" /></button>
            <label className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-all cursor-pointer">
              <Upload className="w-4 h-4" /><input type="file" hidden onChange={importData} accept=".json" />
            </label>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 mr-2 text-[10px] font-bold text-slate-400">
             <kbd className="bg-white px-1.5 py-0.5 rounded shadow-sm border border-slate-200">N</kbd> New Task
          </div>
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-95">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </header>

      <main className="no-print flex-1 overflow-hidden flex flex-col lg:flex-row">
        {/* Left: Main Calendar */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-slate-900">{format(state.currentDate, 'MMMM yyyy')}</h2>
              <div className="flex items-center bg-slate-50 rounded-xl p-1 gap-1 border border-slate-100">
                <button onClick={() => setState(p => ({ ...p, currentDate: subMonths(p.currentDate, 1) }))} className="p-2 hover:bg-white rounded-lg transition-all"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => setState(p => ({ ...p, currentDate: new Date() }))} className="px-4 py-1 text-[11px] font-black uppercase hover:bg-white rounded-lg text-slate-500">Today</button>
                <button onClick={() => setState(p => ({ ...p, currentDate: addMonths(p.currentDate, 1) }))} className="p-2 hover:bg-white rounded-lg transition-all"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-4 mb-3">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                <div key={day} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-5 gap-4">
              {(() => {
                const monthStart = startOfMonth(state.currentDate);
                const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
                const endDate = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 });
                const days = eachDayOfInterval({ start: startDate, end: endDate }).filter(d => !isWeekend(d));
                
                return days.map(day => {
                  const dKey = format(day, 'yyyy-MM-dd');
                  const dayData = state.days[dKey];
                  const isSelected = isSameDay(day, selectedDate);
                  const isHovered = dropTarget === dKey;

                  return (
                    <div
                      key={dKey}
                      onDragOver={e => { e.preventDefault(); setDropTarget(dKey); }}
                      onDragLeave={() => setDropTarget(null)}
                      onDrop={e => onDrop(e, dKey)}
                      onClick={() => setSelectedDate(day)}
                      className={`
                        h-40 p-3 rounded-2xl border-2 flex flex-col transition-all relative cursor-pointer
                        ${isSelected ? 'border-indigo-500 bg-indigo-50/20 shadow-inner' : 'border-slate-100 bg-slate-50/30 hover:border-slate-300'}
                        ${isHovered ? 'ring-4 ring-indigo-200 border-indigo-400 scale-[1.02] z-10' : ''}
                        ${!isSameMonth(day, monthStart) ? 'opacity-25 grayscale' : 'opacity-100'}
                      `}
                    >
                      <span className={`text-xs font-black mb-2 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}>
                        {format(day, 'd')}
                      </span>
                      <div className="flex-1 overflow-hidden space-y-1.5">
                        {dayData?.activities.slice(0, 4).map(a => (
                          <div 
                            key={a.id} 
                            draggable 
                            onDragStart={e => { setDraggedActivity({ activity: a, fromDate: dKey }); e.dataTransfer.effectAllowed = "copyMove"; }}
                            className={`px-2 py-1 rounded-lg text-[10px] font-black truncate border flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-grab
                              ${a.customColor ? 'border-slate-200' : (SCHOOL_COLORS.find(c => c.class === a.color)?.border || 'border-slate-200')}
                            `}
                            style={a.customColor ? { backgroundColor: a.customColor } : {}}
                          >
                            <span className="shrink-0">{a.icon}</span>
                            <span className={a.completed ? 'line-through opacity-40' : 'text-slate-800'}>{a.title}</span>
                          </div>
                        ))}
                        {dayData && dayData.activities.length > 4 && (
                          <p className="text-[9px] font-black text-indigo-400 text-center">+{dayData.activities.length - 4} items</p>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>

        {/* Right: Schedule Panel */}
        <aside className="w-full lg:w-[440px] border-l border-slate-200 bg-white flex flex-col shadow-2xl z-20">
          <div className="p-8 border-b border-slate-50 bg-slate-50/20">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{format(selectedDate, 'EEEE')}</span>
              <Keyboard className="w-4 h-4 text-slate-300" title="Shortcuts Enabled" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{format(selectedDate, 'MMMM do')}</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Quick-Add Presets Sidebar */}
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Quick Add</h4>
              <div className="flex gap-2">
                {ICON_OPTIONS.filter(o => ['Math', 'QOTD', 'Lunch', 'Reading'].includes(o.label)).map(o => (
                  <button 
                    key={o.label}
                    onClick={() => addActivities(o.label, "09:00", false, o.icon, o.color, "", "none")}
                    className="flex-1 flex flex-col items-center p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
                  >
                    <span className="text-xl mb-1 group-hover:scale-110 transition-transform">{o.icon}</span>
                    <span className="text-[8px] font-black uppercase text-slate-400 group-hover:text-indigo-600">{o.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Today's List</h4>
              <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-black shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0">
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {currentDayData.activities.length === 0 ? (
              <div className="py-24 text-center border-4 border-dashed border-slate-50 rounded-3xl flex flex-col items-center justify-center grayscale opacity-40">
                <LayoutGrid className="w-12 h-12 text-slate-200 mb-4" />
                <p className="text-sm text-slate-400 font-black uppercase">No tasks yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentDayData.activities.sort((a,b) => a.isAllDay ? -1 : a.time.localeCompare(b.time)).map(activity => (
                  <div 
                    key={activity.id} 
                    draggable 
                    onDragStart={e => { setDraggedActivity({ activity, fromDate: dateKey }); e.dataTransfer.effectAllowed = "copyMove"; }}
                    className="group flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all cursor-grab active:cursor-grabbing relative overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-100 group-hover:bg-indigo-500 transition-colors"></div>
                    <GripVertical className="w-4 h-4 text-slate-200 group-hover:text-slate-400 shrink-0" />
                    <div 
                      className={`w-12 h-12 flex items-center justify-center rounded-xl text-2xl shadow-sm shrink-0 border border-black/5
                        ${activity.customColor ? '' : activity.color}
                      `}
                      style={activity.customColor ? { backgroundColor: activity.customColor } : {}}
                    >
                      {activity.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-base font-black truncate ${activity.completed ? 'line-through text-slate-300' : 'text-slate-900'}`}>{activity.title}</p>
                        {activity.seriesId && <RefreshCcw className="w-3 h-3 text-indigo-400" />}
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{activity.isAllDay ? 'All Day' : activity.time}</p>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => toggleActivity(activity.id)} title="Complete Task" className={`p-2 rounded-lg ${activity.completed ? 'text-emerald-500 bg-emerald-50' : 'text-slate-300 hover:text-emerald-600 hover:bg-emerald-50'}`}>
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                      <button onClick={() => cloneActivity(activity)} title="Duplicate" className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                        <Copy className="w-5 h-5" />
                      </button>
                      <button onClick={() => removeActivity(activity, dateKey)} title="Delete" className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* Landscape Print View (20pt Large Type) */}
      <div className="print-only">
        {printPages.map((page, idx) => (
          <div key={idx} className="print-page-break p-6">
            <h2 className="text-3xl font-black mb-8 border-b-8 border-indigo-600 pb-4 flex justify-between items-center">
               <span>School Schedule</span>
               <span className="text-slate-400 text-xl font-bold">{format(page[0], 'MMM d')} – {format(page[page.length-1], 'MMM d, yyyy')}</span>
            </h2>
            <div className="grid grid-cols-5 gap-6 h-[80vh]">
              {page.map(day => {
                const dayData = state.days[format(day, 'yyyy-MM-dd')];
                return (
                  <div key={format(day, 'yyyy-MM-dd')} className="border-4 border-slate-200 rounded-[2rem] p-6 flex flex-col bg-white shadow-sm">
                    <p className="font-black text-indigo-500 uppercase text-sm mb-2">{format(day, 'EEEE')}</p>
                    <p className="font-black text-4xl mb-6">{format(day, 'MMM d')}</p>
                    <div className="space-y-6 flex-1 overflow-hidden">
                      {dayData?.activities.sort((a,b) => a.isAllDay ? -1 : a.time.localeCompare(b.time)).map(a => (
                        <div key={a.id} className="flex items-center gap-4">
                          <span className="text-4xl shrink-0">{a.icon}</span>
                          <div className="min-w-0">
                            <p className="font-black text-[22pt] leading-tight truncate">{a.title}</p>
                            <p className="text-[12pt] font-black text-slate-400 uppercase">{a.isAllDay ? 'All Day' : a.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && <ActivityModal selectedDate={selectedDate} onClose={() => setIsModalOpen(false)} onSave={addActivities} />}
    </div>
  );
};

// Enhanced Modal with Custom Multi-Day Picker
const ActivityModal: React.FC<{ 
  selectedDate: Date; onClose: () => void; 
  onSave: (title: string, time: string, isAllDay: boolean, icon: string, color: string, customColor: string, repeat: RepeatType, customDays: number[]) => void 
}> = ({ selectedDate, onClose, onSave }) => {
  const [draft, setDraft] = useState({
    title: '', time: '09:00', isAllDay: false, icon: '✏️', color: 'bg-indigo-100', customColor: '', repeat: 'none' as RepeatType, customDays: [getDay(selectedDate)]
  });

  const toggleDay = (d: number) => {
    setDraft(p => ({ ...p, customDays: p.customDays.includes(d) ? p.customDays.filter(x => x !== d) : [...p.customDays, d] }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md no-print animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
        <div className="p-8 border-b flex items-center justify-between bg-slate-50/50">
          <h3 className="text-2xl font-black text-slate-900">Add School Task</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-2xl transition-all"><X className="w-6 h-6 text-slate-400" /></button>
        </div>

        <div className="p-10 overflow-y-auto space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Task Name</label>
                <input 
                  autoFocus
                  type="text" value={draft.title} onChange={e => setDraft({...draft, title: e.target.value})}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-black focus:border-indigo-500 focus:bg-white outline-none transition-all shadow-sm" placeholder="E.g. Math Quiz"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Time</label>
                  <input 
                    disabled={draft.isAllDay}
                    type="time" value={draft.time} onChange={e => setDraft({...draft, time: e.target.value})}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-black focus:border-indigo-500 focus:bg-white outline-none disabled:opacity-30 transition-all shadow-sm"
                  />
                </div>
                <div className="flex flex-col justify-end pb-1">
                  <button 
                    onClick={() => setDraft(p => ({ ...p, isAllDay: !p.isAllDay }))}
                    className={`h-14 px-4 rounded-2xl border-2 font-black text-[10px] uppercase transition-all ${draft.isAllDay ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-200'}`}
                  >All Day</button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Repeat Pattern</label>
              <div className="grid grid-cols-2 gap-2">
                {['none', 'daily', 'weekly', 'custom'].map((r) => (
                  <button 
                    key={r} 
                    onClick={() => setDraft({...draft, repeat: r as RepeatType})}
                    className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${draft.repeat === r ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}
                  >{r}</button>
                ))}
              </div>
              
              {draft.repeat === 'custom' && (
                <div className="flex gap-2 justify-between">
                  {['M', 'T', 'W', 'T', 'F'].map((l, i) => (
                    <button 
                      key={i} 
                      onClick={() => toggleDay(i + 1)}
                      className={`w-10 h-10 rounded-full font-black text-[10px] border-2 transition-all ${draft.customDays.includes(i + 1) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                    >{l}</button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Color Theme</label>
              <div className="flex flex-wrap gap-2.5">
                {SCHOOL_COLORS.map(c => (
                  <button 
                    key={c.class} 
                    onClick={() => setDraft({...draft, color: c.class, customColor: ''})}
                    className={`w-9 h-9 rounded-xl border-4 transition-all ${c.class} ${draft.color === c.class && !draft.customColor ? 'border-slate-900 scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                  />
                ))}
                <input 
                  type="color" value={draft.customColor || '#6366f1'} onChange={e => setDraft({...draft, customColor: e.target.value})}
                  className="w-9 h-9 rounded-xl border-2 border-slate-100 cursor-pointer overflow-hidden p-0"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Choose Icon</label>
              <div className="grid grid-cols-6 gap-2">
                {ICON_OPTIONS.map(opt => (
                  <button 
                    key={opt.label} 
                    onClick={() => setDraft({ ...draft, icon: opt.icon, title: draft.title || opt.label })}
                    className={`text-2xl p-2 rounded-xl transition-all border-2 ${draft.icon === opt.icon ? 'bg-slate-100 border-indigo-500' : 'bg-white border-slate-50 hover:bg-slate-50'}`}
                  >{opt.icon}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-8 flex gap-4">
            <button onClick={onClose} className="flex-1 bg-slate-100 text-slate-500 font-black py-5 rounded-[1.5rem] hover:bg-slate-200 transition-all uppercase tracking-[0.2em] text-xs">Cancel</button>
            <button 
              disabled={!draft.title}
              onClick={() => { onSave(draft.title, draft.time, draft.isAllDay, draft.icon, draft.color, draft.customColor, draft.repeat, draft.customDays); onClose(); }}
              className="flex-[2] bg-indigo-600 text-white font-black py-5 rounded-[1.5rem] shadow-2xl shadow-indigo-200 hover:bg-black transition-all uppercase tracking-[0.2em] text-xs disabled:opacity-30"
            >
              Add to Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
