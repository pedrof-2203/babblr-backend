import { Injectable, Logger } from '@nestjs/common';
import { AbstractRepository } from '../common/database/abstract.repository';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatDocument } from './entities/chat.document';

@Injectable()
export class ChatsRepository extends AbstractRepository<ChatDocument> {
  protected readonly logger = new Logger(ChatsRepository.name);

  constructor(
    @InjectModel(ChatDocument.name)
    chatModel: Model<ChatDocument>,
  ) {
    super(chatModel);
  }
}
