export type QueenPosition = [boolean, boolean, boolean];
export type BoardPositions = [
  QueenPosition,
  QueenPosition,
  QueenPosition,
  QueenPosition,
  QueenPosition,
  QueenPosition,
  QueenPosition,
  QueenPosition,
];

export class Board {
  // Each board instance should be immutable. All mutations and recombinations should return a new Board instance.

  readonly fitness: number;
  readonly positions: BoardPositions;
  readonly iterationBorn: number;
  readonly collisionIndexes: Map<number, number[]>;

  static readonly ORDERED_POSITIONS: BoardPositions = [
    [false, false, false],
    [false, false, true],
    [false, true, false],
    [false, true, true],
    [true, false, false],
    [true, false, true],
    [true, true, false],
    [true, true, true],
  ];

  constructor(positions: BoardPositions, iterationBorn = 0) {
    this.positions = positions;
    Object.freeze(this.positions);

    this.iterationBorn = iterationBorn;
    const { collisions, collisionIndexes } = this.findCollisions();
    this.fitness = collisions;
    this.collisionIndexes = collisionIndexes;
  }

  private findCollisions() {
    let collisions = 0;
    const collisionIndexes = new Map<number, number[]>(
      this.positions.map((_, index) => [index, []]),
    );

    const queenRows = this.positions.map((pos) =>
      Board.ORDERED_POSITIONS.indexOf(pos),
    );

    for (let i = 0; i < queenRows.length - 1; i++) {
      const row1 = queenRows[i];

      for (let j = i + 1; j < queenRows.length; j++) {
        const row2 = queenRows[j];
        const columnsDifference = j - i;

        // Check if queens are on the same diagonal
        // Two queens are on the same diagonal if the difference in their rows
        // equals the difference in their columns
        if (Math.abs(row1 - row2) === columnsDifference) {
          collisions++;
          collisionIndexes.get(i)!.push(j);
          collisionIndexes.get(j)!.push(i);
        }
      }
    }

    return {
      collisions,
      collisionIndexes,
    };
  }

  static createRandomBoard(iterationBorn = 0): Board {
    const positions: BoardPositions = [...this.ORDERED_POSITIONS];

    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    return new Board(positions, iterationBorn);
  }

  static createFromSwappingRandomPositions(
    board: Board,
    iterationBorn = 0,
  ): Board {
    const mutatedPositions = [...board.positions];
    let indexesToSwap: [number, number] | undefined = undefined;

    while (
      indexesToSwap === undefined ||
      indexesToSwap[0] === indexesToSwap[1]
    ) {
      indexesToSwap = [
        board.getRandomIndex(mutatedPositions.length),
        board.getRandomIndex(mutatedPositions.length),
      ];
    }

    [mutatedPositions[indexesToSwap[0]], mutatedPositions[indexesToSwap[1]]] = [
      mutatedPositions[indexesToSwap[1]],
      mutatedPositions[indexesToSwap[0]],
    ];

    return new Board(mutatedPositions as BoardPositions, iterationBorn);
  }

  static createTwoFromCutAndCrossfill(
    board1: Board,
    board2: Board,
    iterationBorn: number,
  ): [Board, Board] {
    const cutPoint = board1.getRandomIndex(board1.positions.length);

    const offspringCut1 = board1.positions.slice(0, cutPoint);
    const offspringCut2 = board2.positions.slice(0, cutPoint);

    const offspring1 = [
      ...offspringCut1,
      ...board2.getCrossfill(offspringCut1),
    ];
    const offspring2 = [
      ...offspringCut2,
      ...board1.getCrossfill(offspringCut2),
    ];

    return [
      new Board(offspring1 as BoardPositions, iterationBorn),
      new Board(offspring2 as BoardPositions, iterationBorn),
    ];
  }

  private getRandomIndex(length: number): number {
    return Math.floor(Math.random() * length);
  }

  private getCrossfill(offspring: QueenPosition[]): QueenPosition[] {
    return this.positions.filter((piece) => !offspring.includes(piece));
  }
}
