import { ObjectType, Field, ID } from 'type-graphql';

@ObjectType()
export class TranslationType {
  @Field(() => ID)
  id!: number;

  @Field(() => ID)
  contentPieceId!: number;

  @Field()
  targetLanguage!: string;

  @Field()
  translatedText!: string;

  @Field()
  status!: string;

  @Field({ nullable: true })
  qualityScore?: number;

  @Field()
  createdAt!: Date;
}