'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { AiPanel } from '@/components/AiPanel';

interface Channel {
  id: string;
  type: 'TELEGRAM' | 'MAX' | 'AVITO';
  name: string;
  status: string;
}

interface Conversation {
  id: string;
  externalChatId: string;
  title: string | null;
  unreadCount: number;
  lastMessageAt: string;
  channel: Channel;
  contactLinks: Array<{ contact: { id: string; name: string | null; email: string | null } }>;
  _count?: { messages: number };
}

interface Message {
  id: string;
  direction: 'IN' | 'OUT';
  text: string | null;
  attachments: any[];
  authorExternalId: string | null;
  createdAt: string;
}

export default function InboxPage() {
  const router = useRouter();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function loadData() {
    try {
      const [channelsData, conversationsData] = await Promise.all([
        api.getChannels(),
        api.getConversations(),
      ]);
      setChannels(channelsData);
      setConversations(conversationsData);
    } catch (error) {
      console.error('Failed to load inbox data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(conversationId: string) {
    try {
      const data = await api.getMessages(conversationId);
      setMessages(data.messages || []);
      // Mark as read
      await api.markAsRead(conversationId);
      // Update unread count in local state
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c))
      );
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || sendingMessage) return;

    setSendingMessage(true);
    try {
      const message = await api.sendMessage(selectedConversation.id, newMessage.trim());
      setMessages((prev) => [...prev, message]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function handleAiAction(action: { type: string; label: string }) {
    // Handle AI suggested actions
    switch (action.type) {
      case 'send_quote':
      case 'send_invoice':
      case 'send_calendar_link':
      case 'send_product_card':
        router.push('/artifacts');
        break;
      case 'create_deal':
        router.push('/pipeline');
        break;
      case 'create_contact':
        router.push('/contacts');
        break;
      default:
        console.log('Unknown action:', action);
    }
  }

  function getContactName(conversation: Conversation): string {
    // First try linked contact name
    if (conversation.contactLinks?.length > 0 && conversation.contactLinks[0].contact.name) {
      return conversation.contactLinks[0].contact.name;
    }
    // Then try conversation title
    if (conversation.title) {
      return conversation.title;
    }
    // Fallback to external chat ID
    return conversation.externalChatId;
  }

  function formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  }

  const filteredConversations = selectedChannel === 'all'
    ? conversations
    : conversations.filter((c) => c.channel.id === selectedChannel);

  const hasChannels = channels.length > 0;
  const hasConversations = conversations.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // No channels connected
  if (!hasChannels) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Inbox</h1>
          <p className="text-gray-500 mt-1">Messages from all channels</p>
        </div>

        <div className="glass-card rounded-2xl p-16 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
            <InboxIcon className="w-10 h-10 text-blue-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">No messages yet</h3>
          <p className="text-gray-500 mt-2 max-w-sm mx-auto">
            Connect a channel, for example Telegram, to receive messages from clients.
          </p>
          <button onClick={() => router.push('/integrations')} className="btn-primary mt-6">
            Connect a channel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Inbox</h1>
          <p className="text-gray-500 mt-1">
            {conversations.length} {conversations.length === 1 ? 'conversation' : 'conversations'}
          </p>
        </div>

        {/* Channel Filter */}
        {channels.length > 1 && (
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="input-field w-auto"
          >
            <option value="all">All channels</option>
            {channels.map((channel) => (
              <option key={channel.id} value={channel.id}>
                {channel.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Conversations List */}
        <div className="w-80 flex-shrink-0 glass-card rounded-2xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-black/5">
            <h2 className="font-semibold">Conversations</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {!hasConversations ? (
              <div className="p-8 text-center text-gray-500">
                <p>No active conversations</p>
                <p className="text-sm mt-1">New messages will appear here</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No conversations in this channel</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`w-full p-4 text-left hover:bg-black/[0.02] transition-colors border-b border-black/5 last:border-0 ${
                    selectedConversation?.id === conversation.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-medium text-sm">
                        {getContactName(conversation).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium truncate">{getContactName(conversation)}</p>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {formatTime(conversation.lastMessageAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <ChannelBadge type={conversation.channel.type} name={conversation.channel.name} />
                        {conversation.unreadCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white text-xs font-medium">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 glass-card rounded-2xl overflow-hidden flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-black/5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center">
                  <span className="text-white font-medium">
                    {getContactName(selectedConversation).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold">{getContactName(selectedConversation)}</p>
                  <ChannelBadge type={selectedConversation.channel.type} name={selectedConversation.channel.name} />
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <p>No messages</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.direction === 'OUT' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          message.direction === 'OUT'
                            ? 'bg-blue-500 text-white rounded-br-md'
                            : 'bg-gray-100 text-gray-900 rounded-bl-md'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.text}</p>
                        <p className={`text-xs mt-1 ${message.direction === 'OUT' ? 'text-blue-100' : 'text-gray-400'}`}>
                          {formatTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* AI Panel */}
              {messages.length > 0 && (
                <AiPanel
                  conversationId={selectedConversation.id}
                  onInsertDraft={(text) => setNewMessage(text)}
                  onActionClick={(action) => handleAiAction(action)}
                />
              )}

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-black/5 flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="input-field flex-1"
                  disabled={sendingMessage}
                />
                <button
                  type="submit"
                  className="btn-primary px-6 flex items-center gap-2"
                  disabled={!newMessage.trim() || sendingMessage}
                >
                  {sendingMessage ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <SendIcon className="w-5 h-5" />
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <ChatIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p>Select a conversation on the left</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChannelBadge({ type, name }: { type: 'TELEGRAM' | 'MAX' | 'AVITO'; name?: string }) {
  const config = {
    TELEGRAM: { icon: '📱', color: 'bg-blue-100 text-blue-700' },
    MAX: { icon: '💬', color: 'bg-purple-100 text-purple-700' },
    AVITO: { icon: '🛒', color: 'bg-green-100 text-green-700' },
  };
  const { icon, color } = config[type];
  const displayName = name || type;
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${color}`}>{icon} {displayName}</span>;
}

// Icons
function InboxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-17.5 0a2.25 2.25 0 00-2.25 2.25v1.5a2.25 2.25 0 002.25 2.25h19.5a2.25 2.25 0 002.25-2.25v-1.5a2.25 2.25 0 00-2.25-2.25m-17.5 0V6.75A2.25 2.25 0 014.5 4.5h15a2.25 2.25 0 012.25 2.25v6.75" />
    </svg>
  );
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
  );
}
