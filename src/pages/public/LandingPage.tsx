import { useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { ROUTES } from '@/app/routes/paths';
import { ButtonLink } from '@/components/ui';
import {
  BREAKPOINT_NAMES,
  BREAKPOINTS,
  env,
  LANGUAGE_DIRECTION,
  mediaMinWidth,
  type BreakpointName,
} from '@/app/config';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useRoleState } from '@/hooks/useRoleState';
import { roleHomePath } from '@/utils/roles';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useViewportSize } from '@/hooks/useViewportSize';
import { useAuthStore, usePreferencesStore } from '@/store';
import styles from './LandingPage.module.css';

const GRID_TILES = 8;

/** Temporary verification page (not a business module): proves providers, routing, i18n/RTL, theme and responsiveness. */
export default function LandingPage() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const queryClient = useQueryClient();
  const language = usePreferencesStore((s) => s.language);
  const signedIn = useAuthStore((s) => s.status === 'authenticated');
  const { active } = useRoleState();
  const theme = usePreferencesStore((s) => s.theme);
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const { width, height } = useViewportSize();
  const breakpoint = useBreakpoint();

  const direction = LANGUAGE_DIRECTION[language];
  const appliedTheme = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;
  const activeIndex = breakpoint === 'base' ? -1 : BREAKPOINT_NAMES.indexOf(breakpoint);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <h1 className={styles.title}>{t('app.title')}</h1>
        <p className={styles.status}>{t('landing.status')}</p>
        <p className={styles.intro}>{t('verify.intro')}</p>
        <div className={styles.cta}>
          {signedIn ? (
            <ButtonLink variant="primary" to={roleHomePath(active) ?? ROUTES.myDevices}>
              {t('landing.myDevices')}
            </ButtonLink>
          ) : (
            <>
              <ButtonLink variant="primary" to={ROUTES.login}>
                {t('landing.signIn')}
              </ButtonLink>
              <ButtonLink to={ROUTES.register}>{t('landing.register')}</ButtonLink>
            </>
          )}
        </div>
      </section>

      <div className={styles.cards}>
        <Card title={t('verify.language.title')}>
          <Row label={t('verify.language.current')} value={t(`verify.language.names.${language}`)} />
          <Row label={t('verify.language.direction')} value={t(`verify.language.${direction}`)} />
        </Card>
        <Card title={t('verify.theme.title')}>
          <Row label={t('verify.theme.preference')} value={t(`theme.${theme}`)} />
          <Row label={t('verify.theme.applied')} value={t(`theme.${appliedTheme}`)} />
        </Card>
        <Card title={t('verify.viewport.title')}>
          <Row label={t('verify.viewport.size')} value={<bdi dir="ltr">{`${width} × ${height}`}</bdi>} />
          <Row label={t('verify.viewport.breakpoint')} value={<bdi dir="ltr">{breakpoint}</bdi>} />
        </Card>
        <Card title={t('verify.runtime.title')}>
          <Row label={t('verify.runtime.path')} value={<bdi dir="ltr">{pathname}</bdi>} />
          <Row label={t('verify.runtime.router')} value={t('verify.ok')} />
          <Row label={t('verify.runtime.i18n')} value={t('verify.ok')} />
          <Row label={t('verify.runtime.query')} value={queryClient ? t('verify.ready') : '—'} />
          <Row label={t('verify.runtime.store')} value={t('verify.ready')} />
        </Card>
        <Card title={t('verify.api.title')}>
          <Row label={t('verify.api.baseUrl')} value={env.apiBaseUrl ? t('verify.configured') : t('verify.notConfigured')} />
          <Row label={t('verify.api.timeout')} value={<bdi dir="ltr">{`${env.apiTimeoutMs} ms`}</bdi>} />
        </Card>
      </div>

      <section className={styles.section} aria-labelledby="bp-title">
        <h2 id="bp-title" className={styles.sectionTitle}>
          {t('verify.breakpoints.title')}
        </h2>
        <p className="muted">{t('verify.breakpoints.hint')}</p>
        <ul className={styles.breakpoints}>
          <li className={styles.chip} aria-current={breakpoint === 'base' ? 'true' : undefined} data-active={breakpoint === 'base'}>
            <bdi dir="ltr">base</bdi>
          </li>
          {BREAKPOINT_NAMES.map((name, index) => (
            <BreakpointChip key={name} name={name} active={index <= activeIndex} current={index === activeIndex} />
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="grid-title">
        <h2 id="grid-title" className={styles.sectionTitle}>
          {t('verify.grid.title')}
        </h2>
        <ul className={styles.grid}>
          {Array.from({ length: GRID_TILES }, (_, i) => (
            <li key={i} className={styles.tile}>
              {t('verify.grid.tile', { n: i + 1 })}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className={styles.card}>
      <h2 className={styles.cardTitle}>{title}</h2>
      <dl className={styles.list}>{children}</dl>
    </article>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className={styles.row}>
      <dt className="muted">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function BreakpointChip({ name, active, current }: { name: BreakpointName; active: boolean; current: boolean }) {
  return (
    <li className={styles.chip} data-active={active} aria-current={current ? 'true' : undefined} title={mediaMinWidth(name)}>
      <bdi dir="ltr">{`${name} ≥ ${BREAKPOINTS[name]}`}</bdi>
    </li>
  );
}
