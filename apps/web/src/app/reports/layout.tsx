import AdminLteDashboardShell from '@/components/AdminLteDashboardShell';

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return <AdminLteDashboardShell role="DOCTOR" allowedRoles={['DOCTOR']}>{children}</AdminLteDashboardShell>;
}