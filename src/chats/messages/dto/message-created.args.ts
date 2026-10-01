import { ArgsType, Field } from '@nestjs/graphql';
import { Prop } from '@nestjs/mongoose';
import { IsArray, IsNotEmpty } from 'class-validator';

@ArgsType()
export class MessageCreatedArgs {
  @Field(() => [String])
  @IsArray()
  @IsNotEmpty({ each: true })
  chatIds: string[];
}
