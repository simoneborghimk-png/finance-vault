import * as React from 'react';
import { cn } from '../../lib/utils';

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  size?: 'xs' | 'sm' | 'default';
}

const kbdSizes = {
  xs: 'h-4 px-1 text-[9px]',
  sm: 'h-5 px-1.5 text-[10px]',
  default: 'h-6 px-2 text-xs',
};

export function Kbd({ className, size = 'sm', children, ...props }: KbdProps) {
  return (
    <kbd
      className={cn(
        'pointer-events-none inline-flex select-none items-center gap-1 rounded border border-border bg-muted font-mono font-medium text-muted-foreground shadow-2xs',
        kbdSizes[size],
        className
      )}
      {...props}
    >
      {children}
    </kbd>
  );
}
