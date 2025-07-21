export interface FOFunctionDomain {
  min: number;
  max: number;
}

export type FOPoint = number[];

export enum FOTestFunctionType {
  Ackley = 'Ackley',
  Schwefel = 'Schwefel',
  Rastrigin = 'Rastrigin',
  Rosenbrock = 'Rosenbrock',
}

export abstract class FOTestFunction {
  abstract readonly type: FOTestFunctionType;
  abstract readonly domain: FOFunctionDomain;
  abstract readonly globalMinimum: { point: FOPoint; value: number };
  readonly dimensions: number;

  constructor(dimensions: number) {
    this.dimensions = dimensions;
  }

  generateRandomPoint(): FOPoint {
    return Array.from(
      { length: this.dimensions },
      () =>
        Math.random() * (this.domain.max - this.domain.min) + this.domain.min,
    ) as FOPoint;
  }

  abstract evaluate(point: FOPoint): number;

  distanceToGlobalMinimum(x: FOPoint): number {
    let distance = 0;

    for (let i = 0; i < x.length; i++) {
      const diff = x[i] - this.globalMinimum.point[i];
      distance += diff * diff;
    }

    return Math.sqrt(distance);
  }

  relativeError(x: number[]): number {
    const currentValue = this.evaluate(x);
    const globalValue = this.globalMinimum.value;

    if (Math.abs(globalValue) < 1e-10) {
      return Math.abs(currentValue - globalValue);
    }

    return Math.abs(currentValue - globalValue) / Math.abs(globalValue);
  }
}
