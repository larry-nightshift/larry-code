import { type ReactNode, type HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'gradient' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

const variantStyles = {
  default: 'bg-surface-800 border border-surface-700',
  gradient: 'bg-gradient-card border border-surface-700/50',
  outlined: 'bg-transparent border border-surface-600',
};

const paddingStyles = {
  none: '',
  sm: 'p-2',
  md: 'p-3',
  lg: 'p-4',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      hoverable = false,
      className = '',
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={[
          'rounded-lg shadow-sm transition-all duration-200',
          variantStyles[variant],
          paddingStyles[padding],
          hoverable
            ? 'hover:shadow-md hover:border-surface-600 hover:-translate-y-px'
            : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';

interface CardHeaderProps {
  title: string;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({ title, action, className = '' }: CardHeaderProps) {
  return (
    <div
      className={[
        'flex items-center justify-between mb-2',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <h3 className="text-h2 text-surface-100">{title}</h3>
      {action}
    </div>
  );
}
