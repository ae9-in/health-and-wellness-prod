
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();
const secret = process.env.JWT_SECRET || 'fallback-secret';

async function main() {
  const adminToken = jwt.sign({ isAdmin: true, role: 'ADMIN' }, secret, { expiresIn: '7d' });
  const fetch = require('node-fetch');
  const res = await fetch('http://localhost:5001/api/admin/stats', {
    headers: { 'Authorization': 'Bearer ' + adminToken }
  });
  if (!res.ok) {
     console.log('API Failed:', res.status, await res.text());
  } else {
     console.log('API Data:', await res.json());
  }
}
main().finally(() => prisma.$disconnect());

