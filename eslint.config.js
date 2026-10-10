import js from "@eslint/js";
import importX from "eslint-plugin-import-x";
import pluginVue from "eslint-plugin-vue";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/coverage/**",
      "package-lock.json",
      "apps/web/public/**",
    ],
  },
  js.configs.recommended,
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,
  {
    // Let import rules see imports inside single-file components, so
    // `import-x/no-unresolved` covers `.vue` sources too.
    settings: {
      "import-x/parsers": {
        "vue-eslint-parser": [".vue"],
      },
    },
  },
  ...tseslint.configs.recommended,
  ...pluginVue.configs["flat/recommended"],
  {
    files: ["apps/api/**/*.{ts,js}"],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ["apps/web/**/*.{ts,js,vue}"],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ["**/*.vue"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
  {
    files: ["apps/web/src/App.vue"],
    rules: {
      "vue/multi-word-component-names": "off",
    },
  },
  {
    rules: {
      // Prettier owns formatting; turn off Vue rules that would fight it.
      "vue/html-self-closing": "off",
      "vue/max-attributes-per-line": "off",
      "vue/singleline-html-element-content-newline": "off",
      "vue/html-closing-bracket-newline": "off",
      "vue/first-attribute-linebreak": "off",
      "vue/html-indent": "off",
    },
  },
  {
    rules: {
      // Type-only bindings must use an inline `type` specifier, auto-fixable.
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports",
          // Allow `typeof import("...")`, used by vitest's importOriginal().
          disallowTypeAnnotations: false,
        },
      ],
      // One import statement per module; `prefer-inline` keeps merged type
      // specifiers inline so the two rules produce the same style.
      "import-x/no-duplicates": ["error", { "prefer-inline": true }],
      // These two warn on idiomatic default-import namespaces such as
      // `import tseslint from "typescript-eslint"` then `tseslint.config()`.
      "import-x/no-named-as-default": "off",
      "import-x/no-named-as-default-member": "off",
      // These two can't inspect `.vue` imports: `<script setup>` generates its
      // default export at compile time and the SFC script parse can't read
      // TS-only syntax. `vue-tsc` already enforces export correctness across
      // `.ts` and `.vue`, so keep them off rather than eat the false positives.
      "import-x/default": "off",
      "import-x/namespace": "off",
    },
  },
);
