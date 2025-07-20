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
  EQInitialPopulation,
  EQMutationMethod,
  EQParentsSelectionMethod,
  EQRecombinationMethod,
  EQSolverCompletionCondition,
  EQSolverParameters,
  EightQueensSolver,
} from '@app/projects/eight-queens/core/solver';
import { EQExecutionService } from '@app/projects/eight-queens/services/execution.service';

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
  parentsSelectionMethod = signal<EQParentsSelectionMethod>(
    EQParentsSelectionMethod.BestFitness,
  );
  recombinationMethod = signal<EQRecombinationMethod>(
    EQRecombinationMethod.CutAndCrossfill,
  );
  mutationMethod = signal<EQMutationMethod>(EQMutationMethod.SwapAny);
  initialPopulation = signal<EQInitialPopulation>(EQInitialPopulation.Random);
  completionCondition = signal<EQSolverCompletionCondition>(
    EQSolverCompletionCondition.ConvergeOne,
  );
  runContinuously = signal(true);

  executionService = inject(EQExecutionService);

  ParentsSelectionMethod = EQParentsSelectionMethod;
  parentsSelectionMethodOptions: SelectOption<EQParentsSelectionMethod>[] = [
    {
      value: EQParentsSelectionMethod.Random,
      label: 'Aleatório',
    },
    {
      value: EQParentsSelectionMethod.BestFitness,
      label: 'Melhor fitness',
    },
    {
      value: EQParentsSelectionMethod.TournamentOfThree,
      label: 'Torneio de três',
    },
  ];

  RecombinationMethod = EQRecombinationMethod;
  recombinationMethodOptions: SelectOption<EQRecombinationMethod>[] = [
    {
      value: EQRecombinationMethod.CutAndCrossfill,
      label: 'Cut-and-crossfill',
    },
    {
      value: EQRecombinationMethod.CycleCrossover,
      label: 'Cycle crossover',
    },
  ];

  MutationMethod = EQMutationMethod;
  mutationMethodOptions: SelectOption<string>[] = [
    {
      value: EQMutationMethod.SwapAny,
      label: 'Trocar qualquer posição',
    },
    {
      value: EQMutationMethod.SwapCollision,
      label: 'Trocar posição com colisão',
    },
  ];

  InitialPopulation = EQInitialPopulation;
  initialPopulationOptions: SelectOption<EQInitialPopulation>[] = [
    {
      value: EQInitialPopulation.Random,
      label: 'Aleatória',
    },
    {
      value: EQInitialPopulation.SequentialBoard,
      label: 'Tab. sequencial',
    },
  ];

  SolverCompletionCondition = EQSolverCompletionCondition;
  completionConditionOptions: SelectOption<EQSolverCompletionCondition>[] = [
    {
      value: EQSolverCompletionCondition.ConvergeOne,
      label: 'Convergir um',
    },
    {
      value: EQSolverCompletionCondition.ConvergeAll,
      label: 'Convergir todos',
    },
  ];

  startNewExecution() {
    const parameters: EQSolverParameters = this.createSolverParameters();

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

  createSolverParameters(): EQSolverParameters {
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
