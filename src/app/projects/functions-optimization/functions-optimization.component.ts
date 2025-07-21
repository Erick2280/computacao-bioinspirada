import { AsyncPipe, NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  remixBox2Line,
  remixCheckFill,
  remixCloseFill,
  remixContractRightFill,
  remixDnaLine,
  remixDropperLine,
  remixExpandRightLine,
  remixFilterLine,
  remixFlagLine,
  remixFormula,
  remixHand,
  remixHashtag,
  remixLoaderFill,
  remixParentLine,
  remixPauseFill,
  remixPlayFill,
  remixResetLeftFill,
  remixSeedlingLine,
  remixSettings6Line,
  remixStopCircleLine,
} from '@ng-icons/remixicon';

import { FONewExecutionCardComponent } from '@app/projects/functions-optimization/components/new-execution-card/new-execution-card.component';
import { FOSolvingPanelComponent } from '@app/projects/functions-optimization/components/solving-panel/solving-panel.component';
import {
  FOMutationMethod,
  FOParentsSelectionMethod,
  FORecombinationMethod,
  FOSolverCompletionCondition,
  FOSolverMechanism,
  FOSolverState,
  FOSurvivorSelectionStrategy,
} from '@app/projects/functions-optimization/core/solver';
import { FOTestFunctionType } from '@app/projects/functions-optimization/core/test-functions/test-function';
import { FOExecutionService } from '@app/projects/functions-optimization/services/execution.service';

@Component({
  selector: 'app-functions-optimization',
  imports: [
    RouterModule,
    NgIcon,
    FONewExecutionCardComponent,
    AsyncPipe,
    NgClass,
    FOSolvingPanelComponent,
    FormsModule,
  ],
  templateUrl: './functions-optimization.component.html',
  viewProviders: [
    provideIcons({
      remixBox2Line,
      remixCheckFill,
      remixContractRightFill,
      remixDnaLine,
      remixDropperLine,
      remixExpandRightLine,
      remixFilterLine,
      remixFlagLine,
      remixFormula,
      remixHand,
      remixHashtag,
      remixLoaderFill,
      remixParentLine,
      remixPauseFill,
      remixPlayFill,
      remixResetLeftFill,
      remixSeedlingLine,
      remixSettings6Line,
      remixStopCircleLine,
      remixCloseFill,
    }),
  ],
})
export class FunctionsOptimizationComponent {
  executionService = inject(FOExecutionService);
  SolverState = FOSolverState;
  SolverMechanism = FOSolverMechanism;

  getTestFunctionLabel(testFunction: FOTestFunctionType): string {
    const testFunctionLabels = {
      [FOTestFunctionType.Ackley]: 'Ackley',
      [FOTestFunctionType.Rastrigin]: 'Rastrigin',
      [FOTestFunctionType.Rosenbrock]: 'Rosenbrock',
      [FOTestFunctionType.Schwefel]: 'Schwefel',
    };
    return testFunctionLabels[testFunction];
  }

  getMechanismLabel(mechanism: FOSolverMechanism): string {
    const mechanismLabels = {
      [FOSolverMechanism.GeneticAlgorithm]: 'Algoritmo genético',
      [FOSolverMechanism.EvolutionStrategy]: 'Estratégia evolutiva',
    };
    return mechanismLabels[mechanism];
  }

  getParentsSelectionMethodLabel(method: FOParentsSelectionMethod): string {
    const methodLabels = {
      [FOParentsSelectionMethod.UniformRandom]: 'Aleatório uniforme',
      [FOParentsSelectionMethod.BestFitness]: 'Melhor fitness',
      [FOParentsSelectionMethod.TournamentOfThree]: 'Torneio de três',
    };
    return methodLabels[method];
  }

  getRecombinationMethodLabel(method: FORecombinationMethod): string {
    const methodLabels = {
      [FORecombinationMethod.UniformCrossover]: 'Crossover uniforme',
      [FORecombinationMethod.ArithmeticCrossover]: 'Crossover aritmético',
      [FORecombinationMethod.IntermediateRecombination]:
        'Recombinação intermediária',
      [FORecombinationMethod.DiscreteRecombination]: 'Recombinação discreta',
    };
    return methodLabels[method];
  }

  getMutationMethodLabel(method: FOMutationMethod): string {
    const methodLabels = {
      [FOMutationMethod.GaussianMutation]: 'Mutação gaussiana',
      [FOMutationMethod.UniformMutation]: 'Mutação uniforme',
      [FOMutationMethod.SelfAdaptiveGaussianMutation]:
        'Mutação gaussiana auto-adaptativa',
    };
    return methodLabels[method];
  }

  getSurvivorSelectionStrategyLabel(
    strategy: FOSurvivorSelectionStrategy,
  ): string {
    const strategyLabels = {
      [FOSurvivorSelectionStrategy.MuPlusLambda]: 'Pais e filhos',
      [FOSurvivorSelectionStrategy.MuCommaLambda]: 'Apenas filhos',
    };
    return strategyLabels[strategy];
  }

  getCompletionConditionLabel(condition: FOSolverCompletionCondition): string {
    const conditionLabels = {
      [FOSolverCompletionCondition.ConvergeOne]: 'Convergir um',
      [FOSolverCompletionCondition.ConvergeAll]: 'Convergir todos',
    };
    return conditionLabels[condition];
  }
}
