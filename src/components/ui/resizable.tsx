import * as React from 'react';
import * as ResizablePrimitive from 'react-resizable-panels';
import { cn } from '../../lib/utils';

const GripVertical = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
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
    <circle cx="9" cy="12" r="1" />
    <circle cx="9" cy="5" r="1" />
    <circle cx="9" cy="19" r="1" />
    <circle cx="15" cy="12" r="1" />
    <circle cx="15" cy="5" r="1" />
    <circle cx="15" cy="19" r="1" />
  </svg>
);

export interface ResizablePanelGroupProps extends Omit<
  ResizablePrimitive.GroupProps,
  'orientation'
> {
  direction?: 'horizontal' | 'vertical';
  orientation?: 'horizontal' | 'vertical';
}

export const ResizablePanelGroup = ({
  className,
  direction = 'horizontal',
  orientation,
  ...props
}: ResizablePanelGroupProps) => (
  <ResizablePrimitive.Group
    data-slot="resizable-panel-group"
    orientation={orientation ?? direction}
    className={cn('flex h-full w-full data-[orientation=vertical]:flex-col', className)}
    {...props}
  />
);
ResizablePanelGroup.displayName = 'ResizablePanelGroup';

export const ResizablePanel = ResizablePrimitive.Panel;

export interface ResizableHandleProps extends ResizablePrimitive.SeparatorProps {
  withHandle?: boolean;
}

export const ResizableHandle = ({ withHandle, className, ...props }: ResizableHandleProps) => (
  <ResizablePrimitive.Separator
    data-slot="resizable-handle"
    className={cn(
      'relative flex w-px items-center justify-center bg-border transition-colors after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-ring focus-visible:outline-offset-1 data-[orientation=vertical]:h-px data-[orientation=vertical]:w-full data-[orientation=vertical]:after:left-0 data-[orientation=vertical]:after:h-1 data-[orientation=vertical]:after:w-full data-[orientation=vertical]:after:-translate-y-1/2 data-[orientation=vertical]:after:translate-x-0 [&[data-separator]]:hover:bg-ring/70 [&[data-separator]]:data-[active=true]:bg-ring',
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-xs border border-border bg-background shadow-xs">
        <GripVertical className="h-2.5 w-2.5 text-muted-foreground" />
      </div>
    )}
  </ResizablePrimitive.Separator>
);
ResizableHandle.displayName = 'ResizableHandle';
