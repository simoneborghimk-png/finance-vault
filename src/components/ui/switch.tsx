import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '../../lib/utils';

export interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
  label?: React.ReactNode;
  description?: string;
  isInvalid?: boolean;
}

export const Switch = React.forwardRef<
  React.ComponentRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(({ className, label, description, id, disabled, isInvalid = false, ...props }, ref) => {
  const generatedId = React.useId();
  const switchId = id ?? generatedId;
  const isError = isInvalid || props['aria-invalid'] === 'true' || props['aria-invalid'] === true;

  const switchElement = (
    <SwitchPrimitive.Root
      id={switchId}
      ref={ref}
      disabled={disabled}
      aria-invalid={isError ? 'true' : undefined}
      className={cn(
        'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-ring focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted',
        isError && 'ring-2 ring-destructive ring-offset-2',
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          'pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0'
        )}
      />
    </SwitchPrimitive.Root>
  );

  if (!label && !description) {
    return switchElement;
  }

  return (
    <div className="flex items-start gap-3">
      {switchElement}
      <div className="grid gap-1 leading-none select-none">
        {label && (
          <label
            htmlFor={switchId}
            className={cn(
              'text-sm font-medium leading-none cursor-pointer',
              disabled && 'cursor-not-allowed opacity-70'
            )}
          >
            {label}
          </label>
        )}
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
});
Switch.displayName = SwitchPrimitive.Root.displayName;
