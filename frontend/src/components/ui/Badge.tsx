import { type ReactNode } from 'react';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-surface-700 text-surface-300 border-surface-600',
  primary: 'bg-primary-500/15 text-primary-300 border-primary-500/30',
  success: 'bg-success-500/15 text-success-300 border-success-500/30',
  warning: 'bg-warning-500/15 text-warning-300 border-warning-500/30',
  danger: 'bg-danger-500/15 text-danger-300 border-danger-500/30',
  info: 'bg-info-500/15 text-info-300 border-info-500/30',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-1 py-px text-[0.625rem]',
  md: 'px-1.5 py-0.5 text-small',
};

export function Badge({
  variant = 'default',
  size = 'md',
  children,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center font-medium rounded-full border',
        variantStyles[variant],
        sizeStyles[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  );
}
