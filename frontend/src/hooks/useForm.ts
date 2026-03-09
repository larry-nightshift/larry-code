import { useState, useCallback, type ChangeEvent, type FocusEvent } from 'react';

type ValidationRule = {
  required?: string;
  minLength?: { value: number; message: string };
  maxLength?: { value: number; message: string };
  pattern?: { value: RegExp; message: string };
  custom?: (value: string) => string | undefined;
};

type ValidationStrategy = 'realtime' | 'blur' | 'submit';

type FieldConfig = {
  initialValue?: string;
  rules?: ValidationRule;
  strategy?: ValidationStrategy;
};

type FieldState = {
  value: string;
  error: string | undefined;
  touched: boolean;
};

function validateField(value: string, rules?: ValidationRule): string | undefined {
  if (!rules) return undefined;

  if (rules.required && !value.trim()) {
    return rules.required;
  }
  if (rules.minLength && value.length < rules.minLength.value) {
    return rules.minLength.message;
  }
  if (rules.maxLength && value.length > rules.maxLength.value) {
    return rules.maxLength.message;
  }
  if (rules.pattern && !rules.pattern.value.test(value)) {
    return rules.pattern.message;
  }
  if (rules.custom) {
    return rules.custom(value);
  }

  return undefined;
}

export function useForm<T extends Record<string, FieldConfig>>(fields: T) {
  type FieldName = keyof T & string;

  const [state, setState] = useState<Record<string, FieldState>>(() => {
    const initial: Record<string, FieldState> = {};
    for (const [name, config] of Object.entries(fields)) {
      initial[name] = {
        value: config.initialValue ?? '',
        error: undefined,
        touched: false,
      };
    }
    return initial;
  });

  const handleChange = useCallback(
    (name: FieldName) =>
      (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const value = e.target.value;
        const config = fields[name];
        const strategy = config.strategy ?? 'submit';

        setState((prev) => ({
          ...prev,
          [name]: {
            ...prev[name],
            value,
            error:
              strategy === 'realtime'
                ? validateField(value, config.rules)
                : prev[name].touched && strategy === 'blur'
                  ? validateField(value, config.rules)
                  : prev[name].error,
          },
        }));
      },
    [fields],
  );

  const handleBlur = useCallback(
    (name: FieldName) => (_e: FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const config = fields[name];
      const strategy = config.strategy ?? 'submit';

      if (strategy === 'blur' || strategy === 'realtime') {
        setState((prev) => ({
          ...prev,
          [name]: {
            ...prev[name],
            touched: true,
            error: validateField(prev[name].value, config.rules),
          },
        }));
      }
    },
    [fields],
  );

  const setValue = useCallback((name: FieldName, value: string) => {
    setState((prev) => ({
      ...prev,
      [name]: { ...prev[name], value },
    }));
  }, []);

  const validate = useCallback((): boolean => {
    let isValid = true;
    const updates: Record<string, FieldState> = {};

    for (const [name, config] of Object.entries(fields)) {
      const error = validateField(state[name].value, config.rules);
      updates[name] = { ...state[name], touched: true, error };
      if (error) isValid = false;
    }

    setState(updates);
    return isValid;
  }, [fields, state]);

  const reset = useCallback(() => {
    const initial: Record<string, FieldState> = {};
    for (const [name, config] of Object.entries(fields)) {
      initial[name] = {
        value: config.initialValue ?? '',
        error: undefined,
        touched: false,
      };
    }
    setState(initial);
  }, [fields]);

  const getFieldProps = useCallback(
    (name: FieldName) => ({
      value: state[name]?.value ?? '',
      onChange: handleChange(name),
      onBlur: handleBlur(name),
      error: state[name]?.error,
    }),
    [state, handleChange, handleBlur],
  );

  const values = Object.fromEntries(
    Object.keys(fields).map((name) => [name, state[name]?.value ?? '']),
  ) as Record<FieldName, string>;

  const isValid = Object.entries(fields).every(
    ([name, config]) => !validateField(state[name]?.value ?? '', config.rules),
  );

  return {
    state,
    values,
    isValid,
    getFieldProps,
    setValue,
    validate,
    reset,
  };
}
