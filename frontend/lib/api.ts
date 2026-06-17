const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = 'Bearer ' + token;
    }

    const response = await fetch(API_URL + '/api' + endpoint, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async requestMagicLink(email: string) {
    return this.request<{ message: string; magicLink?: string }>('/auth/magic-link', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyToken(token: string) {
    return this.request<{ accessToken: string; user: any }>('/auth/verify?token=' + token);
  }

  async getProfile() {
    return this.request<any>('/auth/me');
  }

  // Contacts
  async getContacts(search?: string) {
    const params = search ? '?search=' + encodeURIComponent(search) : '';
    return this.request<any[]>('/contacts' + params);
  }

  async getContact(id: string) {
    return this.request<any>('/contacts/' + id);
  }

  async createContact(data: { name?: string; email?: string; phone?: string; tags?: string[]; notes?: string }) {
    return this.request<any>('/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateContact(id: string, data: Partial<{ name: string; email: string; phone: string; tags: string[]; notes: string }>) {
    return this.request<any>('/contacts/' + id, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getContactConversations(id: string) {
    return this.request<any[]>('/contacts/' + id + '/conversations');
  }

  async getContactDeals(id: string) {
    return this.request<any[]>('/contacts/' + id + '/deals');
  }

  async getContactArtifacts(id: string) {
    return this.request<any[]>('/contacts/' + id + '/artifacts');
  }

  async getContactTimeline(id: string) {
    return this.request<any[]>('/contacts/' + id + '/timeline');
  }

  async deleteContact(id: string) {
    return this.request<{ success: boolean }>('/contacts/' + id, {
      method: 'DELETE',
    });
  }

  // Pipelines
  async getPipelines() {
    return this.request<any[]>('/pipelines');
  }

  async getPipeline(id: string) {
    return this.request<any>('/pipelines/' + id);
  }

  async createPipeline(data: { name: string }) {
    return this.request<any>('/pipelines', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePipeline(id: string, data: { name?: string }) {
    return this.request<any>('/pipelines/' + id, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async addStage(pipelineId: string, data: { name: string; color?: string }) {
    return this.request<any>('/pipelines/' + pipelineId + '/stages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateStage(pipelineId: string, stageId: string, data: { name?: string; color?: string }) {
    return this.request<any>('/pipelines/' + pipelineId + '/stages/' + stageId, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteStage(pipelineId: string, stageId: string) {
    return this.request<{ success: boolean }>('/pipelines/' + pipelineId + '/stages/' + stageId, {
      method: 'DELETE',
    });
  }

  async getDeal(id: string) {
    return this.request<any>('/deals/' + id);
  }

  // Deals
  async getDeals(pipelineId?: string) {
    const params = pipelineId ? '?pipelineId=' + pipelineId : '';
    return this.request<any[]>('/deals' + params);
  }

  async getDealsByPipeline(pipelineId: string) {
    return this.request<{ pipeline: any; stages: any[] }>('/deals/pipeline/' + pipelineId);
  }

  async createDeal(data: { title: string; value?: number; pipelineId: string; stageId: string; contactId?: string }) {
    return this.request<any>('/deals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDeal(id: string, data: Partial<{ title: string; value: number; notes: string; stageId: string }>) {
    return this.request<any>('/deals/' + id, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async moveDeal(id: string, stageId: string) {
    return this.request<any>('/deals/' + id + '/move', {
      method: 'PATCH',
      body: JSON.stringify({ stageId }),
    });
  }

  async deleteDeal(id: string) {
    return this.request<{ success: boolean }>('/deals/' + id, {
      method: 'DELETE',
    });
  }

  // Conversations
  async getConversations(channelId?: string, unreadOnly?: boolean) {
    const params = new URLSearchParams();
    if (channelId) params.append('channelId', channelId);
    if (unreadOnly) params.append('unreadOnly', 'true');
    const query = params.toString() ? '?' + params.toString() : '';
    return this.request<any[]>('/conversations' + query);
  }

  async getConversation(id: string) {
    return this.request<any>('/conversations/' + id);
  }

  async getMessages(conversationId: string, cursor?: string, limit?: number) {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    if (limit) params.append('limit', limit.toString());
    const query = params.toString() ? '?' + params.toString() : '';
    return this.request<{ messages: any[]; nextCursor?: string }>('/conversations/' + conversationId + '/messages' + query);
  }

  async sendMessage(conversationId: string, text: string) {
    return this.request<any>('/conversations/' + conversationId + '/messages', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  async markAsRead(conversationId: string) {
    return this.request<any>('/conversations/' + conversationId + '/read', {
      method: 'PATCH',
    });
  }

  // Channels
  async getChannels() {
    return this.request<any[]>('/channels');
  }

  async getChannel(id: string) {
    return this.request<any>('/channels/' + id);
  }

  async connectTelegram(botToken: string) {
    return this.request<any>('/channels/telegram/connect', {
      method: 'POST',
      body: JSON.stringify({ botToken }),
    });
  }

  async connectMax(botToken: string) {
    return this.request<any>('/channels/max/connect', {
      method: 'POST',
      body: JSON.stringify({ botToken }),
    });
  }

  async connectAvito(clientId: string, clientSecret: string) {
    return this.request<any>('/channels/avito/connect', {
      method: 'POST',
      body: JSON.stringify({ clientId, clientSecret }),
    });
  }

  async disconnectChannel(id: string) {
    return this.request<{ success: boolean }>('/channels/' + id, {
      method: 'DELETE',
    });
  }

  // Artifacts
  async getArtifacts(type?: string) {
    const params = type ? '?type=' + type : '';
    return this.request<any[]>('/artifacts' + params);
  }

  async getArtifact(id: string) {
    return this.request<any>('/artifacts/' + id);
  }

  async createQuote(data: {
    title: string;
    contactId?: string;
    dealId?: string;
    items: Array<{ name: string; description?: string; quantity: number; price: number; unit?: string }>;
    notes?: string;
    validUntil?: string;
  }) {
    return this.request<any>('/artifacts/quotes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createInvoice(data: {
    title: string;
    invoiceNumber: string;
    contactId?: string;
    dealId?: string;
    items: Array<{ name: string; description?: string; quantity: number; price: number; unit?: string }>;
    notes?: string;
    dueDate?: string;
  }) {
    return this.request<any>('/artifacts/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createCalendarLink(data: {
    title: string;
    contactId?: string;
    description?: string;
    duration?: number;
  }) {
    return this.request<any>('/artifacts/calendar-links', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createProductCard(data: {
    name: string;
    description?: string;
    price: number;
    currency?: string;
    images?: string[];
    features?: string[];
    link?: string;
  }) {
    return this.request<any>('/artifacts/product-cards', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendArtifact(artifactId: string, conversationId: string, message?: string) {
    return this.request<any>('/artifacts/send', {
      method: 'POST',
      body: JSON.stringify({ artifactId, conversationId, message }),
    });
  }

  async deleteArtifact(id: string) {
    return this.request<{ success: boolean }>('/artifacts/' + id, {
      method: 'DELETE',
    });
  }

  async downloadArtifactPdf(id: string): Promise<void> {
    const token = this.getToken();
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    const response = await fetch(`${API_URL}/api/artifacts/${id}/pdf`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    
    if (!response.ok) {
      throw new Error('Failed to download PDF');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'document.pdf';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  // AI
  async generateDraftReply(conversationId: string) {
    return this.request<{ text: string; confidence: number }>(
      '/ai/conversations/' + conversationId + '/draft-reply',
      { method: 'POST' }
    );
  }

  async generateActionSuggestions(conversationId: string) {
    return this.request<{
      actions: Array<{
        type: string;
        label: string;
        params?: Record<string, any>;
      }>;
    }>('/ai/conversations/' + conversationId + '/action-suggestions', {
      method: 'POST',
    });
  }

  async generateSummary(conversationId: string) {
    return this.request<{
      summary: string;
      clientNeeds: string[];
      sentiment: 'positive' | 'neutral' | 'negative';
    }>('/ai/conversations/' + conversationId + '/summary', {
      method: 'POST',
    });
  }

  async getAiSuggestions(conversationId: string) {
    return this.request<any[]>('/ai/conversations/' + conversationId + '/suggestions');
  }

  async acceptSuggestion(suggestionId: string) {
    return this.request<any>('/ai/suggestions/' + suggestionId + '/accept', {
      method: 'POST',
    });
  }

  async dismissSuggestion(suggestionId: string) {
    return this.request<any>('/ai/suggestions/' + suggestionId + '/dismiss', {
      method: 'POST',
    });
  }

  // Settings
  async getSettings() {
    return this.request<any>('/settings');
  }

  // Onboarding
  async completeOnboarding() {
    return this.request<any>('/settings/onboarding-complete', {
      method: 'PATCH',
    });
  }

  async getOnboardingStatus() {
    return this.request<{ onboardingCompleted: boolean }>('/settings/onboarding-status');
  }

  // Team
  async getTeamMembers() {
    return this.request<any[]>('/team');
  }

  async inviteTeamMember(email: string, role?: 'ADMIN' | 'MEMBER') {
    return this.request<any>('/team/invite', {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });
  }

  async updateMemberRole(membershipId: string, role: 'ADMIN' | 'MEMBER') {
    return this.request<any>('/team/' + membershipId + '/role', {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  async removeMember(membershipId: string) {
    return this.request<any>('/team/' + membershipId, {
      method: 'DELETE',
    });
  }

  // Analytics
  async getAnalyticsFunnel(params?: { orgId?: string; from?: string; to?: string }) {
    const q = new URLSearchParams(params as Record<string, string> || {}).toString();
    return this.request<any[]>('/analytics/funnel' + (q ? '?' + q : ''));
  }

  async getAnalyticsRevenue(params?: { orgId?: string; from?: string; to?: string; groupBy?: 'day' | 'week' | 'month' }) {
    const q = new URLSearchParams(params as Record<string, string> || {}).toString();
    return this.request<any[]>('/analytics/revenue' + (q ? '?' + q : ''));
  }

  async getAnalyticsChannels(params?: { orgId?: string; from?: string; to?: string }) {
    const q = new URLSearchParams(params as Record<string, string> || {}).toString();
    return this.request<any[]>('/analytics/channels' + (q ? '?' + q : ''));
  }

  async getAnalyticsTeam(params?: { orgId?: string; from?: string; to?: string }) {
    const q = new URLSearchParams(params as Record<string, string> || {}).toString();
    return this.request<any[]>('/analytics/team' + (q ? '?' + q : ''));
  }

  async updateSettings(data: {
    scenario?: 'b2b' | 'services' | 'products';
    company?: {
      name?: string;
      inn?: string;
      kpp?: string;
      ogrn?: string;
      legalAddress?: string;
      actualAddress?: string;
      director?: string;
    };
    bank?: {
      name?: string;
      bik?: string;
      account?: string;
      corrAccount?: string;
    };
    calendar?: {
      workDays?: number[];
      workHoursStart?: string;
      workHoursEnd?: string;
      slotDuration?: number;
    };
    ai?: {
      enabled?: boolean;
      autoSuggest?: boolean;
    };
  }) {
    return this.request<any>('/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient();
