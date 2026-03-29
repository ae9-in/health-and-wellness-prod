const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

async function testUpload() {
  const form = new FormData();
  form.append('name', 'Test Product');
  form.append('description', 'A test product for image uploads');
  form.append('category', 'Wellness');
  form.append('price', '100');
  form.append('stock', '10');
  form.append('commissionRate', '5');
  
  // write a dummy image
  fs.writeFileSync('dummy.jpg', 'fake image content');
  form.append('productImages', fs.createReadStream('dummy.jpg'));

  // First we need a token. Let's just create a test one or login
  const loginRes = await axios.post('http://localhost:5001/api/auth/login', {
    email: 'test3@gmail.com',
    password: 'password123'
  });
  const token = loginRes.data.token;

  try {
    const res = await axios.post('http://localhost:5001/api/brand/products', form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });
    console.log('SUCCESS:', res.data);
  } catch (err) {
    console.log('ERROR:', err.response?.data || err.message);
  }
}

testUpload();
