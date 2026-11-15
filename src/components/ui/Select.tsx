import { forwardRef, type SelectHTMLAttributes } from 'react';

/** Native select (best mobile UX and accessibility) with the shared look. */
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className = '', children, ...rest },
  ref,
) {
  return (
    <select ref={ref} className={`input ${className}`.trim()} {...rest}>
      {children}
    </select>
  );
});
