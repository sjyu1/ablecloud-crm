// app/notice/register/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import NoticeRegisterForm from './noticeRegisterForm';
import log from '@/utils/logger';

export default async function NoticeRegisterPage() {
  log.info('API ::: POST /notice/register');
  const cookieStore = cookies();
  const role = (await cookieStore).get('role')?.value;
  const username = (await cookieStore).get('username')?.value;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">공지사항 등록</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <NoticeRegisterForm role={role} username={username} />
      </div>
    </div>
  );
}
