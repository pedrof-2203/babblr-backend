import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { ChatsService } from './chats.service';
import { Chat } from './entities/chat.entity';
import { CreateChatInput } from './dto/create-chat.input';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { TokenPayload } from '../auth/token-payload.interface';
import { PaginationArgs } from '../common/dto/pagination-args.dto';

@Resolver(() => Chat)
export class ChatsResolver {
  constructor(private readonly chatsService: ChatsService) {}

  @Query(() => [Chat], { name: 'chats' })
  @UseGuards(GqlAuthGuard)
  async findAll(@Args() paginationArgs: PaginationArgs): Promise<Chat[]> {
    return await this.chatsService.findMany([], paginationArgs);
  }

  @Mutation(() => Chat)
  @UseGuards(GqlAuthGuard)
  async createChat(
    @Args('createChatInput') createChatInput: CreateChatInput,
    @CurrentUser() user: TokenPayload,
  ): Promise<Chat> {
    return await this.chatsService.create(createChatInput, user._id);
  }

  @Query(() => Chat, { name: 'chat' })
  @UseGuards(GqlAuthGuard)
  async findOne(@Args('_id') _id: string): Promise<Chat> {
    return await this.chatsService.findOneById(_id);
  }
}
