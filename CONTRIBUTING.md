# Contributing

Merci de contribuer à `ci-cd-2`. Ce guide complète le README.

## Workflow type

1. Fork ou crée une branche : `git checkout -b feat/ma-feature`.
2. Code, puis `git commit` — les hooks Husky lancent automatiquement :
   - `pre-commit` : `npm run lint` + `npm run format:check`.
   - `commit-msg` : commitlint vérifie le format Conventional Commits.
3. Push, ouvre une Pull Request vers `main`.
4. Le CI valide à nouveau lint, format, commitlint et les tests (Node 18 + 20).
5. Un reviewer valide la PR, qui est ensuite mergée en squash ou rebase.

## Conventions

- **Commits** : Conventional Commits — voir [README.md](README.md#format-des-commits) pour la
  liste des types et exemples.
- **Style de code** : géré par Prettier, configuration dans [`.prettierrc`](./.prettierrc). Ne
  pas formatter manuellement, laisser Prettier le faire (`npm run format`).
- **Lint** : ESLint en mode strict (`--max-warnings=0`). Un warning bloque la CI. Si une règle
  ESLint est inappropriée pour ce projet, la désactiver explicitement dans `.eslintrc.json`
  avec un commentaire qui explique pourquoi.

## Releases

Le maintainer décide quand publier une release. Voir [README.md#comment-déclencher-une-release](README.md#comment-déclencher-une-release).
