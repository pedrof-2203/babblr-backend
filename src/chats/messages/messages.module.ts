import { forwardRef, Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesResolver } from './messages.resolver';
import { ChatsModule } from '../chats.module';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../../users/users.module';

@Module({
  imports: [
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
    forwardRef(() => ChatsModule),
    UsersModule,
  ],
  providers: [MessagesResolver, MessagesService],
})
export class MessagesModule {}
