const configuredName = import.meta.env.VITE_APP_NAME?.trim();

/** Public, client-side configuration only. Never place private keys in VITE_* variables. */
export const appConfig = {
  name: configuredName || 'SAETA MAPS',
  environment: import.meta.env.MODE,
  isProduction: import.meta.env.PROD,
} as const;
