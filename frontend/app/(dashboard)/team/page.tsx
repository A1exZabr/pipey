'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Member {
  id: string;
  userId: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
}

const ROLE_CONFIG = {
  OWNER: { label: 'Owner', color: 'bg-purple-100 text-purple-700', icon: '👑' },
  ADMIN: { label: 'Admin', color: 'bg-blue-100 text-blue-700', icon: '🛡️' },
  MEMBER: { label: 'Member', color: 'bg-gray-100 text-gray-700', icon: '👤' },
};

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    try {
      const data = await api.getTeamMembers();
      setMembers(data);
    } catch (error) {
      console.error('Failed to load team:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail) return;

    setInviting(true);
    try {
      const newMember = await api.inviteTeamMember(inviteEmail, inviteRole);
      setMembers([...members, newMember]);
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('MEMBER');
    } catch (error: any) {
      alert(error.message || 'Failed to invite');
    } finally {
      setInviting(false);
    }
  }

  async function handleRoleChange(membershipId: string, newRole: 'ADMIN' | 'MEMBER') {
    try {
      await api.updateMemberRole(membershipId, newRole);
      setMembers(members.map(m => 
        m.id === membershipId ? { ...m, role: newRole } : m
      ));
    } catch (error: any) {
      alert(error.message || 'Failed to change role');
    }
  }

  async function handleRemove(membershipId: string) {
    if (!confirm('Remove member from the team?')) return;

    try {
      await api.removeMember(membershipId);
      setMembers(members.filter(m => m.id !== membershipId));
    } catch (error: any) {
      alert(error.message || 'Failed to remove');
    }
  }

  // Check if current user is owner or admin
  const currentUserRole = members.find(m => m.role === 'OWNER')?.role || 'MEMBER';
  const canManage = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';
  const isOwner = currentUserRole === 'OWNER';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Team</h1>
          <p className="text-gray-500 mt-1">{members.length} members</p>
        </div>
        {canManage && (
          <button onClick={() => setShowInviteModal(true)} className="btn-primary">
            + Invite
          </button>
        )}
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-black/5">
              <th className="text-left p-4 font-medium text-gray-500">Member</th>
              <th className="text-left p-4 font-medium text-gray-500">Role</th>
              <th className="text-left p-4 font-medium text-gray-500">Joined</th>
              {canManage && <th className="p-4"></th>}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const roleConfig = ROLE_CONFIG[member.role];
              return (
                <tr key={member.id} className="border-b border-black/5 last:border-0">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center">
                        <span className="text-white font-medium">
                          {member.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium">{member.email}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    {isOwner && member.role !== 'OWNER' ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value as 'ADMIN' | 'MEMBER')}
                        className="px-3 py-1 rounded-lg border border-gray-200 text-sm"
                      >
                        <option value="ADMIN">🛡️ Admin</option>
                        <option value="MEMBER">👤 Member</option>
                      </select>
                    ) : (
                      <span className={`px-3 py-1 rounded-lg text-sm font-medium ${roleConfig.color}`}>
                        {roleConfig.icon} {roleConfig.label}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-gray-500">
                    {new Date(member.joinedAt).toLocaleDateString('en-US')}
                  </td>
                  {canManage && (
                    <td className="p-4 text-right">
                      {member.role !== 'OWNER' && (
                        <button
                          onClick={() => handleRemove(member.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Role descriptions */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-semibold mb-4">Access levels</h3>
        <div className="space-y-3 text-sm">
          <div className="flex gap-4">
            <span className="w-24 font-medium">👑 Owner</span>
            <span className="text-gray-600">Full access, team and settings management</span>
          </div>
          <div className="flex gap-4">
            <span className="w-24 font-medium">🛡️ Admin</span>
            <span className="text-gray-600">Inviting members, access to all features</span>
          </div>
          <div className="flex gap-4">
            <span className="w-24 font-medium">👤 Member</span>
            <span className="text-gray-600">Working with contacts, deals, and messages</span>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Invite to the team</h2>
              <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <form onSubmit={handleInvite} className="p-4 space-y-4">
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="input-field w-full"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="label">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'ADMIN' | 'MEMBER')}
                  className="input-field w-full"
                >
                  <option value="MEMBER">👤 Member</option>
                  <option value="ADMIN">🛡️ Admin</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowInviteModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={inviting}>
                  {inviting ? 'Sending...' : 'Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
