'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { requestMagicLink } from '@/lib/api/auth';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicLink, setMagicLink] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMagicLink('');

    try {
      const response = await requestMagicLink(email);

      // In dev mode the API returns a magicLink
      if (response.magicLink) {
        setMagicLink(response.magicLink);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Image
            src="/Pipey_logo.png"
            alt="Pipey"
            width={180}
            height={48}
            className="h-12 w-auto mx-auto mb-4"
            priority
          />
          <h1 className="text-2xl font-semibold">Sign up</h1>
          <p className="text-gray-500 mt-1">Create your account</p>
        </div>

        <div className="glass-card rounded-2xl p-8">

          {!magicLink ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="email@example.com"
                  className="input-field"
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                {loading ? 'Sending...' : 'Sign up'}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-green-800 font-medium">Link created!</p>
                <p className="text-green-600 text-sm mt-1">Click below to sign up</p>
              </div>

              <a href={magicLink} className="btn-primary w-full flex items-center justify-center gap-2">
                Sign up
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>

              <button onClick={() => { setMagicLink(''); setEmail(''); }} className="w-full text-gray-500 text-sm hover:text-gray-700">
                Use a different email
              </button>
            </div>
          )}

          <div className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-blue-500 font-medium hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
