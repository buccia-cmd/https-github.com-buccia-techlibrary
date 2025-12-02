require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function isAdmin(req) {
  return req.headers['x-admin-secret'] === process.env.ADMIN_SECRET;
}

app.get('/api/books', async (req, res) => {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.post('/api/books', async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "wrong admin secret" });

  const book = req.body;

  const { data, error } = await supabase
    .from('books')
    .insert([book])
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data[0]);
});

app.delete('/api/books/:id', async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "wrong admin secret" });

  const { data, error } = await supabase
    .from('books')
    .delete()
    .eq('id', req.params.id)
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
});

app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
