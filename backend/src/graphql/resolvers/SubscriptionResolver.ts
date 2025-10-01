import { Resolver, Subscription, Root, Arg, ID } from 'type-graphql';
import { pubsub, EVENTS } from '../pubsub';
import { CampaignType } from '../types/CampaignType';
import { ContentPieceType } from '../types/ContentPieceType';

@Resolver()
export class SubscriptionResolver {
  /**
   * Subscribe to campaign changes
   * Usage in GraphQL:
   * subscription {
   *   campaignUpdated {
   *     id
   *     name
   *     status
   *   }
   * }
   */
  @Subscription(() => CampaignType, {
    topics: [EVENTS.CAMPAIGN_CREATED, EVENTS.CAMPAIGN_UPDATED, EVENTS.CAMPAIGN_DELETED],
    description: 'Subscribe to all campaign changes (created, updated, deleted)',
  })
  campaignUpdated(@Root() campaign: any): any {
    return campaign;
  }

  /**
   * Subscribe to a specific campaign
   * Usage in GraphQL:
   * subscription {
   *   campaignById(id: 1) {
   *     id
   *     name
   *     contentPieces { id }
   *   }
   * }
   */
  @Subscription(() => CampaignType, {
    topics: [EVENTS.CAMPAIGN_UPDATED],
    filter: ({ payload, args }) => {
      return payload.id === args.id;
    },
    description: 'Subscribe to updates for a specific campaign',
  })
  campaignById(
    @Root() campaign: any,
    @Arg('id', () => ID) id: number
  ): any {
    return campaign;
  }

  /**
   * Subscribe to content piece changes
   * Usage in GraphQL:
   * subscription {
   *   contentUpdated {
   *     id
   *     originalContent
   *     status
   *   }
   * }
   */
  @Subscription(() => ContentPieceType, {
    topics: [EVENTS.CONTENT_CREATED, EVENTS.CONTENT_UPDATED],
    description: 'Subscribe to content piece changes',
  })
  contentUpdated(@Root() content: any): any {
    return content;
  }

  /**
   * Subscribe to content changes for a specific campaign
   * Usage in GraphQL:
   * subscription {
   *   contentByCampaign(campaignId: 1) {
   *     id
   *     originalContent
   *   }
   * }
   */
  @Subscription(() => ContentPieceType, {
    topics: [EVENTS.CONTENT_CREATED, EVENTS.CONTENT_UPDATED],
    filter: ({ payload, args }) => {
      return payload.campaignId === args.campaignId;
    },
    description: 'Subscribe to content updates for a specific campaign',
  })
  contentByCampaign(
    @Root() content: any,
    @Arg('campaignId', () => ID) campaignId: number
  ): any {
    return content;
  }

  /**
   * Subscribe to AI generation events
   * Usage in GraphQL:
   * subscription {
   *   aiGenerationCreated
   * }
   */
  @Subscription(() => String, {
    topics: EVENTS.AI_GENERATION_CREATED,
    description: 'Subscribe to AI generation events',
  })
  aiGenerationCreated(@Root() generation: any): string {
    return JSON.stringify(generation);
  }

  /**
   * Subscribe to review events
   * Usage in GraphQL:
   * subscription {
   *   reviewCreated
   * }
   */
  @Subscription(() => String, {
    topics: EVENTS.REVIEW_CREATED,
    description: 'Subscribe to review events',
  })
  reviewCreated(@Root() review: any): string {
    return JSON.stringify(review);
  }
}

// Helper functions to publish events from controllers
export async function publishCampaignCreated(campaign: any) {
  await pubsub.publish(EVENTS.CAMPAIGN_CREATED, campaign);
}

export async function publishCampaignUpdated(campaign: any) {
  await pubsub.publish(EVENTS.CAMPAIGN_UPDATED, campaign);
}

export async function publishCampaignDeleted(campaignId: number) {
  await pubsub.publish(EVENTS.CAMPAIGN_DELETED, { id: campaignId, deleted: true });
}

export async function publishContentCreated(content: any) {
  await pubsub.publish(EVENTS.CONTENT_CREATED, content);
}

export async function publishContentUpdated(content: any) {
  await pubsub.publish(EVENTS.CONTENT_UPDATED, content);
}

export async function publishAIGenerationCreated(generation: any) {
  await pubsub.publish(EVENTS.AI_GENERATION_CREATED, generation);
}

export async function publishReviewCreated(review: any) {
  await pubsub.publish(EVENTS.REVIEW_CREATED, review);
}