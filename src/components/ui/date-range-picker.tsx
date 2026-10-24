import * as React from 'react';
import {
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfYear,
  isSameDay
} from 'date-fns';
import { it } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronDown, Check, RotateCcw } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { cn } from '../../lib/utils';
import { Button } from './button';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

export interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange | undefined, presetLabel?: string) => void;
  className?: string;
  align?: 'start' | 'center' | 'end';
}

interface Preset {
  label: string;
  getRange: () => DateRange;
}

const PRESETS: Preset[] = [
  {
    label: 'Tutto lo storico',
    getRange: () => ({ from: undefined, to: undefined }),
  },
  {
    label: 'Ultimo mese',
    getRange: () => {
      const now = new Date();
      return { from: subMonths(now, 1), to: now };
    },
  },
  {
    label: 'Ultimi 3 mesi',
    getRange: () => {
      const now = new Date();
      return { from: subMonths(now, 3), to: now };
    },
  },
  {
    label: 'Ultimi 6 mesi',
    getRange: () => {
      const now = new Date();
      return { from: subMonths(now, 6), to: now };
    },
  },
  {
    label: 'Ultimi 12 mesi',
    getRange: () => {
      const now = new Date();
      return { from: subMonths(now, 12), to: now };
    },
  },
  {
    label: 'Questo mese',
    getRange: () => {
      const now = new Date();
      return { from: startOfMonth(now), to: endOfMonth(now) };
    },
  },
  {
    label: 'Mese precedente',
    getRange: () => {
      const prev = subMonths(new Date(), 1);
      return { from: startOfMonth(prev), to: endOfMonth(prev) };
    },
  },
  {
    label: 'Anno in corso',
    getRange: () => {
      const now = new Date();
      return { from: startOfYear(now), to: now };
    },
  },
];

export function DateRangePicker({
  value,
  onChange,
  className,
  align = 'start',
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedRange, setSelectedRange] = React.useState<DateRange | undefined>(value);
  const [activePreset, setActivePreset] = React.useState<string>('Tutto lo storico');

  // Sync internal range with external value
  React.useEffect(() => {
    setSelectedRange(value);
  }, [value]);

  const handleApplyPreset = (preset: Preset) => {
    const range = preset.getRange();
    setSelectedRange(range);
    setActivePreset(preset.label);
    onChange(range, preset.label);
    setIsOpen(false);
  };

  const handleCustomRangeSelect = (range: DateRange | undefined) => {
    setSelectedRange(range);
    setActivePreset('Personalizzato');
    if (range?.from && range?.to) {
      onChange(range, 'Personalizzato');
    }
  };

  const handleReset = () => {
    const emptyRange: DateRange = { from: undefined, to: undefined };
    setSelectedRange(emptyRange);
    setActivePreset('Tutto lo storico');
    onChange(emptyRange, 'Tutto lo storico');
    setIsOpen(false);
  };

  const handleClose = () => {
    onChange(selectedRange, activePreset);
    setIsOpen(false);
  };

  // Label to show inside trigger button
  const formattedTriggerLabel = React.useMemo(() => {
    if (!value || (!value.from && !value.to)) {
      return 'Tutto lo storico';
    }
    if (value.from && value.to) {
      if (isSameDay(value.from, value.to)) {
        return format(value.from, 'd MMM yyyy', { locale: it });
      }
      return `${format(value.from, 'd MMM yyyy', { locale: it })} – ${format(value.to, 'd MMM yyyy', { locale: it })}`;
    }
    if (value.from) {
      return `Dal ${format(value.from, 'd MMM yyyy', { locale: it })}`;
    }
    return 'Periodo personalizzato';
  }, [value]);

  return (
    <div className={cn('relative inline-block', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'h-9 justify-between text-left font-normal bg-background border border-input rounded-md px-3 text-xs text-foreground hover:bg-muted/40 hover:text-foreground gap-2 min-w-[230px] shadow-xs transition-colors',
              'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
              isOpen && 'border-primary ring-2 ring-primary/20',
              !value?.from && 'text-muted-foreground'
            )}
          >
            <div className="flex items-center gap-2 truncate">
              <CalendarIcon className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="truncate">{formattedTriggerLabel}</span>
            </div>
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 opacity-50 shrink-0 transition-transform duration-200',
                isOpen && 'rotate-180 opacity-100 text-primary'
              )}
            />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align={align}
          className="w-auto p-0 bg-popover border border-border text-popover-foreground shadow-2xl rounded-xl z-50 overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row">
            {/* Left Column: Preset Shortcuts */}
            <div className="w-full sm:w-48 p-2 border-b sm:border-b-0 sm:border-r border-border bg-card/40 space-y-0.5">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground px-2 py-1.5">
                Filtro Rapido
              </p>
              {PRESETS.map((preset) => {
                const isActive = activePreset === preset.label;
                return (
                  <button
                    key={preset.label}
                    onClick={() => handleApplyPreset(preset)}
                    type="button"
                    className={cn(
                      'w-full text-left text-xs px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors',
                      isActive
                        ? 'bg-primary/15 text-primary font-medium border border-primary/30'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <span>{preset.label}</span>
                    {isActive && <Check className="w-3.5 h-3.5 text-primary" />}
                  </button>
                );
              })}
            </div>

            {/* Right Column: Interactive Visual Calendar (Double Month) */}
            <div className="p-3">
              <Calendar
                mode="range"
                defaultMonth={selectedRange?.from || subMonths(new Date(), 1)}
                selected={selectedRange}
                onSelect={handleCustomRangeSelect}
                numberOfMonths={2}
                locale={it}
                className="bg-transparent border-0 text-foreground"
              />
            </div>
          </div>

          {/* Footer Bar */}
          <div className="flex items-center justify-between p-2.5 bg-card/60 border-t border-border text-xs">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-muted-foreground hover:text-foreground h-7 text-xs flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Azzera</span>
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-7 text-xs border-border text-muted-foreground hover:text-foreground"
              >
                Annulla
              </Button>
              <Button
                size="sm"
                onClick={handleClose}
                className="h-7 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-3 shadow-sm"
              >
                Applica
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
