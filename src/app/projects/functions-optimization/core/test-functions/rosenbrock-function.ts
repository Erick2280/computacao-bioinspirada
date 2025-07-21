import {
  FOFunctionDomain,
  FOPoint,
  FOTestFunction,
  FOTestFunctionType,
} from './test-function';

export class RosenbrockFunction extends FOTestFunction {
  readonly type = FOTestFunctionType.Rosenbrock;
  readonly domain: FOFunctionDomain = { min: -2.048, max: 2.048 };
  readonly globalMinimum: { point: FOPoint; value: number };

  constructor(dimensions: number) {
    super(dimensions);
    this.globalMinimum = {
      point: new Array(dimensions).fill(1),
      value: 0,
    };
  }

  evaluate(point: FOPoint): number {
    let sum = 0;

    for (let i = 0; i < point.length - 1; i++) {
      const xi = point[i];
      const xiPlus1 = point[i + 1];

      const term1 = 100 * Math.pow(xiPlus1 - xi * xi, 2);
      const term2 = Math.pow(1 - xi, 2);

      sum += term1 + term2;
    }

    return sum;
  }
}
