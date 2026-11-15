import { forwardRef, type InputHTMLAttributes } from 'react';

/** Plain text input with the shared look. Spread `register()` onto it. */
export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function TextInput(
  { className = '', ...rest },
  ref,
) {
  return <input ref={ref} className={`input ${className}`.trim()} {...rest} />;
});

/** Phone numbers: LTR digits, numeric keypad, no spell-checking or autocapitalization. */
export const PhoneInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function PhoneInput(
  { className = '', ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      type="tel"
      inputMode="tel"
      dir="ltr"
      autoComplete="tel"
      autoCapitalize="none"
      spellCheck={false}
      className={`input input-ltr ${className}`.trim()}
      {...rest}
    />
  );
});

/** One-time codes: LTR, numeric keypad, one-time-code autofill. */
export const OtpInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function OtpInput(
  { className = '', ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      type="text"
      inputMode="numeric"
      dir="ltr"
      autoComplete="one-time-code"
      autoCapitalize="none"
      spellCheck={false}
      className={`input input-ltr ${className}`.trim()}
      {...rest}
    />
  );
});
