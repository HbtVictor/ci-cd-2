// src/server.js
const express = require('express');
const { add, subtract, multiply, divide, modulo } = require('./calculator');

const app = express();
const PORT = process.env.PORT || 3000;

const operations = { add, subtract, multiply, divide, modulo };

/**
 * Parse et valide les paramètres `a` et `b` de la requête.
 * Retourne `{ a, b }` si tout est OK, ou `null` si invalide
 * (le caller envoie alors une réponse 400).
 */
function parseOperands(rawA, rawB) {
  const a = parseFloat(rawA);
  const b = parseFloat(rawB);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return { a, b };
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

app.get('/calc/:op/:a/:b', (req, res) => {
  const { op } = req.params;
  if (!operations[op]) {
    return res.status(400).json({ error: 'Unknown op' });
  }
  const operands = parseOperands(req.params.a, req.params.b);
  if (!operands) {
    return res.status(400).json({ error: 'Les paramètres a et b doivent être des nombres' });
  }
  try {
    res.json({ result: operations[op](operands.a, operands.b) });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.listen(PORT, () => console.log(`Server on port ${PORT}`));
module.exports = app;
