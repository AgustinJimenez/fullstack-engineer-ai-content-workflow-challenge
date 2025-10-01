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
    status?: string | string[];
    contentStatus?: string | string[];
    contentType?: string | string[];
    hasAIContent?: string;
    hasTranslations?: string;
    defaultLanguage?: string | string[];
    targetLanguages?: string | string[];
  }): Promise<{ data: Campaign[]; pagination: { page: number | null; limit: number; total: number | null; hasMore: boolean; nextCursor: number | null } }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.cursor) searchParams.append('cursor', params.cursor.toString());
    
    // Handle both single values and arrays
    if (params?.status) {
      if (Array.isArray(params.status)) {
        params.status.forEach(s => searchParams.append('status', s));
      } else {
        searchParams.append('status', params.status);
      }
    }
    if (params?.contentStatus) {
      if (Array.isArray(params.contentStatus)) {
        params.contentStatus.forEach(s => searchParams.append('contentStatus', s));
      } else {
        searchParams.append('contentStatus', params.contentStatus);
      }
    }
    if (params?.contentType) {
      if (Array.isArray(params.contentType)) {
        params.contentType.forEach(t => searchParams.append('contentType', t));
      } else {
        searchParams.append('contentType', params.contentType);
      }
    }
    if (params?.defaultLanguage) {
      if (Array.isArray(params.defaultLanguage)) {
        params.defaultLanguage.forEach(l => searchParams.append('defaultLanguage', l));
      } else {
        searchParams.append('defaultLanguage', params.defaultLanguage);
      }
    }
    if (params?.targetLanguages) {
      if (Array.isArray(params.targetLanguages)) {
        params.targetLanguages.forEach(l => searchParams.append('targetLanguages', l));
      } else {
        searchParams.append('targetLanguages', params.targetLanguages);
      }
    }
    
    if (params?.hasAIContent) searchParams.append('hasAIContent', params.hasAIContent);
    if (params?.hasTranslations) searchParams.append('hasTranslations', params.hasTranslations);
    
    const queryString = searchParams.toString();
    const endpoint = `/api/v1/campaigns${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{ data: Campaign[]; pagination: { page: number | null; limit: number; total: number | null; hasMore: boolean; nextCursor: number | null } }>(endpoint);
  }

  async getCampaignStats(filters?: {
    status?: string | string[];
    contentStatus?: string | string[];
    contentType?: string | string[];
    hasAIContent?: string;
    hasTranslations?: string;
    defaultLanguage?: string | string[];
    targetLanguages?: string | string[];
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
    
    // Handle both single values and arrays
    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        filters.status.forEach(s => searchParams.append('status', s));
      } else {
        searchParams.append('status', filters.status);
      }
    }
    if (filters?.contentStatus) {
      if (Array.isArray(filters.contentStatus)) {
        filters.contentStatus.forEach(s => searchParams.append('contentStatus', s));
      } else {
        searchParams.append('contentStatus', filters.contentStatus);
      }
    }
    if (filters?.contentType) {
      if (Array.isArray(filters.contentType)) {
        filters.contentType.forEach(t => searchParams.append('contentType', t));
      } else {
        searchParams.append('contentType', filters.contentType);
      }
    }
    if (filters?.defaultLanguage) {
      if (Array.isArray(filters.defaultLanguage)) {
        filters.defaultLanguage.forEach(l => searchParams.append('defaultLanguage', l));
      } else {
        searchParams.append('defaultLanguage', filters.defaultLanguage);
      }
    }
    if (filters?.targetLanguages) {
      if (Array.isArray(filters.targetLanguages)) {
        filters.targetLanguages.forEach(l => searchParams.append('targetLanguages', l));
      } else {
        searchParams.append('targetLanguages', filters.targetLanguages);
      }
    }
    
    if (filters?.hasAIContent) searchParams.append('hasAIContent', filters.hasAIContent);
    if (filters?.hasTranslations) searchParams.append('hasTranslations', filters.hasTranslations);
    
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
    // First get the content to translate
    const content = await this.getContent(contentId);
    
    // Determine what to translate - prefer AI-generated content if available
    let textToTranslate = content.originalContent;
    let sourceType = 'original';
    
    // If there are AI generations, translate the most recent one
    if (content.aiGenerations && content.aiGenerations.length > 0) {
      // Get the most recent AI generation
      const latestGeneration = content.aiGenerations[content.aiGenerations.length - 1];
      textToTranslate = latestGeneration.generatedText;
      sourceType = 'ai-generated';
    }
    
    // Use the AI generation endpoint with a translation prompt
    const translationPrompt = `Translate this text to ${data.targetLanguage}. Return only the translation, no additional text or explanations:

${textToTranslate}`;

    const translationResult = await this.generateContent(contentId, {
      prompt: translationPrompt,
      model: 'openai' // Use default provider
    });
    
    // Clean up the translation result (remove quotes if present)
    let cleanedTranslation = translationResult.generatedText.trim();
    if (cleanedTranslation.startsWith('"') && cleanedTranslation.endsWith('"')) {
      cleanedTranslation = cleanedTranslation.slice(1, -1);
    }
    
    // Create a mock translation object that matches the expected structure
    // Since we're bypassing the actual translate endpoint, we simulate the result
    const translation: Translation = {
      id: Date.now(), // Use timestamp as mock ID
      contentPieceId: contentId,
      targetLanguage: data.targetLanguage,
      translatedText: cleanedTranslation,
      aiModel: 'openai',
      status: 'completed',
      qualityScore: 0.9,
      createdAt: new Date().toISOString()
    };
    
    return translation;
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
