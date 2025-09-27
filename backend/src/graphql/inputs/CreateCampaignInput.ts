import { InputType, Field } from 'type-graphql';
import { IsNotEmpty, IsOptional, IsArray } from 'class-validator';

@InputType()
export class CreateCampaignInput {
  @Field()
  @IsNotEmpty()
  name!: string;

  @Field({ nullable: true })
  @IsOptional()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  status?: string;

  @Field({ nullable: true })
  @IsOptional()
  defaultLanguage?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  targetLanguages?: string[];
}