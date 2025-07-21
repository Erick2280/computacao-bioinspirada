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
  readonly sigmas?: number[]; // Strategy parameters for ES self-adaptive mutation

  constructor(
    genes: FOPoint,
    meta: FOIndividualMeta,
    iterationBorn = 0,
    sigmas?: number[],
  ) {
    this.genes = genes;
    this.meta = meta;
    this.sigmas = sigmas;
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

  static createRandom(
    meta: FOIndividualMeta,
    iterationBorn = 0,
    withSigmas = false,
  ): FOIndividual {
    const genes = meta.testFunction.generateRandomPoint();
    const sigmas = withSigmas ? Array(meta.dimensions).fill(0.1) : undefined; // Initial sigma values
    return new FOIndividual(genes, meta, iterationBorn, sigmas);
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
      const gaussianRandom = FOIndividual.generateGaussianRandom();

      const sigma = 0.1; // Standard deviation for mutation
      const mutation = gaussianRandom * sigma;
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
    return new FOIndividual(
      mutatedGenes,
      individual.meta,
      iterationBorn,
      individual.sigmas,
    );
  }

  static createFromSelfAdaptiveGaussianMutation(
    individual: FOIndividual,
    iterationBorn: number,
  ): FOIndividual {
    const tau = 1 / Math.sqrt(2 * Math.sqrt(individual.meta.dimensions));
    const tau0 = 1 / Math.sqrt(2 * individual.meta.dimensions);

    // Sigma bounds to prevent numerical issues
    const minSigma = 1e-6;
    const maxSigma =
      (individual.meta.testFunction.domain.max -
        individual.meta.testFunction.domain.min) /
      2;

    // Generate global random number for sigma mutation
    const globalNormal = FOIndividual.generateGaussianRandom();

    // Mutate strategy parameters (sigmas)
    const newSigmas = (
      individual.sigmas || Array(individual.meta.dimensions).fill(0.1)
    ).map((currentSigma) => {
      const localNormal = FOIndividual.generateGaussianRandom();
      let newSigma =
        currentSigma * Math.exp(tau0 * globalNormal + tau * localNormal);

      // Apply bounds to sigma
      newSigma = Math.max(minSigma, Math.min(maxSigma, newSigma));

      return newSigma;
    });

    // Mutate object variables using new sigmas
    const mutatedGenes = individual.genes.map((gene, index) => {
      const normal = FOIndividual.generateGaussianRandom();
      let newGene = gene + newSigmas[index] * normal;

      // Ensure bounds
      newGene = Math.max(individual.meta.testFunction.domain.min, newGene);
      newGene = Math.min(individual.meta.testFunction.domain.max, newGene);
      return newGene;
    });

    return new FOIndividual(
      mutatedGenes,
      individual.meta,
      iterationBorn,
      newSigmas,
    );
  }

  private static generateGaussianRandom(): number {
    // Static variables to store the second value from Box-Muller
    if (!FOIndividual.hasSpareGaussian) {
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);

      FOIndividual.spareGaussian = z1;
      FOIndividual.hasSpareGaussian = true;
      return z0;
    } else {
      FOIndividual.hasSpareGaussian = false;
      return FOIndividual.spareGaussian!;
    }
  }

  private static hasSpareGaussian = false;
  private static spareGaussian: number | null = null;

  static createTwoFromUniformCrossover(
    parent1: FOIndividual,
    parent2: FOIndividual,
    iterationBorn: number,
  ): [FOIndividual, FOIndividual] {
    this.verifyMetas(parent1, parent2);

    const offspring1Genes: number[] = [];
    const offspring2Genes: number[] = [];
    const offspring1Sigmas: number[] = [];
    const offspring2Sigmas: number[] = [];

    for (let i = 0; i < parent1.genes.length; i++) {
      if (Math.random() < 0.5) {
        offspring1Genes.push(parent1.genes[i]);
        offspring2Genes.push(parent2.genes[i]);
        if (parent1.sigmas && parent2.sigmas) {
          offspring1Sigmas.push(parent1.sigmas[i]);
          offspring2Sigmas.push(parent2.sigmas[i]);
        }
      } else {
        offspring1Genes.push(parent2.genes[i]);
        offspring2Genes.push(parent1.genes[i]);
        if (parent1.sigmas && parent2.sigmas) {
          offspring1Sigmas.push(parent2.sigmas[i]);
          offspring2Sigmas.push(parent1.sigmas[i]);
        }
      }
    }

    const sigmas1 =
      parent1.sigmas && parent2.sigmas ? offspring1Sigmas : parent1.sigmas;
    const sigmas2 =
      parent1.sigmas && parent2.sigmas ? offspring2Sigmas : parent2.sigmas;

    return [
      new FOIndividual(offspring1Genes, parent1.meta, iterationBorn, sigmas1),
      new FOIndividual(offspring2Genes, parent1.meta, iterationBorn, sigmas2),
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

    let sigmas1: number[] | undefined;
    let sigmas2: number[] | undefined;

    if (parent1.sigmas && parent2.sigmas) {
      sigmas1 = parent1.sigmas.map(
        (sigma, index) => alpha * sigma + (1 - alpha) * parent2.sigmas![index],
      );
      sigmas2 = parent1.sigmas.map(
        (sigma, index) => (1 - alpha) * sigma + alpha * parent2.sigmas![index],
      );
    } else {
      sigmas1 = parent1.sigmas;
      sigmas2 = parent2.sigmas;
    }

    return [
      new FOIndividual(offspring1Genes, parent1.meta, iterationBorn, sigmas1),
      new FOIndividual(offspring2Genes, parent1.meta, iterationBorn, sigmas2),
    ];
  }

  static createTwoFromIntermediateRecombination(
    parent1: FOIndividual,
    parent2: FOIndividual,
    iterationBorn: number,
  ): [FOIndividual, FOIndividual] {
    this.verifyMetas(parent1, parent2);

    // Intermediate recombination: arithmetic mean of parents
    const offspring1Genes = parent1.genes.map(
      (gene, index) => (gene + parent2.genes[index]) / 2,
    );
    const offspring2Genes = [...offspring1Genes]; // Both offspring are identical in intermediate recombination

    let sigmas1: number[] | undefined;
    let sigmas2: number[] | undefined;

    if (parent1.sigmas && parent2.sigmas) {
      sigmas1 = parent1.sigmas.map(
        (sigma, index) => (sigma + parent2.sigmas![index]) / 2,
      );
      sigmas2 = [...sigmas1];
    } else {
      sigmas1 = parent1.sigmas;
      sigmas2 = parent2.sigmas;
    }

    return [
      new FOIndividual(offspring1Genes, parent1.meta, iterationBorn, sigmas1),
      new FOIndividual(offspring2Genes, parent1.meta, iterationBorn, sigmas2),
    ];
  }

  static createTwoFromDiscreteRecombination(
    parent1: FOIndividual,
    parent2: FOIndividual,
    iterationBorn: number,
  ): [FOIndividual, FOIndividual] {
    this.verifyMetas(parent1, parent2);

    // Discrete recombination: randomly select each gene from either parent
    const offspring1Genes: number[] = [];
    const offspring2Genes: number[] = [];
    const offspring1Sigmas: number[] = [];
    const offspring2Sigmas: number[] = [];

    for (let i = 0; i < parent1.genes.length; i++) {
      // Each gene is independently selected from either parent with equal probability
      // First offspring
      if (Math.random() < 0.5) {
        offspring1Genes.push(parent1.genes[i]);
        if (parent1.sigmas && parent2.sigmas) {
          offspring1Sigmas.push(parent1.sigmas[i]);
        }
      } else {
        offspring1Genes.push(parent2.genes[i]);
        if (parent1.sigmas && parent2.sigmas) {
          offspring1Sigmas.push(parent2.sigmas[i]);
        }
      }

      // Second offspring (independent selection)
      if (Math.random() < 0.5) {
        offspring2Genes.push(parent1.genes[i]);
        if (parent1.sigmas && parent2.sigmas) {
          offspring2Sigmas.push(parent1.sigmas[i]);
        }
      } else {
        offspring2Genes.push(parent2.genes[i]);
        if (parent1.sigmas && parent2.sigmas) {
          offspring2Sigmas.push(parent2.sigmas[i]);
        }
      }
    }

    const sigmas1 =
      parent1.sigmas && parent2.sigmas ? offspring1Sigmas : parent1.sigmas;
    const sigmas2 =
      parent1.sigmas && parent2.sigmas ? offspring2Sigmas : parent2.sigmas;

    return [
      new FOIndividual(offspring1Genes, parent1.meta, iterationBorn, sigmas1),
      new FOIndividual(offspring2Genes, parent1.meta, iterationBorn, sigmas2),
    ];
  }
}
