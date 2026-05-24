const axios = require('axios');
axios.get('http://localhost:3001/api/products').then(res => console.log('Products:', res.data.length)).catch(err => console.error('Error:', err.message));
