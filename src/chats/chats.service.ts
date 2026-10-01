import { Injectable } from '@nestjs/common';
import { ChatsRepository } from './chats.repository';
import { CreateChatInput } from './dto/create-chat.input';

@Injectable()
export class ChatsService {
  constructor(private readonly chatsRepository: ChatsRepository) {}

  async findAll() {
    return this.chatsRepository.findMany({});
  }

  async create(input: CreateChatInput, userId: string) {
    return this.chatsRepository.create({
      ...input,
      userId,
      messages: [],
    });
  }

  async findOneById(_id: string) {
    return this.chatsRepository.findOne({ _id });
  }
}
