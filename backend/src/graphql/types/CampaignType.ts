import { ObjectType, Field, ID } from 'type-graphql';
import { ContentPieceType } from './ContentPieceType';

@ObjectType()
export class CampaignType {
  @Field(() => ID)
  id!: number;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  status!: string;

  @Field()
  defaultLanguage!: string;

  @Field(() => [String])
  targetLanguages!: string[];

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  @Field(() => [ContentPieceType], { nullable: true })
  contentPieces?: ContentPieceType[];
}