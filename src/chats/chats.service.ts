import { Injectable, NotFoundException } from '@nestjs/common';
import { PipelineStage, Types } from 'mongoose';
import { ChatsRepository } from './chats.repository';
import { CreateChatInput } from './dto/create-chat.input';
import { PaginationArgs } from '../common/dto/pagination-args.dto';

@Injectable()
export class ChatsService {
  constructor(private readonly chatsRepository: ChatsRepository) {}

  async findMany(
    prePipelineStages: PipelineStage[] = [],
    paginationArgs?: PaginationArgs,
  ) {
    const chats = await this.chatsRepository.model.aggregate([
      ...prePipelineStages,
      {
        $set: {
          latestMessage: {
            $cond: [
              '$messages',
              { $arrayElemAt: ['$messages', -1] },
              { createdAt: new Date() },
            ],
          },
        },
      },
      { $sort: { 'latestMessage.createdAt': -1 } },
      { $unset: 'messages' },

      { $skip: paginationArgs?.skip ?? 0 },
      { $limit: paginationArgs?.limit ?? 25 },

      {
        $lookup: {
          from: 'users',
          localField: 'latestMessage.userId',
          foreignField: '_id',
          as: 'latestMessage.user',
        },
      },
    ]);
    chats.forEach((chat) => {
      if (!chat.latestMessage?._id) {
        delete chat.latestMessage;
        return;
      }
      chat.latestMessage.user = chat.latestMessage.user[0];
      delete chat.latestMessage.userId;
      chat.latestMessage.chatId = chat._id;
    });
    return chats;
  }

  async create(input: CreateChatInput, userId: string) {
    return this.chatsRepository.create({
      ...input,
      userId,
      messages: [],
    });
  }

  async findOneById(_id: string) {
    const chats = await this.findMany([
      { $match: { _id: new Types.ObjectId(_id) } },
    ]);
    if (!chats[0]) {
      throw new NotFoundException(`Not chat found by id ${_id}`);
    }
    return chats[0];
  }

  async countChats() {
    return this.chatsRepository.model.countDocuments({});
  }
}
