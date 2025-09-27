import { ObjectType, Field, ID } from 'type-graphql';

@ObjectType()
export class ReviewType {
  @Field(() => ID)
  id!: number;

  @Field(() => ID)
  contentPieceId!: number;

  @Field()
  language!: string;

  @Field()
  status!: string;

  @Field({ nullable: true })
  feedback?: string;

  @Field({ nullable: true })
  reviewerName?: string;

  @Field()
  createdAt!: Date;
}