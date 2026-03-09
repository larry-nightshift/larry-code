import { type SelectHTMLAttributes, forwardRef } from 'react';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  options: SelectOption[];
  placeholder?: string;
}

const sizeStyles = {
  sm: 'px-1.5 py-0.5 text-small',
  md: 'px-2 py-1 text-body',
  lg: 'px-2.5 py-1.5 text-body',
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      size = 'md',
      fullWidth = true,
      options,
      placeholder,
      className = '',
      ...props
    },
    ref,
  ) => {
    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label className="block text-caption font-medium text-surface-300 mb-0.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={[
            'block rounded bg-surface-800 border text-surface-100 transition-all duration-200 appearance-none',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500',
            'bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E")] bg-[length:16px] bg-[right_8px_center] bg-no-repeat pr-4',
            error
              ? 'border-danger-500 focus:ring-danger-500/50 focus:border-danger-500'
              : 'border-surface-600 hover:border-surface-500',
            sizeStyles[size],
            fullWidth ? 'w-full' : '',
            props.disabled ? 'opacity-50 cursor-not-allowed' : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-0.5 text-small text-danger-400">{error}</p>}
        {!error && hint && (
          <p className="mt-0.5 text-small text-surface-500">{hint}</p>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';
