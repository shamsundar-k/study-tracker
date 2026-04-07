import { useState, type ChangeEvent, type FormEvent } from 'react';
import type { ZodSchema } from 'zod';

interface UseFormOptions<T extends Record<string, unknown>> {
  schema: ZodSchema<T>;
  initial: T;
  onSubmit: (values: T) => Promise<void>;
  onError?: (err: unknown) => void;
}

type Errors<T> = Partial<Record<keyof T, string>>;

export function useForm<T extends Record<string, unknown>>({
  schema,
  initial,
  onSubmit,
  onError,
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initial);
  const [errors, setErrors] = useState<Errors<T>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const coercedValue =
      type === 'number' ? (value === '' ? undefined : Number(value)) : value;
    setValues((prev) => ({ ...prev, [name]: coercedValue }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Errors<T> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof T;
        if (key) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(parsed.data);
    } catch (err) {
      onError?.(err);
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setValues(initial);
    setErrors({});
  };

  return { values, errors, handleChange, handleSubmit, submitting, reset, setValues };
}
