/**
 * In Tailwind v4 brauchst du 'tailwindcss/nesting' nicht mehr in den Plugins,
 * da Tailwind das CSS-Nesting nativ handhabt.
 */
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};