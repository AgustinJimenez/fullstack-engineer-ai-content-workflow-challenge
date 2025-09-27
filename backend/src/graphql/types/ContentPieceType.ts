import { ObjectType, Field, ID } from 'type-graphql';
import { AIGenerationType } from './AIGenerationType';
import { TranslationType } from './TranslationType';
import { ReviewType } from './ReviewType';

@ObjectType()
export class ContentPieceType {
  @Field(() => ID)
  id!: number;

  @Field(() => ID)
  campaignId!: number;

  @Field()
  type!: string;

  @Field({ nullable: true })
  originalContent?: string;

  @Field()
  language!: string;

  @Field()
  status!: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  @Field(() => [AIGenerationType], { nullable: true })
  aiGenerations?: AIGenerationType[];

  @Field(() => [TranslationType], { nullable: true })
  translations?: TranslationType[];

  @Field(() => [ReviewType], { nullable: true })
  reviews?: ReviewType[];
}