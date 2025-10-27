'use client';

import { useState } from 'react';
import { useRouter, redirect } from 'next/navigation';
import Link from 'next/link';

interface NoticeForm {
  title: string;
  content: string;
  writer: string;
  level: string[];
}

interface NoticeRegisterFormProps {
  role?: string;
  username?: string;
}

const LEVEL_OPTIONS = [
  { id: 'ALL', name: '전체' },
  { id: 'PLATINUM', name: 'PLATINUM' },
  { id: 'GOLD', name: 'GOLD' },
  { id: 'SILVER', name: 'SILVER' },
  { id: 'VAR', name: 'VAR' },
];

export default function NoticeRegisterForm({ role, username }: NoticeRegisterFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState<NoticeForm>({
    title: '',
    content: '',
    writer: username || '',
    level: ['ALL'],
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxGroupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;

    setFormData((prev) => {
      const selected = [...prev.level];
      let updated: string[] = [];

      if (value === 'ALL') {
        updated = checked ? ['ALL'] : selected.filter((v) => v !== 'ALL');
      } else {
        updated = selected.filter((v) => v !== 'ALL');
        if (checked) updated.push(value);
        else updated = updated.filter((v) => v !== value);
        if (updated.length === 0) updated = ['ALL'];
      }

      return { ...prev, level: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        level: formData.level.join(','),
        writer: username,
      };

      const response = await fetch('/api/notice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert('공지사항이 등록되었습니다.');
        router.push('/notice');
      } else {
        const data = await response.json();
        throw new Error(data.message || '공지사항 등록에 실패했습니다.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '공지사항 등록에 실패했습니다.';
      if (message === 'Failed to fetch user information') {
        return redirect('/api/logout');
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">등급</label>
        <div className="w-1/2 grid grid-cols-2 gap-3 p-3 border border-gray-300 rounded-md">
          {LEVEL_OPTIONS.map((item) => (
            <label key={item.id} className="flex items-center space-x-2 text-sm text-gray-700">
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
        <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
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
        <label className="block text-sm font-medium text-gray-700 mb-2">내용</label>
        <textarea
          name="content"
          value={formData.content}
          onChange={handleChange}
          rows={10}
          placeholder="내용을 입력하세요"
          className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {error && <div className="text-red-500 text-sm">{error}</div>}

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
  );
}
