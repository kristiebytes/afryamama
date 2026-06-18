import AdminLteDashboardShell from '@/components/AdminLteDashboardShell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLteDashboardShell role="ADMIN" allowedRoles={['ADMIN']}>{children}</AdminLteDashboardShell>;
}