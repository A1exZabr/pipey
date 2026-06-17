'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Token not found');
      return;
    }

    verifyToken(token);
  }, [searchParams]);

  const verifyToken = async (token: string) => {
    try {
      const response = await api.verifyToken(token);

      login(response.accessToken, response.user);

      setStatus('success');
      setMessage('Signed in! Redirecting...');

      const needsOnboarding = !response.user.organizations?.[0]?.onboardingCompleted;

      setTimeout(() => {
        router.push(needsOnboarding ? '/onboarding' : '/dashboard');
      }, 1000);
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Token verification failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass-card rounded-2xl p-8 max-w-md w-full mx-4 text-center">
        {status === 'loading' && (
          <>
            <div className="mx-auto h-12 w-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <h2 className="mt-6 text-xl font-semibold">Verifying...</h2>
            <p className="mt-2 text-gray-500">Please wait</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-6 text-xl font-semibold">Success!</h2>
            <p className="mt-2 text-gray-500">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="mt-6 text-xl font-semibold">Error</h2>
            <p className="mt-2 text-gray-500">{message}</p>
            <button onClick={() => router.push('/auth/login')} className="btn-primary mt-6 w-full">
              Back to sign in
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-12 w-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
