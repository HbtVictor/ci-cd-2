# ci-cd-2

[![CI Pipeline](https://github.com/HbtVictor/ci-cd-2/actions/workflows/ci.yml/badge.svg)](https://github.com/HbtVictor/ci-cd-2/actions/workflows/ci.yml)

TP S9/S10 — Pipeline qualité du code + versioning sémantique (Conventional Commits + git-cliff + release GitHub).

## Stack

- **Code** : Node.js 20, Express, Jest
- **Qualité** : ESLint (`--max-warnings=0`), Prettier
- **Commits** : Conventional Commits (validés par commitlint + Husky en local et en CI)
- **Release** : tags SemVer `vX.Y.Z` → CHANGELOG auto via git-cliff → release GitHub + image Docker tagguée

## Scripts npm

| Script                 | Usage                                               |
| ---------------------- | --------------------------------------------------- |
| `npm test`             | Tests Jest                                          |
| `npm run test:ci`      | Tests + couverture (utilisé par la CI)              |
| `npm run lint`         | ESLint avec `--max-warnings=0` (warning = échec)    |
| `npm run lint:fix`     | Corrige automatiquement ce qui est corrigeable      |
| `npm run format`       | Reformate tous les fichiers avec Prettier           |
| `npm run format:check` | Vérifie le format sans modifier (utilisé par la CI) |
| `npm start`            | Lance le serveur Express sur `:3000`                |

## Comment contribuer

1. Cloner et installer : `git clone … && cd ci-cd-2 && npm install`
   - `npm install` exécute `prepare` qui installe les hooks Husky → tu n'auras plus à y penser.
2. Créer une branche : `git checkout -b feat/ma-feature`.
3. Coder, puis avant de commit, **les hooks lancent automatiquement** :
   - `pre-commit` : lint + format check.
   - `commit-msg` : valide le format Conventional Commits.
4. Si le hook commit-msg refuse ton message, corrige-le. **Ne pas utiliser `--no-verify`** (le job `commitlint` du pipeline CI te bloquera de toute façon).
5. Push, ouvre une PR. Le CI valide lint + format + commitlint + tests (Node 18 et 20).
6. Une fois mergé sur `main`, la version reste inchangée. Le maintainer décide quand publier une release (voir ci-dessous).

### Format des commits

`<type>(<scope>): <sujet de 10 caractères ou plus>` — exemples :

- `feat(api): ajouter endpoint /calc/modulo`
- `fix(server): corriger crash sur division par chaîne vide`
- `chore(deps): bump express vers 5.2.1`
- `refactor(calculator): extraire validation dans une fonction dédiée`

Types acceptés : `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`, `perf`, `ci`, `build`.

### Breaking changes

Un commit qui casse la rétrocompatibilité doit contenir `BREAKING CHANGE:` dans le corps OU un `!` après le type :

```
feat(api)!: renommer /calc en /math

BREAKING CHANGE: les anciens endpoints /calc/* renvoient 404.
                 Migrer vers /math/*.
```

Ce type de commit déclenche un bump **MAJOR** lors de la release.

## Comment déclencher une release

1. Vérifier que `main` est vert sur le CI.
2. Identifier la prochaine version SemVer selon les commits depuis la dernière release :
   - au moins un `BREAKING CHANGE` → bump MAJOR (1.x.y → 2.0.0)
   - au moins un `feat` → bump MINOR (1.2.x → 1.3.0)
   - sinon (uniquement `fix`, `chore`, etc.) → bump PATCH (1.2.3 → 1.2.4)
3. Créer et pousser le tag :
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
4. Le workflow `release.yml` se déclenche automatiquement :
   - rejoue lint + format + tests (sécurité)
   - génère le CHANGELOG via git-cliff
   - build l'image Docker et la pousse sur GHCR avec les tags `v1.0.0`, `1.0`, `latest`
   - crée la GitHub Release avec le CHANGELOG en description

## Endpoints API

| Méthode | Route                  | Description                              |
| ------- | ---------------------- | ---------------------------------------- |
| GET     | `/health`              | Health check (utilisé par Render/Docker) |
| GET     | `/calc/add/:a/:b`      | Addition                                 |
| GET     | `/calc/subtract/:a/:b` | Soustraction                             |
| GET     | `/calc/multiply/:a/:b` | Multiplication                           |
| GET     | `/calc/divide/:a/:b`   | Division (renvoie 400 si b=0)            |

Exemple : `curl https://<host>/calc/add/5/3` → `{"result":8}`.
