import { Campaign } from '../models/Campaign';
import { ContentPiece } from '../models/ContentPiece';
import { AIGeneration } from '../models/AIGeneration';
import { Translation } from '../models/Translation';
import { Review } from '../models/Review';
import { faker } from '@faker-js/faker';

const CAMPAIGN_COUNT = 3000;
const MIN_CONTENT_PER_CAMPAIGN = 5;
const MAX_CONTENT_PER_CAMPAIGN = 50;
const AI_GENERATION_PROBABILITY = 0.7;
const TRANSLATION_PROBABILITY = 0.6;
const REVIEW_PROBABILITY = 0.4;

const CONTENT_TYPES = ['headline', 'description', 'cta', 'social_post', 'email_subject', 'product_description'];
const CAMPAIGN_STATUSES = ['active', 'paused', 'completed'];
const CONTENT_STATUSES = ['draft', 'ai_generated', 'under_review', 'approved', 'rejected'];
const REVIEW_STATUSES = ['approved', 'needs_revision', 'rejected'];
const AI_PROVIDERS = ['openai', 'anthropic'];
const LANGUAGES = ['en', 'es', 'fr', 'de', 'pt-br', 'it', 'ja', 'zh'];

interface SeederStats {
  campaigns: number;
  contentPieces: number;
  aiGenerations: number;
  translations: number;
  reviews: number;
}

export async function seedCampaigns(options: { count?: number; verbose?: boolean } = {}): Promise<SeederStats> {
  const count = options.count || CAMPAIGN_COUNT;
  const verbose = options.verbose ?? true;
  
  const stats: SeederStats = {
    campaigns: 0,
    contentPieces: 0,
    aiGenerations: 0,
    translations: 0,
    reviews: 0,
  };

  if (verbose) {
    console.log(`🌱 Starting to seed ${count} campaigns...`);
  }

  const batchSize = 100;
  const totalBatches = Math.ceil(count / batchSize);

  for (let batch = 0; batch < totalBatches; batch++) {
    const batchStart = batch * batchSize;
    const batchEnd = Math.min(batchStart + batchSize, count);
    const campaignsToCreate = batchEnd - batchStart;

    if (verbose && batch % 10 === 0) {
      console.log(`  📦 Processing batch ${batch + 1}/${totalBatches} (${stats.campaigns}/${count} campaigns created)`);
    }

    for (let i = 0; i < campaignsToCreate; i++) {
      const campaign = await createCampaignWithContent();
      stats.campaigns++;
      stats.contentPieces += campaign.contentCount;
      stats.aiGenerations += campaign.aiCount;
      stats.translations += campaign.translationCount;
      stats.reviews += campaign.reviewCount;
    }
  }

  if (verbose) {
    console.log('\n✅ Seeding completed successfully!');
    console.log('\n📊 Statistics:');
    console.log(`   Campaigns:      ${stats.campaigns.toLocaleString()}`);
    console.log(`   Content Pieces: ${stats.contentPieces.toLocaleString()}`);
    console.log(`   AI Generations: ${stats.aiGenerations.toLocaleString()}`);
    console.log(`   Translations:   ${stats.translations.toLocaleString()}`);
    console.log(`   Reviews:        ${stats.reviews.toLocaleString()}`);
  }

  return stats;
}

