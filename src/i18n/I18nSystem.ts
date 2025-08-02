import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { formatDistance, formatRelative, format as formatDate } from 'date-fns';
import * as locales from 'date-fns/locale';

// Language configuration
export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  pluralRule: (count: number) => number;
  numberFormat: Intl.NumberFormatOptions;
  dateFormat: string;
  timeFormat: string;
  currency: string;
  flag: string;
  region: string;
  fallback?: string;
}

// Translation interfaces
export interface TranslationValue {
  [key: string]: string | TranslationValue | string[];
}

export interface TranslationFile {
  [key: string]: TranslationValue;
}

export interface InterpolationContext {
  [key: string]: string | number | Date | boolean;
}

export interface PluralOptions {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
}

// Supported languages
export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    pluralRule: (n) => n === 1 ? 0 : 1,
    numberFormat: { style: 'decimal' },
    dateFormat: 'MMMM d, yyyy',
    timeFormat: 'h:mm a',
    currency: 'USD',
    flag: '🇺🇸',
    region: 'US'
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    direction: 'ltr',
    pluralRule: (n) => n === 1 ? 0 : 1,
    numberFormat: { style: 'decimal' },
    dateFormat: 'd \'de\' MMMM \'de\' yyyy',
    timeFormat: 'HH:mm',
    currency: 'EUR',
    flag: '🇪🇸',
    region: 'ES',
    fallback: 'en'
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    direction: 'ltr',
    pluralRule: (n) => n === 0 || n === 1 ? 0 : 1,
    numberFormat: { style: 'decimal' },
    dateFormat: 'd MMMM yyyy',
    timeFormat: 'HH:mm',
    currency: 'EUR',
    flag: '🇫🇷',
    region: 'FR',
    fallback: 'en'
  },
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    direction: 'ltr',
    pluralRule: (n) => n === 1 ? 0 : 1,
    numberFormat: { style: 'decimal' },
    dateFormat: 'd. MMMM yyyy',
    timeFormat: 'HH:mm',
    currency: 'EUR',
    flag: '🇩🇪',
    region: 'DE',
    fallback: 'en'
  },
  {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    direction: 'ltr',
    pluralRule: (n) => n === 1 ? 0 : 1,
    numberFormat: { style: 'decimal' },
    dateFormat: 'd MMMM yyyy',
    timeFormat: 'HH:mm',
    currency: 'EUR',
    flag: '🇮🇹',
    region: 'IT',
    fallback: 'en'
  },
  {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    direction: 'ltr',
    pluralRule: (n) => n === 1 ? 0 : 1,
    numberFormat: { style: 'decimal' },
    dateFormat: 'd \'de\' MMMM \'de\' yyyy',
    timeFormat: 'HH:mm',
    currency: 'BRL',
    flag: '🇧🇷',
    region: 'BR',
    fallback: 'en'
  },
  {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    direction: 'ltr',
    pluralRule: (n) => {
      if (n % 10 === 1 && n % 100 !== 11) return 0;
      if (n % 10 >= 2 && n % 10 <= 4 && !(n % 100 >= 12 && n % 100 <= 14)) return 1;
      return 2;
    },
    numberFormat: { style: 'decimal' },
    dateFormat: 'd MMMM yyyy \'г.\'',
    timeFormat: 'HH:mm',
    currency: 'RUB',
    flag: '🇷🇺',
    region: 'RU',
    fallback: 'en'
  },
  {
    code: 'zh',
    name: 'Chinese (Simplified)',
    nativeName: '简体中文',
    direction: 'ltr',
    pluralRule: () => 0,
    numberFormat: { style: 'decimal' },
    dateFormat: 'yyyy年M月d日',
    timeFormat: 'HH:mm',
    currency: 'CNY',
    flag: '🇨🇳',
    region: 'CN',
    fallback: 'en'
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    direction: 'ltr',
    pluralRule: () => 0,
    numberFormat: { style: 'decimal' },
    dateFormat: 'yyyy年M月d日',
    timeFormat: 'HH:mm',
    currency: 'JPY',
    flag: '🇯🇵',
    region: 'JP',
    fallback: 'en'
  },
  {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    direction: 'ltr',
    pluralRule: () => 0,
    numberFormat: { style: 'decimal' },
    dateFormat: 'yyyy년 M월 d일',
    timeFormat: 'HH:mm',
    currency: 'KRW',
    flag: '🇰🇷',
    region: 'KR',
    fallback: 'en'
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    direction: 'rtl',
    pluralRule: (n) => {
      if (n === 0) return 0;
      if (n === 1) return 1;
      if (n === 2) return 2;
      if (n % 100 >= 3 && n % 100 <= 10) return 3;
      if (n % 100 >= 11) return 4;
      return 5;
    },
    numberFormat: { style: 'decimal' },
    dateFormat: 'd MMMM yyyy',
    timeFormat: 'HH:mm',
    currency: 'SAR',
    flag: '🇸🇦',
    region: 'SA',
    fallback: 'en'
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    direction: 'ltr',
    pluralRule: (n) => n === 1 ? 0 : 1,
    numberFormat: { style: 'decimal' },
    dateFormat: 'd MMMM yyyy',
    timeFormat: 'HH:mm',
    currency: 'INR',
    flag: '🇮🇳',
    region: 'IN',
    fallback: 'en'
  },
  {
    code: 'tr',
    name: 'Turkish',
    nativeName: 'Türkçe',
    direction: 'ltr',
    pluralRule: (n) => n === 1 ? 0 : 1,
    numberFormat: { style: 'decimal' },
    dateFormat: 'd MMMM yyyy',
    timeFormat: 'HH:mm',
    currency: 'TRY',
    flag: '🇹🇷',
    region: 'TR',
    fallback: 'en'
  },
  {
    code: 'pl',
    name: 'Polish',
    nativeName: 'Polski',
    direction: 'ltr',
    pluralRule: (n) => {
      if (n === 1) return 0;
      if (n % 10 >= 2 && n % 10 <= 4 && !(n % 100 >= 12 && n % 100 <= 14)) return 1;
      return 2;
    },
    numberFormat: { style: 'decimal' },
    dateFormat: 'd MMMM yyyy',
    timeFormat: 'HH:mm',
    currency: 'PLN',
    flag: '🇵🇱',
    region: 'PL',
    fallback: 'en'
  },
  {
    code: 'nl',
    name: 'Dutch',
    nativeName: 'Nederlands',
    direction: 'ltr',
    pluralRule: (n) => n === 1 ? 0 : 1,
    numberFormat: { style: 'decimal' },
    dateFormat: 'd MMMM yyyy',
    timeFormat: 'HH:mm',
    currency: 'EUR',
    flag: '🇳🇱',
    region: 'NL',
    fallback: 'en'
  },
  {
    code: 'sv',
    name: 'Swedish',
    nativeName: 'Svenska',
    direction: 'ltr',
    pluralRule: (n) => n === 1 ? 0 : 1,
    numberFormat: { style: 'decimal' },
    dateFormat: 'd MMMM yyyy',
    timeFormat: 'HH:mm',
    currency: 'SEK',
    flag: '🇸🇪',
    region: 'SE',
    fallback: 'en'
  },
  {
    code: 'da',
    name: 'Danish',
    nativeName: 'Dansk',
    direction: 'ltr',
    pluralRule: (n) => n === 1 ? 0 : 1,
    numberFormat: { style: 'decimal' },
    dateFormat: 'd. MMMM yyyy',
    timeFormat: 'HH:mm',
    currency: 'DKK',
    flag: '🇩🇰',
    region: 'DK',
    fallback: 'en'
  },
  {
    code: 'no',
    name: 'Norwegian',
    nativeName: 'Norsk',
    direction: 'ltr',
    pluralRule: (n) => n === 1 ? 0 : 1,
    numberFormat: { style: 'decimal' },
    dateFormat: 'd. MMMM yyyy',
    timeFormat: 'HH:mm',
    currency: 'NOK',
    flag: '🇳🇴',
    region: 'NO',
    fallback: 'en'
  },
  {
    code: 'fi',
    name: 'Finnish',
    nativeName: 'Suomi',
    direction: 'ltr',
    pluralRule: (n) => n === 1 ? 0 : 1,
    numberFormat: { style: 'decimal' },
    dateFormat: 'd. MMMM yyyy',
    timeFormat: 'HH:mm',
    currency: 'EUR',
    flag: '🇫🇮',
    region: 'FI',
    fallback: 'en'
  },
  {
    code: 'he',
    name: 'Hebrew',
    nativeName: 'עברית',
    direction: 'rtl',
    pluralRule: (n) => {
      if (n === 1) return 0;
      if (n === 2) return 1;
      return 2;
    },
    numberFormat: { style: 'decimal' },
    dateFormat: 'd בMMMM yyyy',
    timeFormat: 'HH:mm',
    currency: 'ILS',
    flag: '🇮🇱',
    region: 'IL',
    fallback: 'en'
  },
  {
    code: 'th',
    name: 'Thai',
    nativeName: 'ไทย',
    direction: 'ltr',
    pluralRule: () => 0,
    numberFormat: { style: 'decimal' },
    dateFormat: 'd MMMM yyyy',
    timeFormat: 'HH:mm',
    currency: 'THB',
    flag: '🇹🇭',
    region: 'TH',
    fallback: 'en'
  },
  {
    code: 'vi',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    direction: 'ltr',
    pluralRule: () => 0,
    numberFormat: { style: 'decimal' },
    dateFormat: 'd MMMM yyyy',
    timeFormat: 'HH:mm',
    currency: 'VND',
    flag: '🇻🇳',
    region: 'VN',
    fallback: 'en'
  },
  {
    code: 'id',
    name: 'Indonesian',
    nativeName: 'Bahasa Indonesia',
    direction: 'ltr',
    pluralRule: () => 0,
    numberFormat: { style: 'decimal' },
    dateFormat: 'd MMMM yyyy',
    timeFormat: 'HH:mm',
    currency: 'IDR',
    flag: '🇮🇩',
    region: 'ID',
    fallback: 'en'
  }
];

