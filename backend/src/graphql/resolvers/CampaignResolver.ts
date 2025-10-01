import { Resolver, Query, Mutation, Arg, ID, FieldResolver, Root } from 'type-graphql';
import { Campaign } from '../../models/Campaign';
import { ContentPiece } from '../../models/ContentPiece';
import { CampaignType } from '../types/CampaignType';
import { ContentPieceType } from '../types/ContentPieceType';
import { CreateCampaignInput } from '../inputs/CreateCampaignInput';
import { publishCampaignCreated, publishCampaignUpdated, publishCampaignDeleted } from './SubscriptionResolver';

@Resolver(() => CampaignType)
export class CampaignResolver {
  @Query(() => [CampaignType])
  async campaigns(): Promise<Campaign[]> {
    return Campaign.findAll({
      include: [
        {
          model: ContentPiece,
          as: 'contentPieces'
        }
      ]
    });
  }

  @Query(() => CampaignType, { nullable: true })
  async campaign(@Arg('id', () => ID) id: number): Promise<Campaign | null> {
    return Campaign.findByPk(id, {
      include: [
        {
          model: ContentPiece,
          as: 'contentPieces'
        }
      ]
    });
  }

  @Mutation(() => CampaignType)
  async createCampaign(@Arg('data') data: CreateCampaignInput): Promise<Campaign> {
    const campaign = await Campaign.create({
      name: data.name,
      description: data.description,
      status: data.status || 'active',
      defaultLanguage: data.defaultLanguage || 'en',
      targetLanguages: data.targetLanguages || []
    });

    // Publish subscription event
    await publishCampaignCreated(campaign.toJSON());

    return campaign;
  }

  @Mutation(() => CampaignType, { nullable: true })
  async updateCampaign(
    @Arg('id', () => ID) id: number,
    @Arg('data') data: CreateCampaignInput
  ): Promise<Campaign | null> {
    const campaign = await Campaign.findByPk(id);
    if (!campaign) return null;

    await campaign.update({
      name: data.name,
      description: data.description,
      status: data.status,
      defaultLanguage: data.defaultLanguage,
      targetLanguages: data.targetLanguages
    });

    // Publish subscription event
    await publishCampaignUpdated(campaign.toJSON());

    return campaign;
  }

  @Mutation(() => Boolean)
  async deleteCampaign(@Arg('id', () => ID) id: number): Promise<boolean> {
    const campaign = await Campaign.findByPk(id);
    if (!campaign) return false;

    await campaign.destroy();

    // Publish subscription event
    await publishCampaignDeleted(id);

    return true;
  }

  @FieldResolver(() => [ContentPieceType])
  async contentPieces(@Root() campaign: Campaign): Promise<ContentPiece[]> {
    return ContentPiece.findAll({
      where: { campaignId: campaign.id }
    });
  }
}