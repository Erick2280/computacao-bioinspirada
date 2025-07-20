import { rollChance } from '@app/global/utils';

import { EQBoard } from './board';

export interface EQSolverParameters {
  populationSize: number;
  recombinationProbability: number;
  mutationProbability: number;
  maxIterations: number;
  parentCandidatesAmount: number;
  parentsSelectionMethod: EQParentsSelectionMethod;
  recombinationMethod: EQRecombinationMethod;
  mutationMethod: EQMutationMethod;
  initialPopulation: EQInitialPopulation;
  completionCondition: EQSolverCompletionCondition;
}

export interface EQSolverStatistics {
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
  recombination: EQChanceCounter;
  mutation: EQChanceCounter;
}

export interface EQChanceCounter {
  chancesRolled: number;
  chancesHit: number;
}

export enum EQSolverState {
  NotInitialized = 'NotInitialized',
  InProgress = 'InProgress',
  Solved = 'Solved',
  ReachedMaxIterations = 'ReachedMaxIterations',
}

export enum EQMutationMethod {
  SwapAny = 'SwapAny',
  SwapCollision = 'SwapCollision',
}

export enum EQParentsSelectionMethod {
  Random = 'Random',
  BestFitness = 'BestFitness',
  TournamentOfThree = 'TournamentOfThree',
}

export enum EQRecombinationMethod {
  CutAndCrossfill = 'CutAndCrossfill',
  CycleCrossover = 'CycleCrossover',
}

export enum EQSolverCompletionCondition {
  ConvergeOne = 'ConvergeOne',
  ConvergeAll = 'ConvergeAll',
}

export enum EQInitialPopulation {
  Random = 'Random',
  SequentialBoard = 'SequentialBoard',
}

export class EightQueensSolver {
  readonly parameters: EQSolverParameters;
  static readonly PARENTS_SELECTION_METHODS: Record<
    EQParentsSelectionMethod,
    (boards: EQBoard[]) => EQBoard[]
  > = {
    [EQParentsSelectionMethod.Random]: (boards) =>
      boards.sort(() => Math.random() - 0.5).slice(0, 2),
    [EQParentsSelectionMethod.BestFitness]: (boards) => boards.slice(0, 2),
    [EQParentsSelectionMethod.TournamentOfThree]: (boards) => {
      const tournamentSize = 3;
      const selectedBoards = boards
        .sort(() => Math.random() - 0.5)
        .slice(0, tournamentSize);
      return selectedBoards.sort((a, b) => a.fitness - b.fitness).slice(0, 2);
    },
  };
  static readonly MUTATION_METHODS: Record<
    EQMutationMethod,
    (board: EQBoard, currentIteration: number) => EQBoard
  > = {
    [EQMutationMethod.SwapAny]: EQBoard.createFromSwappingRandomPositions,
    [EQMutationMethod.SwapCollision]: EQBoard.createFromSwappingWithCollision,
  };
  static readonly RECOMBINATION_METHODS: Record<
    EQRecombinationMethod,
    (parent1: EQBoard, parent2: EQBoard, currentIteration: number) => EQBoard[]
  > = {
    [EQRecombinationMethod.CutAndCrossfill]:
      EQBoard.createTwoFromCutAndCrossfill,
    [EQRecombinationMethod.CycleCrossover]: EQBoard.createTwoFromCycleCrossover,
  };

  boards: EQBoard[] = [];
  #state: EQSolverState = EQSolverState.NotInitialized;
  #statistics: EQSolverStatistics | null = null;
  #currentIteration: number | null = null;

  constructor(parameters: EQSolverParameters) {
    this.parameters = parameters;
    Object.freeze(this.parameters);
  }

  get state(): EQSolverState {
    return this.#state;
  }

  get currentIteration(): number | null {
    return this.#currentIteration;
  }

  get statistics(): EQSolverStatistics | null {
    return this.#statistics;
  }

  initialize() {
    if (this.#state !== EQSolverState.NotInitialized) {
      return;
    }

    this.generateInitialPopulation();
    this.sortBoardsByFitness();
    this.#currentIteration = 0;
    this.#state = EQSolverState.InProgress;
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
    if (this.#state !== EQSolverState.InProgress) {
      throw new Error('Solver not in progress');
    }

    const parentCandidates = this.pickRandomBoards(
      this.parameters.parentCandidatesAmount,
    );

    const selectedParents =
      EightQueensSolver.PARENTS_SELECTION_METHODS[
        this.parameters.parentsSelectionMethod
      ](parentCandidates);
    let offspring = selectedParents;

    const recombinationChanceCounter: EQChanceCounter = {
      chancesRolled: 0,
      chancesHit: 0,
    };

    const mutationChanceCounter: EQChanceCounter = {
      chancesRolled: 0,
      chancesHit: 0,
    };

    recombinationChanceCounter.chancesRolled++;
    if (rollChance(this.parameters.recombinationProbability)) {
      offspring = EightQueensSolver.RECOMBINATION_METHODS[
        this.parameters.recombinationMethod
      ](selectedParents[0], selectedParents[1], this.#currentIteration!);
      recombinationChanceCounter.chancesHit++;
    }

    for (const [index, board] of offspring.entries()) {
      mutationChanceCounter.chancesRolled++;
      if (rollChance(this.parameters.mutationProbability)) {
        offspring[index] = EightQueensSolver.MUTATION_METHODS[
          this.parameters.mutationMethod
        ](board, this.#currentIteration!);
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
      EQInitialPopulation,
      () => EQBoard[]
    > = {
      [EQInitialPopulation.Random]: () =>
        Array.from({ length: this.parameters.populationSize }, () =>
          EQBoard.createRandomBoard(),
        ),
      [EQInitialPopulation.SequentialBoard]: () =>
        Array.from(
          { length: this.parameters.populationSize },
          () => new EQBoard([...EQBoard.ORDERED_POSITIONS]),
        ),
    };

    this.boards =
      initialPopulationGenerators[this.parameters.initialPopulation]();
  }

  pickRandomBoards(amount: number): EQBoard[] {
    if (amount === this.boards.length) {
      return [...this.boards];
    }

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
      EQSolverCompletionCondition,
      () => boolean
    > = {
      [EQSolverCompletionCondition.ConvergeOne]: () =>
        this.boards[0].fitness === 0,
      [EQSolverCompletionCondition.ConvergeAll]: () =>
        this.boards[this.boards.length - 1].fitness === 0,
    };

    if (isCompletionConditionSatisfied[this.parameters.completionCondition]()) {
      this.#state = EQSolverState.Solved;
      return;
    }

    if (this.#currentIteration! + 1 >= this.parameters.maxIterations) {
      this.#state = EQSolverState.ReachedMaxIterations;
    }
  }

  private updateStatistics(counters: {
    mutationChanceCounter: EQChanceCounter;
    recombinationChanceCounter: EQChanceCounter;
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
