import { FOFunctionDomain, FOPoint, FOTestFunction } from './test-function';

export class SchwefelFunction extends FOTestFunction {
  readonly name = 'Schwefel';
  readonly domain: FOFunctionDomain = { min: -500, max: 500 };
  readonly globalMinimum: { point: FOPoint; value: number };

  constructor(dimensions: number) {
    super(dimensions);
    this.globalMinimum = {
      point: new Array(dimensions).fill(420.9687),
      value: 0,
    };
  }

  evaluate(point: FOPoint): number {
    const n = point.length;

    const sum = point.reduce((sum, xi) => {
      return sum + xi * Math.sin(Math.sqrt(Math.abs(xi)));
    }, 0);

    return 418.9829 * n - sum;
  }
}
