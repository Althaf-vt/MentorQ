import { forwardRef, useState, type HTMLAttributes } from 'react';

export type CalendarProps = HTMLAttributes<HTMLDivElement> & {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  markedDates?: ReadonlySet<string>;
  markedDateLabel?: string;
};

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const monthName = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' });
const dateName = new Intl.DateTimeFormat('en-IN', { dateStyle: 'full' });

function shiftDay(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function weekStart(date: Date) {
  return shiftDay(date, -((date.getDay() + 6) % 7));
}

export function calendarDateKey(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join('-');
}

export const Calendar = forwardRef<HTMLDivElement, CalendarProps>(
  ({ selectedDate, onDateSelect, markedDates, markedDateLabel = 'Marked date', className = '', ...props }, ref) => {
    const [uncontrolled, setUncontrolled] = useState(() => new Date());
    const [view, setView] = useState<'week' | 'month'>('week');
    const selected = selectedDate ?? uncontrolled;
    const today = calendarDateKey(new Date());
    const selection = calendarDateKey(selected);
    const monthStart = new Date(selected.getFullYear(), selected.getMonth(), 1);
    const first = weekStart(view === 'week' ? selected : monthStart);
    const daysInMonth = new Date(selected.getFullYear(), selected.getMonth() + 1, 0).getDate();
    const leading = (monthStart.getDay() + 6) % 7;
    const dayCount = view === 'week' ? 7 : Math.ceil((daysInMonth + leading) / 7) * 7;

    function select(date: Date) {
      if (!selectedDate) setUncontrolled(date);
      onDateSelect?.(date);
    }

    function navigate(step: number) {
      if (view === 'week') {
        select(shiftDay(selected, 7 * step));
        return;
      }
      const target = new Date(selected.getFullYear(), selected.getMonth() + step, 1);
      const end = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
      select(shiftDay(target, Math.min(selected.getDate(), end) - 1));
    }

    return (
      <div {...props} ref={ref} className={['mqds-calendar', className].filter(Boolean).join(' ')}>
        <div className="mqds-calendar-toolbar">
          <div className="mqds-calendar-views" role="group" aria-label="Calendar view">
            <button type="button" aria-pressed={view === 'week'} onClick={() => setView('week')}>Week</button>
            <button type="button" aria-pressed={view === 'month'} onClick={() => setView('month')}>Month</button>
          </div>
          <button className="mqds-calendar-today" type="button" onClick={() => select(new Date())}>Today</button>
        </div>
        <div className="mqds-calendar-heading">
          <h3 key={view + calendarDateKey(view === 'week' ? first : monthStart)} aria-live="polite">
            {monthName.format(selected)}
          </h3>
          <div className="mqds-calendar-arrows" role="group" aria-label="Calendar navigation">
            <button type="button" aria-label={'Previous ' + view} onClick={() => navigate(-1)}>&lsaquo;</button>
            <button type="button" aria-label={'Next ' + view} onClick={() => navigate(1)}>&rsaquo;</button>
          </div>
        </div>
        <div className="mqds-calendar-days">
          {weekdays.map(day => <span className="mqds-calendar-weekday" key={day}>{day}</span>)}
          {Array.from({ length: dayCount }, (_, index) => {
            const day = shiftDay(first, index);
            const key = calendarDateKey(day);
            const marked = markedDates?.has(key);
            return (
              <button type="button" key={key} aria-pressed={key === selection}
                aria-current={key === today ? 'date' : undefined}
                aria-label={dateName.format(day) + (marked ? ', ' + markedDateLabel : '')}
                data-outside={view === 'month' && day.getMonth() !== selected.getMonth()}
                data-marked={Boolean(marked)}
                onClick={() => select(day)}>
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
);

Calendar.displayName = 'Calendar';
