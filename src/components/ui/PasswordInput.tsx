import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

/** Password field with a show/hide toggle (touch-sized, keyboard accessible). */
export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>>(
  function PasswordInput({ className = '', ...rest }, ref) {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);
    return (
      <div className="input-group">
        <input
          ref={ref}
          type={visible ? 'text' : 'password'}
          dir="ltr"
          autoCapitalize="none"
          spellCheck={false}
          className={`input input-ltr ${className}`.trim()}
          {...rest}
        />
        <button
          type="button"
          className="input-group-btn"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t('form.hidePassword') : t('form.showPassword')}
          aria-pressed={visible}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {visible ? (
              <>
                <path d="M3 3l18 18" />
                <path d="M10.6 6.1A10.7 10.7 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3.2 3.9M6.6 6.7C3.9 8.4 2.5 12 2.5 12S6 18 12 18c1.5 0 2.8-.4 4-1" />
              </>
            ) : (
              <>
                <path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6S2.5 12 2.5 12z" />
                <circle cx="12" cy="12" r="3" />
              </>
            )}
          </svg>
        </button>
      </div>
    );
  },
);
