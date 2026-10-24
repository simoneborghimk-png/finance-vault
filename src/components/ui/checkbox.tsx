import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
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

const Minus = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export interface CheckboxProps extends Omit<
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
  'onChange'
> {
  label?: React.ReactNode;
  description?: string;
  isInvalid?: boolean;
  onChange?: (e: { target: { checked: boolean } }) => void;
}

export const Checkbox = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(
  (
    {
      className,
      label,
      description,
      id,
      disabled,
      checked,
      isInvalid = false,
      onCheckedChange,
      onChange,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const checkboxId = id ?? generatedId;
    const isError = isInvalid || props['aria-invalid'] === 'true' || props['aria-invalid'] === true;

    const handleCheckedChange = (state: boolean | 'indeterminate') => {
      onCheckedChange?.(state);
      if (onChange && typeof state === 'boolean') {
        onChange({ target: { checked: state } });
      }
    };

    const checkboxElement = (
      <CheckboxPrimitive.Root
        id={checkboxId}
        ref={ref}
        checked={checked}
        disabled={disabled}
        aria-invalid={isError ? 'true' : undefined}
        onCheckedChange={handleCheckedChange}
        className={cn(
          'peer h-4 w-4 shrink-0 rounded-xs border border-primary shadow-xs cursor-pointer transition-all focus:outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-ring focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground',
          isError && 'border-destructive text-destructive focus-visible:outline-destructive',
          className
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator
          className={cn('flex items-center justify-center text-current')}
        >
          {checked === 'indeterminate' ? (
            <Minus className="h-3.5 w-3.5" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    );

    if (!label && !description) {
      return checkboxElement;
    }

    return (
      <div className="flex items-start gap-2.5">
        <div className="pt-0.5">{checkboxElement}</div>
        <div className="grid gap-1 leading-none select-none">
          {label && (
            <label
              htmlFor={checkboxId}
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
  }
);
Checkbox.displayName = CheckboxPrimitive.Root.displayName;
