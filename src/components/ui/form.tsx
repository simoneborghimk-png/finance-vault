import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../../lib/utils';

export interface FormItemContextValue {
  id: string;
  isInvalid?: boolean;
  error?: React.ReactNode;
  hasDescription: boolean;
  setHasDescription: (has: boolean) => void;
  hasMessage: boolean;
  setHasMessage: (has: boolean) => void;
}

const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue);

export function useFormField() {
  const itemContext = React.useContext(FormItemContext);
  const id = itemContext.id;

  return {
    id,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    isInvalid: !!itemContext.isInvalid,
    error: itemContext.error,
    hasDescription: itemContext.hasDescription,
    setHasDescription: itemContext.setHasDescription,
    hasMessage: itemContext.hasMessage,
    setHasMessage: itemContext.setHasMessage,
  };
}

export const Form = React.forwardRef<HTMLFormElement, React.FormHTMLAttributes<HTMLFormElement>>(
  ({ className, ...props }, ref) => (
    <form ref={ref} className={cn('space-y-6', className)} {...props} />
  )
);
Form.displayName = 'Form';

export interface FormItemProps extends React.HTMLAttributes<HTMLDivElement> {
  isInvalid?: boolean;
  error?: React.ReactNode;
}

export const FormItem = React.forwardRef<HTMLDivElement, FormItemProps>(
  ({ className, isInvalid, error, ...props }, ref) => {
    const id = React.useId();
    const [hasDescription, setHasDescription] = React.useState(false);
    const [hasMessage, setHasMessage] = React.useState(false);

    return (
      <FormItemContext.Provider
        value={{
          id,
          isInvalid: isInvalid || !!error,
          error,
          hasDescription,
          setHasDescription,
          hasMessage,
          setHasMessage,
        }}
      >
        <div ref={ref} className={cn('space-y-2', className)} {...props} />
      </FormItemContext.Provider>
    );
  }
);
FormItem.displayName = 'FormItem';

export const FormLabel = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => {
  const { formItemId, isInvalid } = useFormField();

  return (
    <label
      ref={ref}
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground',
        isInvalid && 'text-destructive',
        className
      )}
      htmlFor={formItemId}
      {...props}
    />
  );
});
FormLabel.displayName = 'FormLabel';

export const FormControl = React.forwardRef<
  React.ComponentRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ 'aria-describedby': ariaDescribedBy, ...props }, ref) => {
  const { isInvalid, formItemId, formDescriptionId, formMessageId, hasDescription, hasMessage } =
    useFormField();

  const describedBy =
    [
      ariaDescribedBy,
      hasDescription ? formDescriptionId : undefined,
      hasMessage || isInvalid ? formMessageId : undefined,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={describedBy}
      aria-invalid={isInvalid}
      {...props}
    />
  );
});
FormControl.displayName = 'FormControl';

export const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId, setHasDescription } = useFormField();

  React.useEffect(() => {
    setHasDescription?.(true);
    return () => setHasDescription?.(false);
  }, [setHasDescription]);

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn('text-xs text-muted-foreground', className)}
      {...props}
    />
  );
});
FormDescription.displayName = 'FormDescription';

export const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, isInvalid, formMessageId, setHasMessage } = useFormField();
  const body = error ?? children;

  React.useEffect(() => {
    if (isInvalid || body) {
      setHasMessage?.(true);
      return () => setHasMessage?.(false);
    }
  }, [isInvalid, body, setHasMessage]);

  if (!isInvalid && !body) {
    return null;
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn('text-xs font-medium text-destructive', className)}
      {...props}
    >
      {body}
    </p>
  );
});
FormMessage.displayName = 'FormMessage';
