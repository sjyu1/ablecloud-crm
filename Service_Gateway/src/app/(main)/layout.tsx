'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getCookie, useAuthStore } from '../store/authStore';
import Link from 'next/link';
import Image from 'next/image';
import '../layout.css';

// SVG 파일을 React 컴포넌트로 임포트
import license_svg from '../../../public/icons/license.svg';
import business_svg from '../../../public/icons/business.svg';
import product_svg from '../../../public/icons/product.svg';
import partner_svg from '../../../public/icons/partner.svg';
import customer_svg from '../../../public/icons/customer.svg';
import user_svg from '../../../public/icons/user.svg';
import support_svg from '../../../public/icons/support.svg';
import credit_svg from '../../../public/icons/credit.svg';
import notice_svg from '../../../public/icons/notice.svg';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuthStore();

  const [username, setUsername] = useState<string | undefined>(undefined);
  const [role, setRole] = useState<string | undefined>(undefined);

  // 쿠키에서 사용자 정보 가져오기
  useEffect(() => {
    const usernameCookie = getCookie('username');
    const roleCookie = getCookie('role');

    setUsername(usernameCookie ?? undefined);
    setRole(roleCookie ?? undefined);
  }, []);

  // 로그아웃 처리
  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // 메뉴 아이템 정의 (아이콘 참조 형태)
  const menuItems = [
    { name: '라이선스', path: '/license', icon: license_svg },
    { name: '사업', path: '/business', icon: business_svg },
    { name: '제품', path: '/product', icon: product_svg },
    { name: '파트너', path: '/partner', icon: partner_svg },
    { name: '고객', path: '/customer', icon: customer_svg },
    { name: '사용자', path: '/user', icon: user_svg },
    { name: '기술지원', path: '/support', icon: support_svg },
    ...(role === 'Admin' ? [{ name: '크레딧', path: '/credit', icon: credit_svg }] : []),
    { name: '공지사항', path: '/notice', icon: notice_svg },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* 헤더 */}
      <header className="bg-white shadow fixed w-full z-10">
        <div className="px-4 py-4">
          <nav className="flex justify-between items-center">
            <Image
              src="/images/ablestack-logo.png"
              alt="ABLESTACK Logo"
              width={200}
              height={100}
              priority
            />
            <div className="flex items-center gap-4">
              <span className="text-gray-600">
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

      <div className="flex flex-1 pt-16 bg-white shadow-lg">
        {/* 왼쪽 메뉴 */}
        <aside className="w-64 bg-white shadow-lg fixed h-full">
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xl">
                  <Image
                    src={Icon}
                    alt="ABLESTACK Logo"
                    className="w-6 h-6"
                    priority
                  />
                  </span>
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
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
            © 2025 ABLECLOUD 라이선스 관리 시스템. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
