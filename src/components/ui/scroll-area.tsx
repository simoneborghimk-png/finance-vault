import * as React from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { cn } from '../../lib/utils';

export type ScrollAreaProps = React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>;

export const ScrollArea = React.forwardRef<
  React.ComponentRef<typeof ScrollAreaPrimitive.Root>,
  ScrollAreaProps
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    data-slot="scroll-area"
    className={cn('relative overflow-hidden', className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport
      data-slot="scroll-area-viewport"
      tabIndex={0}
      className="h-full w-full rounded-[inherit] outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
    >
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
));
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

export type ScrollBarProps = React.ComponentPropsWithoutRef<
  typeof ScrollAreaPrimitive.ScrollAreaScrollbar
>;

export const ScrollBar = React.forwardRef<
  React.ComponentRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  ScrollBarProps
>(({ className, orientation = 'vertical', ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    data-slot="scroll-area-scrollbar"
    orientation={orientation}
    className={cn(
      'flex touch-none select-none transition-colors duration-150',
      orientation === 'vertical' && 'h-full w-2.5 border-l border-l-transparent p-[1px]',
      orientation === 'horizontal' && 'h-2.5 flex-col border-t border-t-transparent p-[1px]',
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb
      data-slot="scroll-area-thumb"
      className="relative flex-1 rounded-full bg-border transition-colors hover:bg-muted-foreground/40"
    />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;
