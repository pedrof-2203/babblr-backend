import { Injectable } from '@nestjs/common';
import { CreateMessageInput } from './dto/create-message.input';
import { UpdateMessageInput } from './dto/update-message.input';
import { ChatsRepository } from '../chats.repository';
import { Message } from './entities/message.entity';
import { Types } from 'mongoose';
import { GetMessagesArgs } from './dto/get-messages.args';

@Injectable()
export class MessagesService {
  constructor(private readonly chatsRepository: ChatsRepository) {}

  async create(
    { chatId, content }: CreateMessageInput,
    userId: string,
  ): Promise<Message> {
    const message: Message = {
      _id: new Types.ObjectId(),
      userId,
      content,
      createdAt: new Date(),
    };

    await this.chatsRepository.findOneAndUpdate(
      {
        _id: chatId,
        ...this.filterChatsByUserId(userId),
      },
      {
        $push: {
          messages: message,
        },
      },
    );

    return message;
  }

  async findAll(
    { chatId }: GetMessagesArgs,
    userId: string,
  ): Promise<Message[]> {
    return (
      await this.chatsRepository.findOne({
        _id: chatId,
        ...this.filterChatsByUserId(userId),
      })
    ).messages;
  }

  findOne(id: number) {
    return `This action returns a #${id} message`;
  }

  update(id: number, updateMessageInput: UpdateMessageInput) {
    return `This action updates a #${id} message`;
  }

  remove(id: number) {
    return `This action removes a #${id} message`;
  }

  private filterChatsByUserId(userId: string) {
    return {
      $or: [
        { userId },
        {
          userIds: {
            $in: [userId],
          },
        },
      ],
    };
  }
}
