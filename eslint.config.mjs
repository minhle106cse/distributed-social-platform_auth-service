import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'
import unusedImports from 'eslint-plugin-unused-imports'
import importPlugin from 'eslint-plugin-import'

export default [
  // 1️⃣ Ignore
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'src/generated/**',
      'generated/**',
      'prisma.config.ts',
      'prisma/**',
      '*.cjs',
      '**/*.js',
      'eslint.config.mjs',
    ],
  },

  // 2️⃣ Base JS rules
  js.configs.recommended,

  // 3️⃣ TypeScript (type-aware)
  ...tseslint.configs.recommendedTypeChecked,

  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },

    plugins: {
      'unused-imports': unusedImports,
      import: importPlugin,
    },

    rules: {
      // === TypeScript ===
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],

      // === Unused imports ===
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

      // === Import hygiene ===
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'never',
        },
      ],

      // === Node / Fastify friendly ===
      'no-console': 'off',
    },
  },

  // 4️⃣ Relax strict type rules in route files (CQRS bus returns are inherently dynamic)
  {
    files: ['**/*.routes.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },

  // 5️⃣ Relax strict type rules inside test files (Jest mocks are inherently loosely typed)
  {
    files: ['**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'no-empty': 'off',
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Architectural boundary enforcement (Hexagonal / Clean Architecture).
  // See directives/folder_structure_sop.md + cqrs_pattern.md. Ported from
  // core-api's boundary rules (2026-08-21) — NOT copy-pasted verbatim, because
  // auth-service is plain Fastify with manual DI (`container/`), not NestJS:
  //   - core-api's application layer gets its repos-shape type via NestJS DI +
  //     an interface; auth-service's handlers import the type `AuthServiceRepos`
  //     directly from `@/container/repos`, its composition root. `container/` is
  //     its own documented top-level component (folder_structure_sop.md's
  //     5-component table: "Manual DI wiring — required, Fastify has no DI"),
  //     NOT `infrastructure/` — so it needs its own allowance, not a copy of
  //     core-api's "@/infrastructure/cqrs decorators only" exception.
  //   - core-api's domain rule forbids `@/common/**` outright; auth-service's
  //     domain layer legitimately imports `@/common/errors/*.error` (pure
  //     ApplicationError subclasses, zero framework/ORM dependency — verified
  //     by reading every file in common/ before writing this rule). Forbidding
  //     that would break real, tested, working code for a resemblance to
  //     core-api rather than a real violation, so `@/common/**` is allowed here.
  //   - auth-service has no NestJS HTTP-exception classes to ban from the
  //     application layer (Fastify has no `@nestjs/common` exceptions) — errors
  //     already go through `ApplicationError` subclasses exclusively.
  // Uses @typescript-eslint/no-restricted-imports so `import type` is also
  // caught (a type-only dependency across layers is still a dependency) — this
  // is also what `scripts/check-repo-placement.cjs` (npm run check:arch) checks
  // independently for domain→application specifically, since this eslint form
  // only matches the literal `@/...` alias, not a relative `../../application/..`.
  // ───────────────────────────────────────────────────────────────────────────

  // Domain — pure TypeScript. shared-kernel + common/ (pure abstractions, no
  // framework/ORM in this service's common/) + same-or-cross-domain relative.
  {
    files: ['src/modules/*/domain/**/*.ts'],
    ignores: ['**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'fastify',
                'prisma',
                '@prisma/*',
                '@/generated',
                '@/generated/**',
                '@/infrastructure/**',
                '@/container/**',
                // 2026-08-24: added, unifying on core-api's stricter boundary (owner's call).
                // It used to allow `common/`, which is why auth-service's error classes lived in
                // common/errors/ while core-api's credit errors could not. Now every module owns
                // exactly one error file under its own domain/, so nothing needs the exemption.
                // `check:arch` check D reads THIS list, so adding the line also starts blocking
                // the relative-path way around it ('../../../../common/x'), which eslint alone
                // cannot see.
                '@/common/**',
                '@/modules/*/application/**',
                '@/modules/*/infrastructure/**',
                '@/modules/*/presentation/**',
              ],
              message:
                'Domain phải pure TypeScript: chỉ shared-kernel + relative cùng domain. Cấm framework (Fastify), ORM (Prisma/generated), container/ (composition root), common/, và mọi tầng ngoài.',
            },
          ],
        },
      ],
    },
  },

  // Application — orchestrates via interfaces. No ORM/DB/framework. The only
  // container/ import allowed is the repos-SHAPE type (`@/container/repos`) —
  // never `@/container/application` (that wires the bus, a presentation-layer
  // concern) and never any concrete infrastructure.
  {
    files: ['src/modules/*/application/**/*.ts'],
    ignores: ['**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'fastify',
                'prisma',
                '@prisma/*',
                '@/generated',
                '@/generated/**',
                '@/infrastructure/**',
                '@/container/application',
                '@/container/infra',
                '@/modules/*/infrastructure/**',
                '@/modules/*/presentation/**',
              ],
              message:
                'Application không được phụ thuộc ORM/DB/framework hay tầng presentation/infrastructure. Repos-shape type duy nhất hợp lệ: @/container/repos.',
            },
          ],
        },
      ],
    },
  },

  // Presentation — translate HTTP <-> Command/Query via the composition root's
  // wired bus (@/container/application). Never touch the ORM/DB directly.
  {
    files: ['src/modules/*/presentation/**/*.ts'],
    ignores: ['**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'prisma',
                '@prisma/*',
                '@/generated',
                '@/generated/**',
                '@/infrastructure/database/**',
                '@/container/repos',
              ],
              message:
                'Presentation không được chạm ORM/DB trực tiếp. Đẩy qua CommandBus/QueryBus (@/container/application).',
            },
          ],
        },
      ],
    },
  },

  // common — cross-cutting abstractions only. shared-kernel + relative.
  {
    files: ['src/common/**/*.ts'],
    ignores: ['**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/modules/**',
                '@/infrastructure/**',
                '@/container/**',
                'fastify',
                'prisma',
                '@prisma/*',
                '@/generated',
                '@/generated/**',
              ],
              message:
                'common/ chỉ chứa abstraction cross-cutting: chỉ shared-kernel + relative. Cấm modules/, infrastructure/, container/, framework, ORM.',
            },
          ],
        },
      ],
    },
  },

  // 5️⃣ Disable ESLint formatting (let Prettier handle)
  prettier,
]
