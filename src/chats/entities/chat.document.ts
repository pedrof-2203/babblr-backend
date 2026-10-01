import { AbstractEntity } from '../../common/database/abstract.entity';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Message } from '../messages/entities/message.entity';

@Schema()
export class ChatDocument extends AbstractEntity {
  @Prop()
  userId: string;

  @Prop()
  name: string;

  @Prop([Message])
  messages: Message[];
}

export const ChatSchema = SchemaFactory.createForClass(ChatDocument);
