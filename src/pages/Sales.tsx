import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminSalesView from '@/components/sales/AdminSalesView';
import POSScreen from '@/components/sales/POSScreen';

export default function Sales() {
  const { userRole } = useAuth();
  const [forcePOS, setForcePOS] = useState(false);
  const [forceAdmin, setForceAdmin] = useState(false);

  // Admin can toggle to POS view
  if (userRole === 'admin' && forcePOS) {
    return <POSScreen onSwitchToAdmin={() => setForcePOS(false)} />;
  }

  // Admin default: full dashboard
  if (userRole === 'admin' && !forceAdmin) {
    return <AdminSalesView onSwitchToPOS={() => setForcePOS(true)} />;
  }

  // User (employee): POS screen
  if (userRole === 'user' && !forceAdmin) {
    return <POSScreen />;
  }

  // Fallback (loading or unknown role)
  return <AdminSalesView onSwitchToPOS={() => setForcePOS(true)} />;
}
