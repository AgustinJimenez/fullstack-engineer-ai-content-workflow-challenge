import { faker } from '@faker-js/faker';

export const testCampaigns = {
  valid: {
    name: faker.company.catchPhrase(),
    description: faker.lorem.paragraph(),
  },
  marketing: {
    name: `${faker.commerce.productAdjective()} ${faker.company.buzzNoun()} Campaign`,
    description: faker.lorem.paragraph(),
  },
  product: {
    name: `${faker.commerce.productName()} Launch Campaign`,
    description: faker.lorem.paragraph(),
  },
};

export const testContent = {
  headline: {
    type: 'headline',
    originalContent: faker.company.catchPhrase(),
    language: 'en',
  },
  description: {
    type: 'description',
    originalContent: faker.lorem.paragraph(),
    language: 'en',
  },
  cta: {
    type: 'cta',
    originalContent: faker.company.buzzPhrase(),
    language: 'en',
  },
};

export const aiModels = {
  openai: 'openai',
};

export const languages = {
  english: 'en',
  spanish: 'es',
  french: 'fr',
  german: 'de',
};

export const contentTypes = [
  'headline',
  'description', 
  'body',
  'cta',
  'tagline',
  'social_post',
];

export const reviewStatuses = {
  approved: 'approved',
  rejected: 'rejected',
  needsRevision: 'needs_revision',
};

export const analysisTestContent = {
  enthusiastic: {
    type: 'headline',
    originalContent: `Amazing revolutionary breakthrough! This incredible product will transform your life completely! Fantastic opportunity!`,
    language: 'en',
  },
  professional: {
    type: 'description', 
    originalContent: `Our professional enterprise business solution provides comprehensive capabilities for modern organizations and professional teams.`,
    language: 'en',
  },
  neutral: {
    type: 'body',
    originalContent: `This product offers various features that may be useful for different applications and scenarios.`,
    language: 'en',
  },
  negative: {
    type: 'cta',
    originalContent: `Unfortunately, this disappointing product has terrible performance and poor quality. Very bad experience.`,
    language: 'en',
  },
};

export const expectedAnalysisResults = {
  enthusiastic: {
    tone: 'enthusiastic',
    sentiment: 'positive',
    keywords: ['amazing', 'revolutionary', 'incredible'],
  },
  professional: {
    tone: 'professional', 
    sentiment: 'neutral',
    keywords: ['enterprise', 'business', 'intelligence'],
  },
  neutral: {
    tone: 'neutral',
    sentiment: 'neutral',
    keywords: ['product', 'features', 'applications'],
  },
  negative: {
    tone: 'neutral',
    sentiment: 'negative', 
    keywords: ['disappointing', 'terrible', 'poor'],
  },
};