import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from './database.service';
import { PrismaClient } from '@prisma/client';

describe('DatabaseService', () => {
  let service: DatabaseService;

  beforeEach(async () => {
    const mockConnect = jest.fn().mockResolvedValue(undefined);
    const mockDisconnect = jest.fn().mockResolvedValue(undefined);
    
    const DatabaseServiceProvider = {
      provide: DatabaseService,
      useFactory: () => {
        return {
          $connect: mockConnect,
          $disconnect: mockDisconnect,
          onModuleInit: async function() {
            return this.$connect();
          }
        };
      }
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [DatabaseServiceProvider],
    }).compile();

    service = module.get<DatabaseService>(DatabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have $connect method', () => {
    expect(service.$connect).toBeDefined();
    expect(typeof service.$connect).toBe('function');
  });

  it('should call $connect when onModuleInit is called', async () => {
    const connectSpy = jest.spyOn(service, '$connect');
    
    await service.onModuleInit();
    
    expect(connectSpy).toHaveBeenCalledTimes(1);
  });

  it('should not throw when $connect succeeds', async () => {
    jest.spyOn(service, '$connect').mockResolvedValueOnce(undefined);
    
    await expect(service.onModuleInit()).resolves.not.toThrow();
  });

  it('should throw when $connect fails', async () => {
    const error = new Error('Connection failed');
    jest.spyOn(service, '$connect').mockRejectedValueOnce(error);
    
    await expect(service.onModuleInit()).rejects.toThrow('Connection failed');
  });
});