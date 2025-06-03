import express from 'express';
import strains from './strains'

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/strain', (_req, res) => {  
  const random = strains[Math.floor(Math.random() * strains.length)];
  res.send(random);
});

app.listen(PORT, () => {
  console.log(`Strain API listening on port ${PORT}`);
});
