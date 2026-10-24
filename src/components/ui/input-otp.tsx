import * as React from 'react';
import { OTPInput, OTPInputContext } from 'input-otp';
import { cn } from '../../lib/utils';

const Minus = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
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
    <path d="M5 12h14" />
  </svg>
);

export type InputOTPProps = React.ComponentPropsWithoutRef<typeof OTPInput> & {
  isInvalid?: boolean;
};

export const InputOTP = React.forwardRef<React.ComponentRef<typeof OTPInput>, InputOTPProps>(
  ({ className, containerClassName, isInvalid = false, ...props }, ref) => {
    const isError = isInvalid || props['aria-invalid'] === 'true' || props['aria-invalid'] === true;

    return (
      <OTPInput
        ref={ref}
        aria-invalid={isError ? 'true' : undefined}
        containerClassName={cn(
          'flex items-center gap-2 has-disabled:opacity-50',
          isError &&
            '[&_[data-slot=input-otp-slot]]:border-destructive [&_[data-slot=input-otp-slot]]:text-destructive',
          containerClassName
        )}
        className={cn('disabled:cursor-not-allowed', className)}
        {...props}
      />
    );
  }
);
InputOTP.displayName = 'InputOTP';

export const InputOTPGroup = React.forwardRef<
  React.ComponentRef<'div'>,
  React.ComponentPropsWithoutRef<'div'>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex items-center', className)} {...props} />
));
InputOTPGroup.displayName = 'InputOTPGroup';

export const InputOTPSlot = React.forwardRef<
  React.ComponentRef<'div'>,
  React.ComponentPropsWithoutRef<'div'> & { index: number }
>(({ index, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {};

  return (
    <div
      ref={ref}
      data-slot="input-otp-slot"
      className={cn(
        'relative flex h-10 w-10 items-center justify-center border-y border-r border-input text-sm font-semibold transition-all first:rounded-l-md first:border-l last:rounded-r-md bg-background text-foreground',
        isActive && 'z-10 ring-2 ring-ring ring-offset-background border-ring',
        className
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
        </div>
      )}
    </div>
  );
});
InputOTPSlot.displayName = 'InputOTPSlot';

export const InputOTPSeparator = React.forwardRef<
  React.ComponentRef<'div'>,
  React.ComponentPropsWithoutRef<'div'>
>(({ ...props }, ref) => (
  <div ref={ref} role="separator" {...props}>
    <Minus className="h-4 w-4 opacity-50 text-muted-foreground" />
  </div>
));
InputOTPSeparator.displayName = 'InputOTPSeparator';
