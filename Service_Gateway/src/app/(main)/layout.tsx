'use client';

import { useRouter } from 'next/navigation';
import { getCookie, useAuthStore } from '../store/authStore';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const username = getCookie('username');

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const menuItems = [
    // { name: '대시보드', path: '/dashboard', icon: '📊' },
    { name: '라이센스', path: '/license', icon: '🔑' },
    // { name: '제품', path: '/product', icon: '🗄️' },
    // { name: '납품업체', path: '/company', icon: '🏢' },
    // { name: '설정', path: '/settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* 헤더 */}
      <header className="bg-white shadow fixed w-full z-10">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-800">ABLECLOUD CRM</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">
                {/* <strong>{user?.username}</strong>님 환영합니다 */}
                <strong>{username}</strong>님 환영합니다
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
              >
                로그아웃
              </button>
            </div>
          </nav>
        </div>
      </header>

      <div className="flex flex-1 pt-16">
        {/* 왼쪽 메뉴 */}
        <aside className="w-64 bg-white shadow-lg fixed h-full">
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  pathname === item.path
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* 메인 컨텐츠 */}
        <main className="flex-1 ml-64 p-8">
          <div className="container mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* 푸터 */}
      <footer className="bg-white border-t ml-64">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-gray-500 text-sm">
            © 2024 ABLECLOUD CRM 관리 시스템. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
} 