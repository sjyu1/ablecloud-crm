'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import PasswordChangeModal from './passwordChangeModal';

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  type: string;
  telnum: string;
  role: string;
  company: string;
}

interface Props {
  user?: User;
  role?: string;
  prevPage: string;
  prevType: string;
  prevSearchField: string;
  prevSearchValue: string;
}

export default function UserDetailClient({
  user,
  role,
  prevPage,
  prevType,
  prevSearchField,
  prevSearchValue,
}: Props) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDelete = async () => {
    if (!confirm('정말 이 사용자를 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/user/${user?.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        alert('사용자가 삭제되었습니다.');
        router.push(`/user?page=${prevPage}&type=${prevType}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`);
      } else {
        const data = await res.json();
        throw new Error(data.message || '사용자 삭제에 실패했습니다.');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  };

  const handlePasswordChange = (newPassword: string) => {
    setIsModalOpen(false);
    // Optional: show a success message
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">사용자 상세정보</h1>
        <div className="space-x-2">
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            비밀번호 변경
          </button>
          <button
            onClick={() => router.push(`/user/${user?.id}/edit?page=${prevPage}&type=${prevType}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            수정
          </button>
          {role === 'Admin' && (
            <>
              <button onClick={handleDelete} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                삭제
              </button>
            </>
          )}
          <button
            onClick={() => router.push(`/user?page=${prevPage}&type=${prevType}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            목록
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <DetailItem label="아이디" value={user?.username} />
        <DetailItem label="이메일" value={user?.email} />
        <DetailItem label="이름" value={user?.firstName} />
        <DetailItem label="전화번호" value={user?.telnum} />
        <DetailItem label="타입" value={user?.type} />
        <DetailItem label="ROLE" value={user?.role} />
        <DetailItem label="회사" value={user?.company} />
      </div>

      <PasswordChangeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handlePasswordChange} />
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-500">{label}</h3>
      <p className="mt-1 text-lg text-gray-900">{value}</p>
    </div>
  );
}
