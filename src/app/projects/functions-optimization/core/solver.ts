import { FOIndividual, FOIndividualMeta } from './individual';
import { FOTestFunction } from './test-functions/test-function';

export interface FOSolverParameters {
  populationSize: number;
  maxIterations: number;
  dimensions: number;
  completionCondition: FOSolverCompletionCondition;
  mechanism: FOSolverMechanism;
  testFunction: FOTestFunction;
  parentCandidatesAmount: number;
  convergenceThreshold: number;
  parentsSelectionMethod: FOParentsSelectionMethod;
  recombinationMethod: FORecombinationMethod;
  mutationMethod: FOMutationMethod;

  // Evolution Strategy specific parameters
  offspringSize?: number;
  survivorSelectionStrategy?: FOSurvivorSelectionStrategy;
  selfAdaptiveMutation?: boolean;
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
  sigma?: {
    // Evolution Strategy specific - mutation step sizes
    average: number[];
    best: number[];
    worst: number[];
  };
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
  UniformRandom = 'UniformRandom', // ES: Select parents uniformly from entire population
}

export enum FORecombinationMethod {
  UniformCrossover = 'UniformCrossover',
  ArithmeticCrossover = 'ArithmeticCrossover',
  IntermediateRecombination = 'IntermediateRecombination', // ES: Arithmetic mean
  DiscreteRecombination = 'DiscreteRecombination', // ES: Random selection per gene
}

export enum FOMutationMethod {
  GaussianMutation = 'GaussianMutation',
  UniformMutation = 'UniformMutation',
  SelfAdaptiveGaussianMutation = 'SelfAdaptiveGaussianMutation',
}

