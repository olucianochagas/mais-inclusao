// Ambient module declarations para plugins ESLint sem types publicados.
//
// Estes pacotes funcionam corretamente em runtime — TypeScript apenas não
// consegue inferir o shape do plugin objeto. Declaramos como objeto com
// `configs` opcional para satisfazer o uso típico em flat config.

declare module 'eslint-plugin-import' {
  const plugin: {
    configs?: Record<string, { rules: Record<string, unknown> }>;
    rules?: Record<string, unknown>;
  };
  export default plugin;
}

declare module 'eslint-plugin-security' {
  const plugin: {
    configs?: Record<string, { rules: Record<string, unknown> }>;
    rules?: Record<string, unknown>;
  };
  export default plugin;
}

declare module 'eslint-plugin-simple-import-sort' {
  const plugin: {
    rules?: Record<string, unknown>;
  };
  export default plugin;
}

declare module 'eslint-plugin-jsx-a11y' {
  const plugin: {
    configs: {
      strict: { rules: Record<string, unknown> };
      recommended: { rules: Record<string, unknown> };
    };
    rules?: Record<string, unknown>;
  };
  export default plugin;
}
