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

export async function fetchWithAuthValid(url: string, options: RequestInit = {}) {
  const token = (await cookies()).get('token')?.value;
  
  if (!token) {
    throw new Error('Failed to fetch user information');
  }

  if (!await validToken(token)) {
    throw new Error('Failed to fetch user information');
  }
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'authorization': `Bearer ${token}`,
  };

  // const headers = options?.headers ? new Headers(options.headers) : new Headers();
  // let headerData = {}
  // let defaultHeaders = {
  //   // 'Content-Type': 'application/json',
  //   'Content-Type': headers.get("Content-Type"),
  //   'authorization': `Bearer ${token}`,
  // };

  // if (!headers.has("Authorization")) {
  //   headerData = defaultHeaders
  // } else {
  //   headerData = { ...options?.headers }
  // }

  return fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });
} 

export async function validToken(token: string) {
  try {
    const res_user = await fetchWithAuth(`${process.env.KEYCLOAK_API_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/userinfo`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data_user = await res_user.json();
    if (!data_user) {
      return false
    }

    return true
  } catch (error) {
    return false
  }
}