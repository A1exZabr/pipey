'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface AiPanelProps {
  conversationId: string;
  onInsertDraft: (text: string) => void;
  onActionClick: (action: { type: string; label: string }) => void;
}

interface Summary {
  summary: string;
  clientNeeds: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
}

interface DraftReply {
  text: string;
  confidence: number;
}

interface ActionSuggestion {
  type: string;
  label: string;
  params?: Record<string, any>;
}

export function AiPanel({ conversationId, onInsertDraft, onActionClick }: AiPanelProps) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [draftReply, setDraftReply] = useState<DraftReply | null>(null);
  const [actions, setActions] = useState<ActionSuggestion[]>([]);
  const [loading, setLoading] = useState<'summary' | 'draft' | 'actions' | null>(null);
  const [expanded, setExpanded] = useState(true);

  async function loadSummary() {
    setLoading('summary');
    try {
      const result = await api.generateSummary(conversationId);
      setSummary(result);
    } catch (error) {
      console.error('Failed to generate summary:', error);
    } finally {
      setLoading(null);
    }
  }

  async function loadDraftReply() {
    setLoading('draft');
    try {
      const result = await api.generateDraftReply(conversationId);
      setDraftReply(result);
    } catch (error) {
      console.error('Failed to generate draft:', error);
    } finally {
      setLoading(null);
    }
  }

  async function loadActionSuggestions() {
    setLoading('actions');
    try {
      const result = await api.generateActionSuggestions(conversationId);
      setActions(result.actions || []);
    } catch (error) {
      console.error('Failed to generate actions:', error);
    } finally {
      setLoading(null);
    }
  }

  function handleInsertDraft() {
    if (draftReply?.text) {
      onInsertDraft(draftReply.text);
    }
  }

  const sentimentConfig = {
    positive: { emoji: '😊', color: 'text-green-600', label: 'Positive' },
    neutral: { emoji: '😐', color: 'text-gray-600', label: 'Neutral' },
    negative: { emoji: '😟', color: 'text-red-600', label: 'Negative' },
  };

  const actionIcons: Record<string, string> = {
    send_quote: '📄',
    send_invoice: '🧾',
    send_calendar_link: '📅',
    send_product_card: '🛍',
    create_deal: '💼',
    create_contact: '👤',
  };

  return (
    <div className="border-t border-black/5 bg-gradient-to-r from-purple-50 to-blue-50">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2 flex items-center justify-between text-sm hover:bg-black/[0.02]"
      >
        <span className="flex items-center gap-2 font-medium text-purple-700">
          <span>✨</span> AI Assistant
        </span>
        <span className="text-gray-400">{expanded ? '▼' : '▲'}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Quick Actions Row */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={loadSummary}
              disabled={loading === 'summary'}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 disabled:opacity-50"
            >
              {loading === 'summary' ? '...' : '📋 Summary'}
            </button>
            <button
              onClick={loadDraftReply}
              disabled={loading === 'draft'}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 disabled:opacity-50"
            >
              {loading === 'draft' ? '...' : '✏️ Draft Reply'}
            </button>
            <button
              onClick={loadActionSuggestions}
              disabled={loading === 'actions'}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-50"
            >
              {loading === 'actions' ? '...' : '💡 Actions'}
            </button>
          </div>

          {/* Summary */}
          {summary && (
            <div className="bg-white rounded-lg p-3 border border-purple-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-purple-700">Conversation Summary</span>
                <span className={`text-xs ${sentimentConfig[summary.sentiment].color}`}>
                  {sentimentConfig[summary.sentiment].emoji} {sentimentConfig[summary.sentiment].label}
                </span>
              </div>
              <p className="text-sm text-gray-700">{summary.summary}</p>
              {summary.clientNeeds.length > 0 && (
                <div className="mt-2">
                  <span className="text-xs text-gray-500">Needs:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {summary.clientNeeds.map((need, i) => (
                      <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                        {need}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <button
                onClick={() => setSummary(null)}
                className="mt-2 text-xs text-gray-400 hover:text-gray-600"
              >
                Hide
              </button>
            </div>
          )}

          {/* Draft Reply */}
          {draftReply && (
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-blue-700">Draft Reply</span>
                <span className="text-xs text-gray-400">
                  Confidence: {Math.round(draftReply.confidence * 100)}%
                </span>
              </div>
              <p className="text-sm text-gray-700 bg-blue-50 p-2 rounded">{draftReply.text}</p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleInsertDraft}
                  className="px-3 py-1 text-xs font-medium rounded bg-blue-500 text-white hover:bg-blue-600"
                >
                  Insert
                </button>
                <button
                  onClick={() => setDraftReply(null)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Action Suggestions */}
          {actions.length > 0 && (
            <div className="bg-white rounded-lg p-3 border border-green-100">
              <span className="text-xs font-medium text-green-700 block mb-2">Recommended Actions</span>
              <div className="flex flex-wrap gap-2">
                {actions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => onActionClick(action)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 flex items-center gap-1"
                  >
                    <span>{actionIcons[action.type] || '⚡'}</span>
                    {action.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setActions([])}
                className="mt-2 text-xs text-gray-400 hover:text-gray-600"
              >
                Hide
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
