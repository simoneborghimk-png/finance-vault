import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { cn } from '../../lib/utils';

const Circle = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
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
    <circle cx="12" cy="12" r="10" />
  </svg>
);

export const RadioGroup = React.forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root className={cn('grid gap-2.5', className)} {...props} ref={ref} />
  );
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

export interface RadioGroupItemProps extends React.ComponentPropsWithoutRef<
  typeof RadioGroupPrimitive.Item
> {
  label?: React.ReactNode;
  description?: string;
  isInvalid?: boolean;
}

export const RadioGroupItem = React.forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps
>(({ className, label, description, id, disabled, isInvalid = false, ...props }, ref) => {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const isError = isInvalid || props['aria-invalid'] === 'true' || props['aria-invalid'] === true;

  const itemElement = (
    <RadioGroupPrimitive.Item
      ref={ref}
      id={inputId}
      disabled={disabled}
      aria-invalid={isError ? 'true' : undefined}
      className={cn(
        'aspect-square h-4 w-4 shrink-0 inline-flex items-center justify-center rounded-full border border-primary text-primary shadow-xs cursor-pointer transition-all focus:outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-ring focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        isError && 'border-destructive text-destructive focus-visible:outline-destructive',
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center leading-none">
        <Circle className="h-2 w-2 fill-current text-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );

  if (!label && !description) {
    return itemElement;
  }

  return (
    <div className="flex items-start gap-2.5">
      <div className="flex items-center justify-center h-4 w-4 shrink-0 mt-0.5">{itemElement}</div>
      <div className="grid gap-1 leading-none select-none">
        {label && (
          <label
            htmlFor={inputId}
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
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;
