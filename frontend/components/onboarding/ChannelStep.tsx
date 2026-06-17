'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface ChannelStepProps {
  onComplete: () => void;
}

export default function ChannelStep({ onComplete }: ChannelStepProps) {
  const [connectedCount, setConnectedCount] = useState(0);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [telegramToken, setTelegramToken] = useState('');
  const [maxToken, setMaxToken] = useState('');
  const [avitoClientId, setAvitoClientId] = useState('');
  const [avitoSecret, setAvitoSecret] = useState('');
  const [showForm, setShowForm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function connectTelegram() {
    if (!telegramToken.trim()) return;
    setConnecting('telegram');
    setError(null);
    try {
      await api.connectTelegram(telegramToken.trim());
      setConnectedCount((c) => c + 1);
      setShowForm(null);
      setTelegramToken('');
    } catch (e: any) {
      setError(e.message || 'Connection failed');
    } finally {
      setConnecting(null);
    }
  }

  async function connectMax() {
    if (!maxToken.trim()) return;
    setConnecting('max');
    setError(null);
    try {
      await api.connectMax(maxToken.trim());
      setConnectedCount((c) => c + 1);
      setShowForm(null);
      setMaxToken('');
    } catch (e: any) {
      setError(e.message || 'Connection failed');
    } finally {
      setConnecting(null);
    }
  }

  async function connectAvito() {
    if (!avitoClientId.trim() || !avitoSecret.trim()) return;
    setConnecting('avito');
    setError(null);
    try {
      await api.connectAvito(avitoClientId.trim(), avitoSecret.trim());
      setConnectedCount((c) => c + 1);
      setShowForm(null);
      setAvitoClientId('');
      setAvitoSecret('');
    } catch (e: any) {
      setError(e.message || 'Connection failed');
    } finally {
      setConnecting(null);
    }
  }

  const channels = [
    { id: 'telegram', name: 'Telegram', icon: '💬' },
    { id: 'max', name: 'MAX (VK Teams)', icon: '📨' },
    { id: 'avito', name: 'Avito', icon: '🛒' },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Connect a communication channel</h1>
        <p className="text-gray-500 mt-2">
          Connect at least one channel to start receiving messages from clients
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-4">
        {channels.map((ch) => (
          <div key={ch.id} className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{ch.icon}</span>
                <span className="font-medium">{ch.name}</span>
              </div>
              {showForm !== ch.id && (
                <button
                  onClick={() => setShowForm(ch.id)}
                  className="btn-secondary text-sm"
                >
                  Connect
                </button>
              )}
            </div>

            {showForm === 'telegram' && ch.id === 'telegram' && (
              <div className="mt-4 space-y-3">
                <input
                  type="text"
                  value={telegramToken}
                  onChange={(e) => setTelegramToken(e.target.value)}
                  placeholder="Bot token from @BotFather"
                  className="input-field"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowForm(null)}
                    className="btn-secondary text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={connectTelegram}
                    disabled={connecting === 'telegram'}
                    className="btn-primary text-sm"
                  >
                    {connecting === 'telegram' ? 'Connecting...' : 'Connect'}
                  </button>
                </div>
              </div>
            )}

            {showForm === 'max' && ch.id === 'max' && (
              <div className="mt-4 space-y-3">
                <input
                  type="text"
                  value={maxToken}
                  onChange={(e) => setMaxToken(e.target.value)}
                  placeholder="MAX bot token"
                  className="input-field"
                />
                <div className="flex gap-2">
                  <button onClick={() => setShowForm(null)} className="btn-secondary text-sm">
                    Cancel
                  </button>
                  <button
                    onClick={connectMax}
                    disabled={connecting === 'max'}
                    className="btn-primary text-sm"
                  >
                    {connecting === 'max' ? 'Connecting...' : 'Connect'}
                  </button>
                </div>
              </div>
            )}

            {showForm === 'avito' && ch.id === 'avito' && (
              <div className="mt-4 space-y-3">
                <input
                  type="text"
                  value={avitoClientId}
                  onChange={(e) => setAvitoClientId(e.target.value)}
                  placeholder="Client ID"
                  className="input-field"
                />
                <input
                  type="text"
                  value={avitoSecret}
                  onChange={(e) => setAvitoSecret(e.target.value)}
                  placeholder="Client Secret"
                  className="input-field"
                />
                <div className="flex gap-2">
                  <button onClick={() => setShowForm(null)} className="btn-secondary text-sm">
                    Cancel
                  </button>
                  <button
                    onClick={connectAvito}
                    disabled={connecting === 'avito'}
                    className="btn-primary text-sm"
                  >
                    {connecting === 'avito' ? 'Connecting...' : 'Connect'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {connectedCount > 0 && (
        <p className="text-center text-sm text-gray-500">
          The more channels you connect, the higher your conversion
        </p>
      )}

      <button
        onClick={onComplete}
        disabled={connectedCount === 0}
        className={`w-full py-3 rounded-xl font-medium transition-all ${
          connectedCount > 0
            ? 'btn-primary'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        {connectedCount > 0 ? 'Done, let’s continue' : 'Connect at least one channel'}
      </button>
    </div>
  );
}
