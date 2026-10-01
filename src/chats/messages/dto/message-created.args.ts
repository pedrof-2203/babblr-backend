import { ArgsType, Field } from "@nestjs/graphql";
import { Prop } from "@nestjs/mongoose";
import { IsNotEmpty } from "class-validator";

@ArgsType()
export class MessageCreatedArgs {
  @Field()
  @IsNotEmpty()
  chatId: string;
}