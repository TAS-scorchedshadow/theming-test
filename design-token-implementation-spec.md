# Design Token Architecture — Implementation Spec

## Purpose
This document is an implementation reference for the design token architecture used across internal client deployments. Read it fully before generating any code, file structure, or configuration.

---

## Architecture Overview

Three layers. Each layer has a strict ownership boundary.

```
Layer 1 — Token source         @your-org/design-tokens          (primitives + semantic aliases only)
Layer 2 — Framework adapters   @your-org/design-tokens/[target]  (generated dist outputs per framework)
Layer 3 — Component tokens     @your-org/[component-lib]/styles  (each lib owns its own component tokens)
```

**Critical rule:** Component tokens (`--button-primary-bg`) are defined inside their component library, not in the tokens package. The tokens package publishes only primitives and semantic aliases. Component libraries import the CSS vars output and define their own component-level tokens on top.

---

## Repository Structure

Monorepo. Use nx for dependency graph and affected builds.

```
packages/
├── design-tokens/              @your-org/design-tokens
│   ├── tokens/
│   │   ├── color.json
│   │   ├── spacing.json
│   │   ├── typography.json
│   │   └── radius.json
│   ├── adapters/
│   │   ├── css.config.js       → dist/css/tokens.css
│   │   ├── scss.config.js      → dist/scss/_variables.scss
│   │   └── js.config.js        → dist/js/tokens.mjs
│   ├── dist/                   (generated, do not edit)
│   └── package.json
│
├── component-libs/
│   ├── angular-lib/            @your-org/angular-lib
│   │   ├── src/
│   │   │   ├── button/
│   │   │   │   ├── button.component.ts
│   │   │   │   └── button.component.scss   ← defines --button-* tokens + consumes them
│   │   │   └── badge/
│   │   │       ├── badge.component.ts
│   │   │       └── badge.component.scss    ← defines --badge-* tokens + consumes them
│   │   └── package.json
│   └── [future-libs]/          same pattern
│
└── deployments/
    ├── client-a/
    │   ├── tokens/
    │   │   └── color.json      ← overrides primitive values only
    │   └── skin.css            ← runtime :root overrides, served from CDN
    └── client-b/
        ├── tokens/
        │   └── color.json
        └── skin.css
```

---

## Token Package — `@your-org/design-tokens`

### Token JSON structure

Tokens are defined in three tiers. Only tiers 1 and 2 belong in this package.

**Tier 1 — Primitives** (raw palette, never referenced directly in components)
```json
{
  "color": {
    "blue": {
      "100": { "value": "#D6E4F5" },
      "300": { "value": "#7BAEDD" },
      "500": { "value": "#3B6FD4" },
      "700": { "value": "#2A5BB8" },
      "900": { "value": "#1A3D8F" }
    },
    "neutral": {
      "100": { "value": "#F5F5F5" },
      "300": { "value": "#CCCCCC" },
      "500": { "value": "#888888" },
      "700": { "value": "#444444" },
      "900": { "value": "#1A1A1A" }
    }
  },
  "radius": {
    "sm": { "value": "4px" },
    "md": { "value": "8px" },
    "lg": { "value": "12px" }
  },
  "spacing": {
    "xs": { "value": "4px" },
    "sm": { "value": "8px" },
    "md": { "value": "16px" },
    "lg": { "value": "24px" },
    "xl": { "value": "40px" }
  },
  "font": {
    "family": { "base": { "value": "'Inter', sans-serif" } },
    "size": {
      "sm": { "value": "12px" },
      "md": { "value": "14px" },
      "lg": { "value": "16px" }
    },
    "weight": {
      "regular": { "value": "400" },
      "bold":    { "value": "600" }
    }
  }
}
```

**Tier 2 — Semantic aliases** (design intent, not values — these are what components reference)
```json
{
  "color": {
    "brand": {
      "primary":        { "value": "{color.blue.500}" },
      "primary-hover":  { "value": "{color.blue.700}" },
      "primary-subtle": { "value": "{color.blue.100}" }
    },
    "text": {
      "default":    { "value": "{color.neutral.900}" },
      "muted":      { "value": "{color.neutral.500}" },
      "on-primary": { "value": "#ffffff" }
    },
    "surface": {
      "default": { "value": "#ffffff" },
      "raised":  { "value": "{color.neutral.100}" }
    },
    "border": {
      "default": { "value": "{color.neutral.300}" },
      "focus":   { "value": "{color.blue.500}" }
    }
  }
}
```

### Generated CSS output

Style Dictionary resolves `{reference}` syntax to `var(--...)` chains. The CSS output looks like:

