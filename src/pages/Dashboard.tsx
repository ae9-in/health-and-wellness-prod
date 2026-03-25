import { useAuth } from '@/lib/auth';
import { Navigate } from 'react-router-dom';
import UserDashboard from './UserDashboard';
import AffiliateDashboard from './AffiliateDashboard';
import BrandDashboard from './BrandDashboard';

export default function Dashboard() {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" />;

  switch (user.role) {
    case 'ADMIN':
      return <Navigate to="/admin/dashboard" />;
    case 'AFFILIATE':
      return <AffiliateDashboard />;
    case 'BRAND':
      return <BrandDashboard />;
    case 'USER':
    default:
      return <UserDashboard />;
  }
}
