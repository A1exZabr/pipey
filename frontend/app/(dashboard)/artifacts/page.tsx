'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type ArtifactType = 'QUOTE' | 'INVOICE' | 'CALENDAR_LINK' | 'PRODUCT_CARD';

interface Artifact {
  id: string;
  type: ArtifactType;
  payload: any;
  fileUrl?: string;
  createdAt: string;
}

const TYPE_CONFIG: Record<ArtifactType, { label: string; icon: string; color: string }> = {
  QUOTE: { label: 'Quote', icon: '📄', color: 'bg-blue-100 text-blue-700' },
  INVOICE: { label: 'Invoice', icon: '🧾', color: 'bg-green-100 text-green-700' },
  CALENDAR_LINK: { label: 'Booking', icon: '📅', color: 'bg-purple-100 text-purple-700' },
  PRODUCT_CARD: { label: 'Product', icon: '🛍', color: 'bg-orange-100 text-orange-700' },
};

export default function ArtifactsPage() {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ArtifactType | 'ALL'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState<ArtifactType | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [sendModal, setSendModal] = useState<{ artifact: Artifact } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [artifactsData, contactsData, conversationsData] = await Promise.all([
        api.getArtifacts(),
        api.getContacts(),
        api.getConversations(),
      ]);
      setArtifacts(artifactsData);
      setContacts(contactsData);
      setConversations(conversationsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredArtifacts = activeTab === 'ALL' 
    ? artifacts 
    : artifacts.filter(a => a.type === activeTab);

  async function handleDelete(id: string) {
    if (!confirm('Delete this document?')) return;
    try {
      await api.deleteArtifact(id);
      setArtifacts(artifacts.filter(a => a.id !== id));
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete');
    }
  }

  async function handleSend(artifactId: string, conversationId: string, message?: string) {
    try {
      await api.sendArtifact(artifactId, conversationId, message);
      setSendModal(null);
      alert('Sent!');
    } catch (error) {
      console.error('Failed to send:', error);
      alert('Failed to send');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Documents</h1>
          <p className="text-gray-500 mt-1">Quotes, invoices, booking links, product cards</p>
        </div>
      </div>

      {/* Create Buttons */}
      <div className="flex gap-3 flex-wrap">
        <button onClick={() => setShowCreateModal('QUOTE')} className="btn-secondary flex items-center gap-2">
          <span>📄</span> Create quote
        </button>
        <button onClick={() => setShowCreateModal('INVOICE')} className="btn-secondary flex items-center gap-2">
          <span>🧾</span> Create invoice
        </button>
        <button onClick={() => setShowCreateModal('CALENDAR_LINK')} className="btn-secondary flex items-center gap-2">
          <span>📅</span> Booking link
        </button>
        <button onClick={() => setShowCreateModal('PRODUCT_CARD')} className="btn-secondary flex items-center gap-2">
          <span>🛍</span> Product card
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        <TabButton active={activeTab === 'ALL'} onClick={() => setActiveTab('ALL')}>
          All ({artifacts.length})
        </TabButton>
        {(Object.keys(TYPE_CONFIG) as ArtifactType[]).map(type => (
          <TabButton key={type} active={activeTab === type} onClick={() => setActiveTab(type)}>
            {TYPE_CONFIG[type].icon} {TYPE_CONFIG[type].label} ({artifacts.filter(a => a.type === type).length})
          </TabButton>
        ))}
      </div>

      {/* List */}
      {filteredArtifacts.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <span className="text-4xl">📁</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900">No documents yet</h3>
          <p className="text-gray-500 mt-2">Create your first document to send to a client</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredArtifacts.map(artifact => (
            <ArtifactCard
              key={artifact.id}
              artifact={artifact}
              onDelete={() => handleDelete(artifact.id)}
              onSend={() => setSendModal({ artifact })}
            />
          ))}
        </div>
      )}

      {/* Create Modals */}
      {showCreateModal === 'QUOTE' && (
        <CreateQuoteModal
          contacts={contacts}
          onClose={() => setShowCreateModal(null)}
          onCreate={(artifact) => {
            setArtifacts([artifact, ...artifacts]);
            setShowCreateModal(null);
          }}
        />
      )}
      {showCreateModal === 'INVOICE' && (
        <CreateInvoiceModal
          contacts={contacts}
          onClose={() => setShowCreateModal(null)}
          onCreate={(artifact) => {
            setArtifacts([artifact, ...artifacts]);
            setShowCreateModal(null);
          }}
        />
      )}
      {showCreateModal === 'CALENDAR_LINK' && (
        <CreateCalendarLinkModal
          contacts={contacts}
          onClose={() => setShowCreateModal(null)}
          onCreate={(artifact) => {
            setArtifacts([artifact, ...artifacts]);
            setShowCreateModal(null);
          }}
        />
      )}
      {showCreateModal === 'PRODUCT_CARD' && (
        <CreateProductCardModal
          onClose={() => setShowCreateModal(null)}
          onCreate={(artifact) => {
            setArtifacts([artifact, ...artifacts]);
            setShowCreateModal(null);
          }}
        />
      )}

      {/* Send Modal */}
      {sendModal && (
        <SendArtifactModal
          artifact={sendModal.artifact}
          conversations={conversations}
          onClose={() => setSendModal(null)}
          onSend={handleSend}
        />
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}

function ArtifactCard({ artifact, onDelete, onSend }: { artifact: Artifact; onDelete: () => void; onSend: () => void }) {
  const config = TYPE_CONFIG[artifact.type];
  const payload = artifact.payload;
  const [downloading, setDownloading] = useState(false);

  const canDownloadPdf = artifact.type === 'QUOTE' || artifact.type === 'INVOICE';

  async function handleDownloadPdf() {
    setDownloading(true);
    try {
      await api.downloadArtifactPdf(artifact.id);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert('Failed to download PDF');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="glass-card rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between">
        <span className={`px-2 py-1 rounded text-xs font-medium ${config.color}`}>
          {config.icon} {config.label}
        </span>
        <span className="text-xs text-gray-400">
          {new Date(artifact.createdAt).toLocaleDateString('en-US')}
        </span>
      </div>

      <div>
        <h3 className="font-semibold truncate">
          {payload.title || payload.name || payload.quoteNumber || 'Untitled'}
        </h3>
        {payload.total !== undefined && (
          <p className="text-lg font-bold text-green-600 mt-1">
            {payload.total.toLocaleString('en-US')} ₽
          </p>
        )}
        {payload.price !== undefined && (
          <p className="text-lg font-bold text-green-600 mt-1">
            {payload.price.toLocaleString('en-US')} {payload.currency || '₽'}
          </p>
        )}
        {payload.publicUrl && (
          <p className="text-sm text-blue-500 truncate mt-1">{payload.publicUrl}</p>
        )}
      </div>

      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <button onClick={onSend} className="flex-1 btn-primary text-sm py-2">
          Send
        </button>
        {canDownloadPdf && (
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="px-3 py-2 text-blue-500 hover:bg-blue-50 rounded-lg text-sm"
            title="Download PDF"
          >
            {downloading ? '...' : '📥'}
          </button>
        )}
        <button onClick={onDelete} className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg text-sm">
          🗑
        </button>
      </div>
    </div>
  );
}

// ============================================
// CREATE MODALS
// ============================================

function CreateQuoteModal({ contacts, onClose, onCreate }: { contacts: any[]; onClose: () => void; onCreate: (a: Artifact) => void }) {
  const [title, setTitle] = useState('');
  const [contactId, setContactId] = useState('');
  const [items, setItems] = useState([{ name: '', quantity: 1, price: 0 }]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || items.some(i => !i.name || !i.price)) {
      alert('Fill in the title and line items');
      return;
    }
    setLoading(true);
    try {
      const artifact = await api.createQuote({
        title,
        contactId: contactId || undefined,
        items,
        notes: notes || undefined,
      });
      onCreate(artifact);
    } catch (error) {
      console.error('Failed to create:', error);
      alert('Failed to create');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Create quote" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Title</label>
          <input className="input-field w-full" value={title} onChange={e => setTitle(e.target.value)} placeholder="For example: Website development" />
        </div>
        <div>
          <label className="label">Client (optional)</label>
          <select className="input-field w-full" value={contactId} onChange={e => setContactId(e.target.value)}>
            <option value="">Select a client</option>
            {contacts.map(c => <option key={c.id} value={c.id}>{c.name || c.email || c.phone}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Line items</label>
          {items.map((item, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input className="input-field flex-1" placeholder="Name" value={item.name} onChange={e => {
                const newItems = [...items];
                newItems[i].name = e.target.value;
                setItems(newItems);
              }} />
              <input className="input-field w-20" type="number" placeholder="Qty" value={item.quantity} onChange={e => {
                const newItems = [...items];
                newItems[i].quantity = parseInt(e.target.value) || 1;
                setItems(newItems);
              }} />
              <input className="input-field w-28" type="number" placeholder="Price" value={item.price || ''} onChange={e => {
                const newItems = [...items];
                newItems[i].price = parseInt(e.target.value) || 0;
                setItems(newItems);
              }} />
              {items.length > 1 && (
                <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))} className="text-red-500">✕</button>
              )}
            </div>
          ))}
          <button type="button" onClick={() => setItems([...items, { name: '', quantity: 1, price: 0 }])} className="text-blue-500 text-sm">
            + Add line item
          </button>
        </div>
        <div>
          <label className="label">Note</label>
          <textarea className="input-field w-full" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create quote'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function CreateInvoiceModal({ contacts, onClose, onCreate }: { contacts: any[]; onClose: () => void; onCreate: (a: Artifact) => void }) {
  const [title, setTitle] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`);
  const [contactId, setContactId] = useState('');
  const [items, setItems] = useState([{ name: '', quantity: 1, price: 0 }]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !invoiceNumber || items.some(i => !i.name || !i.price)) {
      alert('Fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const artifact = await api.createInvoice({
        title,
        invoiceNumber,
        contactId: contactId || undefined,
        items,
        notes: notes || undefined,
      });
      onCreate(artifact);
    } catch (error) {
      console.error('Failed to create:', error);
      alert('Failed to create');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Create invoice" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Title</label>
            <input className="input-field w-full" value={title} onChange={e => setTitle(e.target.value)} placeholder="What the invoice is for" />
          </div>
          <div>
            <label className="label">Invoice number</label>
            <input className="input-field w-full" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Client</label>
          <select className="input-field w-full" value={contactId} onChange={e => setContactId(e.target.value)}>
            <option value="">Select a client</option>
            {contacts.map(c => <option key={c.id} value={c.id}>{c.name || c.email || c.phone}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Line items</label>
          {items.map((item, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input className="input-field flex-1" placeholder="Name" value={item.name} onChange={e => {
                const newItems = [...items];
                newItems[i].name = e.target.value;
                setItems(newItems);
              }} />
              <input className="input-field w-20" type="number" placeholder="Qty" value={item.quantity} onChange={e => {
                const newItems = [...items];
                newItems[i].quantity = parseInt(e.target.value) || 1;
                setItems(newItems);
              }} />
              <input className="input-field w-28" type="number" placeholder="Price" value={item.price || ''} onChange={e => {
                const newItems = [...items];
                newItems[i].price = parseInt(e.target.value) || 0;
                setItems(newItems);
              }} />
              {items.length > 1 && (
                <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))} className="text-red-500">✕</button>
              )}
            </div>
          ))}
          <button type="button" onClick={() => setItems([...items, { name: '', quantity: 1, price: 0 }])} className="text-blue-500 text-sm">
            + Add line item
          </button>
        </div>
        <div>
          <label className="label">Note</label>
          <textarea className="input-field w-full" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create invoice'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function CreateCalendarLinkModal({ contacts, onClose, onCreate }: { contacts: any[]; onClose: () => void; onCreate: (a: Artifact) => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(30);
  const [contactId, setContactId] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title) {
      alert('Enter a title');
      return;
    }
    setLoading(true);
    try {
      const artifact = await api.createCalendarLink({
        title,
        description: description || undefined,
        duration,
        contactId: contactId || undefined,
      });
      onCreate(artifact);
    } catch (error) {
      console.error('Failed to create:', error);
      alert('Failed to create');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Booking link" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Service name</label>
          <input className="input-field w-full" value={title} onChange={e => setTitle(e.target.value)} placeholder="For example: Consultation" />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input-field w-full" rows={2} value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <div>
          <label className="label">Duration (minutes)</label>
          <select className="input-field w-full" value={duration} onChange={e => setDuration(parseInt(e.target.value))}>
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>1 hour</option>
            <option value={90}>1.5 hours</option>
            <option value={120}>2 hours</option>
          </select>
        </div>
        <div>
          <label className="label">For a client (optional)</label>
          <select className="input-field w-full" value={contactId} onChange={e => setContactId(e.target.value)}>
            <option value="">General link</option>
            {contacts.map(c => <option key={c.id} value={c.id}>{c.name || c.email || c.phone}</option>)}
          </select>
        </div>
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create link'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function CreateProductCardModal({ onClose, onCreate }: { onClose: () => void; onCreate: (a: Artifact) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [features, setFeatures] = useState<string[]>(['']);
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !price) {
      alert('Enter a name and price');
      return;
    }
    setLoading(true);
    try {
      const artifact = await api.createProductCard({
        name,
        description: description || undefined,
        price,
        features: features.filter(f => f.trim()),
        link: link || undefined,
      });
      onCreate(artifact);
    } catch (error) {
      console.error('Failed to create:', error);
      alert('Failed to create');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Product card" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Product name</label>
          <input className="input-field w-full" value={name} onChange={e => setName(e.target.value)} placeholder="For example: iPhone 15 Pro" />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input-field w-full" rows={2} value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <div>
          <label className="label">Price (₽)</label>
          <input className="input-field w-full" type="number" value={price || ''} onChange={e => setPrice(parseInt(e.target.value) || 0)} />
        </div>
        <div>
          <label className="label">Features</label>
          {features.map((f, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input className="input-field flex-1" placeholder="For example: 256 GB storage" value={f} onChange={e => {
                const newF = [...features];
                newF[i] = e.target.value;
                setFeatures(newF);
              }} />
              {features.length > 1 && (
                <button type="button" onClick={() => setFeatures(features.filter((_, j) => j !== i))} className="text-red-500">✕</button>
              )}
            </div>
          ))}
          <button type="button" onClick={() => setFeatures([...features, ''])} className="text-blue-500 text-sm">
            + Add feature
          </button>
        </div>
        <div>
          <label className="label">Product link (optional)</label>
          <input className="input-field w-full" value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." />
        </div>
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create card'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function SendArtifactModal({ artifact, conversations, onClose, onSend }: { 
  artifact: Artifact; 
  conversations: any[]; 
  onClose: () => void; 
  onSend: (artifactId: string, conversationId: string, message?: string) => void;
}) {
  const [conversationId, setConversationId] = useState('');
  const [message, setMessage] = useState('');

  return (
    <Modal title="Send document" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="label">Select a conversation</label>
          <select className="input-field w-full" value={conversationId} onChange={e => setConversationId(e.target.value)}>
            <option value="">Select a chat</option>
            {conversations.map(c => (
              <option key={c.id} value={c.id}>
                {c.title || c.externalChatId} ({c.channel?.name})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Cover message (optional)</label>
          <textarea className="input-field w-full" rows={2} value={message} onChange={e => setMessage(e.target.value)} placeholder="Add a comment..." />
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            onClick={() => conversationId && onSend(artifact.id, conversationId, message || undefined)}
            className="btn-primary"
            disabled={!conversationId}
          >
            Send
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
