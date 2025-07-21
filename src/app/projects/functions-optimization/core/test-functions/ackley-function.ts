import {
  FOFunctionDomain,
  FOPoint,
  FOTestFunction,
  FOTestFunctionType,
} from './test-function';

export class AckleyFunction extends FOTestFunction {
  readonly type = FOTestFunctionType.Ackley;
  readonly domain: FOFunctionDomain = { min: -32.768, max: 32.768 };
  readonly globalMinimum: { point: FOPoint; value: number };

  constructor(dimensions: number) {
    super(dimensions);
    this.globalMinimum = {
      point: new Array(dimensions).fill(0),
      value: 0,
    };
  }

  evaluate(point: FOPoint): number {
    const a = 20;
    const b = 0.2;
    const c = 2 * Math.PI;
    const n = point.length;

    const sumSquares = point.reduce((sum, xi) => sum + xi * xi, 0);
    const sumCosines = point.reduce((sum, xi) => sum + Math.cos(c * xi), 0);

    const term1 = -a * Math.exp(-b * Math.sqrt(sumSquares / n));
    const term2 = -Math.exp(sumCosines / n);
    const term3 = a + Math.E;

    return term1 + term2 + term3;
  }
}
