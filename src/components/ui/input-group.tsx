import * as React from 'react';
import { cn } from '../../lib/utils';

function InputGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="input-group"
      className={cn(
        'relative flex h-9 w-full items-stretch rounded-md border border-input bg-background shadow-xs transition-colors overflow-hidden',
        'focus-within:border-ring focus-within:ring-1 focus-within:ring-ring',
        'has-[[disabled]]:opacity-50 has-[[disabled]]:cursor-not-allowed',
        'has-[[aria-invalid=true]]:border-destructive has-[[aria-invalid=true]]:ring-destructive',
        className
      )}
      {...props}
    />
  );
}

function InputGroupAddon({
  className,
  align = 'inline',
  ...props
}: React.ComponentProps<'div'> & {
  align?: 'inline' | 'inset-start' | 'inset-end';
}) {
  return (
    <div
      data-slot="input-group-addon"
      data-align={align}
      className={cn(
        'flex items-center text-muted-foreground select-none text-sm shrink-0',
        align === 'inline' &&
          'self-stretch px-3 bg-muted border-input first:border-r last:border-l',
        align === 'inset-start' && 'pl-3 pr-1 pointer-events-none [&>svg]:size-4 [&_i]:text-sm',
        align === 'inset-end' && 'pr-3 pl-1 [&>svg]:size-4 [&_i]:text-sm',
        className
      )}
      {...props}
    />
  );
}

function InputGroupInput({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      data-slot="input-group-input"
      className={cn(
        'flex h-full w-full min-w-0 flex-1 bg-transparent px-3 py-1 text-sm outline-none border-0 transition-colors',
        'focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

export { InputGroup, InputGroupAddon, InputGroupInput };
