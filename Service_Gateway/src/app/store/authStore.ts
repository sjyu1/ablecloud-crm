import { create } from 'zustand';

interface User {
  id: number;
  username: string;
}

interface AuthState {
  user: User | null;
  login: (credentials: { username: string; password: string }) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  login: async (credentials) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        // throw new Error('Login failed');
        return false;
      }

      const data = await response.json();
      set({ user: data.user });

      // 쿠키에 토큰 저장
      document.cookie = `token=${data.token}; path=/; max-age=604800; samesite=strict`;
      // 쿠키에 username 저장
      document.cookie = `username=${data.user.username}; path=/; max-age=604800; samesite=strict`;
      // 쿠키에 role 저장
      const access_token_json = JSON.parse(Buffer.from(data.token.split('.')[1], 'base64').toString())
      const role_arr = access_token_json.realm_access.roles

      for ( const role in role_arr){
        if(role_arr[role] === "Admin" || role_arr[role] === "User"){
          document.cookie = `role=${role_arr[role]}; path=/; max-age=604800; samesite=strict`;
        }
      }

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  },
  logout: () => {
    set({ user: null });
    // 모든 인증 관련 쿠키 제거
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    document.cookie = 'username=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    document.cookie = 'role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
  },
}));

// 쿠키에서 값을 가져오는 유틸리티 함수
export const getCookie = (name: string): string | null => {
  // if(typeof document !== 'undefined') {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  // }
  // return null;
}; 

// 토큰 만료시 로그아웃
export const logoutIfTokenExpired = () => {
  alert('로그인 유효시간이 지나 로그아웃됩니다.');

  // 모든 인증 관련 쿠키 제거
  const cookies = document.cookie.split(';');
  cookies.forEach(cookie => {
    const cookieName = cookie.split('=')[0].trim();
    document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`;  // 쿠키 만료시킴
  });

  // 로그인 페이지로 리디렉션
  window.location.href = '/login';
};