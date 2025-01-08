'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from './store/authStore';

export default function MainPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div>
      <h1>Main Page</h1>
    </div>
  );
}