```css
/* dist/css/tokens.css */
:root {
  --color-blue-500: #3B6FD4;
  --color-blue-700: #2A5BB8;
  --color-blue-100: #D6E4F5;
  --color-neutral-900: #1A1A1A;

  --color-brand-primary:        var(--color-blue-500);
  --color-brand-primary-hover:  var(--color-blue-700);
  --color-brand-primary-subtle: var(--color-blue-100);

  --color-text-default:         var(--color-neutral-900);
  --color-text-muted:           var(--color-neutral-500);
  --color-text-on-primary:      #ffffff;

  --color-surface-default:      #ffffff;
  --color-surface-raised:       var(--color-neutral-100);
  --color-border-default:       var(--color-neutral-300);
  --color-border-focus:         var(--color-blue-500);

  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 40px;

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  --font-family-base:    'Inter', sans-serif;
  --font-size-sm:        12px;
  --font-size-md:        14px;
  --font-size-lg:        16px;
  --font-weight-regular: 400;
  --font-weight-bold:    600;
}
```

### Style Dictionary config (CSS adapter)

```js
// adapters/css.config.js
export default {
  source: ['tokens/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'dist/css/',
      files: [{
        destination: 'tokens.css',
        format: 'css/variables',
        options: { outputReferences: true }  // preserves var(--...) chains, not resolved hex
      }]
    }
  }
}
```

`outputReferences: true` is required. Without it, Style Dictionary resolves all references to their final hex values, breaking the deployment skin override chain.

### package.json exports map

```json
{
  "name": "@your-org/design-tokens",
  "exports": {
    "./css":  "./dist/css/tokens.css",
    "./scss": "./dist/scss/_variables.scss",
    "./js":   "./dist/js/tokens.mjs"
  },
  "scripts": {
    "build": "style-dictionary build --config adapters/css.config.js && style-dictionary build --config adapters/scss.config.js",
    "prepublishOnly": "npm run build"
  }
}
```

---

## Component Libraries

### Ownership rule

Each component library:
1. Imports `@your-org/design-tokens/css` to get semantic aliases on `:root`
2. Defines its own component tokens in a root-level `_component-tokens.scss` (or equivalent)
3. Component SCSS files consume only their own component tokens — never semantic aliases directly

This indirection means component token defaults can be overridden by a deployment skin without touching component SCSS.

### Component token pattern

```scss
// packages/component-libs/angular-lib/src/styles/_component-tokens.scss
// Defines defaults. A deployment skin can override any of these.
:root {
  // Button
  --button-primary-bg:         var(--color-brand-primary);
  --button-primary-bg-hover:   var(--color-brand-primary-hover);
  --button-primary-text:       var(--color-text-on-primary);
  --button-ghost-text:         var(--color-brand-primary);
  --button-ghost-bg-hover:     var(--color-brand-primary-subtle);
  --button-border-radius:      var(--radius-md);
  --button-padding-y:          var(--spacing-sm);
  --button-padding-x:          var(--spacing-md);
  --button-font-size:          var(--font-size-md);
  --button-font-weight:        var(--font-weight-bold);

  // Badge
  --badge-info-bg:             var(--color-brand-primary-subtle);
  --badge-info-text:           var(--color-brand-primary);
  --badge-border-radius:       var(--radius-sm);
  --badge-padding-y:           var(--spacing-xs);
  --badge-padding-x:           var(--spacing-sm);
  --badge-font-size:           var(--font-size-sm);
  --badge-font-weight:         var(--font-weight-bold);
}
```

```scss
// button.component.scss
// Only references --button-* tokens. Never --color-* or primitives directly.
.btn {
  display: inline-flex;
  align-items: center;
  padding: var(--button-padding-y) var(--button-padding-x);
  border-radius: var(--button-border-radius);
  font-size: var(--button-font-size);
  font-weight: var(--button-font-weight);
  font-family: var(--font-family-base);
  transition: background 150ms ease;
  cursor: pointer;
  border: none;

  &--primary {
    background: var(--button-primary-bg);
    color: var(--button-primary-text);
    &:hover { background: var(--button-primary-bg-hover); }
    &:focus-visible {
      outline: 2px solid var(--color-border-focus);
      outline-offset: 2px;
    }
  }

  &--ghost {
    background: transparent;
    color: var(--button-ghost-text);
    border: 1px solid var(--color-border-default);
    &:hover { background: var(--button-ghost-bg-hover); }
  }
}
```

```scss
// badge.component.scss
.badge {
  display: inline-flex;
  align-items: center;
  padding: var(--badge-padding-y) var(--badge-padding-x);
  border-radius: var(--badge-border-radius);
  font-size: var(--badge-font-size);
  font-weight: var(--badge-font-weight);
  font-family: var(--font-family-base);

  &--info {
    background: var(--badge-info-bg);
    color: var(--badge-info-text);
  }
}
```

### Component library package.json

```json
{
  "name": "@your-org/angular-lib",
  "peerDependencies": {
    "@your-org/design-tokens": "^1.0.0"
  }
}
```

`peerDependency` not `dependency` — the consuming deployment app controls which token version is active.

---

## Deployment Skin Pattern

