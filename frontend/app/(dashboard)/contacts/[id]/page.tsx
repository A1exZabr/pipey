'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

type Tab = 'timeline' | 'conversations' | 'deals' | 'artifacts';

export default function ContactProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [contact, setContact] = useState<any>(null);
  const [tab, setTab] = useState<Tab>('timeline');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);

  useEffect(() => {
    loadContact();
  }, [id]);

  useEffect(() => {
    if (contact) loadTabData();
  }, [tab, contact]);

  async function loadContact() {
    try {
      const c = await api.getContact(id);
      setContact(c);
    } catch {
      router.push('/contacts');
    } finally {
      setLoading(false);
    }
  }

  async function loadTabData() {
    setTabLoading(true);
    try {
      if (tab === 'timeline') setData(await api.getContactTimeline(id));
      else if (tab === 'conversations') setData(await api.getContactConversations(id));
      else if (tab === 'deals') setData(await api.getContactDeals(id));
      else if (tab === 'artifacts') setData(await api.getContactArtifacts(id));
    } catch {
      setData([]);
    } finally {
      setTabLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!contact) return null;

  const displayName = contact.name || contact.email || 'Contact';

  const TABS: { key: Tab; label: string }[] = [
    { key: 'timeline', label: 'Timeline' },
    { key: 'conversations', label: 'Conversations' },
    { key: 'deals', label: 'Deals' },
    { key: 'artifacts', label: 'Documents' },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back */}
      <Link href="/contacts" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <BackIcon className="w-4 h-4" />
        Contacts
      </Link>

      {/* Header */}
      <div className="glass-card rounded-2xl p-6 flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-2xl font-semibold">
            {displayName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold">{displayName}</h1>
          <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
            {contact.email && <span>{contact.email}</span>}
            {contact.phone && <span>{contact.phone}</span>}
          </div>
          {contact.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {contact.tags.map((tag: string) => (
                <span key={tag} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}
          {contact.notes && (
            <p className="mt-3 text-sm text-gray-600 whitespace-pre-line">{contact.notes}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              tab === key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-3">
        {tabLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center text-gray-400">
            No data
          </div>
        ) : tab === 'timeline' ? (
          <TimelineList items={data} />
        ) : tab === 'conversations' ? (
          <ConversationList items={data} />
        ) : tab === 'deals' ? (
          <DealList items={data} />
        ) : (
          <ArtifactList items={data} />
        )}
      </div>
    </div>
  );
}

function TimelineList({ items }: { items: any[] }) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="glass-card rounded-2xl p-4 flex items-start gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            item.type === 'deal' ? 'bg-green-100 text-green-600' :
            item.type === 'conversation' ? 'bg-blue-100 text-blue-600' :
            'bg-orange-100 text-orange-600'
          }`}>
            {item.type === 'deal' ? '₽' : item.type === 'conversation' ? '💬' : '📄'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              {item.type === 'deal' ? `Deal: ${item.data.title}` :
               item.type === 'conversation' ? `Conversation in ${item.data.channel?.name || item.data.channel?.type || 'channel'}` :
               `Document: ${item.data.title}`}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(item.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ConversationList({ items }: { items: any[] }) {
  return (
    <div className="space-y-3">
      {items.map((conv) => (
        <Link
          key={conv.id}
          href={`/inbox?conversation=${conv.id}`}
          className="glass-card rounded-2xl p-4 flex items-center gap-3 hover:bg-black/[0.02] transition-colors block"
        >
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-600 text-sm font-medium">
              {(conv.channel?.type || '?').charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{conv.channel?.name || conv.channel?.type || 'Conversation'}</p>
            {conv.messages?.[0] && (
              <p className="text-xs text-gray-500 truncate mt-0.5">{conv.messages[0].text}</p>
            )}
          </div>
          <span className="text-xs text-gray-400">
            {new Date(conv.createdAt).toLocaleDateString('en-US')}
          </span>
        </Link>
      ))}
    </div>
  );
}

function DealList({ items }: { items: any[] }) {
  return (
    <div className="space-y-3">
      {items.map((deal) => (
        <div key={deal.id} className="glass-card rounded-2xl p-4 flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: deal.stage?.color || '#6366f1' }}
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{deal.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{deal.stage?.name} · {deal.pipeline?.name}</p>
          </div>
          {deal.value && (
            <span className="text-sm font-semibold text-green-600">
              {Number(deal.value).toLocaleString('en-US')} ₽
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function ArtifactList({ items }: { items: any[] }) {
  const TYPE_LABELS: Record<string, string> = {
    QUOTE: 'Quote',
    INVOICE: 'Invoice',
    CALENDAR_LINK: 'Meeting link',
    PRODUCT_CARD: 'Product card',
  };

  return (
    <div className="space-y-3">
      {items.map((artifact) => (
        <div key={artifact.id} className="glass-card rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
            <span className="text-orange-500 text-lg">📄</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{artifact.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{TYPE_LABELS[artifact.type] || artifact.type}</p>
          </div>
          <span className="text-xs text-gray-400">
            {new Date(artifact.createdAt).toLocaleDateString('en-US')}
          </span>
        </div>
      ))}
    </div>
  );
}

function BackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}
