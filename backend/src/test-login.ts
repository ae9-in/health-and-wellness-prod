async function testLogin() {
  try {
    const res = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'kiran@gmail.com',
        password: 'password'
      })
    });
    const data: any = await res.json();
    if (res.ok) {
      console.log('Login successful:', data.token ? 'Token received' : 'No token');
    } else {
      console.error('Login failed:', data);
    }
  } catch (err: any) {
    console.error('Login failed:', err.message);
  }
}

testLogin();
