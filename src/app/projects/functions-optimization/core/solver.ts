import { rollChance } from '@app/global/utils';

import { FOIndividual, FOIndividualMeta } from './individual';
import { FOTestFunction } from './test-functions/test-function';

export interface FOSolverParameters {
  populationSize: number;
  maxIterations: number;
  dimensions: number;
  completionCondition: FOSolverCompletionCondition;
  mechanism: FOSolverMechanism;
  testFunction: FOTestFunction;
  recombinationProbability: number;
  mutationProbability: number;
  parentCandidatesAmount: number;
  convergenceThreshold: number;
  parentsSelectionMethod: FOParentsSelectionMethod;
  recombinationMethod: FORecombinationMethod;
  mutationMethod: FOMutationMethod;
}

export interface FOSolverStatistics {
  fitness: {
    average: number[];
    best: number[];
    worst: number[];
    median: number[];
    standardDeviation: number[];
  };
  age: {
    average: number[];
    oldest: number[];
    earlierIterationAlive: number[];
  };
  distanceToGlobalMinimum: {
    average: number[];
    best: number[];
    worst: number[];
  };
  relativeError: {
    average: number[];
    best: number[];
    worst: number[];
  };
  recombination: FOChanceCounter;
  mutation: FOChanceCounter;
}

export interface FOChanceCounter {
  chancesRolled: number;
  chancesHit: number;
}

export enum FOSolverCompletionCondition {
  ConvergeOne = 'ConvergeOne',
  ConvergeAll = 'ConvergeAll',
}

export enum FOSolverMechanism {
  GeneticAlgorithm = 'GeneticAlgorithm',
  EvolutionStrategy = 'EvolutionStrategy',
}

export enum FOSolverState {
  NotInitialized = 'NotInitialized',
  InProgress = 'InProgress',
  Solved = 'Solved',
  ReachedMaxIterations = 'ReachedMaxIterations',
}

export enum FOParentsSelectionMethod {
  Random = 'Random',
  BestFitness = 'BestFitness',
  TournamentOfThree = 'TournamentOfThree',
}

export enum FORecombinationMethod {
  UniformCrossover = 'UniformCrossover',
  ArithmeticCrossover = 'ArithmeticCrossover',
}

export enum FOMutationMethod {
  GaussianMutation = 'GaussianMutation',
  UniformMutation = 'UniformMutation',
}

export class FunctionOptimizationSolver {
  readonly parameters: FOSolverParameters;
  readonly meta: FOIndividualMeta;

  static readonly PARENTS_SELECTION_METHODS: Record<
    FOParentsSelectionMethod,
    (individuals: FOIndividual[]) => FOIndividual[]
  > = {
    [FOParentsSelectionMethod.Random]: (individuals) =>
      individuals.sort(() => Math.random() - 0.5).slice(0, 2),
    [FOParentsSelectionMethod.BestFitness]: (individuals) =>
      individuals.slice(0, 2),
    [FOParentsSelectionMethod.TournamentOfThree]: (individuals) => {
      const tournamentSize = 3;
      const selectedIndividuals = individuals
        .sort(() => Math.random() - 0.5)
        .slice(0, tournamentSize);
      return selectedIndividuals
        .sort((a, b) => a.fitness - b.fitness)
        .slice(0, 2);
    },
  };

  static readonly MUTATION_METHODS: Record<
    FOMutationMethod,
    (individual: FOIndividual, currentIteration: number) => FOIndividual
  > = {
    [FOMutationMethod.GaussianMutation]:
      FOIndividual.createFromGaussianMutation,
    [FOMutationMethod.UniformMutation]: FOIndividual.createFromUniformMutation,
  };

  static readonly RECOMBINATION_METHODS: Record<
    FORecombinationMethod,
    (
      parent1: FOIndividual,
      parent2: FOIndividual,
      currentIteration: number,
    ) => FOIndividual[]
  > = {
    [FORecombinationMethod.UniformCrossover]: (
      parent1,
      parent2,
      currentIteration,
    ) =>
      FOIndividual.createTwoFromUniformCrossover(
        parent1,
        parent2,
        currentIteration,
      ),
    [FORecombinationMethod.ArithmeticCrossover]: (
      parent1,
      parent2,
      currentIteration,
    ) =>
      FOIndividual.createTwoFromArithmeticCrossover(
        parent1,
        parent2,
        currentIteration,
      ),
  };

