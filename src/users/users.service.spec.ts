import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  const repository = {
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: repository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('hashes the password before creating a user', async () => {
    const input = { email: 'user@example.com', password: 'Test-password-123!' };
    await service.create(input);
    const saved = repository.create.mock.calls[0][0];
    expect(saved.email).toBe(input.email);
    expect(saved.password).not.toBe(input.password);
    expect(await bcrypt.compare(input.password, saved.password)).toBe(true);
  });

  it('hashes a replacement password before updating a user', async () => {
    const password = 'Replacement-password-123!';
    await service.update('user-id', { _id: 'user-id', password });
    const [filter, update] = repository.findOneAndUpdate.mock.calls[0];
    expect(filter).toEqual({ _id: 'user-id' });
    expect(update.$set.password).not.toBe(password);
    expect(await bcrypt.compare(password, update.$set.password)).toBe(true);
  });
});
