# Dependency license metadata audit

**Snapshot reviewed:** `frontend/package-lock.json`  
**Scope:** npm package metadata recorded in the committed lockfile; this is not a legal opinion or a complete asset-rights review.

## Inventory

The lockfile contains 536 package entries under `packages`.

| Declared license metadata | Package entries |
|---|---:|
| MIT | 402 |
| Apache-2.0 | 34 |
| ISC | 35 |
| BSD-3-Clause | 18 |
| BSD-2-Clause | 7 |
| BlueOak-1.0.0 | 6 |
| LGPL-3.0-or-later | 10 |
| Apache-2.0 AND MIT | 9 |
| Apache-2.0 AND LGPL-3.0-or-later | 3 |
| Apache-2.0 AND LGPL-3.0-or-later AND MIT | 1 |
| Other declared expressions | 5 |
| Missing license field | 6 |

The six entries with missing license metadata are:

- `@tailwindcss/typography/node_modules/postcss-selector-parser`
- `class-variance-authority`
- `cross-spawn`
- `lodash.castarray`
- `lodash.isplainobject`
- `lucide-react`

The lockfile also records LGPL-3.0-or-later metadata for Sharp-related packages. Review the applicable package and binary distribution terms before redistributing builds that include them.

## Python dependencies

The backend uses `backend/requirements.txt`. It is not represented by a resolved Python lockfile in this audit, so transitive Python package versions and licenses remain unverified.

## Follow-up

1. Verify missing npm license metadata against each package's authoritative license file or registry metadata.
2. Generate a resolved Python dependency lock and license inventory.
3. Review model weights, datasets, audio samples, and other non-package assets separately.
4. Regenerate this report whenever dependency lockfiles change.

**Limitations:** package-lock metadata can be absent, stale, or simplified. Counts include optional and platform-specific package entries. This report does not replace the actual license texts or notices required by individual dependencies.
