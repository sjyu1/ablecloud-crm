import { cookies } from 'next/headers';
import { fetchWithAuth } from '@/utils/api';
import { redirect } from 'next/navigation';
import UserRegisterForm from './userRegisterForm';
import log from '@/utils/logger';

export default async function UserRegisterPage() {
  log.info('API URL ::: POST /user');
  const cookieStore = cookies();
  const role = (await cookieStore).get('role')?.value;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">사용자 등록</h1>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <UserRegisterForm role={role} />
      </div>
    </div>
  );
}
