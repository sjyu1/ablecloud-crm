'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { getCookie, logoutIfTokenExpired } from '../../../../store/authStore';
import Link from 'next/link';

interface NoticeForm {
  id: number;
  title: string;
  content: string;
  level: string[];
}

const level = [
  { id: 'ALL', name: '전체' },
  { id: 'PLATINUM', name: 'PLATINUM' },
  { id: 'GOLD', name: 'GOLD' },
  { id: 'SILVER', name: 'SILVER' },
  { id: 'VAR', name: 'VAR' }
];

export default function NoticeEditPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const prevPage = searchParams.get('page') || '1';
  const prevSearchField = searchParams.get('searchField') || 'title';
  const prevSearchValue = searchParams.get('searchValue') || '';
  const [formData, setFormData] = useState<NoticeForm | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNoticeDetail();
  }, []);

  const fetchNoticeDetail = async () => {
    try {
      const response = await fetch(`/api/notice/${params.id}`);
      const result = await response.json();

      if (!response.ok) {
        if (result.message === 'Failed to fetch user information') {
          logoutIfTokenExpired(); // 토큰 만료시 로그아웃
        } else {
          return;
        }
      }

      const data = result.data;

      const levelArray = Array.isArray(data.level)
        ? data.level
        : (data.level || '')
            .split(',')
            .map((id: string) => id.trim())
            .filter(Boolean); // 공백 제거 및 빈값 제거

      setFormData({
        ...data,
        level: levelArray,
      });
    } catch (err) {
      // setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      alert('공지사항 정보를 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // setIsLoading(true);

    try {
      const updateFormData: any = {
        ...formData,
        level: formData?.level.join(','),
      };

      const response = await fetch(`/api/notice/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateFormData),
      });

      if (response.ok) {
        alert('공지사항이 수정되었습니다.');
      } else {
        throw new Error(response.status == 409? '이미 존재하는 공지사항입니다.' : '공지사항 수정에 실패했습니다.');
      }

      router.push(`/notice/${params.id}?page=${prevPage}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
      
    setFormData(prev => prev ? {
      ...prev,
      [name]: value
    } : null);
  };

  const handleCheckboxGroupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
  
    setFormData(prev => {
      if (!prev) return prev;
  
      let selected = Array.isArray(prev.level) ? prev.level : [];
  
      // "전체" 선택 시
      if (value === 'ALL') {
        return {
          ...prev,
          level: checked ? ['ALL'] : selected, // 체크 해제 시 상태 유지
        };
      }
  
      // 현재 선택 항목에서 "전체" 제외
      let updatedLevels = selected.filter(l => l !== 'ALL');
  
      if (checked) {
        updatedLevels.push(value);
      } else {
        // 선택 해제 시 하나만 남아있다면 해제 못하게 막음
        if (updatedLevels.length === 1 && updatedLevels[0] === value) {
          return prev;
        }
        updatedLevels = updatedLevels.filter(l => l !== value);
      }
  
      return {
        ...prev,
        level: updatedLevels,
      };
    });
  };

  if (isLoading) {
    return <div className="text-center py-4 text-sm">로딩 중...</div>;
  }

  // if (error) {
  //   return <div className="text-center text-red-500 py-4">{error}</div>;
  // }

  if (!formData) {
    return <div className="text-center py-4 text-sm">공지사항 정보를 찾을 수 없습니다.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">공지사항 수정</h1>
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
              href={`/notice/${params.id}?page=${prevPage}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`}
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
              {isLoading ? '처리 중...' : '수정'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
