module.exports = {
  extends: ['@commitlint/config-conventional'],
  // Rules complémentaires (cf. Q21 du TP)
  rules: {
    // Le sujet (la phrase après le type) doit faire au moins 10 caractères
    'subject-min-length': [2, 'always', 10],
    // Le sujet ne peut pas être vide
    'subject-empty': [2, 'never'],
  },
};
