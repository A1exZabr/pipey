'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, UserProfile } from '../api/auth';

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      setLoading(false);
      router.push('/auth/login');
      return;
    }

    try {
      const profile = await authApi.getProfile();
      setUser(profile);
    } catch (error) {
      localStorage.removeItem('accessToken');
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('organization');
    router.push('/auth/login');
  };

  return { user, loading, logout };
}
