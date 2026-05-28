import { Test, TestingModule } from '@nestjs/testing';
import { TaskLinksService } from './task-link.service';

describe('TaskLinkService', () => {
  let service: TaskLinksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TaskLinksService],
    }).compile();

    service = module.get<TaskLinksService>(TaskLinksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
