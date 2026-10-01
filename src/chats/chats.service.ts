import { Injectable } from '@nestjs/common';
import { CreateChatInput } from './dto/create-chat.input';
import { UpdateChatInput } from './dto/update-chat.input';
import { ChatsRepository } from './chats.repository';

@Injectable()
export class ChatsService {
  constructor(private readonly chatsRepository: ChatsRepository) {}

  async create(createChatInput: CreateChatInput, userId: string) {
    return this.chatsRepository.create({
      ...createChatInput,
      userId,
      userIds: createChatInput.userIds || [],
      messages: [],
    });
  }

  async findAll(userId: string) {
    return this.chatsRepository.findMany({
      ...this.filterChatsByUserId(userId),
    });
  }

  async findOne(_id: string) {
    return this.chatsRepository.findOne({ _id });
  }

  filterChatsByUserId(userId: string) {
    return {
      $or: [
        { userId },
        {
          userIds: {
            $in: [userId],
          },
        },
        {
          isPrivate: false,
        },
      ],
    };
  }
}
