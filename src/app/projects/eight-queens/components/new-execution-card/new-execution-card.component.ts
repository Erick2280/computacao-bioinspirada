import { PercentPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  remixAlignBottom,
  remixDnaLine,
  remixDropperLine,
  remixExpandRightLine,
  remixFlagLine,
  remixHand,
  remixHashtag,
  remixParentLine,
  remixPlayCircleFill,
  remixSeedlingLine,
  remixSettings6Line,
} from '@ng-icons/remixicon';

import {
  EightQueensSolver,
  InitialPopulation,
  MutationMethod,
  ParentsSelectionMethod,
  RecombinationMethod,
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
      remixSettings6Line,
      remixDropperLine,
    }),
  ],
})
export class NewExecutionCardComponent {
  populationSize = signal(100);
  recombinationProbability = signal(0.6);
  mutationProbability = signal(0.4);
  maxIterations = signal(10000);
  parentCandidatesAmount = signal(5);
  parentsSelectionMethod = signal<ParentsSelectionMethod>(
    ParentsSelectionMethod.BestFitness,
  );
  recombinationMethod = signal<RecombinationMethod>(
    RecombinationMethod.CutAndCrossfill,
  );
  mutationMethod = signal<MutationMethod>(MutationMethod.SwapAny);
  initialPopulation = signal<InitialPopulation>(InitialPopulation.Random);
  completionCondition = signal<SolverCompletionCondition>(
    SolverCompletionCondition.ConvergeOne,
  );
  runContinuously = signal(true);

  executionService = inject(ExecutionService);

  ParentsSelectionMethod = ParentsSelectionMethod;
  parentsSelectionMethodOptions: SelectOption<ParentsSelectionMethod>[] = [
    {
      value: ParentsSelectionMethod.Random,
      label: 'Aleatório',
    },
    {
      value: ParentsSelectionMethod.BestFitness,
      label: 'Melhor fitness',
    },
    {
      value: ParentsSelectionMethod.TournamentOfThree,
      label: 'Torneio de três',
    },
  ];

  RecombinationMethod = RecombinationMethod;
  recombinationMethodOptions: SelectOption<RecombinationMethod>[] = [
    {
      value: RecombinationMethod.CutAndCrossfill,
      label: 'Cut-and-crossfill',
    },
    {
      value: RecombinationMethod.CycleCrossover,
      label: 'Cycle crossover',
    },
  ];

  MutationMethod = MutationMethod;
  mutationMethodOptions: SelectOption<string>[] = [
    {
      value: MutationMethod.SwapAny,
      label: 'Trocar qualquer posição',
    },
    {
      value: MutationMethod.SwapCollision,
      label: 'Trocar posição com colisão',
    },
  ];

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
    const parameters: SolverParameters = this.createSolverParameters();

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

  createSolverParameters(): SolverParameters {
    return {
      populationSize: this.populationSize(),
      initialPopulation: this.initialPopulation(),
      parentsSelectionMethod: this.parentsSelectionMethod(),
      recombinationMethod: this.recombinationMethod(),
      recombinationProbability: this.recombinationProbability(),
      mutationProbability: this.mutationProbability(),
      mutationMethod: this.mutationMethod(),
      maxIterations: this.maxIterations(),
      parentCandidatesAmount: this.parentCandidatesAmount(),
      completionCondition: this.completionCondition(),
    };
  }
}

interface SelectOption<T> {
  value: T;
  label: string;
}
