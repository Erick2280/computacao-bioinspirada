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

  initialize() {
    if (this.#state !== SolverState.NotInitialized) {
      return;
    }

    this.generateInitialPopulation();
    this.sortBoardsByFitness();
    this.#currentIteration = 0;
    this.#state = SolverState.InProgress;
    this.checkForCompletion();
  }

  // TODO: How much more data can we expose for the UI?
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

    // TODO: In the future, we might want to implement other recombination and mutation methods,
    // maybe using different classes for each method.
    if (rollChance(this.parameters.recombinationProbability)) {
      offspring = Board.createTwoFromCutAndCrossfill(
        selectedParents[0],
        selectedParents[1],
        this.#currentIteration!,
      );
    }

    for (const [index, board] of offspring.entries()) {
      if (rollChance(this.parameters.mutationProbability)) {
        offspring[index] = Board.createFromSwappingRandomPositions(
          board,
          this.#currentIteration!,
        );
      }
    }

    this.boards.push(...offspring);
    this.sortBoardsByFitness();
    this.cutPopulationToSize();
    this.checkForCompletion();

    this.#currentIteration!++;
  }

  private generateInitialPopulation() {
    if (this.parameters.initialPopulation === InitialPopulation.Random) {
      this.boards = Array.from({ length: this.parameters.populationSize }, () =>
        Board.createRandomBoard(),
      );
    }

    if (this.parameters.initialPopulation === InitialPopulation.WorstBoard) {
      this.boards = Array.from(
        { length: this.parameters.populationSize },
        () => new Board([...Board.ORDERED_POSITIONS]),
      );
    }
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
    if (
      this.parameters.completionCondition ===
        SolverCompletionCondition.ConvergeOne &&
      this.boards[0].fitness === 0
    ) {
      this.#state = SolverState.Solved;
    }

    if (
      this.parameters.completionCondition ===
        SolverCompletionCondition.ConvergeAll &&
      this.boards[this.boards.length - 1].fitness === 0
    ) {
      this.#state = SolverState.Solved;
    }

    if (this.#currentIteration! + 1 >= this.parameters.maxIterations) {
      this.#state = SolverState.ReachedMaxIterations;
    }
  }
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
