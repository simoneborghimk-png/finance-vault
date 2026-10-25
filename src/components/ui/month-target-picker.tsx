import React, { useState, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Button } from './button';
import { Badge } from './badge';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

interface MonthTargetPickerProps {
  value: string; // YYYY-MM
  onChange: (value: string) => void;
  className?: string;
}

const MONTH_NAMES_SHORT = [
  'Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu',
  'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'
];

const MONTH_NAMES_FULL = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

export const MonthTargetPicker: React.FC<MonthTargetPickerProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Parse initial value or fallback to now + 6 months
  const { year: currentValYear, month: currentValMonth } = useMemo(() => {
    if (value && value.includes('-')) {
      const [y, m] = value.split('-');
      return { year: parseInt(y, 10), month: parseInt(m, 10) };
    }
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  }, [value]);

  const [viewYear, setViewYear] = useState<number>(currentValYear);

  // Keep viewYear in sync when value changes externally
  React.useEffect(() => {
    setViewYear(currentValYear);
  }, [currentValYear]);

  const now = new Date();
  const currentActualYear = now.getFullYear();
  const currentActualMonth = now.getMonth() + 1; // 1-12

  // Distance in months
  const monthsDiff = useMemo(() => {
    return Math.max(
      1,
      (currentValYear - currentActualYear) * 12 + (currentValMonth - currentActualMonth)
    );
  }, [currentValYear, currentValMonth, currentActualYear, currentActualMonth]);

  // Formatted trigger label
  const formattedLabel = useMemo(() => {
    const monthName = MONTH_NAMES_FULL[currentValMonth - 1] || '';
    return `${monthName} ${currentValYear}`;
  }, [currentValMonth, currentValYear]);

  // Helper to apply target month and year
  const handleSelect = (y: number, m: number) => {
    const formatted = `${y}-${String(m).padStart(2, '0')}`;
    onChange(formatted);
    setIsOpen(false);
  };

  // Preset generator
  const presets = useMemo(() => {
    const generatePreset = (offsetMonths: number, label: string) => {
      const target = new Date(currentActualYear, currentActualMonth - 1 + offsetMonths, 1);
      const y = target.getFullYear();
      const m = target.getMonth() + 1;
      return {
        label,
        year: y,
        month: m,
        valueStr: `${y}-${String(m).padStart(2, '0')}`,
      };
    };

    return [
      generatePreset(1, 'Tra 1 mese'),
      generatePreset(3, 'Tra 3 mesi'),
      generatePreset(6, 'Tra 6 mesi'),
      generatePreset(12, 'Tra 1 anno'),
      generatePreset(24, 'Tra 2 anni'),
    ];
  }, [currentActualYear, currentActualMonth]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`flex items-center justify-between w-full h-10 px-3 py-2 bg-background border border-input rounded-md text-xs text-foreground hover:border-border/80 focus:outline-none focus:ring-1 focus:ring-ring transition-colors cursor-pointer ${className}`}
        >
          <div className="flex items-center gap-2 truncate">
            <Calendar className="w-4 h-4 text-primary shrink-0" />
            <span className="font-semibold text-foreground capitalize truncate">{formattedLabel}</span>
          </div>
          <Badge
            variant="outline"
            className="border-primary/40 text-primary bg-primary/10 text-[10px] ml-1.5 shrink-0 font-medium py-0.5 px-2"
          >
            tra {monthsDiff} mes{monthsDiff === 1 ? 'e' : 'i'}
          </Badge>
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-3 bg-card border-border shadow-xl text-xs space-y-3" align="start">
        {/* Quick Presets */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span>Preset Rapidi:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => {
              const isSelected = p.valueStr === value;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleSelect(p.year, p.month)}
                  className={`text-[11px] px-2.5 py-1 rounded-md border transition-all ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary font-semibold shadow-xs'
                      : 'bg-background border-border text-muted-foreground hover:text-foreground hover:border-border/80'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-border pt-2.5 space-y-2.5">
          {/* Year Navigator */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewYear((prev) => Math.max(currentActualYear, prev - 1))}
              disabled={viewYear <= currentActualYear}
              className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors"
              aria-label="Anno precedente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-sm text-foreground font-mono">{viewYear}</span>
            <button
              type="button"
              onClick={() => setViewYear((prev) => prev + 1)}
              className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Anno successivo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* 12 Months Grid */}
          <div className="grid grid-cols-4 gap-1.5">
            {MONTH_NAMES_SHORT.map((name, idx) => {
              const monthNum = idx + 1;
              const isPast =
                viewYear === currentActualYear && monthNum < currentActualMonth;
              const isSelected =
                viewYear === currentValYear && monthNum === currentValMonth;

              return (
                <button
                  key={name}
                  type="button"
                  disabled={isPast}
                  onClick={() => handleSelect(viewYear, monthNum)}
                  className={`py-2 text-xs rounded-md font-medium text-center transition-all ${
                    isSelected
                      ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                      : isPast
                      ? 'opacity-30 cursor-not-allowed text-muted-foreground'
                      : 'hover:bg-muted text-foreground'
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