  individuals: FOIndividual[] = [];
  #state: FOSolverState = FOSolverState.NotInitialized;
  #statistics: FOSolverStatistics | null = null;
  #currentIteration: number | null = null;

  constructor(parameters: FOSolverParameters) {
    this.parameters = parameters;
    this.meta = {
      testFunction: parameters.testFunction,
      dimensions: parameters.dimensions,
    };
    Object.freeze(this.parameters);
    Object.freeze(this.meta);
  }

  get state(): FOSolverState {
    return this.#state;
  }

  get currentIteration(): number | null {
    return this.#currentIteration;
  }

  get statistics(): FOSolverStatistics | null {
    return this.#statistics;
  }

  initialize() {
    if (this.#state !== FOSolverState.NotInitialized) {
      return;
    }

    this.generateInitialPopulation();
    this.sortIndividualsByFitness();
    this.#currentIteration = 0;
    this.#state = FOSolverState.InProgress;
    this.#statistics = {
      fitness: {
        average: [],
        best: [],
        worst: [],
        median: [],
        standardDeviation: [],
      },
      age: {
        average: [],
        oldest: [],
        earlierIterationAlive: [],
      },
      distanceToGlobalMinimum: {
        average: [],
        best: [],
        worst: [],
      },
      relativeError: {
        average: [],
        best: [],
        worst: [],
      },
      recombination: {
        chancesRolled: 0,
        chancesHit: 0,
      },
      mutation: {
        chancesRolled: 0,
        chancesHit: 0,
      },
    };
    this.checkForCompletion();
  }

  iterate() {
    if (this.#state !== FOSolverState.InProgress) {
      throw new Error('Solver not in progress');
    }

    const parentCandidates = this.pickRandomIndividuals(
      this.parameters.parentCandidatesAmount,
    );

    const selectedParents =
      FunctionOptimizationSolver.PARENTS_SELECTION_METHODS[
        this.parameters.parentsSelectionMethod
      ](parentCandidates);
    let offspring = selectedParents;

    const recombinationChanceCounter: FOChanceCounter = {
      chancesRolled: 0,
      chancesHit: 0,
    };

    const mutationChanceCounter: FOChanceCounter = {
      chancesRolled: 0,
      chancesHit: 0,
    };

    recombinationChanceCounter.chancesRolled++;
    if (rollChance(this.parameters.recombinationProbability)) {
      offspring = FunctionOptimizationSolver.RECOMBINATION_METHODS[
        this.parameters.recombinationMethod
      ](selectedParents[0], selectedParents[1], this.#currentIteration!);
      recombinationChanceCounter.chancesHit++;
    }

    for (const [index, individual] of offspring.entries()) {
      mutationChanceCounter.chancesRolled++;
      if (rollChance(this.parameters.mutationProbability)) {
        offspring[index] = FunctionOptimizationSolver.MUTATION_METHODS[
          this.parameters.mutationMethod
        ](individual, this.#currentIteration!);
        mutationChanceCounter.chancesHit++;
      }
    }

    this.individuals.push(...offspring);
    this.sortIndividualsByFitness();
    this.cutPopulationToSize();
    this.checkForCompletion();
    this.updateStatistics({
      mutationChanceCounter,
      recombinationChanceCounter,
    });

    this.#currentIteration!++;
  }

  private generateInitialPopulation() {
    this.individuals = Array.from(
      { length: this.parameters.populationSize },
      () => FOIndividual.createRandom(this.meta),
    );
  }

  pickRandomIndividuals(amount: number): FOIndividual[] {
    if (amount === this.individuals.length) {
      return [...this.individuals];
    }

    const selectedIndexes = new Set<number>();

    while (selectedIndexes.size < amount) {
      const randomIndex = Math.floor(Math.random() * this.individuals.length);
      selectedIndexes.add(randomIndex);
    }

    return Array.from(selectedIndexes)
      .sort((a, b) => a - b)
      .map((index) => this.individuals[index]);
  }

  private sortIndividualsByFitness() {
    this.individuals.sort((a, b) => a.fitness - b.fitness);
  }

  private cutPopulationToSize() {
    this.individuals = this.individuals.slice(
      0,
      this.parameters.populationSize,
    );
  }

  private checkForCompletion() {
    const isCompletionConditionSatisfied: Record<
      FOSolverCompletionCondition,
      () => boolean
    > = {
      [FOSolverCompletionCondition.ConvergeOne]: () =>
        this.individuals[0].relativeError() <=
        this.parameters.convergenceThreshold,
      [FOSolverCompletionCondition.ConvergeAll]: () =>
        this.individuals[this.individuals.length - 1].relativeError() <=
        this.parameters.convergenceThreshold,
    };

    if (isCompletionConditionSatisfied[this.parameters.completionCondition]()) {
      this.#state = FOSolverState.Solved;
      return;
    }

    if (this.#currentIteration! + 1 >= this.parameters.maxIterations) {
      this.#state = FOSolverState.ReachedMaxIterations;
    }
  }

  private updateStatistics(counters: {
    mutationChanceCounter: FOChanceCounter;
    recombinationChanceCounter: FOChanceCounter;
  }) {
    if (this.individuals.length === 0) {
      return;
    }

    const medianIndex = Math.floor(this.individuals.length / 2);

    // Fitness statistics
    const fitnessValues = this.individuals.map(
      (individual) => individual.fitness,
    );
    const averageFitness =
      fitnessValues.reduce((sum, value) => sum + value, 0) /
      fitnessValues.length;
    this.#statistics!.fitness.average.push(averageFitness);
    this.#statistics!.fitness.best.push(fitnessValues[0]);
    this.#statistics!.fitness.worst.push(
      fitnessValues[fitnessValues.length - 1],
    );
    const fitnessMedian =
      this.individuals.length % 2 === 0
        ? (fitnessValues[medianIndex - 1] + fitnessValues[medianIndex]) / 2
        : fitnessValues[medianIndex];
    this.#statistics!.fitness.median.push(fitnessMedian);
    const fitnessVariance =
      fitnessValues.reduce(
        (sum, value) => sum + (value - averageFitness) ** 2,
        0,
      ) / fitnessValues.length;
    const fitnessStandardDeviation = Math.sqrt(fitnessVariance);
    this.#statistics!.fitness.standardDeviation.push(fitnessStandardDeviation);

    // Age statistics
    const ages = this.individuals.map(
      (individual) => this.currentIteration! - individual.iterationBorn,
    );
    const averageAge =
      ages.reduce((sum, value) => sum + value, 0) / ages.length;
    this.#statistics!.age.average.push(averageAge);
    this.#statistics!.age.oldest.push(Math.max(...ages));
    this.#statistics!.age.earlierIterationAlive.push(
      Math.min(
        ...this.individuals.map((individual) => individual.iterationBorn),
      ),
    );

    // Distance to global minimum statistics
    const distances = this.individuals.map((individual) =>
      individual.distanceToGlobalMinimum(),
    );
    const averageDistance =
      distances.reduce((sum, value) => sum + value, 0) / distances.length;
    this.#statistics!.distanceToGlobalMinimum.average.push(averageDistance);
    this.#statistics!.distanceToGlobalMinimum.best.push(Math.min(...distances));
    this.#statistics!.distanceToGlobalMinimum.worst.push(
      Math.max(...distances),
    );

    // Relative error statistics
    const relativeErrors = this.individuals.map((individual) =>
      individual.relativeError(),
    );
    const averageRelativeError =
      relativeErrors.reduce((sum, value) => sum + value, 0) /
      relativeErrors.length;
    this.#statistics!.relativeError.average.push(averageRelativeError);
    this.#statistics!.relativeError.best.push(Math.min(...relativeErrors));
    this.#statistics!.relativeError.worst.push(Math.max(...relativeErrors));

    // Genetic operation counters
    this.#statistics!.recombination.chancesRolled +=
      counters.recombinationChanceCounter.chancesRolled;
    this.#statistics!.recombination.chancesHit +=
      counters.recombinationChanceCounter.chancesHit;
    this.#statistics!.mutation.chancesRolled +=
      counters.mutationChanceCounter.chancesRolled;
    this.#statistics!.mutation.chancesHit +=
      counters.mutationChanceCounter.chancesHit;
  }
}
