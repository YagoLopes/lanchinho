# Repository Guidelines

## Project Structure & Module Organization
The Expo entry point is `App.tsx`, which wires navigation, hydration, and notifications. Feature code lives in `src/`, organised by responsibility: `components/` for shared UI, `screens/` for routed views, `navigation/` for stack/tab setup, `store/` for Zustand state, `services/` for API and notification helpers, `utils/` for date and formatting helpers, `hooks/` for reusable logic, and `types/` for shared TypeScript definitions. Static assets belong under `assets/`. Use the path aliases defined in `tsconfig.json`/`babel.config.js` (e.g. `@components/Button`) instead of relative climbs.

## Build, Test, and Development Commands
- `npm start` launches Expo in development with Metro bundler.
- `npm run ios` / `npm run android` builds and runs the native shell on the respective simulator or device.
- `npm run web` starts the Expo web target; keep parity with native navigation when updating routes.
- `npm run lint` applies ESLint across the repo; fix errors before pushing.

## Coding Style & Naming Conventions
Write TypeScript-first React Native with functional components and hooks. Follow the two-space indentation and single-quote strings shown in `App.tsx`. Components and screens use `PascalCase` filenames, hooks use `use*` prefixes, Zustand stores end with `Store` (e.g. `dietStore.ts`), and helper modules use `camelCase`. ESLint extends `eslint-config-universe`; run `npm run lint -- --fix` for safe auto-formatting. Keep side-effectful logic inside hooks or `services/` modules.

## Testing Guidelines
Automated tests are not yet configured; when adding Jest or React Native Testing Library, keep specs beside the unit (`Component.spec.tsx`) or under `src/__tests__/`. For now, exercise key user flows in Expo Go before merging: onboarding, meal scheduling, notification snooze, and state hydration. Capture manual test notes in the PR description until Jest coverage exists.

## Commit & Pull Request Guidelines
Commit history follows Conventional Commits (e.g. `chore: initial import Lanchinho`). Use `feat:`, `fix:`, `refactor:`, etc., with imperative 72-character subject lines. For pull requests, include: context and motivation, screenshots or screen recordings for UI changes, manual test checklist, and links to related issues. Request review from another maintainer and ensure CI (lint) is green before requesting merge.
