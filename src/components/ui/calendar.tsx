import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { cn } from '../../lib/utils';
import { buttonVariants } from './button';

const ChevronLeft = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="m15 18-6-6 6-6" />
  </svg>
);

const ChevronRight = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        'p-3 bg-popover text-popover-foreground rounded-md border border-border shadow-xs w-fit',
        className
      )}
      classNames={{
        months: 'flex flex-col sm:flex-row gap-4 relative',
        month: 'space-y-4',
        month_caption: 'flex justify-center pt-1 relative items-center h-7',
        caption_label: 'text-sm font-medium',
        nav: 'flex items-center gap-1',
        button_previous: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 absolute left-1 top-1 z-10'
        ),
        button_next: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 absolute right-1 top-1 z-10'
        ),
        month_grid: 'w-full border-collapse space-y-1',
        weekdays: 'flex justify-between',
        weekday: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center',
        week: 'flex w-full mt-2 justify-between',
        day: 'h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20',
        day_button: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-9 w-9 p-0 font-normal transition-colors aria-selected:opacity-100 rounded-md focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0 focus:outline-none'
        ),
        range_start: 'day-range-start rounded-l-md bg-primary text-primary-foreground font-semibold',
        range_end: 'day-range-end rounded-r-md bg-primary text-primary-foreground font-semibold',
        selected:
          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-md font-semibold shadow-xs',
        today: 'bg-accent text-accent-foreground font-semibold',
        outside:
          'day-outside text-muted-foreground opacity-40 aria-selected:bg-primary/10 aria-selected:text-primary/60 aria-selected:opacity-40',
        disabled: 'text-muted-foreground opacity-30 cursor-not-allowed',
        range_middle: 'aria-selected:bg-primary/15 aria-selected:text-primary font-medium rounded-none',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClassName }) => {
          if (orientation === 'left') {
            return <ChevronLeft className={cn('h-4 w-4', chevronClassName)} />;
          }
          if (orientation === 'right') {
            return <ChevronRight className={cn('h-4 w-4', chevronClassName)} />;
          }
          return <ChevronLeft className={cn('h-4 w-4', chevronClassName)} />;
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';
