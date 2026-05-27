const express = require('express');
const app = express();
app.use(express.json());
app.post('/api/v1/auth/admin/login', (req, res) => {
  res.json({ body: req.body });
});
app.listen(3009, () => console.log('listening'));
