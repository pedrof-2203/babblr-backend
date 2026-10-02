import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { MessagesService } from './messages.service';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('count/:chatId')
  @UseGuards(JwtAuthGuard)
  async countMessages(@Param('chatId') chatId: string) {
    return this.messagesService.countMessages(chatId);
  }
}