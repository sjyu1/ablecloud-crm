'use client';

import { useState } from 'react';
import { useRouter, redirect } from 'next/navigation';
import Link from 'next/link';

interface NoticeForm {
  id: number;
  title: string;
  content: string;
  level: string[];
}

interface LevelOption {
  id: string;
  name: string;
}

interface Props {
  initialData: NoticeForm;
  role?: string;
  searchParams: { page?: string; searchField?: string; searchValue?: string };
}

const levelOptions: LevelOption[] = [
  { id: 'ALL', name: '전체' },
  { id: 'PLATINUM', name: 'PLATINUM' },
  { id: 'GOLD', name: 'GOLD' },
  { id: 'SILVER', name: 'SILVER' },
  { id: 'VAR', name: 'VAR' },
];

export default function NoticeEditFormClient({
  initialData,
  role,
  searchParams,
}: Props) {
  const router = useRouter();

  const prevPage = searchParams.page || '1';
  const prevSearchField = searchParams.searchField || 'title';
  const prevSearchValue = searchParams.searchValue || '';

  const [formData, setFormData] = useState<NoticeForm>(initialData);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxGroupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;

    setFormData((prev) => {
      let selected = Array.isArray(prev.level) ? [...prev.level] : [];

      if (value === 'ALL') {
        return {
          ...prev,
          level: checked ? ['ALL'] : selected,
        };
      }

      let updatedLevels = selected.filter((l) => l !== 'ALL');

      if (checked) {
        updatedLevels.push(value);
      } else {
        if (updatedLevels.length === 1 && updatedLevels[0] === value) {
          // 최소 한 개는 유지
          return prev;
        }
        updatedLevels = updatedLevels.filter((l) => l !== value);
      }

      return {
        ...prev,
        level: updatedLevels,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const updateFormData = {
        ...formData,
        level: formData.level.join(','),
      };

      const response = await fetch(`/api/notice/${formData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateFormData),
      });

      if (response.ok) {
        alert('공지사항이 수정되었습니다.');
        router.push(
          `/notice/${formData.id}?page=${prevPage}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`
        );
      } else {
        const data = await response.json();
        throw new Error(data.message || '공지사항 수정에 실패했습니다.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '공지사항 수정에 실패했습니다.';
      if (message === 'Failed to fetch user information') {
        return redirect('/api/logout');
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              등급
            </label>
            <div className="w-1/2 grid grid-cols-2 gap-3 p-3 border border-gray-300 rounded-md">
              {levelOptions.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center space-x-2 text-sm text-gray-700"
                >
                  <input
                    type="checkbox"
                    name="level"
                    value={item.id}
                    checked={formData.level.includes(item.id)}
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
            href={`/notice/${formData.id}?page=${prevPage}&searchField=${prevSearchField}&searchValue=${prevSearchValue}`}
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
  );
}
