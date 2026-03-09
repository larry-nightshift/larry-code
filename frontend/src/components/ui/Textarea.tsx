import {
  type TextareaHTMLAttributes,
  forwardRef,
  useState,
  useCallback,
} from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  validate?: (value: string) => string | undefined;
}

const sizeStyles = {
  sm: 'px-1.5 py-0.5 text-small',
  md: 'px-2 py-1 text-body',
  lg: 'px-2.5 py-1.5 text-body',
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error: externalError,
      hint,
      size = 'md',
      fullWidth = true,
      validate,
      className = '',
      onChange,
      onBlur,
      rows = 3,
      ...props
    },
    ref,
  ) => {
    const [internalError, setInternalError] = useState<string>();
    const [touched, setTouched] = useState(false);
    const error = externalError ?? internalError;

    const runValidation = useCallback(
      (value: string) => {
        if (validate) {
          setInternalError(validate(value));
        }
      },
      [validate],
    );

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange?.(e);
      },
      [onChange],
    );

    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLTextAreaElement>) => {
        onBlur?.(e);
        setTouched(true);
        runValidation(e.target.value);
      },
      [onBlur, touched, runValidation],
    );

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label className="block text-caption font-medium text-surface-300 mb-0.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          rows={rows}
          onChange={handleChange}
          onBlur={handleBlur}
          className={[
            'block rounded bg-surface-800 border text-surface-100 placeholder-surface-500 transition-all duration-200 resize-y',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500',
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
        />
        {error && <p className="mt-0.5 text-small text-danger-400">{error}</p>}
        {!error && hint && (
          <p className="mt-0.5 text-small text-surface-500">{hint}</p>
        )}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
