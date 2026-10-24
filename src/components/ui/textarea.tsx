import * as React from 'react';
import { cn } from '../../lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  isInvalid?: boolean;
  errorMessage?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      isInvalid = false,
      errorMessage,
      disabled,
      id,
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const textareaId = id ?? generatedId;
    const errorId = errorMessage ? `${textareaId}-error` : undefined;
    const combinedDescribedBy = [ariaDescribedBy, errorId].filter(Boolean).join(' ') || undefined;

    const textareaElement = (
      <textarea
        id={textareaId}
        ref={ref}
        disabled={disabled}
        aria-invalid={isInvalid ? 'true' : undefined}
        aria-describedby={combinedDescribedBy}
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors',
          'outline-none focus:outline-none focus-visible:outline-none focus:border-ring focus:ring-1 focus:ring-ring focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring',
          'disabled:cursor-not-allowed disabled:opacity-50',
          isInvalid &&
            'border-destructive text-destructive focus:ring-destructive focus-visible:ring-destructive',
          className
        )}
        {...props}
      />
    );

    if (!errorMessage) {
      return textareaElement;
    }

    return (
      <div className="w-full">
        {textareaElement}
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-destructive">
          {errorMessage}
        </p>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