/**
 * Advanced Internationalization System
 */
export class I18nSystem {
  private currentLanguage: LanguageConfig;
  private translations: Map<string, TranslationFile> = new Map();
  private fallbackTranslations: Map<string, TranslationFile> = new Map();
  private cache: Map<string, string> = new Map();
  private interpolationRegex = /\{\{([^}]+)\}\}/g;
  private contextSeparator = ':';
  
  // Event system for language changes
  private listeners: Set<(language: LanguageConfig) => void> = new Set();

  constructor(initialLanguage = 'en') {
    this.currentLanguage = this.getLanguageConfig(initialLanguage);
    this.loadTranslations();
  }

  // Language management
  getLanguageConfig(code: string): LanguageConfig {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === code) || SUPPORTED_LANGUAGES[0];
  }

  getCurrentLanguage(): LanguageConfig {
    return this.currentLanguage;
  }

  getSupportedLanguages(): LanguageConfig[] {
    return SUPPORTED_LANGUAGES;
  }

  async setLanguage(code: string): Promise<void> {
    const newLanguage = this.getLanguageConfig(code);
    if (newLanguage.code === this.currentLanguage.code) return;

    this.currentLanguage = newLanguage;
    this.cache.clear();
    
    await this.loadTranslations();
    this.updateDocumentLanguage();
    this.notifyLanguageChange();
    
    // Store preference
    localStorage.setItem('studygenius_language', code);
  }

  private updateDocumentLanguage(): void {
    document.documentElement.lang = this.currentLanguage.code;
    document.documentElement.dir = this.currentLanguage.direction;
    
    // Add RTL class for styling
    if (this.currentLanguage.direction === 'rtl') {
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.classList.remove('rtl');
    }
  }

  // Translation loading
  private async loadTranslations(): Promise<void> {
    try {
      // Load main translations
      const mainTranslations = await this.loadTranslationFile(this.currentLanguage.code);
      this.translations.set(this.currentLanguage.code, mainTranslations);

      // Load fallback translations if specified
      if (this.currentLanguage.fallback) {
        const fallbackTranslations = await this.loadTranslationFile(this.currentLanguage.fallback);
        this.fallbackTranslations.set(this.currentLanguage.code, fallbackTranslations);
      }
    } catch (error) {
      console.error(`Failed to load translations for ${this.currentLanguage.code}:`, error);
    }
  }

  private async loadTranslationFile(languageCode: string): Promise<TranslationFile> {
    try {
      // Try to load from dynamic imports
      const module = await import(`./locales/${languageCode}.json`);
      return module.default || module;
    } catch (error) {
      // Fallback to fetch if dynamic import fails
      try {
        const response = await fetch(`/locales/${languageCode}.json`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } catch (fetchError) {
        console.warn(`Failed to load translation file for ${languageCode}:`, fetchError);
        return {};
      }
    }
  }

  // Core translation methods
  translate(
    key: string, 
    context?: InterpolationContext, 
    count?: number,
    defaultValue?: string
  ): string {
    const cacheKey = this.buildCacheKey(key, context, count);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    let translation = this.getTranslation(key, count);
    
    // Apply interpolation if context provided
    if (context && translation) {
      translation = this.interpolate(translation, context);
    }

    // Use default value if translation not found
    if (!translation && defaultValue) {
      translation = defaultValue;
    }

    // Fall back to key if no translation found
    if (!translation) {
      translation = key;
      console.warn(`Translation missing for key: ${key} (${this.currentLanguage.code})`);
    }

    // Cache the result
    this.cache.set(cacheKey, translation);
    
    return translation;
  }

  private getTranslation(key: string, count?: number): string | null {
    const keys = key.split('.');
    const mainTranslations = this.translations.get(this.currentLanguage.code) || {};
    const fallbackTranslations = this.fallbackTranslations.get(this.currentLanguage.code) || {};

    // Try to get from main translations
    let value = this.getNestedValue(mainTranslations, keys);
    
    // Try fallback if not found
    if (value === null) {
      value = this.getNestedValue(fallbackTranslations, keys);
    }

    // Handle pluralization
    if (value && typeof value === 'object' && count !== undefined) {
      return this.handlePluralization(value as PluralOptions, count);
    }

    return typeof value === 'string' ? value : null;
  }

  private getNestedValue(obj: any, keys: string[]): any {
    let current = obj;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return null;
      }
    }
    
    return current;
  }

  private handlePluralization(options: PluralOptions, count: number): string {
    const pluralForm = this.currentLanguage.pluralRule(count);
    const pluralKeys = ['zero', 'one', 'two', 'few', 'many', 'other'];
    
    // Try to get the specific plural form
    for (let i = pluralForm; i >= 0; i--) {
      const key = pluralKeys[i];
      if (key && options[key as keyof PluralOptions]) {
        return options[key as keyof PluralOptions]!;
      }
    }
    
    // Fallback to 'other'
    return options.other;
  }

  private interpolate(template: string, context: InterpolationContext): string {
    return template.replace(this.interpolationRegex, (match, key) => {
      const trimmedKey = key.trim();
      const value = context[trimmedKey];
      
      if (value === undefined || value === null) {
        console.warn(`Interpolation variable '${trimmedKey}' not found in context`);
        return match; // Return original placeholder
      }
      
      // Handle different value types
      if (value instanceof Date) {
        return this.formatDate(value);
      }
      
      if (typeof value === 'number') {
        return this.formatNumber(value);
      }
      
      return String(value);
    });
  }

  private buildCacheKey(key: string, context?: InterpolationContext, count?: number): string {
    const parts = [this.currentLanguage.code, key];
    
    if (count !== undefined) {
      parts.push(`count:${count}`);
    }
    
    if (context) {
      const contextStr = Object.entries(context)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}:${v}`)
        .join(',');
      parts.push(`ctx:${contextStr}`);
    }
    
    return parts.join('|');
  }

  // Formatting methods
  formatNumber(
    value: number, 
    options?: Intl.NumberFormatOptions
  ): string {
    const formatOptions = {
      ...this.currentLanguage.numberFormat,
      ...options
    };
    
    return new Intl.NumberFormat(this.currentLanguage.code, formatOptions).format(value);
  }

  formatCurrency(
    value: number, 
    currency?: string, 
    options?: Intl.NumberFormatOptions
  ): string {
    const formatOptions: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: currency || this.currentLanguage.currency,
      ...options
    };
    
    return new Intl.NumberFormat(this.currentLanguage.code, formatOptions).format(value);
  }

  formatDate(
    date: Date, 
    formatStyle?: 'full' | 'long' | 'medium' | 'short' | string
  ): string {
    if (typeof formatStyle === 'string' && !['full', 'long', 'medium', 'short'].includes(formatStyle)) {
      // Custom format string
      const locale = this.getDateFnsLocale();
      return formatDate(date, formatStyle, { locale });
    }
    
    const options: Intl.DateTimeFormatOptions = {
      dateStyle: formatStyle as any || 'medium'
    };
    
    return new Intl.DateTimeFormat(this.currentLanguage.code, options).format(date);
  }

  formatTime(
    date: Date, 
    options?: Intl.DateTimeFormatOptions
  ): string {
    const formatOptions: Intl.DateTimeFormatOptions = {
      timeStyle: 'short',
      ...options
    };
    
    return new Intl.DateTimeFormat(this.currentLanguage.code, formatOptions).format(date);
  }

  formatRelativeTime(date: Date): string {
    const locale = this.getDateFnsLocale();
    return formatRelative(date, new Date(), { locale });
  }

  formatDistance(date: Date, baseDate: Date = new Date()): string {
    const locale = this.getDateFnsLocale();
    return formatDistance(date, baseDate, { locale, addSuffix: true });
  }

  private getDateFnsLocale(): Locale {
    const localeMap: { [key: string]: any } = {
      en: locales.enUS,
      es: locales.es,
      fr: locales.fr,
      de: locales.de,
      it: locales.it,
      pt: locales.ptBR,
      ru: locales.ru,
      zh: locales.zhCN,
      ja: locales.ja,
      ko: locales.ko,
      ar: locales.ar,
      hi: locales.hi,
      tr: locales.tr,
      pl: locales.pl,
      nl: locales.nl,
      sv: locales.sv,
      da: locales.da,
      no: locales.nb,
      fi: locales.fi,
      he: locales.he,
      th: locales.th,
      vi: locales.vi,
      id: locales.id
    };
    
    return localeMap[this.currentLanguage.code] || locales.enUS;
  }

  // Utility methods
  isRTL(): boolean {
    return this.currentLanguage.direction === 'rtl';
  }

  getLanguageFlag(): string {
    return this.currentLanguage.flag;
  }

  getLanguageNativeName(): string {
    return this.currentLanguage.nativeName;
  }

  // Context-aware translations
  translateWithContext(
    key: string, 
    contextKey: string, 
    context?: InterpolationContext, 
    count?: number
  ): string {
    const contextualKey = `${key}${this.contextSeparator}${contextKey}`;
    
    // Try contextual translation first
    let translation = this.getTranslation(contextualKey, count);
    
    // Fall back to base key if contextual not found
    if (!translation) {
      translation = this.getTranslation(key, count);
    }
    
    // Apply interpolation
    if (context && translation) {
      translation = this.interpolate(translation, context);
    }
    
    return translation || key;
  }

  // Lazy loading
  async loadNamespace(namespace: string): Promise<void> {
    try {
      const translations = await this.loadTranslationFile(`${this.currentLanguage.code}/${namespace}`);
      const currentTranslations = this.translations.get(this.currentLanguage.code) || {};
      
      // Merge namespace translations
      this.translations.set(this.currentLanguage.code, {
        ...currentTranslations,
        [namespace]: translations
      });
      
      // Clear relevant cache entries
      this.clearCacheForNamespace(namespace);
      
    } catch (error) {
      console.error(`Failed to load namespace ${namespace}:`, error);
    }
  }

  private clearCacheForNamespace(namespace: string): void {
    const prefix = `${this.currentLanguage.code}|${namespace}.`;
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  // Event system
  onLanguageChange(listener: (language: LanguageConfig) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyLanguageChange(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentLanguage);
      } catch (error) {
        console.error('Error in language change listener:', error);
      }
    });
  }

  // Translation validation and debugging
  validateTranslations(): { missing: string[], invalid: string[] } {
    const missing: string[] = [];
    const invalid: string[] = [];
    
    // This would validate all translation keys against a base schema
    // Implementation details depend on your validation requirements
    
    return { missing, invalid };
  }

  getTranslationCoverage(): number {
    const mainTranslations = this.translations.get(this.currentLanguage.code) || {};
    const baseTranslations = this.translations.get('en') || {};
    
    const mainKeys = this.getAllKeys(mainTranslations);
    const baseKeys = this.getAllKeys(baseTranslations);
    
    if (baseKeys.length === 0) return 100;
    
    const coveredKeys = mainKeys.filter(key => baseKeys.includes(key));
    return (coveredKeys.length / baseKeys.length) * 100;
  }

  private getAllKeys(obj: any, prefix = ''): string[] {
    const keys: string[] = [];
    
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        keys.push(...this.getAllKeys(value, fullKey));
      } else {
        keys.push(fullKey);
      }
    }
    
    return keys;
  }

  // Cache management
  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  getCacheStats(): { size: number, memory: number } {
    const size = this.cache.size;
    const memory = JSON.stringify([...this.cache.entries()]).length;
    
    return { size, memory };
  }

  // Export/Import for translation management
  exportTranslations(languageCode?: string): TranslationFile {
    const code = languageCode || this.currentLanguage.code;
    return this.translations.get(code) || {};
  }

  importTranslations(languageCode: string, translations: TranslationFile): void {
    this.translations.set(languageCode, translations);
    this.clearCache();
  }

  // Initialize from user preferences
  static async initialize(): Promise<I18nSystem> {
    const savedLanguage = localStorage.getItem('studygenius_language');
    const browserLanguage = navigator.language.split('-')[0];
    const defaultLanguage = savedLanguage || browserLanguage || 'en';
    
    const i18n = new I18nSystem(defaultLanguage);
    await i18n.loadTranslations();
    
    return i18n;
  }
}

// React Context and Hooks
interface I18nContextType {
  i18n: I18nSystem;
  language: LanguageConfig;
  t: (key: string, context?: InterpolationContext, count?: number) => string;
  tc: (key: string, contextKey: string, context?: InterpolationContext, count?: number) => string;
  setLanguage: (code: string) => Promise<void>;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (value: number, currency?: string, options?: Intl.NumberFormatOptions) => string;
  formatDate: (date: Date, format?: string) => string;
  formatTime: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
  formatRelativeTime: (date: Date) => string;
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children, i18n }: { children: ReactNode; i18n: I18nSystem }) {
  const [language, setLanguage] = useState(i18n.getCurrentLanguage());

  useEffect(() => {
    return i18n.onLanguageChange(setLanguage);
  }, [i18n]);

  const contextValue: I18nContextType = {
    i18n,
    language,
    t: (key, context, count) => i18n.translate(key, context, count),
    tc: (key, contextKey, context, count) => i18n.translateWithContext(key, contextKey, context, count),
    setLanguage: i18n.setLanguage.bind(i18n),
    formatNumber: i18n.formatNumber.bind(i18n),
    formatCurrency: i18n.formatCurrency.bind(i18n),
    formatDate: i18n.formatDate.bind(i18n),
    formatTime: i18n.formatTime.bind(i18n),
    formatRelativeTime: i18n.formatRelativeTime.bind(i18n),
    isRTL: i18n.isRTL()
  };

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// Convenience hooks
export function useTranslation() {
  const { t, tc } = useI18n();
  return { t, tc };
}

export function useLanguage() {
  const { language, setLanguage } = useI18n();
  return { language, setLanguage };
}

export function useLocalization() {
  const { formatNumber, formatCurrency, formatDate, formatTime, formatRelativeTime, isRTL } = useI18n();
  return { formatNumber, formatCurrency, formatDate, formatTime, formatRelativeTime, isRTL };
}

// Export singleton instance
export const i18nSystem = new I18nSystem();
export default i18nSystem;