export enum FOSurvivorSelectionStrategy {
  MuPlusLambda = 'MuPlusLambda', // μ + λ: parents + offspring compete
  MuCommaLambda = 'MuCommaLambda', // μ, λ: only offspring compete
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
    [FOParentsSelectionMethod.UniformRandom]: (individuals) => {
      // ES uniform selection: each individual has equal probability of being selected
      const parent1 =
        individuals[Math.floor(Math.random() * individuals.length)];
      let parent2 = individuals[Math.floor(Math.random() * individuals.length)];

      // Ensure different parents if possible with proper retry mechanism
      let attempts = 0;
      const maxAttempts = 10;
      while (
        individuals.length > 1 &&
        parent1 === parent2 &&
        attempts < maxAttempts
      ) {
        parent2 = individuals[Math.floor(Math.random() * individuals.length)];
        attempts++;
      }

      return [parent1, parent2];
    },
  };

  static readonly MUTATION_METHODS: Record<
    FOMutationMethod,
    (individual: FOIndividual, currentIteration: number) => FOIndividual
  > = {
    [FOMutationMethod.GaussianMutation]:
      FOIndividual.createFromGaussianMutation,
    [FOMutationMethod.UniformMutation]: FOIndividual.createFromUniformMutation,
    [FOMutationMethod.SelfAdaptiveGaussianMutation]:
      FOIndividual.createFromSelfAdaptiveGaussianMutation,
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
    [FORecombinationMethod.IntermediateRecombination]: (
      parent1,
      parent2,
      currentIteration,
    ) =>
      FOIndividual.createTwoFromIntermediateRecombination(
        parent1,
        parent2,
        currentIteration,
      ),
    [FORecombinationMethod.DiscreteRecombination]: (
      parent1,
      parent2,
      currentIteration,
    ) =>
      FOIndividual.createTwoFromDiscreteRecombination(
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
      ...(this.parameters.mechanism === FOSolverMechanism.EvolutionStrategy &&
        this.parameters.selfAdaptiveMutation && {
          sigma: {
            average: [],
            best: [],
            worst: [],
          },
        }),
    };
    this.checkForCompletion();
  }

  iterate() {
    if (this.#state !== FOSolverState.InProgress) {
      throw new Error('Solver not in progress');
    }

    if (this.parameters.mechanism === FOSolverMechanism.EvolutionStrategy) {
      this.iterateEvolutionStrategy();
    } else {
      this.iterateGeneticAlgorithm();
    }

    this.#currentIteration!++;
  }

  private iterateGeneticAlgorithm() {
    const parentCandidates = this.pickRandomIndividuals(
      this.parameters.parentCandidatesAmount,
    );

    const selectedParents =
      FunctionOptimizationSolver.PARENTS_SELECTION_METHODS[
        this.parameters.parentsSelectionMethod
      ](parentCandidates);
    let offspring = selectedParents;

    offspring = FunctionOptimizationSolver.RECOMBINATION_METHODS[
      this.parameters.recombinationMethod
    ](selectedParents[0], selectedParents[1], this.#currentIteration!);

    for (const [index, individual] of offspring.entries()) {
      offspring[index] = FunctionOptimizationSolver.MUTATION_METHODS[
        this.parameters.mutationMethod
      ](individual, this.#currentIteration!);
    }

    this.individuals.push(...offspring);
    this.sortIndividualsByFitness();
    this.cutPopulationToSize();
    this.checkForCompletion();
    this.updateStatistics();
  }

  private iterateEvolutionStrategy() {
    const offspringSize =
      this.parameters.offspringSize || this.parameters.populationSize;
    const offspring: FOIndividual[] = [];

    // Generate offspring
    for (let i = 0; i < offspringSize; i++) {
      let newIndividual: FOIndividual;

      if (this.individuals.length >= 2) {
        const parentCandidates = this.pickRandomIndividuals(
          this.parameters.parentCandidatesAmount,
        );
        const selectedParents =
          FunctionOptimizationSolver.PARENTS_SELECTION_METHODS[
            this.parameters.parentsSelectionMethod
          ](parentCandidates);

        const recombinedOffspring =
          FunctionOptimizationSolver.RECOMBINATION_METHODS[
            this.parameters.recombinationMethod
          ](selectedParents[0], selectedParents[1], this.#currentIteration!);

        // Take the first offspring from recombination
        newIndividual = recombinedOffspring[0];
      } else {
        // If only one parent, clone it
        const parent = this.individuals[0];
        newIndividual = new FOIndividual(
          [...parent.genes],
          parent.meta,
          this.#currentIteration!,
          parent.sigmas ? [...parent.sigmas] : undefined,
        );
      }

      newIndividual = FunctionOptimizationSolver.MUTATION_METHODS[
        this.parameters.mutationMethod
      ](newIndividual, this.#currentIteration!);

      offspring.push(newIndividual);
    }

    // Survivor selection
    this.applySurvivorSelection(offspring);

    this.sortIndividualsByFitness();
    this.checkForCompletion();
    this.updateStatistics();
  }

  private applySurvivorSelection(offspring: FOIndividual[]) {
    const strategy =
      this.parameters.survivorSelectionStrategy ||
      FOSurvivorSelectionStrategy.MuPlusLambda;

    switch (strategy) {
      case FOSurvivorSelectionStrategy.MuPlusLambda:
        // Parents and offspring compete
        this.individuals.push(...offspring);
        this.sortIndividualsByFitness();
        this.cutPopulationToSize();
        break;

      case FOSurvivorSelectionStrategy.MuCommaLambda:
        // Only offspring compete (parents are discarded)
        this.individuals = offspring;
        this.sortIndividualsByFitness();
        this.cutPopulationToSize();
        break;
    }
  }

  private generateInitialPopulation() {
    const withSigmas =
      this.parameters.mechanism === FOSolverMechanism.EvolutionStrategy &&
      this.parameters.selfAdaptiveMutation;

    this.individuals = Array.from(
      { length: this.parameters.populationSize },
      () => FOIndividual.createRandom(this.meta, 0, withSigmas),
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

  private updateStatistics() {
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

    // Evolution Strategy specific: sigma statistics
    if (this.#statistics!.sigma && this.individuals.some((ind) => ind.sigmas)) {
      const allSigmas = this.individuals
        .filter((ind) => ind.sigmas)
        .flatMap((ind) => ind.sigmas!);

      if (allSigmas.length > 0) {
        const averageSigma =
          allSigmas.reduce((sum, sigma) => sum + sigma, 0) / allSigmas.length;
        this.#statistics!.sigma.average.push(averageSigma);
        this.#statistics!.sigma.best.push(Math.min(...allSigmas));
        this.#statistics!.sigma.worst.push(Math.max(...allSigmas));
      }
    }
  }
}
