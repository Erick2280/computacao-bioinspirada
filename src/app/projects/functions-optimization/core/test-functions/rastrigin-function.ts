import { FOFunctionDomain, FOPoint, FOTestFunction } from './test-function';

export class RastriginFunction extends FOTestFunction {
  readonly name = 'Rastrigin';
  readonly domain: FOFunctionDomain = { min: -5.12, max: 5.12 };
  readonly globalMinimum: { point: FOPoint; value: number };

  constructor(dimensions: number) {
    super(dimensions);
    this.globalMinimum = {
      point: new Array(dimensions).fill(0),
      value: 0,
    };
  }

  evaluate(point: FOPoint): number {
    const A = 10;
    const n = point.length;

    const sum = point.reduce((sum, xi) => {
      return sum + (xi * xi - A * Math.cos(2 * Math.PI * xi));
    }, 0);

    return A * n + sum;
  }
}
