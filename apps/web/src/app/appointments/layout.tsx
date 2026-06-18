import AdminLteDashboardShell from '@/components/AdminLteDashboardShell';

export default function AppointmentsLayout({ children }: { children: React.ReactNode }) {
  return <AdminLteDashboardShell role="DOCTOR" allowedRoles={['DOCTOR']}>{children}</AdminLteDashboardShell>;
}