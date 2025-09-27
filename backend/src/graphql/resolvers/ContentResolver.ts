import { Resolver, Query, Mutation, Arg, ID, FieldResolver, Root } from 'type-graphql';
import { ContentPiece } from '../../models/ContentPiece';
import { AIGeneration } from '../../models/AIGeneration';
import { Translation } from '../../models/Translation';
import { Review } from '../../models/Review';
import { ContentPieceType } from '../types/ContentPieceType';
import { AIGenerationType } from '../types/AIGenerationType';
import { TranslationType } from '../types/TranslationType';
import { ReviewType } from '../types/ReviewType';
import { CreateContentInput } from '../inputs/CreateContentInput';

@Resolver(() => ContentPieceType)
export class ContentResolver {
  @Query(() => [ContentPieceType])
  async contentPieces(): Promise<ContentPiece[]> {
    return ContentPiece.findAll({
      include: [
        { model: AIGeneration, as: 'aiGenerations' },
        { model: Translation, as: 'translations' },
        { model: Review, as: 'reviews' }
      ]
    });
  }

  @Query(() => ContentPieceType, { nullable: true })
  async contentPiece(@Arg('id', () => ID) id: number): Promise<ContentPiece | null> {
    return ContentPiece.findByPk(id, {
      include: [
        { model: AIGeneration, as: 'aiGenerations' },
        { model: Translation, as: 'translations' },
        { model: Review, as: 'reviews' }
      ]
    });
  }

  @Query(() => [ContentPieceType])
  async contentPiecesByCampaign(@Arg('campaignId', () => ID) campaignId: number): Promise<ContentPiece[]> {
    return ContentPiece.findAll({
      where: { campaignId },
      include: [
        { model: AIGeneration, as: 'aiGenerations' },
        { model: Translation, as: 'translations' },
        { model: Review, as: 'reviews' }
      ]
    });
  }

  @Mutation(() => ContentPieceType)
  async createContentPiece(@Arg('data') data: CreateContentInput): Promise<ContentPiece> {
    return ContentPiece.create({
      campaignId: data.campaignId,
      type: data.type,
      originalContent: data.originalContent,
      language: data.language || 'en',
      status: 'draft'
    });
  }

  @Mutation(() => Boolean)
  async deleteContentPiece(@Arg('id', () => ID) id: number): Promise<boolean> {
    const contentPiece = await ContentPiece.findByPk(id);
    if (!contentPiece) return false;

    await contentPiece.destroy();
    return true;
  }

  @FieldResolver(() => [AIGenerationType])
  async aiGenerations(@Root() contentPiece: ContentPiece): Promise<AIGeneration[]> {
    return AIGeneration.findAll({
      where: { contentPieceId: contentPiece.id },
      order: [['createdAt', 'DESC']]
    });
  }

  @FieldResolver(() => [TranslationType])
  async translations(@Root() contentPiece: ContentPiece): Promise<Translation[]> {
    return Translation.findAll({
      where: { contentPieceId: contentPiece.id },
      order: [['createdAt', 'DESC']]
    });
  }

  @FieldResolver(() => [ReviewType])
  async reviews(@Root() contentPiece: ContentPiece): Promise<Review[]> {
    return Review.findAll({
      where: { contentPieceId: contentPiece.id },
      order: [['createdAt', 'DESC']]
    });
  }
}