import * as React from 'react';
import { cn } from '../../lib/utils';
import { getIconDefinition, type IconFamily, type IconWeight } from './icon-registry';

export type { IconFamily, IconWeight };

export type IconSize = '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface IconProps extends React.SVGAttributes<SVGSVGElement> {
  /** Icon name without 'fa-' prefix (e.g. 'user', 'bell', 'magnifying-glass') */
  name: string;
  /** Family style of the icon */
  family?: IconFamily;
  /** Visual weight of the icon */
  weight?: IconWeight;
  /** Preset size */
  size?: IconSize;
  /** Fixed width for alignment in vertical menus */
  fixedWidth?: boolean;
  /** Continuous rotation animation */
  spin?: boolean;
  /** 8-step stepped rotation animation */
  pulse?: boolean;
  /** Primary color for duotone styles (CSS color or token) */
  primaryColor?: string;
  /** Secondary color for duotone styles (CSS color or token) */
  secondaryColor?: string;
  /** Secondary opacity for duotone styles (0.0 to 1.0) */
  secondaryOpacity?: number;
  /** Accessible label. If provided, sets role="img" and aria-label. Otherwise marks aria-hidden="true" */
  label?: string;
}

const SIZE_CLASSES: Record<IconSize, string> = {
  '2xs': 'size-[0.625em]',
  xs: 'size-[0.75em]',
  sm: 'size-[0.875em]',
  md: 'size-[1em]',
  lg: 'size-[1.25em]',
  xl: 'size-[1.5em]',
  '2xl': 'size-[2em]',
};

export const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  (
    {
      name,
      family = 'classic',
      weight = 'regular',
      size,
      fixedWidth = false,
      spin = false,
      pulse = false,
      primaryColor,
      secondaryColor,
      secondaryOpacity,
      label,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const iconDef = getIconDefinition(name, family, weight);

    let prefixClass: string;
    if (family === 'brands') {
      prefixClass = 'fa-brands';
    } else if (family === 'duotone') {
      prefixClass = `fa-duotone fa-${weight}`;
    } else if (family === 'sharp') {
      prefixClass = `fa-sharp fa-${weight}`;
    } else if (family === 'sharp-duotone') {
      prefixClass = `fa-sharp-duotone fa-${weight}`;
    } else {
      prefixClass = `fa-${weight}`;
    }

    const cleanName = name.replace(/^fa-/, '');
    const nameClass = `fa-${cleanName}`;
    const sizeClass = size ? `fa-${size} ${SIZE_CLASSES[size]}` : 'size-[1em]';

    const duotoneStyles: React.CSSProperties = {
      ...(primaryColor ? { '--fa-primary-color': primaryColor } : {}),
      ...(secondaryColor ? { '--fa-secondary-color': secondaryColor } : {}),
      ...(secondaryOpacity !== undefined ? { '--fa-secondary-opacity': secondaryOpacity } : {}),
      ...style,
    } as React.CSSProperties;

    const isDuotone = Array.isArray(iconDef.paths);

    return (
      <svg
        ref={ref}
        viewBox={iconDef.viewBox}
        fill="currentColor"
        className={cn(
          'inline-block shrink-0 select-none align-[-0.125em]',
          prefixClass,
          nameClass,
          sizeClass,
          fixedWidth && 'fa-fw w-[1.25em] text-center',
          spin && 'fa-spin animate-spin',
          pulse && 'fa-pulse',
          className
        )}
        style={duotoneStyles}
        aria-hidden={label ? undefined : true}
        aria-label={label}
        role={label ? 'img' : undefined}
        focusable="false"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        {isDuotone ? (
          <>
            <path
              d={(iconDef.paths as [string, string])[0]}
              fill={secondaryColor || 'currentColor'}
              opacity={secondaryOpacity ?? 0.4}
              className="fa-secondary"
            />
            <path
              d={(iconDef.paths as [string, string])[1]}
              fill={primaryColor || 'currentColor'}
              className="fa-primary"
            />
          </>
        ) : (
          <path d={iconDef.paths as string} />
        )}
      </svg>
    );
  }
);

Icon.displayName = 'Icon';
