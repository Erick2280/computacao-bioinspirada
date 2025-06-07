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

  constructor(positions: BoardPositions) {
    this.positions = positions;
    Object.freeze(this.positions);

    this.fitness = this.evaluateFitness();
  }

  private evaluateFitness(): number {
    // TODO: Is there a better way to calculate the fitness?
    let collisions = 0;
    for (let i = 0; i < this.positions.length; i++) {
      for (let j = 0; j < this.positions.length; j++) {
        if (i !== j) {
          const baseIndex = Board.ORDERED_POSITIONS.indexOf(this.positions[i]);
          const testingIndex = Board.ORDERED_POSITIONS.indexOf(
            this.positions[j],
          );
          const difference = Math.abs(i - j);

          if (Math.abs(baseIndex - testingIndex) === difference) {
            collisions++;
          }
        }
      }
    }

    return collisions / 2; // Each collision is counted twice, so we divide by 2
  }

  static createRandomBoard(): Board {
    const positions: BoardPositions = [...this.ORDERED_POSITIONS];

    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    return new Board(positions);
  }

  static createFromSwappingRandomPositions(board: Board): Board {
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

    return new Board(mutatedPositions as BoardPositions);
  }

  static createTwoFromCutAndCrossfill(
    board1: Board,
    board2: Board,
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
      new Board(offspring1 as BoardPositions),
      new Board(offspring2 as BoardPositions),
    ];
  }

  private getRandomIndex(length: number): number {
    return Math.floor(Math.random() * length);
  }

  private getCrossfill(offspring: QueenPosition[]): QueenPosition[] {
    return this.positions.filter((piece) => !offspring.includes(piece));
  }
}
