export interface AdminCredentials {
  email: string;
  password: string;
}

export function getAdminCredentials(): AdminCredentials | null {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    return null;
  }
  return { email, password };
}

export function requireAdminCredentials(): AdminCredentials {
  const creds = getAdminCredentials();
  if (!creds) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in the environment before running this feature.');
  }
  return creds;
}
