const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5ZDAzMGUyNi1mOGRmLTQ1ZDYtYjNhNC0yYjE3ZjRmNmNkMmMiLCJyb2xlIjoiQlJBTkQiLCJpYXQiOjE3NzQzMDEzOTksImV4cCI6MTc3NDkwNjE5OX0.ENq8GHGkwpnoyF9_pkUmxcOh-vtmjinu7UHbb1Lse34';
const url = 'http://localhost:5001/api/brands/products';
const payload = {
  name: 'Test Product',
  category: 'Nutrition',
  description: 'Test desc',
  price: 350,
  commissionRate: 5,
  stock: 50
};
(async () => {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  const text = await res.text();
  console.log(res.status);
  console.log(text);
})();
