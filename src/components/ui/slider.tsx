import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '../../lib/utils';

export interface SliderProps extends Omit<
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>,
  'value' | 'defaultValue' | 'onValueChange'
> {
  value?: number | number[];
  defaultValue?: number | number[];
  onValueChange?: (value: number) => void;
  onValuesChange?: (values: number[]) => void;
  thumbAriaLabel?: string;
}

export const Slider = React.forwardRef<
  React.ComponentRef<typeof SliderPrimitive.Root>,
  SliderProps
>(
  (
    { className, value, defaultValue, onValueChange, onValuesChange, thumbAriaLabel, ...props },
    ref
  ) => {
    // Normalizzazione di value in array per Radix
    const resolvedValue =
      value !== undefined ? (Array.isArray(value) ? value : [value]) : undefined;
    const resolvedDefaultValue =
      defaultValue !== undefined
        ? Array.isArray(defaultValue)
          ? defaultValue
          : [defaultValue]
        : [0];

    const handleValueChange = (values: number[]) => {
      onValuesChange?.(values);
      onValueChange?.(values[0]);
    };

    const thumbLabel = thumbAriaLabel || (props['aria-label'] as string) || 'Cursore';

    return (
      <SliderPrimitive.Root
        ref={ref}
        value={resolvedValue}
        defaultValue={resolvedDefaultValue}
        onValueChange={handleValueChange}
        className={cn('relative flex w-full touch-none select-none items-center', className)}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-muted">
          <SliderPrimitive.Range className="absolute h-full bg-primary" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          aria-label={thumbLabel}
          className="block h-5 w-5 rounded-full border-2 border-primary bg-background shadow-xs transition-colors focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-ring focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing hover:scale-110 active:scale-95"
        />
      </SliderPrimitive.Root>
    );
  }
);
Slider.displayName = SliderPrimitive.Root.displayName;
