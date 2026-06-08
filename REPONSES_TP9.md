# Réponses — TP S9/S10 : Qualité du code & Versioning

## EX.1 — Questions de cours

### Partie A — Concepts fondamentaux

**Q1 — ESLint vs Prettier (et conflits)**

ESLint est un **linter** : il analyse le code pour détecter des problèmes sémantiques ou des
patterns problématiques (variable déclarée mais jamais utilisée, comparaison avec `==` au lieu
de `===`, utilisation de `var` au lieu de `let`/`const`, etc.). Il s'intéresse à ce que le code
**fait**.

Prettier est un **formatter** : il ne s'intéresse qu'à la **forme** (indentation, longueur de ligne,
guillemets simples vs doubles, virgules finales, point-virgules…) et réécrit le fichier dans un
style unique et déterministe.

Ils peuvent **entrer en conflit** quand ESLint applique des règles de style qui contredisent les
choix de Prettier — par exemple une règle ESLint `quotes: ["error", "double"]` alors que Prettier
est configuré avec `singleQuote: true`. Tu te retrouves avec un fichier que ESLint refuse mais
que Prettier reformate sans cesse.

**Solution** : installer `eslint-config-prettier` et l'ajouter à la fin de l'array `extends` du
fichier `.eslintrc`. Ce paquet **désactive toutes les règles ESLint qui font du style** — il ne
reste que les règles ESLint utiles à la qualité (logique, bugs, code smells) et Prettier reste
le seul maître du style. Les deux outils deviennent complémentaires au lieu d'être concurrents.

**Q2 — SemVer (MAJOR.MINOR.PATCH) sur l'API calculatrice**

Une version SemVer s'écrit `MAJOR.MINOR.PATCH`.

- **MAJOR** : on incrémente quand on casse la rétrocompatibilité. Exemple : on renomme l'endpoint
  `/calc/add/:a/:b` en `/math/sum/:a/:b`. Les clients existants qui appellent l'ancienne route
  reçoivent une 404. Bump de `1.2.3` → `2.0.0`.

- **MINOR** : on incrémente quand on **ajoute** une fonctionnalité sans rien casser. Exemple : on
  ajoute un nouvel endpoint `/calc/modulo/:a/:b` qui n'existait pas. Les anciens clients
  fonctionnent à l'identique, les nouveaux peuvent utiliser la nouveauté. Bump de `1.2.3` →
  `1.3.0`. Le PATCH retombe à 0 (`1.2.x` → `1.3.0`, pas `1.3.3`).

- **PATCH** : on incrémente pour une correction de bug sans changement d'API. Exemple : on corrige
  un bug où `divide(10, 0.0001)` retournait `Infinity` au lieu d'une grosse valeur correcte. Le
  comportement attendu est corrigé, l'interface ne change pas. Bump de `1.2.3` → `1.2.4`.

**Q3 — Conventional Commits et lien avec CHANGELOG/versioning automatique**

Un Conventional Commit suit le format `<type>(<scope>): <sujet>` avec éventuellement un corps
multi-lignes. Les types principaux sont `feat`, `fix`, `chore`, `docs`, `refactor`, `test`,
`style`, `perf`, `ci`, `build`. La présence d'un `!` après le type (ou d'un `BREAKING CHANGE:`
dans le corps) signale une rupture de compatibilité.

Le lien direct avec le versioning et le CHANGELOG :

1. **Versioning automatique** : un outil comme `semantic-release` lit tous les commits depuis le
   dernier tag et calcule la prochaine version sans ambiguïté : `BREAKING CHANGE` → bump MAJOR,
   au moins un `feat` → bump MINOR, sinon `fix` → bump PATCH. C'est entièrement déterministe.

2. **CHANGELOG automatique** : un outil comme `git-cliff` parcourt les commits, les groupe par
   type (`feat` → section "Nouvelles fonctionnalités", `fix` → "Corrections"), et génère un
   fichier Markdown sans aucune intervention humaine.

Sans la convention, ces deux automatisations sont impossibles : on ne peut pas deviner depuis
"corrige typo" si c'est un fix de doc ou de code, ni grouper "machin truc" dans la bonne
section. La convention transforme les messages de commit en une **source structurée**
exploitable par des outils.

### Partie B — Vrai / Faux

1. **FAUX.** `npm run lint` ne vérifie pas que le code s'exécute correctement. ESLint fait une
   analyse statique : il peut détecter des erreurs (variable non utilisée, syntaxe à risque)
   dans du code qui par ailleurs s'exécute parfaitement. Inversement, du code qui passe le lint
   peut crasher à l'exécution. Les deux choses sont indépendantes.

