/**
 * Style Dictionary CSS adapter — generates dist/css/tokens.css
 *
 * outputReferences: true is non-negotiable. It preserves var(--color-blue-500)
 * chains in the output rather than resolving them to hex. This is what makes
 * deployment skin overrides work at runtime: overriding --color-blue-500 in a
 * skin.css automatically cascades to --color-brand-primary and everything that
 * references it, because the var() chain is still live in the browser.
 */
export default {
  source: ['tokens/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'dist/css/',
      files: [
        {
          destination: 'tokens.css',
          format: 'css/variables',
          options: {
            outputReferences: true
          }
        }
      ]
    }
  }
};
