import { Campaign, ContentPiece, AIGeneration, Review, Translation } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Handle empty responses (e.g., 204 No Content)
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return {} as T;
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      // For non-JSON responses, return empty object
      return {} as T;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Campaign methods
  async getCampaigns(params?: {
    page?: number;
    limit?: number;
    cursor?: number;
    status?: string;
    contentStatus?: string;
    contentType?: string;
    hasAIContent?: string;
    hasTranslations?: string;
    language?: string;
  }): Promise<{ data: Campaign[]; pagination: { page: number | null; limit: number; total: number | null; hasMore: boolean; nextCursor: number | null } }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.cursor) searchParams.append('cursor', params.cursor.toString());
    if (params?.status) searchParams.append('status', params.status);
    if (params?.contentStatus) searchParams.append('contentStatus', params.contentStatus);
    if (params?.contentType) searchParams.append('contentType', params.contentType);
    if (params?.hasAIContent) searchParams.append('hasAIContent', params.hasAIContent);
    if (params?.hasTranslations) searchParams.append('hasTranslations', params.hasTranslations);
    if (params?.language) searchParams.append('language', params.language);
    
    const queryString = searchParams.toString();
    const endpoint = `/api/v1/campaigns${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{ data: Campaign[]; pagination: { page: number | null; limit: number; total: number | null; hasMore: boolean; nextCursor: number | null } }>(endpoint);
  }

  async getCampaignStats(filters?: {
    status?: string;
    contentStatus?: string;
    contentType?: string;
    hasAIContent?: string;
    hasTranslations?: string;
    language?: string;
  }): Promise<{
    totalCampaigns: number;
    activeCampaigns: number;
    totalContentPieces: number;
    contentWithAI: number;
    contentUnderReview: number;
    approvedContent: number;
    totalTranslations: number;
  }> {
    const searchParams = new URLSearchParams();
    if (filters?.status) searchParams.append('status', filters.status);
    if (filters?.contentStatus) searchParams.append('contentStatus', filters.contentStatus);
    if (filters?.contentType) searchParams.append('contentType', filters.contentType);
    if (filters?.hasAIContent) searchParams.append('hasAIContent', filters.hasAIContent);
    if (filters?.hasTranslations) searchParams.append('hasTranslations', filters.hasTranslations);
    if (filters?.language) searchParams.append('language', filters.language);
    
    const queryString = searchParams.toString();
    const endpoint = `/api/v1/campaigns/stats${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{
      totalCampaigns: number;
      activeCampaigns: number;
      totalContentPieces: number;
      contentWithAI: number;
      contentUnderReview: number;
      approvedContent: number;
      totalTranslations: number;
    }>(endpoint);
  }

  async getCampaign(id: number): Promise<Campaign> {
    return this.request<Campaign>(`/api/v1/campaigns/${id}`);
  }

  async createCampaign(data: {
    name: string;
    description?: string;
    defaultLanguage?: string;
    targetLanguages?: string[];
  }): Promise<Campaign> {
    return this.request<Campaign>('/api/v1/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCampaign(
    id: number,
    data: {
      name?: string;
      description?: string;
      status?: string;
      defaultLanguage?: string;
      targetLanguages?: string[];
    }
  ): Promise<Campaign> {
    return this.request<Campaign>(`/api/v1/campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCampaign(id: number): Promise<void> {
    return this.request<void>(`/api/v1/campaigns/${id}`, {
      method: 'DELETE',
    });
  }

  // Content methods
  async createContent(data: {
    campaignId: number;
    type: string;
    originalContent?: string;
    language?: string;
  }): Promise<ContentPiece> {
    return this.request<ContentPiece>('/api/v1/content', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createContentForCampaign(
    campaignId: number,
    data: {
      type: string;
      originalContent?: string;
      language?: string;
    }
  ): Promise<ContentPiece> {
    return this.request<ContentPiece>(`/api/v1/campaigns/${campaignId}/content`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getContent(id: number): Promise<ContentPiece> {
    return this.request<ContentPiece>(`/api/v1/content/${id}`);
  }

  async getCampaignContent(campaignId: number): Promise<ContentPiece[]> {
    return this.request<ContentPiece[]>(`/api/v1/campaigns/${campaignId}/content`);
  }

  async updateContent(
    id: number,
    data: {
      originalContent?: string;
      status?: string;
    }
  ): Promise<ContentPiece> {
    return this.request<ContentPiece>(`/api/v1/content/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteContent(id: number): Promise<void> {
    return this.request<void>(`/api/v1/content/${id}`, {
      method: 'DELETE',
    });
  }

  // AI methods
  async generateContent(
    contentId: number,
    data: {
      prompt?: string;
      model?: string;
    }
  ): Promise<AIGeneration> {
    return this.request<AIGeneration>(`/api/v1/ai/generate/${contentId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async translateContent(
    contentId: number,
    data: {
      targetLanguage: string;
    }
  ): Promise<Translation> {
    return this.request<Translation>(`/api/v1/ai/translate/${contentId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getGenerations(contentId: number): Promise<AIGeneration[]> {
    return this.request<AIGeneration[]>(`/api/v1/ai/generations/${contentId}`);
  }

  async analyzeContent(
    contentId: number,
    data: {
      targetId?: number;
    }
  ): Promise<{ id: number; analysis: any; metadata: any }> {
    return this.request<{ id: number; analysis: any; metadata: any }>(`/api/v1/ai/analyze/${contentId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Review methods
  async createReview(data: {
    contentPieceId: number;
    reviewerName?: string;
    status: string;
    feedback?: string;
    language?: string;
  }): Promise<Review> {
    return this.request<Review>('/api/v1/content/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async submitForReview(contentId: number): Promise<{ message: string; contentPiece: ContentPiece }> {
    return this.request<{ message: string; contentPiece: ContentPiece }>(
      `/api/v1/content/${contentId}/submit-for-review`,
      {
        method: 'POST',
      }
    );
  }

  async getReviews(contentId: number): Promise<Review[]> {
    return this.request<Review[]>(`/api/v1/content/${contentId}/reviews`);
  }

  async getContentForReview(language?: string): Promise<ContentPiece[]> {
    const qp = language ? `?language=${encodeURIComponent(language)}` : '';
    return this.request<ContentPiece[]>(`/api/v1/content/for-review${qp}`);
  }




  async compareAIModels(
    contentId: number,
    data: {
      prompt?: string;
      models?: string[];
    }
  ): Promise<{
    results: {
      provider: string;
      text: string;
      analysis?: {
        keywords: string[];
        tone: string;
        sentiment: {
          label: string;
          score: number;
        };
      };
      executionTime: number;
      cost?: number;
    }[];
  }> {
    return this.request(`/api/v1/ai/compare/${contentId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
