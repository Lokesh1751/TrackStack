import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DatabaseService } from 'src/database/database.service';
@Injectable()
export class SprintCron {
  constructor(private readonly db: DatabaseService) {}

  @Cron('0 0 * * *')
  async captureSprintSnapshots() {
    const activeSprints = await this.db.sprint.findMany({
      where: {
        status: 'ACTIVE',
      },

      include: {
        tasks: true,
      },
    });

    for (const sprint of activeSprints) {
      const remainingEstimate = sprint.tasks
        .filter((task) => task.status !== 'DONE')
        .reduce((acc, task) => acc + (task.estimateMinutes || 0), 0);

      await this.db.sprintSnapshot.create({
        data: {
          sprintId: sprint.id,
          remainingEstimate,
        },
      });
    }
  }
}
