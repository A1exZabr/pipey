'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Channel {
  id: string;
  type: 'TELEGRAM' | 'MAX' | 'AVITO';
  name: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  externalId: string | null;
  createdAt: string;
}

const INTEGRATION_TYPES = {
  TELEGRAM: {
    name: 'Telegram',
    description: 'Connect a Telegram bot',
    icon: TelegramIcon,
    color: 'from-blue-400 to-blue-600',
    available: true,
  },
  MAX: {
    name: 'MAX',
    description: 'Connect a MAX bot',
    icon: MaxIcon,
    color: 'from-purple-400 to-purple-600',
    available: true,
  },
  AVITO: {
    name: 'Avito',
    description: 'Connect an Avito account',
    icon: AvitoIcon,
    color: 'from-green-400 to-green-600',
    available: true,
  },
};

export default function IntegrationsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const [showMaxModal, setShowMaxModal] = useState(false);
  const [showAvitoModal, setShowAvitoModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadChannels();
  }, []);

  async function loadChannels() {
    try {
      const data = await api.getChannels();
      setChannels(data);
    } catch (error) {
      console.error('Failed to load channels:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Disconnect this channel? All related conversations will be deleted.')) return;

    setDeletingId(id);
    try {
      await api.disconnectChannel(id);
      await loadChannels();
    } catch (error) {
      console.error('Failed to disconnect channel:', error);
      alert('Error disconnecting channel');
    } finally {
      setDeletingId(null);
    }
  }

  function getChannelsByType(type: keyof typeof INTEGRATION_TYPES) {
    return channels.filter((c) => c.type === type);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Integrations</h1>
        <p className="text-gray-500 mt-1">Connect channels to communicate with clients</p>
      </div>

      {/* How it works - moved to top */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">How does it work?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-semibold text-sm">1</span>
            </div>
            <div>
              <h4 className="font-medium">Connect a channel</h4>
              <p className="text-sm text-gray-500 mt-1">Add a bot token or sign in to the service</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-semibold text-sm">2</span>
            </div>
            <div>
              <h4 className="font-medium">Receive messages</h4>
              <p className="text-sm text-gray-500 mt-1">All incoming messages appear in the Inbox section</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-semibold text-sm">3</span>
            </div>
            <div>
              <h4 className="font-medium">Reply to clients</h4>
              <p className="text-sm text-gray-500 mt-1">Communicate with clients right from the CRM</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Integration Buttons */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">Add integration</h2>
        <div className="flex flex-wrap gap-3">
          {(Object.keys(INTEGRATION_TYPES) as Array<keyof typeof INTEGRATION_TYPES>).map((type) => {
            const info = INTEGRATION_TYPES[type];
            const Icon = info.icon;
            return (
              <button
                key={type}
                onClick={() => {
                  if (type === 'TELEGRAM') setShowTelegramModal(true);
                  if (type === 'MAX') setShowMaxModal(true);
                  if (type === 'AVITO') setShowAvitoModal(true);
                }}
                disabled={!info.available}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  info.available
                    ? 'bg-gradient-to-br ' + info.color + ' text-white hover:shadow-lg hover:scale-105'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{info.name}</span>
                {!info.available && <span className="text-xs">(coming soon)</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Connected Integrations */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : channels.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <PlugIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">No connected integrations</h3>
          <p className="text-gray-500 mt-1">Click the button above to add your first integration</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Connected channels ({channels.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {channels.map((channel) => {
              const info = INTEGRATION_TYPES[channel.type];
              const Icon = info.icon;
              const isDeleting = deletingId === channel.id;

              return (
                <div key={channel.id} className="glass-card rounded-2xl p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${info.color} flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold">{channel.name}</p>
                        <p className="text-xs text-gray-500">{info.name}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      channel.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-700'
                        : channel.status === 'ERROR'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {channel.status === 'ACTIVE' ? 'Active' : channel.status === 'ERROR' ? 'Error' : 'Inactive'}
                    </span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-black/5 flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                      Connected {new Date(channel.createdAt).toLocaleDateString('en-US')}
                    </p>
                    <button
                      onClick={() => handleDelete(channel.id)}
                      disabled={isDeleting}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <TrashIcon className="w-4 h-4" />
                      )}
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Telegram Modal */}
      {showTelegramModal && (
        <TelegramConnectModal
          onClose={() => setShowTelegramModal(false)}
          onSuccess={() => {
            setShowTelegramModal(false);
            loadChannels();
          }}
        />
      )}

      {/* MAX Modal */}
      {showMaxModal && (
        <MaxConnectModal
          onClose={() => setShowMaxModal(false)}
          onSuccess={() => {
            setShowMaxModal(false);
            loadChannels();
          }}
        />
      )}

      {/* Avito Modal */}
      {showAvitoModal && (
        <AvitoConnectModal
          onClose={() => setShowAvitoModal(false)}
          onSuccess={() => {
            setShowAvitoModal(false);
            loadChannels();
          }}
        />
      )}
    </div>
  );
}

function TelegramConnectModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [botToken, setBotToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!botToken.trim()) return;

    setLoading(true);
    setError('');
    setWarning('');

    try {
      const result = await api.connectTelegram(botToken.trim());
      if (result && result.webhookConfigured === false) {
        setWarning('Bot connected, but the webhook is not configured. To receive incoming messages, set BACKEND_URL.');
        setTimeout(() => onSuccess(), 2500);
      } else {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect the bot');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card rounded-2xl p-6 w-full max-w-md m-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
            <TelegramIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Connect Telegram</h2>
            <p className="text-sm text-gray-500">Add a new bot</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bot token</label>
            <input
              type="text"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              className="input-field font-mono text-sm"
              placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
              required
            />
            <p className="text-xs text-gray-500 mt-2">
              Get a token from <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">@BotFather</a> on Telegram
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {warning && (
            <div className="bg-yellow-50 text-yellow-700 px-4 py-3 rounded-xl text-sm">
              {warning}
            </div>
          )}

          <div className="bg-blue-50 rounded-xl p-4 text-sm">
            <h4 className="font-medium text-blue-900 mb-2">Instructions:</h4>
            <ol className="list-decimal list-inside text-blue-800 space-y-1">
              <li>Open @BotFather in Telegram</li>
              <li>Send /newbot and follow the instructions</li>
              <li>Copy the token you receive here</li>
            </ol>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={loading}>
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Connect
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MaxConnectModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [botToken, setBotToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!botToken.trim()) return;

    setLoading(true);
    setError('');
    setWarning('');

    try {
      const result = await api.connectMax(botToken.trim());
      if (result && result.webhookConfigured === false) {
        setWarning('Bot connected, but the webhook is not configured. To receive incoming messages, set BACKEND_URL.');
        setTimeout(() => onSuccess(), 2500);
      } else {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect the bot');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card rounded-2xl p-6 w-full max-w-md m-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
            <MaxIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Connect MAX</h2>
            <p className="text-sm text-gray-500">Add a new bot</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bot token</label>
            <input
              type="text"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              className="input-field font-mono text-sm"
              placeholder="Enter the MAX bot token"
              required
            />
            <p className="text-xs text-gray-500 mt-2">
              Get the token in the bot settings on the MAX platform
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {warning && (
            <div className="bg-yellow-50 text-yellow-700 px-4 py-3 rounded-xl text-sm">
              {warning}
            </div>
          )}

          <div className="bg-purple-50 rounded-xl p-4 text-sm">
            <h4 className="font-medium text-purple-900 mb-2">Instructions:</h4>
            <ol className="list-decimal list-inside text-purple-800 space-y-1">
              <li>Create a bot on the MAX platform</li>
              <li>Go to the bot settings</li>
              <li>Copy the API token here</li>
            </ol>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={loading}>
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Connect
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AvitoConnectModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId.trim() || !clientSecret.trim()) return;

    setLoading(true);
    setError('');
    setWarning('');

    try {
      const result = await api.connectAvito(clientId.trim(), clientSecret.trim());
      if (result && result.webhookConfigured === false) {
        setWarning('Avito connected, but the webhook is not configured. To receive incoming messages, set BACKEND_URL.');
        setTimeout(() => onSuccess(), 2500);
      } else {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect Avito');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card rounded-2xl p-6 w-full max-w-md m-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
            <AvitoIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Connect Avito</h2>
            <p className="text-sm text-gray-500">Add an Avito account</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="input-field font-mono text-sm"
              placeholder="Enter Client ID"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client Secret</label>
            <input
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              className="input-field font-mono text-sm"
              placeholder="Enter Client Secret"
              required
            />
          </div>

          <p className="text-xs text-gray-500">
            Get your Client ID and Client Secret in the <a href="https://www.avito.ru/professionals/api" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">Avito Pro account</a>
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {warning && (
            <div className="bg-yellow-50 text-yellow-700 px-4 py-3 rounded-xl text-sm">
              {warning}
            </div>
          )}

          <div className="bg-green-50 rounded-xl p-4 text-sm">
            <h4 className="font-medium text-green-900 mb-2">Instructions:</h4>
            <ol className="list-decimal list-inside text-green-800 space-y-1">
              <li>Sign in to Avito Pro for professionals</li>
              <li>Go to the "API and integrations" section</li>
              <li>Create an app and copy the keys</li>
            </ol>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={loading}>
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Connect
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Icons
function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
    </svg>
  );
}

function MaxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l4.59-4.58L18 11l-6 6z" />
    </svg>
  );
}

function AvitoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlugIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}
