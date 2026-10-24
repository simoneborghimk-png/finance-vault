import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '../../lib/utils';

export const AvatarRoot = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border',
      className
    )}
    {...props}
  />
));
AvatarRoot.displayName = AvatarPrimitive.Root.displayName;

export const AvatarImage = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn('aspect-square h-full w-full object-cover', className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

export const AvatarFallback = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-muted font-medium text-muted-foreground select-none text-sm',
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export interface AvatarProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  src?: string;
  alt?: string;
  fallbackText?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export function Avatar({
  src,
  alt = 'Avatar utente',
  fallbackText = 'U',
  size = 'md',
  className,
  children,
  ...props
}: AvatarProps) {
  // Se ha children personalizzati, agisce come Root
  if (children) {
    return (
      <AvatarRoot className={className} {...props}>
        {children}
      </AvatarRoot>
    );
  }

  const sizeClasses = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  };

  return (
    <AvatarRoot className={cn(sizeClasses[size], className)} {...props}>
      {src && <AvatarImage src={src} alt={alt} />}
      <AvatarFallback aria-label={alt}>{fallbackText.slice(0, 2).toUpperCase()}</AvatarFallback>
    </AvatarRoot>
  );
}
