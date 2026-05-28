import { Test, TestingModule } from '@nestjs/testing';
import { TaskLinksController } from './task-link.controller';
import { TaskLinksService } from './task-link.service';

describe('TaskLinksController', () => {
  let controller: TaskLinksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskLinksController],
      providers: [
        {
          provide: TaskLinksService,
          useValue: {}
        },
      ],
    }).compile();

    controller = module.get<TaskLinksController>(TaskLinksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
