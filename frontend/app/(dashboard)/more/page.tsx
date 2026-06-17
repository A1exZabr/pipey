'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

const menuItems = [
  { name: 'Documents', href: '/artifacts', icon: '📄', description: 'Quotes, invoices, cards' },
  { name: 'Integrations', href: '/integrations', icon: '🔗', description: 'Telegram, MAX, Avito' },
  { name: 'Team', href: '/team', icon: '👥', description: 'Members and roles' },
  { name: 'Settings', href: '/settings', icon: '⚙️', description: 'Details, schedule' },
];

export default function MorePage() {
  const { user, logout } = useAuth();

  return (
    <div className="space-y-6 pb-20">
      <h1 className="text-2xl font-semibold">Menu</h1>

      {/* User Card */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <span className="text-white text-xl font-semibold">
              {user?.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{user?.email}</p>
            <p className="text-sm text-gray-500 truncate">
              {user?.organizations?.[0]?.name || 'Organization'}
            </p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {menuItems.map((item, index) => (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center gap-4 p-4 hover:bg-black/[0.02] active:bg-black/[0.05] transition-colors ${
              index < menuItems.length - 1 ? 'border-b border-black/5' : ''
            }`}
          >
            <span className="text-2xl">{item.icon}</span>
            <div className="flex-1">
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-gray-500">{item.description}</p>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>

      {/* Support */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center gap-4">
          <span className="text-2xl">💬</span>
          <div className="flex-1">
            <p className="font-medium">Support</p>
            <p className="text-sm text-gray-500">Need help?</p>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full glass-card rounded-2xl p-4 text-red-500 font-medium hover:bg-red-50 transition-colors"
      >
        <div className="flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
          Log out
        </div>
      </button>

      {/* Version */}
      <p className="text-center text-gray-400 text-sm">
        Pipey v0.5.0
      </p>
    </div>
  );
}
