import { FOPoint, FOTestFunction } from './test-functions/test-function';

export interface FOIndividualMeta {
  testFunction: FOTestFunction;
  dimensions: number;
}

export class FOIndividual {
  readonly fitness: number;
  readonly genes: FOPoint;
  readonly iterationBorn: number;
  readonly meta: FOIndividualMeta;

  constructor(genes: FOPoint, meta: FOIndividualMeta, iterationBorn = 0) {
    this.genes = genes;
    this.meta = meta;
    if (genes.length !== meta.dimensions) {
      throw new Error(
        `Genes length (${genes.length}) does not match dimensions (${meta.dimensions})`,
      );
    }
    this.iterationBorn = iterationBorn;
    this.fitness = this.evaluateFitness();
  }

  private evaluateFitness(): number {
    return this.meta.testFunction.evaluate(this.genes);
  }

  distanceToGlobalMinimum(): number {
    return this.meta.testFunction.distanceToGlobalMinimum(this.genes);
  }

  relativeError(): number {
    return this.meta.testFunction.relativeError(this.genes);
  }

  static createRandom(meta: FOIndividualMeta, iterationBorn = 0): FOIndividual {
    const genes = meta.testFunction.generateRandomPoint();
    return new FOIndividual(genes, meta, iterationBorn);
  }

  static verifyMetas(
    individual1: FOIndividual,
    individual2: FOIndividual,
  ): void {
    if (
      individual1.meta.testFunction !== individual2.meta.testFunction ||
      individual1.meta.dimensions !== individual2.meta.dimensions
    ) {
      throw new Error(
        `Individual metas do not match: ${JSON.stringify(individual1.meta)} vs ${JSON.stringify(individual2.meta)}`,
      );
    }
  }

  static createFromUniformRecombination(
    parent1: FOIndividual,
    parent2: FOIndividual,
    iterationBorn = 0,
  ): FOIndividual {
    this.verifyMetas(parent1, parent2);

    const genes = parent1.genes.map((gene, index) => {
      return Math.random() < 0.5 ? gene : parent2.genes[index];
    });

    return new FOIndividual(genes, parent1.meta, iterationBorn);
  }

  static createFromGaussianMutation(
    individual: FOIndividual,
    iterationBorn: number,
  ): FOIndividual {
    const mutatedGenes = individual.genes.map((gene) => {
      // Box-Muller transform to generate Gaussian random numbers
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

      const sigma = 0.1; // Standard deviation for mutation
      const mutation = z0 * sigma;
      let newGene = gene + mutation;

      newGene = Math.max(individual.meta.testFunction.domain.min, newGene);
      newGene = Math.min(individual.meta.testFunction.domain.max, newGene);
      return newGene;
    });
    return new FOIndividual(mutatedGenes, individual.meta, iterationBorn);
  }

  static createFromUniformMutation(
    individual: FOIndividual,
    iterationBorn: number,
    mutationChance = 0.1,
  ): FOIndividual {
    const mutatedGenes = individual.genes.map((gene) => {
      if (Math.random() < mutationChance) {
        return (
          Math.random() *
            (individual.meta.testFunction.domain.max -
              individual.meta.testFunction.domain.min) +
          individual.meta.testFunction.domain.min
        );
      }
      return gene;
    });
    return new FOIndividual(mutatedGenes, individual.meta, iterationBorn);
  }

  static createTwoFromUniformCrossover(
    parent1: FOIndividual,
    parent2: FOIndividual,
    iterationBorn: number,
  ): [FOIndividual, FOIndividual] {
    this.verifyMetas(parent1, parent2);

    const offspring1Genes: number[] = [];
    const offspring2Genes: number[] = [];

    for (let i = 0; i < parent1.genes.length; i++) {
      if (Math.random() < 0.5) {
        offspring1Genes.push(parent1.genes[i]);
        offspring2Genes.push(parent2.genes[i]);
      } else {
        offspring1Genes.push(parent2.genes[i]);
        offspring2Genes.push(parent1.genes[i]);
      }
    }

    return [
      new FOIndividual(offspring1Genes, parent1.meta, iterationBorn),
      new FOIndividual(offspring2Genes, parent1.meta, iterationBorn),
    ];
  }

  static createTwoFromArithmeticCrossover(
    parent1: FOIndividual,
    parent2: FOIndividual,
    iterationBorn: number,
  ): [FOIndividual, FOIndividual] {
    this.verifyMetas(parent1, parent2);

    const alpha = Math.random();
    const offspring1Genes = parent1.genes.map(
      (gene, index) => alpha * gene + (1 - alpha) * parent2.genes[index],
    );
    const offspring2Genes = parent1.genes.map(
      (gene, index) => (1 - alpha) * gene + alpha * parent2.genes[index],
    );
    return [
      new FOIndividual(offspring1Genes, parent1.meta, iterationBorn),
      new FOIndividual(offspring2Genes, parent1.meta, iterationBorn),
    ];
  }
}
