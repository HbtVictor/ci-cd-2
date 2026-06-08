// src/server.js
const express = require('express');
const { add, subtract, multiply, divide, modulo } = require('./calculator');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

app.get('/calc/:op/:a/:b', (req, res) => {
  const { op, a, b } = req.params;
  const ops = { add, subtract, multiply, divide, modulo };
  if (!ops[op]) return res.status(400).json({ error: 'Unknown op' });
  const parsedA = parseFloat(a);
  const parsedB = parseFloat(b);
  if (Number.isNaN(parsedA) || Number.isNaN(parsedB)) {
    return res.status(400).json({ error: 'Les paramètres a et b doivent être des nombres' });
  }
  try {
    res.json({ result: ops[op](parsedA, parsedB) });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.listen(PORT, () => console.log(`Server on port ${PORT}`));
module.exports = app;
