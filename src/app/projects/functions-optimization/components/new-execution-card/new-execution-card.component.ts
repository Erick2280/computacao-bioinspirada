import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  remixBox2Line,
  remixDnaLine,
  remixDropperLine,
  remixExpandRightLine,
  remixFilterLine,
  remixFlagLine,
  remixFormula,
  remixHand,
  remixHashtag,
  remixParentLine,
  remixPlayCircleFill,
  remixSeedlingLine,
  remixSettings6Line,
} from '@ng-icons/remixicon';

import {
  FOMutationMethod,
  FOParentsSelectionMethod,
  FORecombinationMethod,
  FOSolverCompletionCondition,
  FOSolverMechanism,
  FOSolverParameters,
  FOSurvivorSelectionStrategy,
  FunctionOptimizationSolver,
} from '@app/projects/functions-optimization/core/solver';
import {
  FOTestFunction,
  FOTestFunctionType,
} from '@app/projects/functions-optimization/core/test-functions/test-function';
import { FOExecutionService } from '@app/projects/functions-optimization/services/execution.service';

@Component({
  selector: 'app-fo-new-execution-card',
  imports: [NgIcon, FormsModule],
  templateUrl: './new-execution-card.component.html',
  viewProviders: [
    provideIcons({
      remixPlayCircleFill,
      remixHashtag,
      remixParentLine,
      remixDnaLine,
      remixHand,
      remixBox2Line,
      remixExpandRightLine,
      remixFlagLine,
      remixFormula,
      remixSeedlingLine,
      remixSettings6Line,
      remixDropperLine,
      remixFilterLine,
    }),
  ],
})
export class FONewExecutionCardComponent {
  populationSize = signal(100);
  maxIterations = signal(2000);
  dimensions = signal(30);
  convergenceThreshold = signal(0.01);
  parentCandidatesAmount = signal(20);
  testFunction = signal<FOTestFunctionType>(FOTestFunctionType.Ackley);
  mechanism = signal<FOSolverMechanism>(FOSolverMechanism.EvolutionStrategy);
  parentsSelectionMethod = signal<FOParentsSelectionMethod>(
    FOParentsSelectionMethod.TournamentOfThree,
  );
  recombinationMethod = signal<FORecombinationMethod>(
    FORecombinationMethod.ArithmeticCrossover,
  );
  mutationMethod = signal<FOMutationMethod>(
    FOMutationMethod.SelfAdaptiveGaussianMutation,
  );
  completionCondition = signal<FOSolverCompletionCondition>(
    FOSolverCompletionCondition.ConvergeOne,
  );

  // Evolution Strategy specific parameters
  offspringSize = signal(200);
  survivorSelectionStrategy = signal<FOSurvivorSelectionStrategy>(
    FOSurvivorSelectionStrategy.MuPlusLambda,
  );

  runContinuously = signal(true);

  executionService = inject(FOExecutionService);

  ParentsSelectionMethod = FOParentsSelectionMethod;
  parentsSelectionMethodOptions: SelectOption<FOParentsSelectionMethod>[] = [
    {
      value: FOParentsSelectionMethod.Random,
      label: 'Aleatório',
    },
    {
      value: FOParentsSelectionMethod.BestFitness,
      label: 'Melhor fitness',
    },
    {
      value: FOParentsSelectionMethod.TournamentOfThree,
      label: 'Torneio de três',
    },
    {
      value: FOParentsSelectionMethod.UniformRandom,
      label: 'Uniforme aleatório',
    },
  ];

  RecombinationMethod = FORecombinationMethod;
  recombinationMethodOptions: SelectOption<FORecombinationMethod>[] = [
    {
      value: FORecombinationMethod.UniformCrossover,
      label: 'Crossover uniforme',
    },
    {
      value: FORecombinationMethod.ArithmeticCrossover,
      label: 'Crossover aritmético',
    },
    {
      value: FORecombinationMethod.IntermediateRecombination,
      label: 'Recombinação intermediária',
    },
    {
      value: FORecombinationMethod.DiscreteRecombination,
      label: 'Recombinação discreta',
    },
  ];

  MutationMethod = FOMutationMethod;
  mutationMethodOptions: SelectOption<FOMutationMethod>[] = [
    {
      value: FOMutationMethod.GaussianMutation,
      label: 'Mutação gaussiana',
    },
    {
      value: FOMutationMethod.UniformMutation,
      label: 'Mutação uniforme',
    },
    {
      value: FOMutationMethod.SelfAdaptiveGaussianMutation,
      label: 'Mutação gaussiana auto-adaptativa',
    },
  ];

  SolverMechanism = FOSolverMechanism;
  mechanismOptions: SelectOption<FOSolverMechanism>[] = [
    {
      value: FOSolverMechanism.GeneticAlgorithm,
      label: 'Algoritmo genético',
    },
    {
      value: FOSolverMechanism.EvolutionStrategy,
      label: 'Estratégia evolutiva',
    },
  ];

  TestFunction = FOTestFunction;
  testFunctionOptions: SelectOption<FOTestFunctionType>[] = [
    {
      value: FOTestFunctionType.Ackley,
      label: 'Ackley',
    },
    {
      value: FOTestFunctionType.Rastrigin,
      label: 'Rastrigin',
    },
    {
      value: FOTestFunctionType.Rosenbrock,
      label: 'Rosenbrock',
    },
    {
      value: FOTestFunctionType.Schwefel,
      label: 'Schwefel',
    },
  ];

  SurvivorSelectionStrategy = FOSurvivorSelectionStrategy;
  survivorSelectionStrategyOptions: SelectOption<FOSurvivorSelectionStrategy>[] =
    [
      {
        value: FOSurvivorSelectionStrategy.MuPlusLambda,
        label: 'Pais e filhos',
      },
      {
        value: FOSurvivorSelectionStrategy.MuCommaLambda,
        label: 'Apenas filhos',
      },
    ];

  SolverCompletionCondition = FOSolverCompletionCondition;
  completionConditionOptions: SelectOption<FOSolverCompletionCondition>[] = [
    {
      value: FOSolverCompletionCondition.ConvergeOne,
      label: 'Convergir um',
    },
    {
      value: FOSolverCompletionCondition.ConvergeAll,
      label: 'Convergir todos',
    },
  ];

  startNewExecution() {
    const parameters: FOSolverParameters = this.createSolverParameters();

    const solver = new FunctionOptimizationSolver(parameters);

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

  createSolverParameters(): FOSolverParameters {
    const baseParams = {
      populationSize: this.populationSize(),
      maxIterations: this.maxIterations(),
      dimensions: this.dimensions(),
      completionCondition: this.completionCondition(),
      mechanism: this.mechanism(),
      testFunction: this.testFunction(),
      parentCandidatesAmount: this.parentCandidatesAmount(),
      convergenceThreshold: this.convergenceThreshold(),
      parentsSelectionMethod: this.parentsSelectionMethod(),
      recombinationMethod: this.recombinationMethod(),
      mutationMethod: this.mutationMethod(),
    };

    // Add Evolution Strategy specific parameters if needed
    if (this.mechanism() === FOSolverMechanism.EvolutionStrategy) {
      return {
        ...baseParams,
        offspringSize: this.offspringSize(),
        survivorSelectionStrategy: this.survivorSelectionStrategy(),
      };
    }

    return baseParams;
  }
}

interface SelectOption<T> {
  value: T;
  label: string;
}
