import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';

/** Theme + language controls shared by every layout header / drawer. */
export function HeaderControls({ className }: { className?: string }) {
  return (
    <div className={className}>
      <ThemeToggle />
      <LanguageSwitcher />
    </div>
  );
}
