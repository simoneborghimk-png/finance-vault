import * as React from 'react';
import * as TogglePrimitive from '@radix-ui/react-toggle';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

export const toggleVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-ring focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 gap-2',
  {
    variants: {
      variant: {
        default:
          'bg-transparent hover:bg-muted hover:text-muted-foreground data-[state=on]:bg-accent data-[state=on]:text-accent-foreground',
        outline:
          'border border-input bg-transparent hover:bg-accent hover:text-accent-foreground data-[state=on]:bg-accent data-[state=on]:text-accent-foreground',
      },
      size: {
        xs: 'h-7 px-1.5 min-w-7 text-xs gap-1 [&_svg]:size-3',
        sm: 'h-8 px-2 min-w-8 text-xs',
        default: 'h-9 px-3 min-w-9',
        lg: 'h-10 px-3 min-w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export const Toggle = React.forwardRef<
  React.ComponentRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(toggleVariants({ variant, size }), className)}
    {...props}
  />
));
Toggle.displayName = TogglePrimitive.Root.displayName;
