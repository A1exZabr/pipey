'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import SwipeHandler from '@/components/pipeline/SwipeHandler';
import UndoToast from '@/components/pipeline/UndoToast';

interface Stage {
  id: string;
  name: string;
  order: number;
  color: string;
  isCritical: boolean;
  deals: Deal[];
}

interface Deal {
  id: string;
  title: string;
  value: string;
  notes: string | null;
  contact: { id: string; name: string; email: string } | null;
  stage: { id: string; name: string; color: string };
}

interface Pipeline {
  id: string;
  name: string;
  stages: { id: string; name: string; order: number; color: string }[];
}

interface Contact {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
}

export default function PipelinePage() {
  const searchParams = useSearchParams();
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewDealModal, setShowNewDealModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [draggingDeal, setDraggingDeal] = useState<Deal | null>(null);
  const [undoState, setUndoState] = useState<{ deal: Deal; fromStageId: string; message: string } | null>(null);

  useEffect(() => {
    loadData();
    if (searchParams.get('new') === 'true') {
      setShowNewDealModal(true);
    }
  }, [searchParams]);

  async function loadData() {
    try {
      const pipelines = await api.getPipelines();
      if (pipelines.length === 0) {
        const newPipeline = await api.createPipeline({ name: 'Sales pipeline' });
        await loadPipelineData(newPipeline.id);
      } else {
        await loadPipelineData(pipelines[0].id);
      }

      const contactsData = await api.getContacts();
      setContacts(contactsData);
    } catch (error) {
      console.error('Failed to load pipeline:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadPipelineData(pipelineId: string) {
    const data = await api.getDealsByPipeline(pipelineId);
    setPipeline(data.pipeline);
    setStages(data.stages);
  }

  async function handleDrop(stageId: string) {
    if (!draggingDeal || draggingDeal.stage.id === stageId) {
      setDraggingDeal(null);
      return;
    }

    try {
      await api.moveDeal(draggingDeal.id, stageId);
      if (pipeline) {
        await loadPipelineData(pipeline.id);
      }
    } catch (error) {
      console.error('Failed to move deal:', error);
    } finally {
      setDraggingDeal(null);
    }
  }

  async function handleSwipeMove(deal: Deal, direction: 'next' | 'prev') {
    const currentStageIndex = stages.findIndex((s) => s.id === deal.stage.id);
    const targetIndex = direction === 'next' ? currentStageIndex + 1 : currentStageIndex - 1;
    if (targetIndex < 0 || targetIndex >= stages.length) return;

    const targetStage = stages[targetIndex];

    if (targetStage.isCritical) {
      const confirmed = window.confirm(
        `Move "${deal.title}" to the critical stage "${targetStage.name}"?`
      );
      if (!confirmed) return;
    }

    const fromStageId = deal.stage.id;
    try {
      await api.moveDeal(deal.id, targetStage.id);
      if (pipeline) await loadPipelineData(pipeline.id);
      setUndoState({
        deal,
        fromStageId,
        message: `Deal moved to "${targetStage.name}"`,
      });
    } catch (error) {
      console.error('Failed to move deal:', error);
    }
  }

  async function handleUndo() {
    if (!undoState) return;
    try {
      await api.moveDeal(undoState.deal.id, undoState.fromStageId);
      if (pipeline) await loadPipelineData(pipeline.id);
    } catch (error) {
      console.error('Failed to undo:', error);
    } finally {
      setUndoState(null);
    }
  }

  async function handleCreateDeal(data: { title: string; value?: number; contactId?: string }) {
    if (!pipeline || stages.length === 0) return;

    try {
      await api.createDeal({
        ...data,
        pipelineId: pipeline.id,
        stageId: stages[0].id,
      });
      await loadPipelineData(pipeline.id);
      setShowNewDealModal(false);
    } catch (error) {
      console.error('Failed to create deal:', error);
    }
  }

  async function handleUpdateDeal(id: string, data: { title?: string; value?: number; notes?: string; stageId?: string; contactId?: string }) {
    try {
      await api.updateDeal(id, data);
      if (pipeline) {
        await loadPipelineData(pipeline.id);
      }
      setEditingDeal(null);
    } catch (error) {
      console.error('Failed to update deal:', error);
    }
  }

  async function handleDeleteDeal(dealId: string) {
    if (!confirm('Delete this deal?')) return;
    try {
      await api.deleteDeal(dealId);
      if (pipeline) {
        await loadPipelineData(pipeline.id);
      }
      setEditingDeal(null);
    } catch (error) {
      console.error('Failed to delete deal:', error);
    }
  }

  function openDealEditor(deal: Deal) {
    setEditingDeal(deal);
  }

  function openSettings() {
    console.log('Opening settings, pipeline:', pipeline);
    setShowSettingsModal(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{pipeline?.name || 'Pipeline'}</h1>
            <p className="text-gray-500 mt-1">
              Deals in pipeline: {stages.reduce((sum, s) => sum + s.deals.length, 0)}
            </p>
          </div>
          <button
            onClick={openSettings}
            className="p-2 rounded-lg hover:bg-black/5 transition-colors"
            title="Pipeline settings"
          >
            <SettingsIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <button onClick={() => setShowNewDealModal(true)} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          New deal
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-6 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <div
            key={stage.id}
            className="kanban-column"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(stage.id)}
          >
            {/* Stage Header */}
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: stage.color }}
              />
              <h3 className="font-semibold">{stage.name}</h3>
              <span className="ml-auto text-sm text-gray-500 bg-black/5 px-2 py-0.5 rounded-full">
                {stage.deals.length}
              </span>
            </div>

            {/* Deals */}
            <div className="space-y-3">
              {stage.deals.map((deal) => (
                <SwipeHandler
                  key={deal.id}
                  onSwipeLeft={() => handleSwipeMove(deal, 'next')}
                  onSwipeRight={() => handleSwipeMove(deal, 'prev')}
                >
                <div
                  draggable
                  onDragStart={() => setDraggingDeal(deal)}
                  onDragEnd={() => setDraggingDeal(null)}
                  onClick={() => openDealEditor(deal)}
                  className={'kanban-card group cursor-pointer' + (draggingDeal?.id === deal.id ? ' opacity-50' : '')}
                >
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium">{deal.title}</h4>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteDeal(deal.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 transition-all"
                    >
                      <TrashIcon className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                  {deal.contact && (
                    <p className="text-sm text-gray-500 mt-1">{deal.contact.name}</p>
                  )}
                  {deal.notes && (
                    <p className="text-xs text-gray-400 mt-2 line-clamp-2">{deal.notes}</p>
                  )}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-black/5">
                    <span className="text-sm font-medium text-green-600">
                      {formatCurrency(parseFloat(deal.value) || 0)}
                    </span>
                    {deal.contact && (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                        <span className="text-white text-xs font-medium">
                          {deal.contact.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                </SwipeHandler>
              ))}

              {stage.deals.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No deals
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Undo Toast */}
      {undoState && (
        <UndoToast
          message={undoState.message}
          onUndo={handleUndo}
          onDismiss={() => setUndoState(null)}
        />
      )}

      {/* New Deal Modal */}
      {showNewDealModal && (
        <NewDealModal
          contacts={contacts}
          onClose={() => setShowNewDealModal(false)}
          onSave={handleCreateDeal}
        />
      )}

      {/* Edit Deal Modal */}
      {editingDeal && (
        <EditDealModal
          deal={editingDeal}
          stages={stages}
          contacts={contacts}
          onClose={() => setEditingDeal(null)}
          onSave={(data) => handleUpdateDeal(editingDeal.id, data)}
          onDelete={() => handleDeleteDeal(editingDeal.id)}
        />
      )}

      {/* Pipeline Settings Modal */}
      {showSettingsModal && (
        <PipelineSettingsModal
          pipeline={pipeline}
          stages={stages}
          onClose={() => setShowSettingsModal(false)}
          onUpdate={async () => {
            if (pipeline) {
              await loadPipelineData(pipeline.id);
            }
          }}
        />
      )}
    </div>
  );
}

// Contact Picker Modal
function ContactPickerModal({
  contacts,
  selectedId,
  onSelect,
  onClose,
}: {
  contacts: Contact[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');

  const filtered = contacts.filter((c) => {
    const query = search.toLowerCase();
    return (
      (c.name?.toLowerCase().includes(query)) ||
      (c.email?.toLowerCase().includes(query)) ||
      (c.phone?.includes(query))
    );
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card rounded-2xl p-6 w-full max-w-md m-4 max-h-[80vh] flex flex-col">
        <h3 className="text-lg font-semibold mb-4">Select a contact</h3>

        {/* Search */}
        <div className="relative mb-4">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-12"
            autoFocus
          />
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {/* No contact option */}
          <button
            onClick={() => { onSelect(''); onClose(); }}
            className={'w-full text-left p-3 rounded-xl transition-colors ' + (!selectedId ? 'bg-blue-50 border border-blue-200' : 'hover:bg-black/5')}
          >
            <span className="text-gray-500">No contact</span>
          </button>

          {filtered.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No contacts found
            </div>
          ) : (
            filtered.map((contact) => (
              <button
                key={contact.id}
                onClick={() => { onSelect(contact.id); onClose(); }}
                className={'w-full text-left p-3 rounded-xl transition-colors flex items-center gap-3 ' + (selectedId === contact.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-black/5')}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-medium">
                    {(contact.name || contact.email || '?').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{contact.name || 'No name'}</p>
                  <p className="text-sm text-gray-500 truncate">{contact.email || contact.phone || ''}</p>
                </div>
                {selectedId === contact.id && (
                  <CheckIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                )}
              </button>
            ))
          )}
        </div>

        <div className="pt-4 mt-4 border-t border-black/5">
          <button onClick={onClose} className="btn-secondary w-full">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function NewDealModal({
  contacts,
  onClose,
  onSave,
}: {
  contacts: Contact[];
  onClose: () => void;
  onSave: (data: { title: string; value?: number; contactId?: string }) => void;
}) {
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [contactId, setContactId] = useState('');
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedContact = contacts.find(c => c.id === contactId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || saving) return;

    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        value: value ? parseFloat(value) : undefined,
        contactId: contactId || undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card rounded-2xl p-6 w-full max-w-md m-4">
        <h2 className="text-xl font-semibold mb-6">New deal</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="Deal title"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="input-field"
              placeholder="100000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
            <button
              type="button"
              onClick={() => setShowContactPicker(true)}
              className="input-field w-full text-left flex items-center justify-between"
            >
              {selectedContact ? (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center">
                    <span className="text-white text-xs font-medium">
                      {(selectedContact.name || selectedContact.email || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span>{selectedContact.name || selectedContact.email}</span>
                </div>
              ) : (
                <span className="text-gray-500">Select a contact</span>
              )}
              <ChevronIcon className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={saving}>
              {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Create
            </button>
          </div>
        </form>

        {showContactPicker && (
          <ContactPickerModal
            contacts={contacts}
            selectedId={contactId}
            onSelect={setContactId}
            onClose={() => setShowContactPicker(false)}
          />
        )}
      </div>
    </div>
  );
}

function EditDealModal({
  deal,
  stages,
  contacts,
  onClose,
  onSave,
  onDelete,
}: {
  deal: Deal;
  stages: Stage[];
  contacts: Contact[];
  onClose: () => void;
  onSave: (data: { title?: string; value?: number; notes?: string; stageId?: string; contactId?: string }) => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(deal.title);
  const [value, setValue] = useState(deal.value || '');
  const [notes, setNotes] = useState(deal.notes || '');
  const [stageId, setStageId] = useState(deal.stage.id);
  const [contactId, setContactId] = useState(deal.contact?.id || '');
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedContact = contacts.find(c => c.id === contactId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || saving) return;

    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        value: value ? parseFloat(value) : undefined,
        notes: notes || undefined,
        stageId: stageId !== deal.stage.id ? stageId : undefined,
        contactId: contactId || undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card rounded-2xl p-6 w-full max-w-lg m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Edit deal</h2>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg hover:bg-red-50 transition-colors"
            title="Delete deal"
          >
            <TrashIcon className="w-5 h-5 text-red-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="Deal title"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="input-field"
                placeholder="100000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
              <select
                value={stageId}
                onChange={(e) => setStageId(e.target.value)}
                className="input-field"
              >
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
            <button
              type="button"
              onClick={() => setShowContactPicker(true)}
              className="input-field w-full text-left flex items-center justify-between"
            >
              {selectedContact ? (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center">
                    <span className="text-white text-xs font-medium">
                      {(selectedContact.name || selectedContact.email || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span>{selectedContact.name || selectedContact.email}</span>
                </div>
              ) : (
                <span className="text-gray-500">Select a contact</span>
              )}
              <ChevronIcon className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes and comments</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field min-h-[150px] resize-none"
              placeholder="Add notes, comments, communication history..."
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={saving}>
              {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Save
            </button>
          </div>
        </form>

        {showContactPicker && (
          <ContactPickerModal
            contacts={contacts}
            selectedId={contactId}
            onSelect={setContactId}
            onClose={() => setShowContactPicker(false)}
          />
        )}
      </div>
    </div>
  );
}

function PipelineSettingsModal({
  pipeline,
  stages,
  onClose,
  onUpdate,
}: {
  pipeline: Pipeline | null;
  stages: Stage[];
  onClose: () => void;
  onUpdate: () => Promise<void>;
}) {
  const [name, setName] = useState(pipeline?.name || 'Sales pipeline');
  const [localStages, setLocalStages] = useState(stages.map(s => ({ ...s })));
  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState('#6366f1');
  const [saving, setSaving] = useState(false);

  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
    '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
  ];

  async function handleSaveName() {
    if (!pipeline || !name.trim() || name === pipeline.name) return;
    setSaving(true);
    try {
      await api.updatePipeline(pipeline.id, { name: name.trim() });
      await onUpdate();
    } catch (error) {
      console.error('Failed to update pipeline:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddStage() {
    if (!pipeline || !newStageName.trim()) return;
    setSaving(true);
    try {
      await api.addStage(pipeline.id, { name: newStageName.trim(), color: newStageColor });
      setNewStageName('');
      await onUpdate();
      const updatedData = await api.getDealsByPipeline(pipeline.id);
      setLocalStages(updatedData.stages.map((s: Stage) => ({ ...s })));
    } catch (error) {
      console.error('Failed to add stage:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateStage(stageId: string, data: { name?: string; color?: string }) {
    if (!pipeline) return;
    setSaving(true);
    try {
      await api.updateStage(pipeline.id, stageId, data);
      await onUpdate();
    } catch (error) {
      console.error('Failed to update stage:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteStage(stageId: string) {
    if (!pipeline) return;
    const stage = localStages.find(s => s.id === stageId);
    if (stage && stage.deals.length > 0) {
      alert('You cannot delete a stage that has deals. Move the deals to another stage first.');
      return;
    }
    if (!confirm('Delete this stage?')) return;
    setSaving(true);
    try {
      await api.deleteStage(pipeline.id, stageId);
      await onUpdate();
      setLocalStages(prev => prev.filter(s => s.id !== stageId));
    } catch (error) {
      console.error('Failed to delete stage:', error);
    } finally {
      setSaving(false);
    }
  }

  if (!pipeline) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
        <div className="relative glass-card rounded-2xl p-6 w-full max-w-lg m-4">
          <h2 className="text-xl font-semibold mb-6">Pipeline settings</h2>
          <p className="text-gray-500">Loading pipeline...</p>
          <div className="flex justify-end pt-4 mt-4 border-t border-black/5">
            <button onClick={onClose} className="btn-secondary">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card rounded-2xl p-6 w-full max-w-lg m-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-6">Pipeline settings</h2>

        {/* Pipeline Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Pipeline name</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field flex-1"
            />
            <button
              onClick={handleSaveName}
              disabled={saving || !name.trim() || name === pipeline.name}
              className="btn-primary px-4"
            >
              Save
            </button>
          </div>
        </div>

        {/* Stages */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Pipeline stages</label>
          <div className="space-y-3">
            {localStages.map((stage) => (
              <div key={stage.id} className="flex items-center gap-3 p-3 bg-black/[0.02] rounded-xl">
                <input
                  type="color"
                  value={stage.color}
                  onChange={(e) => {
                    setLocalStages(prev => prev.map(s => s.id === stage.id ? { ...s, color: e.target.value } : s));
                    handleUpdateStage(stage.id, { color: e.target.value });
                  }}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0"
                />
                <input
                  type="text"
                  value={stage.name}
                  onChange={(e) => setLocalStages(prev => prev.map(s => s.id === stage.id ? { ...s, name: e.target.value } : s))}
                  onBlur={() => handleUpdateStage(stage.id, { name: stage.name })}
                  className="input-field flex-1"
                />
                <span className="text-sm text-gray-500">{stage.deals.length} deals</span>
                <button
                  onClick={() => handleDeleteStage(stage.id)}
                  className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                  disabled={localStages.length <= 1}
                >
                  <TrashIcon className="w-4 h-4 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Add New Stage */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Add stage</label>
          <div className="flex gap-2 flex-wrap">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setNewStageColor(color)}
                className={'w-6 h-6 rounded-full transition-transform' + (newStageColor === color ? ' ring-2 ring-offset-2 ring-blue-500 scale-110' : '')}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              placeholder="Stage name"
              className="input-field flex-1"
            />
            <button
              onClick={handleAddStage}
              disabled={saving || !newStageName.trim()}
              className="btn-primary px-4"
            >
              Add
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-black/5">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value);
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
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

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