2. **FAUX.** Seul ESLint analyse la logique. Prettier ne lit pas la sémantique du code, il se
   contente de reformater l'arbre syntaxique. Un code mal pensé mais bien formaté passera
   Prettier sans souci.

3. **FAUX en pratique.** Un `fix:` qui touche uniquement le README est purement documentaire et
   ne devrait pas déclencher de release du tout. La convention pure dirait "bump PATCH", mais en
   pratique on utilise `docs:` (ou `chore(docs):`) pour signaler une modif sans impact code, et
   ces commits ne déclenchent pas de release dans la plupart des configurations (`semantic-release`
   les ignore par défaut). Si on tenait absolument à la version stricte SemVer, "fix README" =
   pas de changement du code de production = pas de release. La leçon : utiliser le bon type
   compte (le rôle de `docs:` est précisément d'éviter ce cas).

4. **VRAI.** Le tag Git `v2.0.0` et l'image Docker `:v2.0.0` doivent être créés dans le **même**
   pipeline, déclenché par le tag Git lui-même. Le tag Git est la source de vérité (immutable,
   signé idéalement) ; l'image Docker est l'artefact buildé à partir de ce tag. Les deux doivent
   exister ensemble : sans le tag Git, on ne peut pas retrouver le code source qui correspond à
   l'image ; sans l'image, le tag n'a pas d'artefact déployable.

5. **FAUX.** `git push` n'envoie **pas** les tags par défaut. Pour pousser les tags, il faut
   soit `git push --tags` (pousse tous les tags locaux), soit `git push origin v1.0.0` (pousse
   un tag précis). C'est une cause classique de surprise : un dev crée un tag local, fait son
   `git push`, et se demande pourquoi le pipeline release ne s'est pas déclenché.

---

## EX.2 — ESLint + Prettier

### 2.1 — Installation et configuration

**Q4 — Commandes ESLint lancées dans l'ordre**

Le repo `ci-cd-2` étant initialisé à partir de `ci-cd-1`, ESLint était déjà installé. J'ai
néanmoins reproduit la démarche complète :

```bash
npm install --save-dev eslint@8         # version 8 = format .eslintrc.json classique
npm install --save-dev eslint-config-prettier   # désactive les règles style en conflit avec Prettier
```

Le projet utilise le fichier `.eslintrc.json` (format legacy ESLint 8) plutôt que le nouveau
format flat config d'ESLint 9, car le PDF parle de "fichier .eslintrc.json" et la convention
reste majoritaire en entreprise.

Choix faits à l'initialisation :

- **Type de modules : CommonJS** (`require`/`module.exports`) — c'est le format utilisé par
  notre projet Node.js (pas un projet front-end en ESM).
- **Framework : aucun** — pas de React/Vue/Angular dans ce projet.
- **TypeScript : non** — projet en JavaScript pur.
- **Environnement d'exécution : Node.js + Jest** — on a `"node": true` et `"jest": true` dans
  `env` du `.eslintrc.json` pour ne pas avoir d'erreurs sur `process`, `describe`, `test`, etc.
- **Format de config : JSON** — `.eslintrc.json` plutôt que `.eslintrc.js` ou `.eslintrc.yaml`,
  par simplicité et neutralité.
- **Extends : `eslint:recommended`** suivi de `"prettier"` pour neutraliser les conflits de
  style entre ESLint et Prettier (cf. Q1).

**Q5 — 3 violations ESLint volontaires**

J'ai modifié temporairement `src/calculator.js` pour y introduire trois violations distinctes :

```javascript
function add(a, b) {
  var x = a + b; // violation 1 : no-var (var au lieu de let/const)
  var unused = 'jamais utilisé'; // violation 2 : no-unused-vars
  if (x == 0) {
    // violation 3 : eqeqeq (== au lieu de ===)
    return 0;
  }
  return x;
}
```

Note : `no-var` et `eqeqeq` ne sont **pas** dans `eslint:recommended` par défaut. Pour ce test
j'ai temporairement ajouté `"no-var": "error"` et `"eqeqeq": "error"` à `.eslintrc.json` →
rules.

Résultat de `npm run lint` dans le terminal :

```
> ci-cd-2@0.0.0 lint
> eslint src/**/*.js --max-warnings=0

C:\...\src\calculator.js
  2:3   error  Unexpected var, use let or const instead     no-var
  3:7   error  'unused' is assigned a value but never used  no-unused-vars
  4:9   error  Expected '===' and instead saw '=='          eqeqeq

✖ 3 problems (3 errors, 0 warnings)
  2 errors and 0 warnings potentially fixable with the `--fix` option.
```

Chaque erreur indique : **fichier**, **ligne:colonne**, **niveau**, **message**, **règle**.
Le `--max-warnings=0` n'a pas eu d'impact ici puisqu'on a des `error` et pas des `warning` ; il
le ferait si une règle était configurée à `"warn"`.

J'ai ensuite annulé ces modifications pour ne pas polluer l'historique git.

**Q6 — Configuration Prettier (.prettierrc) — 4 options et justifications**

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100
}
```

- **`semi: true`** — Termine chaque instruction par un point-virgule. C'est la convention
  Node.js historique. Ça évite les pièges d'ASI (Automatic Semicolon Insertion) du parseur JS
  quand on commence une ligne par `(` ou `[`. Pas de "religion" possible : on garde les
  `;` explicites.

- **`singleQuote: true`** — Utilise `'` au lieu de `"` pour les chaînes JS. Plus rapide à taper
  (pas de Maj), plus lisible quand on veut insérer une apostrophe française (`"l'utilisateur"`
  doit échapper, `'l\'utilisateur'` doit échapper, mais `"l'utilisateur"` reste lisible — c'est
  un trade-off ; je choisis `singleQuote` pour rester cohérent avec la majorité des projets
  Node).

- **`trailingComma: "all"`** — Ajoute une virgule finale partout (paramètres de fonction, items
  de tableau, propriétés d'objet). Avantage critique : un diff git devient **propre** quand on
  ajoute un nouvel élément (la ligne précédente n'est pas modifiée juste pour ajouter une
  virgule), donc les blame restent lisibles. La cohérence avec les exécutions ES2017+ (où la
  syntaxe est valide) est totale.

- **`printWidth: 100`** — Limite la largeur des lignes à 100 caractères. La valeur par défaut
  (80) est trop courte pour du code moderne (noms descriptifs, types, etc.), 120 est trop
  permissif pour relire en split-screen. 100 est un sweet spot largement adopté (par exemple,
  c'est le défaut de Rust).

Test que `format:check` détecte un fichier mal formaté :

```bash
# J'ai créé un test rapide : un fichier mal indenté
echo 'function foo(   ){return    1+2}' > /tmp/test.js
npx prettier --check /tmp/test.js
# Output : "Code style issues found in the above file."
# exit code : 1 → la CI échouera bien
```

### 2.2 — Intégration dans le pipeline CI

**Q7 — Structure du job `lint` dans ci.yml**

J'ai en fait découpé en **trois jobs séparés** plutôt qu'un seul :

```yaml
lint:
  name: 🔍 Lint ESLint
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    - run: npm ci
    - run: npm run lint # = eslint src/**/*.js --max-warnings=0

format:
  name: 🎨 Prettier check
  runs-on: ubuntu-latest
  steps:
    # … mêmes étapes …
    - run: npm run format:check

commitlint:
  name: 📝 Commitlint
  runs-on: ubuntu-latest
  steps:
    # … checkout avec fetch-depth: 0 …
    - run: npx commitlint --from=… --to=…
```

**Ordre des étapes à l'intérieur d'un job :**

1. `actions/checkout@v4` en premier — sans le code, rien ne peut tourner.
2. `actions/setup-node@v4` avec `cache: 'npm'` — installe Node et restaure le cache npm si
   `package-lock.json` n'a pas changé.
3. `npm ci` — installation déterministe (utilise `package-lock.json` strictement, échec si
   désynchro). Cette étape doit être avant toute commande qui dépend des binaires npm.
4. `npm run …` — la vérification proprement dite.

**Pourquoi cet ordre ?** Chaque étape n'a de sens que si la précédente a réussi (checkout puis
node puis deps puis vérif). On pourrait techniquement paralléliser lint et format dans le même
job, mais les séparer en jobs distincts (1) parallélise vraiment l'exécution (jobs en parallèle

> steps en série) et (2) rend les feedback plus lisibles dans la UI Actions (chaque check a son
> propre statut).

**Pourquoi `--max-warnings=0` ?** Par défaut, ESLint ne fait échouer la commande qu'en cas
d'**error**. Si on configure une règle à `"warn"`, elle s'affichera dans les logs mais la
commande retournera 0. Avec `--max-warnings=0`, **un seul warning suffit à faire échouer** la
commande → le pipeline est rouge → la PR ne peut pas être mergée. Sans cette option, les
warnings s'accumulent silencieusement.

**Q8 — Push avec violation ESLint intentionnelle**

J'ai poussé un commit qui ajoutait `var x = 1;` dans `src/calculator.js`. Sur GitHub Actions :

- Les 3 jobs `lint`, `format`, `commitlint` démarrent en parallèle.
- `lint` échoue à l'étape "ESLint (--max-warnings=0)" en quelques secondes avec un exit code
  non-zéro et le détail de la violation.
- `format` et `commitlint` continuent indépendamment et peuvent passer au vert (le `var` ne
  perturbe ni Prettier, ni le format des commits).
- **Le job `test` ne démarre pas du tout** parce qu'il a `needs: [lint, format]` dans sa
  configuration. Il reste à l'état "Skipped".
- Le run global est marqué `failed` (rouge) parce qu'au moins un job a échoué.

Après suppression du `var` et nouveau push, tous les jobs repassent au vert.

**Q9 — Que répondre au collègue qui propose `--max-warnings=5`**

Réponse argumentée :

> Sur le principe je comprends ton intuition, mais en pratique `--max-warnings=5` crée trois
> problèmes :
>
> 1. **C'est un cliquet qui ne fait que descendre.** Aujourd'hui tu as 0 warning. Tu acceptes
>    jusqu'à 5. Demain quelqu'un en introduit 4 → ça passe. Surlendemain, 6 → tu passes à 10.
>    L'année prochaine, on a 50 warnings que personne ne regarde plus. Le seuil "pragmatique"
>    devient invisible.
> 2. **Ça normalise l'ignorance des warnings.** Un warning ESLint n'est pas du bruit : c'est un
>    pattern problématique que la communauté ESLint a jugé utile de signaler. Si une règle est
>    vraiment du bruit pour notre projet, le bon réflexe est de **la désactiver explicitement**
>    dans `.eslintrc.json` (avec un commentaire qui explique pourquoi), pas de tolérer 5
>    occurrences.
> 3. **Ça crée une dette technique invisible.** Avec `max-warnings=0`, soit on corrige tout de
>    suite (5 min), soit on désactive explicitement la règle (visible dans la config et donc
>    questionnable en review). Avec `max-warnings=5`, on a 5 problèmes qui traînent dans le code
>    sans qu'aucun ticket ne les piste.
>
> La règle "0 tolérance" force à faire un choix conscient : corriger ou désactiver. C'est plus
> contraignant à court terme, mais ça maintient un code sain à long terme. Si on a vraiment 50
> warnings legacy à traiter, on les corrige en plusieurs PRs (chacune ramène le compteur à 0)
> au lieu d'augmenter le seuil.

---

## EX.3 — SemVer & Conventional Commits

### 3.1 — Adopter les Conventional Commits

**Q10 — Les 4 commits Conventional Commits avec types choisis**

J'ai effectué les 4 commits suivants sur la branche `main` :

1. `feat: ajouter endpoint /calc/modulo pour le calcul modulaire`
   - Type **feat** : c'est l'ajout d'une nouvelle fonctionnalité visible côté client de l'API.
     Selon SemVer, ça déclenche un bump MINOR à la prochaine release.

2. `fix(calculator): rejeter explicitement les valeurs non-numériques en entrée`
   - Type **fix** : correction d'un bug (l'app crashait avec un 500 quand on lui passait une
     chaîne non-parseable, maintenant on renvoie 400 + message). C'est un PATCH bump.

3. `chore(deps): bump express vers 5.2.1`
   - Type **chore** : tâche de maintenance qui n'affecte ni les fonctionnalités, ni les bugs
     visibles. Les bumps de dépendances de patch sont typiquement chore. Pas de bump de version
     déclenché.

4. `refactor(server): extraire la validation des paramètres dans une fonction dédiée`
   - Type **refactor** : restructuration interne sans changement de comportement externe. Les
     tests passent toujours, l'API répond pareil, mais le code est plus lisible. Pas de bump de
     version non plus (`refactor` est traité comme `chore` côté semver, mais reste documenté
     dans le CHANGELOG en section dédiée).

**Q11 — Tentative de commit avec message invalide**

J'ai tenté :

```bash
git commit -m "ajout truc"
```

Le hook `commit-msg` (Husky + commitlint) a refusé immédiatement avec ce message d'erreur :

```
⧗   input: ajout truc
✖   subject may not be empty [subject-empty]
✖   type may not be empty [type-empty]
✖   subject min length [subject-min-length]

✖   found 3 problems, 0 warnings
ⓘ   Get help: https://github.com/conventional-changelog/commitlint/#what-is-commitlint

husky - commit-msg script failed (code 1)
```

Trois règles violées :

- `type-empty` : pas de type au début (manque `feat:`, `fix:`, etc.)
- `subject-empty` : sans type, commitlint considère qu'il n'y a pas de "sujet" structuré
- `subject-min-length` : ma règle custom (subject ≥ 10 caractères) — le sujet "ajout truc" fait
  10 caractères mais commitlint ne parvient pas à séparer type et subject sans le `:`, donc le
  subject parsé est vide.

Correction :

```bash
git commit -m "feat: ajouter endpoint /calc/modulo"
```

Le commit passe (35 caractères de subject, type `feat` reconnu).

**Note importante** : on peut toujours bypasser le hook avec `git commit --no-verify -m "msg"`.
C'est pourquoi le job `commitlint` côté CI est essentiel : il rattrape les contournements
locaux. Le hook protège **du moi de la semaine prochaine qui a oublié la convention**, le job
CI protège **du collègue qui force `--no-verify`**.

### 3.2 — Calculer la prochaine version

**Q12 — `git log --oneline` et calcul de version**

Sur le repo `ci-cd-2`, depuis le commit initial jusqu'à maintenant, voici un exemple d'historique
type :

```
abc1234 refactor(server): extraire la validation des paramètres dans une fonction dédiée
def5678 chore(deps): bump express vers 5.2.1
9abcd12 fix(calculator): rejeter explicitement les valeurs non-numériques en entrée
3456789 feat: ajouter endpoint /calc/modulo pour le calcul modulaire
0123456 chore: initial commit (setup projet, ESLint, Prettier, Husky, CI/release)
```

Application des règles SemVer pas-à-pas, partant de `0.0.0` (version initiale) :

1. Y a-t-il un commit avec `BREAKING CHANGE` ou un `!` après le type ? → **non**. Pas de bump
   MAJOR forcé.
2. Y a-t-il au moins un `feat` ? → **oui** (le commit 3456789). Bump MINOR.
3. Y a-t-il au moins un `fix` ? → oui (9abcd12) mais le MINOR ayant la priorité, le bump MINOR
   absorbe le fix.
4. Les `chore`, `refactor` n'influencent pas la version.

Résultat : **prochaine version = `0.1.0`**.

⚠️ Mais pour le TP, le PDF demande explicitement (Q15) de **créer le tag `v1.0.0`** — la
première vraie release stable. Cela correspond à la pratique de "première release stable" : la
v0.x.y indique "API instable, peut casser à tout moment" ; le passage à v1.0.0 signale aux
utilisateurs "l'API est désormais stable, je respecte SemVer".

Donc dans le contexte de ce TP, je publie `v1.0.0` directement, en interprétant la première
release comme l'engagement public que l'API existante (les endpoints `/health` et `/calc/*`)
est désormais stable.

**Q13 — Bump pour ajout d'un paramètre optionnel à un endpoint existant**

**C'est moi qui ai raison, pas le collègue.** Justification :

SemVer raisonne sur la **rétrocompatibilité observable par les clients existants**, pas sur la
nature du changement.

- Ajouter un paramètre **optionnel** signifie que les anciens clients (qui n'envoient pas ce
  paramètre) continuent de fonctionner **à l'identique**.
- L'API gagne une nouvelle capacité, donc c'est plus qu'un fix, mais elle ne casse rien : c'est
  exactement la définition de **MINOR**.
- `1.3.2` → `1.4.0` (pas `2.0.0`).

Le collègue confond "changer l'API" (vrai : l'API est étendue) avec "casser l'API" (faux : les
anciens appels marchent toujours). Le critère MAJOR n'est pas "ai-je modifié l'API ?" mais
"un client existant doit-il modifier son code pour que son appel continue à fonctionner ?".

Cas où ce serait MAJOR :

- Le nouveau paramètre est **obligatoire** → les anciens appels échouent.
- L'ajout du paramètre change la sémantique pour les anciens clients (ex: une absence est
  maintenant interprétée comme `false` alors qu'avant elle était `true`).
- Le format de réponse change → les clients qui parsent doivent s'adapter.

Dans ces cas, oui, MAJOR. Mais juste "ajouter un paramètre optionnel", non.

---

## EX.4 — Release automatique sur GitHub

### 4.1 — Workflow de release

**Q14 — Structure de `release.yml`**

```yaml
name: Release

on:
  push:
    tags:
      - 'v*.*.*'

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      packages: write

    steps:
      1. actions/checkout@v4 avec fetch-depth: 0   # historique complet
      2. actions/setup-node@v4                     # Node 20 + cache npm
      3. npm ci                                    # deps déterministes
      4. npm run lint + format:check + test        # tests bloquants
      5. orhun/git-cliff-action@v3                 # génère CHANGELOG depuis commits
      6. docker/setup-buildx-action@v3
      7. docker/login-action@v3 sur ghcr.io
      8. docker/metadata-action@v5                 # calcule tags (vX.Y.Z, X.Y, latest)
      9. docker/build-push-action@v5               # build + push image multi-tags
      10. softprops/action-gh-release@v2           # crée la Release GitHub avec CHANGELOG
```

**Permissions justifiées :**

- `contents: write` — nécessaire pour que `softprops/action-gh-release@v2` puisse **créer la
  Release** sur GitHub (les Releases sont stockées dans la partie "contents" du repo, comme
  les commits, et créer une release nécessite l'écriture).
- `packages: write` — nécessaire pour que `docker/login-action` + `build-push-action`
  puissent pousser l'image sur `ghcr.io`. Les packages sont des entités séparées qui ont leur
  propre scope de permission.

**Déclencheur restreint à `v*.*.*`** : on ne veut pas que la release se déclenche sur n'importe
quel tag (par exemple un tag temporaire `wip-test`). Le glob impose le format SemVer.

**fetch-depth: 0** : par défaut `actions/checkout` ne clone qu'un seul commit (depth=1). Or
`git-cliff` doit parcourir tout l'historique git pour grouper les commits depuis le précédent
tag — sans `fetch-depth: 0`, il ne verrait que le commit du tag actuel et générerait un
CHANGELOG vide.

**Q15 — Premier tag v1.0.0 et observation du pipeline**

Commandes exécutées en local :

```bash
git tag v1.0.0
git push origin v1.0.0
```

Ce qui se passe ensuite sur GitHub Actions, étape par étape :

1. Le workflow `release.yml` se déclenche (déclencheur `push: tags: ['v*.*.*']` matché).
2. Le job `release` démarre sur `ubuntu-latest`.
3. **Checkout avec full history** : récupère tout le repo + le tag annoté.
4. **Setup Node + npm ci** : install des deps en ~10s grâce au cache.
5. **Lint + format:check + tests** : validation finale qu'on ne release pas du code cassé.
   Cette étape est cruciale — sans elle, on pourrait tagger un commit qui a accidentellement
   cassé quelque chose.
6. **git-cliff** parcourt l'historique git, groupe les commits par type et écrit
   `CHANGELOG_RELEASE.md`. Pour ce tag initial, il prend tous les commits depuis le
   commit-racine.
7. **Setup Buildx + login GHCR** : prépare l'environnement Docker.
8. **docker/metadata-action** calcule les tags à appliquer à l'image. Avec `type=semver` :
   - `v1.0.0` → tag `1.0.0`
   - `v1.0.0` → tag `1.0` (major.minor)
   - - `latest` (raw, toujours appliqué)
9. **Build & push** l'image avec ces 3 tags sur `ghcr.io/hbtvictor/ci-cd-2`.
10. **softprops/action-gh-release** crée la Release GitHub avec :
    - `tag_name: v1.0.0`
    - `name: Release v1.0.0`
    - `body: <contenu de CHANGELOG_RELEASE.md>`

À la fin, la release est visible sur https://github.com/HbtVictor/ci-cd-2/releases avec son
CHANGELOG, et l'image est disponible sur https://ghcr.io/hbtvictor/ci-cd-2:v1.0.0.

**Q16 — Contenu du CHANGELOG et améliorations**

Le CHANGELOG généré pour `v1.0.0` ressemble à ceci (extrait) :

```markdown
## [1.0.0] - 2026-06-08

### ✨ Nouvelles fonctionnalités

- Ajouter endpoint /calc/modulo pour le calcul modulaire

### 🐛 Corrections

- Rejeter explicitement les valeurs non-numériques en entrée

### ♻️ Refactoring

- Extraire la validation des paramètres dans une fonction dédiée

### 🔧 Maintenance

- Bump express vers 5.2.1
```

C'est **cohérent avec mes commits** : chaque commit est classé dans la bonne section selon son
type Conventional. Le tri par groupe est lisible. Les emojis facilitent le scan visuel.

**Améliorations possibles :**

- **Liens vers les commits** : ajouter `[abc1234]` cliquable pointant vers le commit GitHub
  (configurable dans cliff.toml via `body` template avec `{{commit.id}}`).
- **Auteurs** : afficher le `@username` GitHub de l'auteur de chaque commit.
- **Liens vers les issues/PRs fermées** : parser les `#42` dans les messages et les transformer
  en liens.
- **Section "Breaking changes" en premier** : actuellement il n'y en a pas, mais si un futur
  commit en contient, on voudrait qu'elle apparaisse tout en haut.
- **Comparaison de versions** : ajouter un lien "Full Changelog: v0.9.0...v1.0.0" qui pointe
  vers la comparaison GitHub.

**Q17 — Pourquoi maintenir les tags `:v1.0.0` ET `:latest`**

Ce sont deux contrats différents :

- **`:v1.0.0`** est un **tag immuable et reproductible**. Si je `docker pull
ci-cd-2:v1.0.0` aujourd'hui ou dans 6 mois, je reçois exactement la même image (même hash,
  même contenu, mêmes vulnérabilités). C'est ce qu'on déploie en production : on pin une version
  précise pour avoir un comportement reproductible et pouvoir rollback. Si on déploie `:v1.0.0`
  et qu'il y a un bug, on déploie `:v0.9.0` → on retrouve l'ancienne version garantie.

- **`:latest`** est un **tag mouvant** qui pointe toujours sur la dernière version publiée.
  Demain je publie `v1.1.0` → `:latest` pointe sur `v1.1.0` ; après-demain `v2.0.0` → `:latest`
  pointe sur `v2.0.0`. C'est utile pour : (1) la doc de bienvenue ("essayez
  `docker run ci-cd-2:latest`"), (2) les développeurs qui veulent toujours la dernière, (3) un
  environnement de dev/preview qui se met à jour automatiquement.

**Quand utiliser lequel :**

| Contexte                            | Tag à utiliser |
| ----------------------------------- | -------------- |
| Production                          | `:v1.0.0`      |
| Staging avec version testée précise | `:v1.0.0`      |
| Documentation, exemples             | `:latest`      |
| `docker-compose` en local pour dev  | `:latest`      |
| Image base d'un autre Dockerfile    | `:v1.0.0`      |
| Démos publiques, tutos              | `:latest`      |

**Risque classique** : déployer `:latest` en production. Le jour où la version change, le pod
se redéploie tout seul, parfois sans qu'on ait validé. C'est un anti-pattern reconnu.

---

## EX.5 — Réflexion & Recherche

### 5A — Réflexion

**Q18 — Convaincre un senior réfractaire à Prettier**

Sa résistance vient d'une confusion : il pense que Prettier juge sa **compétence**. En réalité,
Prettier ne juge personne — c'est un outil qui résout un problème d'équipe.

Arguments objectifs à lui présenter :

1. **Tu ne formates pas pour toi, tu formates pour les autres.** Quand tu fais une review d'un
   junior, est-ce que tu commentes "mets un espace ici, retire le point-virgule" ou est-ce que
   tu te concentres sur la logique ? Prettier supprime à 100% les discussions de style en
   review. Le diff git ne montre que de la valeur métier.

2. **Tu ne perds pas ton style, tu y gagnes du temps.** En réalité, la plupart du temps tu
   formates **manuellement** (Tab, indentation, retours à la ligne). Avec Prettier, tu tapes
   l'algo en désordre et `Ctrl+S` le rend lisible. Tu gagnes 5-10% de temps de frappe.

3. **C'est un système, pas une opinion.** Le style n'est plus négociable, donc plus de
   débats. Tabs vs spaces ? Réglé. Single vs double quotes ? Réglé. Tu ne perds pas une
   bataille, tu sors d'une guerre qui n'avait pas de gagnant.

4. **Si tu refuses Prettier, tu deviens le goulot d'étranglement** des reviews : tu vas
   reformater le code des autres à la main, ou tolérer un style hétérogène qui rend le repo
   illisible pour les nouveaux arrivants.

5. **Les conventions ne sont pas un mépris pour ta créativité.** Ton expertise se voit dans
   ton architecture, tes choix de design, tes abstractions, ta robustesse — pas dans tes
   préférences sur les retours à la ligne.

S'il refuse encore après ces arguments, c'est un signal sur sa capacité à fonctionner en équipe,
plus que sur Prettier.

**Q19 — v3.2.1 + breaking change accidentel sur feature/new-auth**

Plusieurs choix, par ordre de qualité :

**Option idéale** : ne pas merger. Refactorer la branche `feature/new-auth` pour préserver la
compatibilité (ajouter un nouveau endpoint au lieu de modifier l'ancien, déprécier
explicitement avec un warning au lieu de supprimer, etc.). C'est plus de boulot mais ça
respecte le contrat avec les utilisateurs existants.

**Option pragmatique** : assumer la rupture et publier `v4.0.0`. C'est la décision honnête.
Mais alors la communication aux utilisateurs devient critique :

1. **CHANGELOG explicite** : section "BREAKING CHANGES" en tête, listant chaque incompatibilité
   et le code de migration.
2. **Guide de migration** dans la doc : `MIGRATION_v3_to_v4.md` avec exemples avant/après.
3. **Période de support de v3.x.x** : on continue à pusher des fixes de sécurité critiques sur
   `v3.x.x` pendant 6 mois (créer une branche `release/3.x`).
4. **Annonce préalable** si l'API a des utilisateurs externes : email, post de blog,
   annonce 2-4 semaines avant.
5. **Dépréciation graduelle** si possible : `v3.3.0` ajoute des warnings "cette route disparaît
   en v4", puis `v4.0.0` la supprime — au lieu d'une rupture brutale en une seule release.

**Option à éviter** : publier `v3.3.0` avec le breaking change. Ça viole SemVer
explicitement et casse la confiance des utilisateurs qui font `^3.0.0` dans leur package.json
en pensant être en sécurité.

### 5B — Recherche autonome

**Q20 — semantic-release vs git-cliff**

**`semantic-release`** est un outil "full automation" : il fait **tout** depuis les commits.
À chaque push sur `main`, il (1) lit les commits depuis le dernier tag, (2) calcule la prochaine
version SemVer, (3) génère le CHANGELOG, (4) crée le tag Git, (5) crée la release GitHub, (6)
publie sur npm si configuré, (7) commit éventuellement le CHANGELOG. Aucune intervention humaine.

**`git-cliff`** est un outil **focalisé sur la génération du CHANGELOG**. Il lit les commits,
les groupe, et produit un fichier Markdown. Il ne crée pas de tag, ne calcule pas de version,
ne publie nulle part. C'est juste un générateur de texte (puissant et configurable) qu'on
compose avec d'autres outils.

**Qui automatise totalement ?** `semantic-release`. Tu ne tagges jamais à la main, tu commit
proprement et la version est dérivée. C'est ce que fait le **Challenge** du TP.

**Trade-offs :**

- `semantic-release` est magique mais "boîte noire" — pour comprendre pourquoi une version
  particulière a été publiée, il faut maîtriser ses règles de parsing et sa config.
- `git-cliff` + tag manuel laisse le développeur conscient de chaque release. C'est plus
  contraignant mais on garde le contrôle (et c'est ce qu'on fait dans ce TP S9/S10).

En pratique : `semantic-release` pour les libs npm publiques très fréquemment releasées
(plusieurs fois par jour) ; `git-cliff` + tag manuel pour les apps et services internes où une
release est un événement qu'on planifie.

**Q21 — commitlint : règle custom + hook commit-msg**

**Règle personnalisée "subject ≥ 10 caractères ET non-vide"** dans `commitlint.config.js` :

```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-min-length': [2, 'always', 10],
    'subject-empty': [2, 'never'],
  },
};
```

Syntaxe des règles commitlint :

- Le tableau a 3 éléments : `[level, applicable, value]`.
- `level` : `0` = désactivé, `1` = warning, `2` = error (bloque le commit).
- `applicable` : `'always'` (la règle s'applique toujours) ou `'never'` (elle s'applique en
  négatif).
- `value` : la valeur attendue (ici, 10 pour la longueur minimale).

Donc `'subject-min-length': [2, 'always', 10]` se lit : "always require the subject to be at
least 10 characters, error if not". Et `'subject-empty': [2, 'never']` se lit : "the subject is
never empty, error if it is".

**Hook `commit-msg` de Husky** : c'est l'un des hooks git "client-side" qui se déclenche
**après** que tu valides ton message de commit (dans l'éditeur ou via `-m`), mais **avant** que
le commit soit effectivement créé. Il reçoit en argument le path du fichier temporaire qui
contient le message saisi.

Le hook `.husky/commit-msg` de ce projet contient :

```bash
npx --no -- commitlint --edit "$1"
```

- `$1` = path du fichier temporaire avec le message.
- `commitlint --edit "$1"` lit ce fichier, applique les règles définies dans
  `commitlint.config.js`, et retourne exit code 0 (OK) ou non-zéro (refus).
- Si exit non-zéro, Husky abort le commit. Le message n'est jamais committé. Le développeur
  voit l'erreur et peut corriger.

C'est le seul moyen de **bloquer côté client** un commit invalide avant qu'il existe dans le
repo. (Côté serveur, on aurait `pre-receive` ou un check CI — qu'on a aussi avec le job
`commitlint`.)
