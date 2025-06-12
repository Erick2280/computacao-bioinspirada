import { PercentPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  remixAlignBottom,
  remixDnaLine,
  remixExpandRightLine,
  remixFlagLine,
  remixHand,
  remixHashtag,
  remixParentLine,
  remixPlayCircleFill,
  remixSeedlingLine,
} from '@ng-icons/remixicon';

import {
  EightQueensSolver,
  InitialPopulation,
  SolverCompletionCondition,
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
      remixFlagLine,
      remixSeedlingLine,
    }),
  ],
})
export class NewExecutionCardComponent {
  populationSize = signal(100);
  recombinationProbability = signal(0.6);
  mutationProbability = signal(0.4);
  maxIterations = signal(10000);
  parentCandidatesAmount = signal(5);
  initialPopulation = signal<InitialPopulation>(InitialPopulation.Random);
  completionCondition = signal<SolverCompletionCondition>(
    SolverCompletionCondition.ConvergeOne,
  );
  runContinuously = signal(true);

  executionService = inject(ExecutionService);

  InitialPopulation = InitialPopulation;
  initialPopulationOptions: SelectOption<InitialPopulation>[] = [
    {
      value: InitialPopulation.Random,
      label: 'Aleatória',
    },
    {
      value: InitialPopulation.WorstBoard,
      label: 'Pior tabuleiro',
    },
  ];

  SolverCompletionCondition = SolverCompletionCondition;
  completionConditionOptions: SelectOption<SolverCompletionCondition>[] = [
    {
      value: SolverCompletionCondition.ConvergeOne,
      label: 'Convergir um',
    },
    {
      value: SolverCompletionCondition.ConvergeAll,
      label: 'Convergir todos',
    },
  ];

  startNewExecution() {
    const parameters: SolverParameters = {
      populationSize: this.populationSize(),
      initialPopulation: this.initialPopulation(),
      recombinationProbability: this.recombinationProbability(),
      mutationProbability: this.mutationProbability(),
      maxIterations: this.maxIterations(),
      parentCandidatesAmount: this.parentCandidatesAmount(),
      completionCondition: this.completionCondition(),
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

interface SelectOption<T> {
  value: T;
  label: string;
}
