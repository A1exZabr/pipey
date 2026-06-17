import { apiClient } from './client';

export interface MagicLinkResponse {
  message: string;
  magicLink?: string;
}

export interface VerifyResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    emailVerifiedAt: string | null;
  };
  organization: {
    id: string;
    name: string;
  };
}

export interface UserProfile {
  user: {
    id: string;
    email: string;
    emailVerifiedAt: string | null;
  };
  organizations: Array<{
    id: string;
    name: string;
    role: string;
  }>;
}

export const authApi = {
  requestMagicLink: async (email: string): Promise<MagicLinkResponse> => {
    const response = await apiClient.post<MagicLinkResponse>('/auth/magic-link', { email });
    return response.data;
  },

  verifyToken: async (token: string): Promise<VerifyResponse> => {
    const response = await apiClient.get<VerifyResponse>(`/auth/verify?token=${token}`);
    return response.data;
  },

  getProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get<UserProfile>('/auth/me');
    return response.data;
  },
};

// Named exports for convenience
export const requestMagicLink = authApi.requestMagicLink;
export const verifyToken = authApi.verifyToken;
export const getProfile = authApi.getProfile;