### Load order (must be respected in every deployment app)

```
1. @your-org/design-tokens/css        primitives + semantic aliases
2. @your-org/angular-lib styles       component token defaults
3. [client]-skin.css                  deployment overrides (served from CDN or assets)
```

If load order is wrong, overrides will not take effect.

### What a skin file overrides

A skin only needs to override semantic aliases (tier 2) or component tokens (tier 3). Overriding a primitive cascades automatically through the var() chain.

```css
/* deployments/client-a/skin.css */
:root {
  /* Override primitives → cascades to all semantic aliases that reference them */
  --color-blue-500: #E85D24;
  --color-blue-700: #C04A18;
  --color-blue-100: #FAE8E0;

  /* Override shape/typography if client requires it */
  --radius-md: 2px;
  --font-family-base: 'Roboto', sans-serif;

  /* Override a specific component token without touching the semantic layer */
  --button-border-radius: 0px;
}
```

A skin file must never contain component SCSS, hardcoded spacing unrelated to tokens, or anything that would only apply to one component. It is a `:root` override block only.

### Runtime skin injection (Angular)

```ts
// app-initializer.ts
export function loadDeploymentSkin(env: Environment): () => Promise<void> {
  return () => new Promise((resolve) => {
    if (!env.skinUrl) return resolve();
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = env.skinUrl;  // 'https://assets.your-org.com/client-a/skin.css'
    link.onload = () => resolve();
    document.head.appendChild(link);
  });
}
```

```ts
// app.module.ts
providers: [{
  provide: APP_INITIALIZER,
  useFactory: loadDeploymentSkin,
  deps: [Environment],
  multi: true
}]
```

---

## npm Dependency Model — Internal Deployments

### Chosen model: dist-tags (Option B)

One package (`@your-org/design-tokens`), one npm tag per client. All client token values are in the same monorepo. Clients do not have access to the package registry or repo.

```bash
# Publishing per client
npm publish --tag client-a
npm publish --tag client-b
npm publish --tag latest    # base/reference theme
```

### Deployment app package.json

```json
{
  "dependencies": {
    "@your-org/angular-lib": "^1.0.0",
    "@your-org/design-tokens": "1.4.2"   ← pin to version, not tag
  }
}
```

Pin to explicit version in lockfile. Use the dist-tag only in the CI publish step, not in `package.json`. This keeps deployments reproducible even if the tag moves.

### Version discipline

| Change | Semver bump | Example |
|--------|-------------|---------|
| Rename or remove a token | Major | `--color-primary` → `--color-brand-primary` |
| Add new tokens | Minor | Adding `--color-tertiary` |
| Value-only change | Patch | Designer updates a hex code |

Token renames are silent runtime failures — no build error, the CSS var simply resolves to `undefined`. Always diff token names in CI before publish.

---

## Build Pipeline Summary

### Trigger chain

```
tokens/[client]/color.json changed
  → style-dictionary build (css, scss, js outputs)
  → npm publish --tag [client]
  → nx affected --target=build
      → adapter-bootstrap rebuild (if bootstrap app exists for this client)
      → angular-lib rebuild
      → deployment-[client] rebuild
  → deploy skin.css to CDN
  → deploy app bundle
```

### nx dependency declaration

```json
{
  "name": "angular-lib",
  "implicitDependencies": ["design-tokens"],
  "targets": {
    "build": {
      "dependsOn": ["^build"]
    }
  }
}
```

### Sass compilation order (Bootstrap deployments only)

```scss
// build-entry.scss — generated per client, not committed
@use '@your-org/design-tokens/scss' as tokens;

// Map to Bootstrap's expected variable names
$primary:       tokens.$color-brand-primary;
$border-radius: tokens.$radius-md;

@import 'bootstrap/scss/bootstrap';
@use '@your-org/angular-lib/styles';
```

Non-Bootstrap libs (like the new angular-lib) do not need this step. They load `tokens.css` at runtime and consume CSS vars directly.

---

## Rules Summary for Code Generation

When generating component styles:
- Reference only `--[component-name]-*` tokens inside component SCSS
- Never use `--color-*`, `--spacing-*`, or primitives directly in component SCSS
- Define all `--[component-name]-*` tokens in `_component-tokens.scss`, defaulting to semantic aliases
- Never hardcode hex values, px values, or font names in component SCSS

When generating token JSON:
- Primitives go in `tokens/color.json`, `tokens/spacing.json` etc.
- Semantic aliases go in the same files, referencing primitives with `{token.path}` syntax
- Component tokens do not belong in the tokens package

When generating a skin file:
- Only `:root { }` overrides
- Override at the highest tier that achieves the desired effect (prefer primitive overrides so the cascade handles the rest)
- No selectors other than `:root`

When generating Style Dictionary config:
- Always set `outputReferences: true` in the CSS formatter
- Run `prepublishOnly` to ensure dist is always rebuilt before publish
