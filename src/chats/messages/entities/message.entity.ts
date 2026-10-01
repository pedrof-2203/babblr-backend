import { Field, ObjectType } from '@nestjs/graphql';
import { AbstractEntity } from '../../../common/database/abstract.entity';
import { User } from '../../../users/entities/user.entity';

@ObjectType()
export class Message extends AbstractEntity {
  @Field()
  chatId: string;

  @Field(() => User)
  user: User;

  @Field()
  content: string;

  @Field()
  createdAt: Date;
}
