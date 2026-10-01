import { Inject, Injectable } from '@nestjs/common';
import { CreateMessageInput } from './dto/create-message.input';
import { UpdateMessageInput } from './dto/update-message.input';
import { ChatsRepository } from '../chats.repository';
import { Message } from './entities/message.entity';
import { Types } from 'mongoose';
import { GetMessagesArgs } from './dto/get-messages.args';
import { PUB_SUB } from '../../common/constants/injection-tokens';
import { PubSub } from 'graphql-subscriptions';
import { MESSAGE_CREATED } from './constants/triggers';
import { MessageCreatedArgs } from './dto/message-created.args';
import { ChatsService } from '../chats.service';

@Injectable()
export class MessagesService {
  constructor(
    private readonly chatsRepository: ChatsRepository,
    private readonly chatsService: ChatsService,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  async create(
    { chatId, content }: CreateMessageInput,
    userId: string,
  ): Promise<Message> {
    const message: Message = {
      _id: new Types.ObjectId(),
      chatId,
      userId,
      content,
      createdAt: new Date(),
    };

    await this.chatsRepository.findOneAndUpdate(
      {
        _id: chatId,
        ...this.chatsService.filterChatsByUserId(userId),
      },
      {
        $push: {
          messages: message,
        },
      },
    );

    await this.pubSub.publish(MESSAGE_CREATED, {
      messageCreated: message,
    });

    return message;
  }

  async findAll(
    { chatId }: GetMessagesArgs,
    userId: string,
  ): Promise<Message[]> {
    return (
      await this.chatsRepository.findOne({
        _id: chatId,
        ...this.chatsService.filterChatsByUserId(userId),
      })
    ).messages;
  }

  async messageCreated({ chatId }: MessageCreatedArgs, userId: string) {
    await this.chatsRepository.findOne({
      _id: chatId,
      ...this.chatsService.filterChatsByUserId(userId),
    });
    return this.pubSub.asyncIterableIterator(MESSAGE_CREATED);
  }
}
