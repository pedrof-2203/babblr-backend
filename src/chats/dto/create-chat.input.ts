import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class CreateChatInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  name: string;
}
