import { Test, TestingModule } from '@nestjs/testing';
import { TaskLinkService } from './task-link.service';

describe('TaskLinkService', () => {
  let service: TaskLinkService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TaskLinkService],
    }).compile();

    service = module.get<TaskLinkService>(TaskLinkService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
