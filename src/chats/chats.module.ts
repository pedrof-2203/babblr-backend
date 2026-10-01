import { forwardRef, Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsResolver } from './chats.resolver';
import { ChatsRepository } from './chats.repository';
import { DatabaseModule } from '../common/database/database.module';
import { PassportModule } from '@nestjs/passport';
import { MessagesModule } from './messages/messages.module';
import { ChatDocument, ChatSchema } from './entities/chat.document';

@Module({
  imports: [
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
    DatabaseModule.forFeature([
      {
        name: ChatDocument.name,
        schema: ChatSchema,
      },
    ]),
    forwardRef(() => MessagesModule),
  ],
  providers: [ChatsResolver, ChatsService, ChatsRepository],
  exports: [ChatsRepository],
})
export class ChatsModule {}
