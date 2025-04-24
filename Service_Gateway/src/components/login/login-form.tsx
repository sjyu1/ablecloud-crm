'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/app/store/authStore';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Logo from '../../../public/images/ablestack-logo.png';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const router = useRouter();
  const login = useAuthStore((state: any) => state.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('아이디와 비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            <Image src={Logo} alt="ABLESTACK Logo" sizes="20vw" priority />
          </CardTitle>
          <CardDescription>
            계정 및 비밀번호를 입력 후 로그인 버튼을 클릭하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="username">아이디</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="아이디"
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">비밀번호</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="비밀번호"
                  required
                />
              </div>
              {error && (
                <div className="text-red-500 text-sm text-center">{error}</div>
              )}
              <Button type="submit" className="w-full">
                로그인
              </Button>
              {isLoading ? (
                <div className="flex justify-center items-center">
                  <div className="animate-spin rounded-full border-t-2 border-white w-6 h-6 mr-2"></div>
                  로딩 중...
                </div>
              ) : (
                ''
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
