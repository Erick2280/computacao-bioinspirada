import { PercentPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  remixAlignBottom,
  remixDnaLine,
  remixExpandRightLine,
  remixHand,
  remixHashtag,
  remixParentLine,
  remixPlayCircleFill,
} from '@ng-icons/remixicon';

import {
  EightQueensSolver,
  SolverParameters,
} from '@app/projects/eight-queens/core/solver';
import { ExecutionService } from '@app/projects/eight-queens/services/execution.service';

@Component({
  selector: 'app-new-execution-card',
  imports: [NgIcon, FormsModule, PercentPipe],
  templateUrl: './new-execution-card.component.html',
  viewProviders: [
    provideIcons({
      remixPlayCircleFill,
      remixHashtag,
      remixParentLine,
      remixDnaLine,
      remixHand,
      remixAlignBottom,
      remixExpandRightLine,
    }),
  ],
})
export class NewExecutionCardComponent {
  populationSize = signal(100);
  recombinationProbability = signal(0.6);
  mutationProbability = signal(0.4);
  maxIterations = signal(10000);
  parentCandidatesAmount = signal(5);
  runContinuously = signal(true);

  executionService = inject(ExecutionService);

  startNewExecution() {
    const parameters: SolverParameters = {
      populationSize: this.populationSize(),
      recombinationProbability: this.recombinationProbability(),
      mutationProbability: this.mutationProbability(),
      maxIterations: this.maxIterations(),
      parentCandidatesAmount: this.parentCandidatesAmount(),
    };

    const solver = new EightQueensSolver(parameters);

    this.executionService.start(solver);

    if (this.runContinuously()) {
      this.executionService.runContinuously();
    }
  }

  checkParentCandidatesAmount() {
    if (this.parentCandidatesAmount() > this.populationSize()) {
      this.parentCandidatesAmount.set(this.populationSize());
    }
  }
}
