import * as React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'sm' | 'default' | 'lg';
  isInvalid?: boolean;
  errorMessage?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

const inputSizes = {
  sm: 'h-8 px-2.5 py-1 text-xs',
  default: 'h-10 px-3 py-2 text-sm',
  lg: 'h-12 px-3.5 py-2.5 text-base',
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      size = 'default',
      isInvalid = false,
      errorMessage,
      leadingIcon,
      trailingIcon,
      disabled,
      id,
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const errorId = errorMessage ? `${inputId}-error` : undefined;
    const combinedDescribedBy = [ariaDescribedBy, errorId].filter(Boolean).join(' ') || undefined;

    const inputElement = (
      <input
        id={inputId}
        type={type}
        ref={ref}
        disabled={disabled}
        aria-invalid={isInvalid ? 'true' : undefined}
        aria-describedby={combinedDescribedBy}
        className={cn(
          'flex w-full rounded-md border border-input bg-background text-foreground transition-colors',
          'outline-none focus:outline-none focus-visible:outline-none focus:border-ring focus:ring-1 focus:ring-ring focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground',
          'disabled:cursor-not-allowed disabled:opacity-50',
          inputSizes[size],
          leadingIcon && (size === 'sm' ? 'pl-8' : size === 'lg' ? 'pl-11' : 'pl-10'),
          trailingIcon && (size === 'sm' ? 'pr-8' : size === 'lg' ? 'pr-11' : 'pr-10'),
          isInvalid &&
            'border-destructive text-destructive focus:ring-destructive focus-visible:ring-destructive',
          className
        )}
        {...props}
      />
    );

    if (!leadingIcon && !trailingIcon && !errorMessage) {
      return inputElement;
    }

    return (
      <div className="w-full">
        <div className="relative flex items-center">
          {leadingIcon && (
            <div
              className={cn(
                'pointer-events-none absolute flex items-center justify-center text-muted-foreground [&_svg]:shrink-0',
                size === 'sm'
                  ? 'left-2.5 [&_svg]:size-3.5'
                  : size === 'lg'
                    ? 'left-3.5 [&_svg]:size-5'
                    : 'left-3 [&_svg]:size-4'
              )}
            >
              {leadingIcon}
            </div>
          )}
          {inputElement}
          {trailingIcon && (
            <div
              className={cn(
                'absolute flex items-center justify-center text-muted-foreground [&_svg]:shrink-0',
                size === 'sm'
                  ? 'right-2.5 [&_svg]:size-3.5'
                  : size === 'lg'
                    ? 'right-3.5 [&_svg]:size-5'
                    : 'right-3 [&_svg]:size-4'
              )}
            >
              {trailingIcon}
            </div>
          )}
        </div>
        {errorMessage && (
          <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-destructive">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
