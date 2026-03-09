import {
  type InputHTMLAttributes,
  forwardRef,
  useState,
  useCallback,
} from 'react';

type ValidationTiming = 'realtime' | 'blur' | 'submit';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  validate?: (value: string) => string | undefined;
}

const REALTIME_TYPES = new Set(['email', 'url', 'password']);

function getValidationTiming(type?: string): ValidationTiming {
  if (REALTIME_TYPES.has(type ?? '')) return 'realtime';
  return 'blur';
}

const sizeStyles = {
  sm: 'px-1.5 py-0.5 text-small',
  md: 'px-2 py-1 text-body',
  lg: 'px-2.5 py-1.5 text-body',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error: externalError,
      hint,
      size = 'md',
      fullWidth = true,
      validate,
      className = '',
      type,
      onChange,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const [internalError, setInternalError] = useState<string>();
    const [touched, setTouched] = useState(false);
    const error = externalError ?? internalError;
    const timing = getValidationTiming(type);

    const runValidation = useCallback(
      (value: string) => {
        if (validate) {
          setInternalError(validate(value));
        }
      },
      [validate],
    );

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange?.(e);
        if (timing === 'realtime' && touched) {
          runValidation(e.target.value);
        }
      },
      [onChange, timing, touched, runValidation],
    );

    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        onBlur?.(e);
        setTouched(true);
        if (timing === 'blur' || timing === 'realtime') {
          runValidation(e.target.value);
        }
      },
      [onBlur, timing, runValidation],
    );

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label className="block text-caption font-medium text-surface-300 mb-0.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          onChange={handleChange}
          onBlur={handleBlur}
          className={[
            'block rounded bg-surface-800 border text-surface-100 placeholder-surface-500 transition-all duration-200',
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

Input.displayName = 'Input';
