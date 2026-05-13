import { Test, TestingModule } from '@nestjs/testing';
import { TaskLinkController } from './task-link.controller';
import { TaskLinkService } from './task-link.service';

describe('TaskLinkController', () => {
  let controller: TaskLinkController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskLinkController],
      providers: [TaskLinkService],
    }).compile();

    controller = module.get<TaskLinkController>(TaskLinkController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
