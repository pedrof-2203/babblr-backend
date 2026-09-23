import { Logger, NotFoundException } from '@nestjs/common';
import { Model, QueryFilter, Types, UpdateQuery } from 'mongoose';
import { AbstractEntity } from './abstract.entity';

export abstract class AbstractRepository<T extends AbstractEntity> {
  protected abstract readonly logger: Logger;

  constructor(protected readonly model: Model<T>) {}

  async findMany(queryFilter: QueryFilter<T>): Promise<T[]> {
    return this.model.find(queryFilter).lean<T[]>();
  }

  async create(document: Omit<T, '_id'>): Promise<T> {
    const createdDocument = new this.model({
      ...document,
      _id: new Types.ObjectId(),
    });

    return (await createdDocument.save()).toJSON() as unknown as T;
  }

  async findOne(queryFilter: QueryFilter<T>): Promise<T> {
    const document = await this.model.findOne(queryFilter).lean<T>();

    if (!document) {
      this.logger.warn('Document not found with queryFilter: ', queryFilter);
      throw new NotFoundException('Document not found. ');
    }

    return document;
  }

  async findOneAndUpdate(
    queryFilter: QueryFilter<T>,
    update: UpdateQuery<T>,
  ): Promise<T> {
    const document = await this.model
      .findOneAndUpdate(queryFilter, update, {
        new: true,
      })
      .lean<T>();

    if (!document) {
      this.logger.warn('Document not found with queryFilter: ', queryFilter);
      throw new NotFoundException('Document not found. ');
    }

    return document;
  }

  async findOneAndDelete(queryFilter: QueryFilter<T>): Promise<T> {
    const document = await this.model.findOneAndDelete(queryFilter).lean<T>();

    if (!document) {
      this.logger.warn('Document not found with queryFilter: ', queryFilter);
      throw new NotFoundException('Document not found.');
    }

    return document;
  }
}
