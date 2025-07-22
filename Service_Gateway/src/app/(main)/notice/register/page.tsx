'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie, logoutIfTokenExpired } from '../../../store/authStore';
import Link from 'next/link';

interface NoticeForm {
  title: string;
  content: string;
  writer: string;
  level: string[];
}

const level = [
  { id: 'ALL', name: '전체' },
  { id: 'PLATINUM', name: 'PLATINUM' },
  { id: 'GOLD', name: 'GOLD' },
  { id: 'SILVER', name: 'SILVER' },
  { id: 'VAR', name: 'VAR' }
];

export default function NoticeRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<NoticeForm>({
    title: '',
    content: '',
    writer: '',
    level: []
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<string | undefined>(undefined);
  const [username, setUsername] = useState<string | undefined>(undefined);

  useEffect(() => {
    const role = getCookie('role');
    setRole(role ?? undefined);
    const username = getCookie('username');
    setUsername(username ?? undefined);

    // 첫번째 항목 자동 체크
    setFormData(prev => ({
      ...prev,
      level: [level[0].id.toString()]
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const registerFormData = { 
        ...formData,
        level: formData.level.join(','),
        writer: username
      }

      const response = await fetch('/api/notice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerFormData),
      });

      if (response.ok) {
        alert('공지사항이 등록되었습니다.');
      } else {
        throw new Error('공지사항 등록에 실패했습니다.');
      }

      router.push('/notice');
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      if (err == 'Failed to fetch user information') {
        logoutIfTokenExpired(); // 토큰 만료시 로그아웃
      } else {
        // alert(result.message);
        return;
        }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxGroupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
  
    setFormData(prev => {
      if (!prev) return prev;
  
      const selected = [...prev.level];
  
      let updatedLevels: string[] = [];
  
      if (value === 'ALL') {
        // "전체" 선택 시 다른 모든 항목 해제
        if (checked) {
          updatedLevels = ['ALL'];
        } else {
          // 전체 해제하려 해도 아무 것도 안 남으면 유지
          if (selected.length === 1 && selected[0] === 'ALL') {
            return prev;
          }
          updatedLevels = selected.filter(v => v !== 'ALL');
          if (updatedLevels.length === 0) return prev;
        }
      } else {
        // 개별 항목 선택 시 "전체" 해제
        updatedLevels = selected.filter(v => v !== 'ALL');
  
        if (checked) {
          updatedLevels.push(value);
        } else {
          // 마지막 항목 체크 해제 방지
          const next = updatedLevels.filter(v => v !== value);
          if (next.length === 0) return prev;
          updatedLevels = next;
        }
      }
  
      return {
        ...prev,
        level: updatedLevels,
      };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">공지사항 등록</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                등급
              </label>
              <div className="w-1/2 grid grid-cols-2 gap-3 p-3 border border-gray-300 rounded-md">
                {level.map(item => (
                  <label
                    key={item.id}
                    className="flex items-center space-x-2 text-sm text-gray-700"
                  >
                    <input
                      type="checkbox"
                      name="level"
                      value={item.id}
                      checked={formData.level.includes(item.id.toString())}
                      onChange={handleCheckboxGroupChange}
                      className="rounded border-gray-300"
                    />
                    <span>{item.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제목
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                내용
              </label>
              <textarea
                  id="text-input"
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  placeholder="내용을 입력하세요"
                  rows={10}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Link
              href="/notice"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? '처리 중...' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}