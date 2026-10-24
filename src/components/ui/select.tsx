import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { cn } from '../../lib/utils';

const Check = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
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
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const ChevronDown = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
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
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const ChevronUp = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
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
    <path d="m18 15-6-6-6 6" />
  </svg>
);

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export const SelectRoot = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

const selectTriggerSizes = {
  sm: 'h-8 px-2.5 py-1 text-xs',
  default: 'h-10 px-3 py-2 text-sm',
  lg: 'h-12 px-3.5 py-2.5 text-base',
};

export interface SelectTriggerProps extends React.ComponentPropsWithoutRef<
  typeof SelectPrimitive.Trigger
> {
  size?: 'sm' | 'default' | 'lg';
  isInvalid?: boolean;
}

export const SelectTrigger = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Trigger>,
  SelectTriggerProps
>(({ className, size = 'default', children, isInvalid, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'flex w-full items-center justify-between rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground transition-colors',
      'outline-none focus:outline-none focus-visible:outline-none focus:border-ring focus:ring-1 focus:ring-ring focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring',
      'disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
      selectTriggerSizes[size],
      isInvalid &&
        'border-destructive text-destructive focus:ring-destructive focus-visible:ring-destructive',
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

export const SelectScrollUpButton = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

export const SelectScrollDownButton = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

export const SelectContent = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'relative z-50 max-h-96 max-h-(--radix-select-content-available-height) min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        position === 'popper' &&
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          'p-1',
          position === 'popper' &&
            'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

export const SelectLabel = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn('py-1.5 pl-8 pr-2 text-xs font-semibold text-muted-foreground', className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

export const SelectItem = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

export const SelectSeparator = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-muted', className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

// Componente ad alto livello unificato (supporta sia API compound Shadcn sia opzioni rapide)
export interface ExtendedSelectProps extends Omit<
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root>,
  'onChange'
> {
  id?: string;
  'aria-label'?: string;
  onChange?: (e: { target: { value: string } }) => void;
  options?: SelectOption[];
  placeholder?: string;
  isInvalid?: boolean;
  errorMessage?: string;
  label?: string;
  className?: string;
  children?: React.ReactNode;
}

export function Select({
  options,
  value,
  defaultValue,
  onValueChange,
  onChange,
  placeholder = 'Seleziona opzione...',
  isInvalid,
  errorMessage,
  label,
  disabled,
  className,
  children,
  ...props
}: ExtendedSelectProps) {
  const generatedId = React.useId();
  const selectId = props.id || generatedId;

  // Se non sono passate options, usa la modalità pura Radix Root
  if (!options) {
    return (
      <SelectPrimitive.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
        {...props}
      >
        {children}
      </SelectPrimitive.Root>
    );
  }

  const handleChange = (val: string) => {
    onValueChange?.(val);
    onChange?.({ target: { value: val } });
  };

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold mb-1.5 text-foreground">
          {label}
        </label>
      )}
      <SelectPrimitive.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={handleChange}
        disabled={disabled}
        {...props}
      >
        <SelectTrigger
          id={selectId}
          aria-label={props['aria-label'] || label}
          className={className}
          isInvalid={isInvalid}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </SelectPrimitive.Root>
      {errorMessage && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-destructive">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
