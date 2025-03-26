'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state: any) => state.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('아이디와 비밀번호를 입력해주세요.');
      return;
    }

    try {
      const success = await login({ username, password });
      if (success) {
        router.push('/license');
      } else {
        // alert('아이디 또는 비밀번호가 올바르지 않습니다.');
        setError('아이디 또는 비밀번호가 올바르지 않습니다.');
      }
    } catch (err) {
      // alert('로그인에 실패했습니다. 다시 시도해주세요.');
      setError('로그인에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
        {/* <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">로그인</h2> */}
        <Image
              src="/images/ablestack-logo.png"  // public 폴더의 경로
              alt="My PNG Image"
              width={500}  // 이미지의 너비
              height={300} // 이미지의 높이
            />
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              아이디
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              
            />
          </div>
          {error && (
            <div className="text-red-500 text-sm text-center">
              {error}
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            로그인
          </button>
        </form>
      </div>
    </div>
  );
} 