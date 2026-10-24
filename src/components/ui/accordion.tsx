import * as React from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { cn } from '../../lib/utils';

const ChevronDown = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
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
    <path d="m6 9 6 6 6-6" />
  </svg>
);

type AccordionBaseProps = {
  className?: string;
  children?: React.ReactNode;
};

export type AccordionProps = AccordionBaseProps &
  (
    | (AccordionPrimitive.AccordionSingleProps & { type?: 'single' })
    | (AccordionPrimitive.AccordionMultipleProps & { type: 'multiple' })
    | {
        type: 'single' | 'multiple';
        value?: string | string[];
        defaultValue?: string | string[];
        onValueChange?: (value: string | string[]) => void;
        collapsible?: boolean;
        disabled?: boolean;
        dir?: 'ltr' | 'rtl';
        orientation?: 'horizontal' | 'vertical';
        asChild?: boolean;
      }
  );

export function Accordion({ className, ...props }: AccordionProps) {
  if (props.type === 'multiple') {
    return (
      <AccordionPrimitive.Root
        {...(props as AccordionPrimitive.AccordionMultipleProps)}
        className={cn('divide-y divide-border border-y border-border', className)}
      />
    );
  }

  const { collapsible = true, ...singleProps } = props as AccordionPrimitive.AccordionSingleProps;
  return (
    <AccordionPrimitive.Root
      collapsible={collapsible}
      {...singleProps}
      type="single"
      className={cn('divide-y divide-border border-y border-border', className)}
    />
  );
}

export const AccordionItem = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    data-slot="accordion-item"
    className={cn('transition-all', className)}
    {...props}
  />
));
AccordionItem.displayName = 'AccordionItem';

export const AccordionTrigger = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex" data-slot="accordion-header">
    <AccordionPrimitive.Trigger
      ref={ref}
      data-slot="accordion-trigger"
      className={cn(
        'flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180 text-foreground cursor-pointer text-sm',
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 text-muted-foreground" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

export const AccordionContent = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    data-slot="accordion-content"
    className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down text-muted-foreground"
    {...props}
  >
    <div className={cn('pb-4 pt-0', className)}>{children}</div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;
