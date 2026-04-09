import { ptBR } from './locales/pt-BR';
import { en } from './locales/en';
import { es } from './locales/es';

export type LangCode = 'pt-BR' | 'en' | 'es';

const STORAGE_KEY = 'super_maze_lang';

const locales: Record<LangCode, Record<string, string>> = {
  'pt-BR': ptBR,
  'en': en,
  'es': es,
};

export interface LangMeta {
  code: LangCode;
  /** Display icon shown in the switcher button and dropdown */
  icon: string;
  /** Language name in its own language */
  name: string;
}

export const LANGUAGES: LangMeta[] = [
  { code: 'pt-BR', icon: '🇧🇷', name: 'Português' },
  { code: 'en',    icon: '🇺🇸', name: 'English'   },
  { code: 'es',    icon: 'Ñ',   name: 'Español'   },
];

function detectLanguage(): LangCode {
  const saved = localStorage.getItem(STORAGE_KEY) as LangCode | null;
  if (saved && saved in locales) return saved;

  const nav = (navigator.language ?? 'en').toLowerCase();
  if (nav.startsWith('pt')) return 'pt-BR';
  if (nav.startsWith('es')) return 'es';
  return 'en';
}

let _current: LangCode = detectLanguage();

/** Returns the active locale code. */
export function getLanguage(): LangCode {
  return _current;
}

/** Switches the active locale and persists the choice. */
export function setLanguage(lang: LangCode): void {
  _current = lang;
  localStorage.setItem(STORAGE_KEY, lang);
}

/**
 * Translates a key using the active locale, with optional variable substitution.
 * Variables use {varName} syntax.  Falls back to English, then the raw key.
 *
 * @example t('run.found.steps', { steps: 42, iters: 120 })
 */
export function t(key: string, vars?: Record<string, string | number>): string {
  let str = locales[_current][key] ?? locales['en'][key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replaceAll(`{${k}}`, String(v));
    }
  }
  return str;
}

/**
 * Returns toLocaleDateString formatted according to the active locale.
 */
export function localeDateString(date: Date): string {
  const localeMap: Record<LangCode, string> = {
    'pt-BR': 'pt-BR',
    'en':    'en-US',
    'es':    'es-MX',
  };
  return date.toLocaleDateString(localeMap[_current]);
}
