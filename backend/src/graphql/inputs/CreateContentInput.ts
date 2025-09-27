import { InputType, Field, ID } from 'type-graphql';
import { IsNotEmpty, IsOptional } from 'class-validator';

@InputType()
export class CreateContentInput {
  @Field(() => ID)
  @IsNotEmpty()
  campaignId!: number;

  @Field()
  @IsNotEmpty()
  type!: string;

  @Field({ nullable: true })
  @IsOptional()
  originalContent?: string;

  @Field({ nullable: true })
  @IsOptional()
  language?: string;
}