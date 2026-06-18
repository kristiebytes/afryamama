import AdminLteDashboardShell from '@/components/AdminLteDashboardShell';

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return <AdminLteDashboardShell role="DOCTOR" allowedRoles={['DOCTOR']}>{children}</AdminLteDashboardShell>;
}