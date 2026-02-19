export type Mood = 'happy' | 'silly' | 'calm' | 'sad' | 'tired' | 'excited';

export interface Activity {
  id: string;
  seriesId?: string;
  title: string;
  time: string;
  isAllDay: boolean;
  icon: string;
  color: string;
  customColor?: string;
  completed: boolean;
}

export interface DayData {
  date: string; // yyyy-MM-dd
  mood?: Mood;
  activities: Activity[];
}

export interface CalendarState {
  currentDate: Date;
  days: Record<string, DayData>;
}

export type RepeatType = 'none' | 'daily' | 'weekly' | 'custom';

export const SCHOOL_COLORS = [
  { name: 'Sky', class: 'bg-sky-200', border: 'border-sky-300' },
  { name: 'Emerald', class: 'bg-emerald-200', border: 'border-emerald-300' },
  { name: 'Amber', class: 'bg-amber-200', border: 'border-amber-300' },
  { name: 'Rose', class: 'bg-rose-200', border: 'border-rose-300' },
  { name: 'Indigo', class: 'bg-indigo-200', border: 'border-indigo-300' },
  { name: 'Orange', class: 'bg-orange-200', border: 'border-orange-300' },
  { name: 'Purple', class: 'bg-purple-200', border: 'border-purple-300' },
];

export const ICON_OPTIONS = [
  { label: 'Math', icon: '🧮', color: 'bg-blue-200' },
  { label: 'Writing', icon: '✏️', color: 'bg-yellow-200' },
  { label: 'Reading', icon: '📖', color: 'bg-green-200' },
  { label: 'Life Skills', icon: '🧹', color: 'bg-orange-200' },
  { label: 'SLP', icon: '🗣️', color: 'bg-purple-200' },
  { label: 'OT', icon: '🧩', color: 'bg-pink-200' },
  { label: 'Field Trip', icon: '🚌', color: 'bg-red-200' },
  { label: 'Biology', icon: '🔬', color: 'bg-emerald-200' },
  { label: 'Theater', icon: '🎭', color: 'bg-indigo-200' },
  { label: 'Pathways', icon: '🛤️', color: 'bg-cyan-200' },
  { label: 'Advisory', icon: '🤝', color: 'bg-amber-200' },
  { label: 'Lunch', icon: '🍱', color: 'bg-rose-200' },
  { label: 'QOTD', icon: '❓', color: 'bg-sky-200' },
];