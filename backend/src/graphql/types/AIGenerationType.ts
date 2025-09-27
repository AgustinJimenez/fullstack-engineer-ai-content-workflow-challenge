import { ObjectType, Field, ID } from 'type-graphql';

@ObjectType()
export class AIGenerationType {
  @Field(() => ID)
  id!: number;

  @Field(() => ID)
  contentPieceId!: number;

  @Field()
  generatedText!: string;

  @Field({ nullable: true })
  promptUsed?: string;

  @Field()
  modelVersion!: string;

  @Field({ nullable: true })
  metadata?: string;

  @Field()
  createdAt!: Date;
}