async function createCampaignWithContent(): Promise<{
  contentCount: number;
  aiCount: number;
  translationCount: number;
  reviewCount: number;
}> {
  const defaultLanguage = faker.helpers.arrayElement(LANGUAGES);
  const targetLanguages = faker.helpers.arrayElements(
    LANGUAGES.filter(lang => lang !== defaultLanguage),
    faker.number.int({ min: 1, max: 4 })
  );

  const campaign = await Campaign.create({
    name: generateCampaignName(),
    description: faker.lorem.paragraph(),
    status: faker.helpers.weightedArrayElement([
      { value: 'active', weight: 70 },
      { value: 'paused', weight: 20 },
      { value: 'completed', weight: 10 },
    ]),
    defaultLanguage,
    targetLanguages,
  });

  const contentCount = faker.number.int({
    min: MIN_CONTENT_PER_CAMPAIGN,
    max: MAX_CONTENT_PER_CAMPAIGN,
  });

  let aiCount = 0;
  let translationCount = 0;
  let reviewCount = 0;

  for (let i = 0; i < contentCount; i++) {
    const contentType = faker.helpers.arrayElement(CONTENT_TYPES);
    const hasAI = Math.random() < AI_GENERATION_PROBABILITY;
    const hasTranslation = Math.random() < TRANSLATION_PROBABILITY;
    const hasReview = Math.random() < REVIEW_PROBABILITY;

    let contentStatus = 'draft';
    if (hasReview) {
      contentStatus = faker.helpers.arrayElement(['under_review', 'approved', 'rejected']);
    } else if (hasAI) {
      contentStatus = 'ai_generated';
    }

    const content = await ContentPiece.create({
      campaignId: campaign.id,
      type: contentType,
      originalContent: generateContentByType(contentType),
      language: defaultLanguage,
      status: contentStatus,
    });

    if (hasAI) {
      const aiGenerationsCount = faker.number.int({ min: 1, max: 3 });
      for (let j = 0; j < aiGenerationsCount; j++) {
        await AIGeneration.create({
          contentPieceId: content.id,
          aiModel: faker.helpers.arrayElement(['gpt-4', 'gpt-3.5-turbo', 'claude-3-opus', 'claude-3-sonnet']),
          modelVersion: faker.helpers.arrayElement(['v1', 'v2', 'latest']),
          promptUsed: faker.lorem.sentence(),
          generatedText: generateContentByType(contentType),
          metadata: {
            temperature: faker.number.float({ min: 0.5, max: 1, fractionDigits: 2 }),
            tokensUsed: faker.number.int({ min: 100, max: 2000 }),
            executionTime: faker.number.int({ min: 500, max: 5000 }),
          },
        });
        aiCount++;
      }
    }

    if (hasTranslation && targetLanguages.length > 0) {
      const languagesToTranslate = faker.helpers.arrayElements(
        targetLanguages,
        faker.number.int({ min: 1, max: targetLanguages.length })
      );

      for (const targetLang of languagesToTranslate) {
        await Translation.create({
          contentPieceId: content.id,
          targetLanguage: targetLang,
          translatedText: generateContentByType(contentType),
          qualityScore: faker.number.float({ min: 0.7, max: 1, fractionDigits: 2 }),
          metadata: {
            translationService: 'openai',
            model: 'gpt-4',
            tokensUsed: faker.number.int({ min: 50, max: 500 }),
          },
        });
        translationCount++;
      }
    }

    if (hasReview) {
      await Review.create({
        contentPieceId: content.id,
        reviewerName: faker.person.fullName(),
        status: faker.helpers.arrayElement(REVIEW_STATUSES),
        feedback: faker.lorem.paragraph(),
        language: defaultLanguage,
        metadata: {
          reviewedAt: faker.date.recent().toISOString(),
          department: faker.helpers.arrayElement(['Marketing', 'Content', 'Product', 'Sales']),
        },
      });
      reviewCount++;
    }
  }

  return { contentCount, aiCount, translationCount, reviewCount };
}

function generateCampaignName(): string {
  const templates = [
    () => `${faker.company.buzzAdjective()} ${faker.company.buzzNoun()} Campaign`,
    () => `${faker.date.month()} ${faker.number.int({ min: 2024, max: 2025 })} ${faker.commerce.department()} Launch`,
    () => `${faker.commerce.productAdjective()} ${faker.commerce.product()} Promotion`,
    () => `${faker.company.catchPhraseAdjective()} ${faker.word.noun()} Initiative`,
    () => `${faker.hacker.adjective()} ${faker.hacker.noun()} Marketing`,
    () => `${faker.commerce.department()} Q${faker.number.int({ min: 1, max: 4 })} ${faker.number.int({ min: 2024, max: 2025 })}`,
  ];

  return faker.helpers.arrayElement(templates)();
}

function generateContentByType(type: string): string {
  switch (type) {
    case 'headline':
      return faker.lorem.sentence({ min: 3, max: 8 }).slice(0, -1);
    
    case 'description':
      return faker.lorem.paragraphs(2);
    
    case 'cta':
      const ctas = [
        'Get Started Now',
        'Learn More',
        'Shop Now',
        'Sign Up Today',
        'Claim Your Offer',
        'Try It Free',
        'Join the Community',
        'Download Free Guide',
        'Request a Demo',
        'Start Your Trial',
      ];
      return faker.helpers.arrayElement(ctas);
    
    case 'social_post':
      const emoji = faker.helpers.arrayElements(['🚀', '✨', '💡', '🎯', '🔥', '💪', '🌟', '👏'], 2).join('');
      return `${emoji} ${faker.lorem.paragraph()} #${faker.word.noun()} #${faker.word.adjective()}`;
    
    case 'email_subject':
      const subjects = [
        () => `${faker.commerce.productAdjective()} ${faker.commerce.product()} - ${faker.number.int({ min: 10, max: 90 })}% Off!`,
        () => `Don't Miss: ${faker.lorem.sentence({ min: 3, max: 6 })}`,
        () => `Exclusive: ${faker.company.catchPhrase()}`,
        () => `New: ${faker.commerce.productName()} Just Launched`,
        () => `${faker.person.firstName()}, ${faker.lorem.sentence({ min: 4, max: 7 })}`,
      ];
      return faker.helpers.arrayElement(subjects)();
    
    case 'product_description':
      return `${faker.commerce.productDescription()}\n\nKey Features:\n${Array.from({ length: 3 }, () => `• ${faker.commerce.productAdjective()} ${faker.word.noun()}`).join('\n')}`;
    
    default:
      return faker.lorem.paragraph();
  }
}

export async function clearDatabase(): Promise<void> {
  console.log('🗑️  Clearing database...');
  
  await Review.destroy({ where: {} });
  await Translation.destroy({ where: {} });
  await AIGeneration.destroy({ where: {} });
  await ContentPiece.destroy({ where: {} });
  await Campaign.destroy({ where: {} });
  
  console.log('✅ Database cleared successfully!');
}