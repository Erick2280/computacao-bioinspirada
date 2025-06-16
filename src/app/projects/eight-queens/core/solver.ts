import { rollChance } from '@app/global/utils';

import { Board } from './board';

export interface SolverParameters {
  populationSize: number;
  recombinationProbability: number;
  mutationProbability: number;
  maxIterations: number;
  parentCandidatesAmount: number;
  initialPopulation: InitialPopulation;
  completionCondition: SolverCompletionCondition;
}

export class EightQueensSolver {
  readonly parameters: SolverParameters;
  boards: Board[] = [];
  #state: SolverState = SolverState.NotInitialized;
  #statistics: SolverStatistics | null = null;
  #currentIteration: number | null = null;

  constructor(parameters: SolverParameters) {
    this.parameters = parameters;
    Object.freeze(this.parameters);
  }

  get state(): SolverState {
    return this.#state;
  }

  get currentIteration(): number | null {
    return this.#currentIteration;
  }

  get statistics(): SolverStatistics | null {
    return this.#statistics;
  }

  initialize() {
    if (this.#state !== SolverState.NotInitialized) {
      return;
    }

    this.generateInitialPopulation();
    this.sortBoardsByFitness();
    this.#currentIteration = 0;
    this.#state = SolverState.InProgress;
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
    if (this.#state !== SolverState.InProgress) {
      throw new Error('SolverNotInProgress');
    }

    const parentCandidates = this.pickRandomBoards(
      this.parameters.parentCandidatesAmount,
    );

    // Since the board list is sorted by fitness, the first two boards are the best candidates for parents.
    const selectedParents = parentCandidates.slice(0, 2);
    let offspring = selectedParents;

    const recombinationChanceCounter: ChanceCounter = {
      chancesRolled: 0,
      chancesHit: 0,
    };

    const mutationChanceCounter: ChanceCounter = {
      chancesRolled: 0,
      chancesHit: 0,
    };

    // TODO: In the future, we might want to implement other recombination and mutation methods,
    // maybe using different classes for each method.
    recombinationChanceCounter.chancesRolled++;
    if (rollChance(this.parameters.recombinationProbability)) {
      offspring = Board.createTwoFromCutAndCrossfill(
        selectedParents[0],
        selectedParents[1],
        this.#currentIteration!,
      );
      recombinationChanceCounter.chancesHit++;
    }

    for (const [index, board] of offspring.entries()) {
      mutationChanceCounter.chancesRolled++;
      if (rollChance(this.parameters.mutationProbability)) {
        offspring[index] = Board.createFromSwappingRandomPositions(
          board,
          this.#currentIteration!,
        );
        mutationChanceCounter.chancesHit++;
      }
    }

    this.boards.push(...offspring);
    this.sortBoardsByFitness();
    this.cutPopulationToSize();
    this.checkForCompletion();
    this.updateStatistics({
      mutationChanceCounter,
      recombinationChanceCounter,
    });

    this.#currentIteration!++;
  }

  private generateInitialPopulation() {
    const initialPopulationGenerators: Record<
      InitialPopulation,
      () => Board[]
    > = {
      [InitialPopulation.Random]: () =>
        Array.from({ length: this.parameters.populationSize }, () =>
          Board.createRandomBoard(),
        ),
      [InitialPopulation.WorstBoard]: () =>
        Array.from(
          { length: this.parameters.populationSize },
          () => new Board([...Board.ORDERED_POSITIONS]),
        ),
    };

    this.boards =
      initialPopulationGenerators[this.parameters.initialPopulation]();
  }

  pickRandomBoards(amount: number): Board[] {
    const selectedIndexes = new Set<number>();

    while (selectedIndexes.size < amount) {
      const randomIndex = Math.floor(Math.random() * this.boards.length);
      selectedIndexes.add(randomIndex);
    }

    return Array.from(selectedIndexes)
      .sort((a, b) => a - b)
      .map((index) => this.boards[index]);
  }

  private sortBoardsByFitness() {
    this.boards.sort((a, b) => a.fitness - b.fitness);
  }

  private cutPopulationToSize() {
    this.boards = this.boards.slice(0, this.parameters.populationSize);
  }

  private checkForCompletion() {
    const isCompletionConditionSatisfied: Record<
      SolverCompletionCondition,
      () => boolean
    > = {
      [SolverCompletionCondition.ConvergeOne]: () =>
        this.boards[0].fitness === 0,
      [SolverCompletionCondition.ConvergeAll]: () =>
        this.boards[this.boards.length - 1].fitness === 0,
    };

    if (isCompletionConditionSatisfied[this.parameters.completionCondition]()) {
      this.#state = SolverState.Solved;
      return;
    }

    if (this.#currentIteration! + 1 >= this.parameters.maxIterations) {
      this.#state = SolverState.ReachedMaxIterations;
    }
  }

  private updateStatistics(counters: {
    mutationChanceCounter: ChanceCounter;
    recombinationChanceCounter: ChanceCounter;
  }) {
    if (this.boards.length === 0) {
      return;
    }

    const medianIndex = Math.floor(this.boards.length / 2);

    const fitnessValues = this.boards.map((board) => board.fitness);
    const averageFitness =
      fitnessValues.reduce((sum, value) => sum + value, 0) /
      fitnessValues.length;
    this.#statistics!.fitness.average.push(averageFitness);
    this.#statistics!.fitness.best.push(fitnessValues[0]);
    this.#statistics!.fitness.worst.push(
      fitnessValues[fitnessValues.length - 1],
    );
    const fitnessMedian =
      this.boards.length % 2 === 0
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

    const ages = this.boards.map(
      (board) => this.currentIteration! - board.iterationBorn,
    );
    const averageAge =
      ages.reduce((sum, value) => sum + value, 0) / ages.length;
    this.#statistics!.age.average.push(averageAge);
    this.#statistics!.age.oldest.push(Math.max(...ages));
    this.#statistics!.age.earlierIterationAlive.push(
      Math.min(...this.boards.map((board) => board.iterationBorn)),
    );

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

export interface SolverStatistics {
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
  recombination: ChanceCounter;
  mutation: ChanceCounter;
}

export interface ChanceCounter {
  chancesRolled: number;
  chancesHit: number;
}

export enum SolverState {
  NotInitialized = 'NotInitialized',
  InProgress = 'InProgress',
  Solved = 'Solved',
  ReachedMaxIterations = 'ReachedMaxIterations',
}

export enum SolverCompletionCondition {
  ConvergeOne = 'ConvergeOne',
  ConvergeAll = 'ConvergeAll',
}

export enum InitialPopulation {
  Random = 'Random',
  WorstBoard = 'WorstBoard',
}
