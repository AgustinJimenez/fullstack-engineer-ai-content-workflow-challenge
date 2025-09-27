import { APIRequestContext, expect } from '@playwright/test';

export class APIHelpers {
  private readonly baseURL = process.env.NEXT_PUBLIC_API_URL || 
    `http://${process.env.API_HOST || 'localhost'}:${process.env.API_PORT || 8080}`;

  constructor(public request: APIRequestContext) {}

  get apiBaseURL() {
    return this.baseURL;
  }

  async createCampaign(data: { name: string; description?: string }) {
    const response = await this.request.post(`${this.baseURL}/api/v1/campaigns`, {
      data,
    });
    if (!response.ok()) {
      const errorText = await response.text();
      console.error(`API Error: ${response.status()} ${response.statusText()}`);
      console.error(`Response: ${errorText}`);
      console.error(`URL: ${this.baseURL}/api/v1/campaigns`);
    }
    expect(response.ok()).toBeTruthy();
    return await response.json();
  }

  async getCampaigns() {
    const response = await this.request.get(`${this.baseURL}/api/v1/campaigns`);
    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    // Handle both old format (direct array) and new format (paginated with data property)
    return Array.isArray(result) ? result : result.data || [];
  }

  async getCampaign(id: number) {
    const response = await this.request.get(`${this.baseURL}/api/v1/campaigns/${id}`);
    expect(response.ok()).toBeTruthy();
    return await response.json();
  }

  async createContent(campaignId: number, data: {
    type: string;
    originalContent?: string;
    language?: string;
  }) {
    const response = await this.request.post(`${this.baseURL}/api/v1/campaigns/${campaignId}/content`, {
      data,
    });
    expect(response.ok()).toBeTruthy();
    return await response.json();
  }

  async generateAIContent(contentId: number, data: {
    prompt?: string;
  } = {}) {
    const response = await this.request.post(`${this.baseURL}/api/v1/ai/generate/${contentId}`, {
      data,
    });
    if (!response.ok()) {
      const errorText = await response.text();
      console.error(`AI Generation API Error: ${response.status()} ${response.statusText()}`);
      console.error(`Response: ${errorText}`);
      console.error(`URL: ${this.baseURL}/api/v1/ai/generate/${contentId}`);
    }
    expect(response.ok()).toBeTruthy();
    return await response.json();
  }

  async translateContent(contentId: number, data: {
    targetLanguage: string;
  }) {
    const response = await this.request.post(`${this.baseURL}/api/v1/ai/translate/${contentId}`, {
      data,
    });
    if (!response.ok()) {
      const errorText = await response.text();
      console.error(`Translation API Error: ${response.status()} ${response.statusText()}`);
      console.error(`Response: ${errorText}`);
      console.error(`URL: ${this.baseURL}/api/v1/ai/translate/${contentId}`);
    }
    expect(response.ok()).toBeTruthy();
    return await response.json();
  }

  async analyzeContent(contentId: number, data: {
    targetId?: number;
  } = {}) {
    const response = await this.request.post(`${this.baseURL}/api/v1/ai/analyze/${contentId}`, {
      data,
    });
    if (!response.ok()) {
      const errorText = await response.text();
      console.error(`Analysis API Error: ${response.status()} ${response.statusText()}`);
      console.error(`Response: ${errorText}`);
      console.error(`URL: ${this.baseURL}/api/v1/ai/analyze/${contentId}`);
    }
    expect(response.ok()).toBeTruthy();
    return await response.json();
  }

  async getGenerations(contentId: number) {
    const response = await this.request.get(`${this.baseURL}/api/v1/ai/generations/${contentId}`);
    expect(response.ok()).toBeTruthy();
    return await response.json();
  }

  async deleteCampaign(campaignId: number) {
    const response = await this.request.delete(`${this.baseURL}/api/v1/campaigns/${campaignId}`);
    return response.ok();
  }

  async deleteContent(contentId: number) {
    const response = await this.request.delete(`${this.baseURL}/api/v1/content/${contentId}`);
    return response.ok();
  }

  async updateContentStatus(contentId: number, status: string) {
    const response = await this.request.put(`${this.baseURL}/api/v1/content/${contentId}`, {
      data: { status },
    });
    expect(response.ok()).toBeTruthy();
    return await response.json();
  }

  async cleanDatabase() {
    try {
      const response = await this.request.delete(`${this.baseURL}/api/v1/campaigns`);
      // Don't expect this to always succeed, as it might not exist in prod
      return response.ok();
    } catch (error) {
      console.warn('Failed to clean database:', error);
      return false;
    }
  }
}