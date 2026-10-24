import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

export const labelVariants = cva(
  'text-sm font-medium leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
);

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>, VariantProps<typeof labelVariants> {
  required?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required = false, children, ...props }, ref) => (
    <label ref={ref} className={cn(labelVariants(), className)} {...props}>
      {children}
      {required && (
        <span aria-hidden="true" className="text-destructive ml-1">
          *
        </span>
      )}
    </label>
  )
);
Label.displayName = 'Label';
