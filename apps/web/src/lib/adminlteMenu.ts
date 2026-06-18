import type { MenuNode } from '@adminlte/react';

export const doctorMenuItems: MenuNode[] = [
  {
    type: 'group',
    text: 'Overview',
    icon: 'bi-speedometer2',
    children: [
      {
        type: 'item',
        text: 'Dashboard',
        href: '/doctor/dashboard',
        icon: 'bi-circle',
      },
    ],
  },
  {
    type: 'header',
    text: 'Clinical Operations',
  },
  {
    type: 'item',
    text: 'Mothers Registry',
    href: '/mothers',
    icon: 'bi-people',
  },
  {
    type: 'item',
    text: 'Appointments',
    href: '/appointments',
    icon: 'bi-calendar3',
  },
  {
    type: 'item',
    text: 'Medical Records',
    href: '/records',
    icon: 'bi-journal-medical',
  },
  {
    type: 'item',
    text: 'Health Reports',
    href: '/reports',
    icon: 'bi-graph-up-arrow',
  },
  {
    type: 'header',
    text: 'Account',
  },
  {
    type: 'item',
    text: 'Doctor Profile',
    href: '/doctor/profile',
    icon: 'bi-person-badge',
  },
];

export const adminMenuItems: MenuNode[] = [
  {
    type: 'group',
    text: 'Administration',
    icon: 'bi-shield-lock',
    children: [
      {
        type: 'item',
        text: 'Dashboard',
        href: '/admin/dashboard',
        icon: 'bi-circle',
      },
    ],
  },
  {
    type: 'header',
    text: 'Monitoring',
  },
  {
    type: 'item',
    text: 'Users',
    href: '/admin/users',
    icon: 'bi-people-fill',
  },
  {
    type: 'item',
    text: 'Reports',
    href: '/admin/reports',
    icon: 'bi-file-earmark-bar-graph',
  },
  {
    type: 'item',
    text: 'Notifications',
    href: '/admin/notifications',
    icon: 'bi-bell',
  },
  {
    type: 'item',
    text: 'Profile',
    href: '/admin/profile',
    icon: 'bi-person-circle',
  },
];