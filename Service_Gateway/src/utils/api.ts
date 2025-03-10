import { cookies } from 'next/headers';

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = (await cookies()).get('token')?.value;
  
  if (!token) {
    throw new Error('인증 토큰이 필요합니다.');
  }

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'authorization': `Bearer ${token}`,
  };

  return fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });
} 