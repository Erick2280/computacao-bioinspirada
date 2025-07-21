import { AsyncPipe, DecimalPipe } from '@angular/common';
import { AfterViewInit, Component, OnDestroy, inject } from '@angular/core';

import { Subscription } from 'rxjs';

import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  remixArrowDownLine,
  remixArrowUpLine,
  remixBarChartLine,
  remixCalculatorLine,
  remixEqualizerLine,
  remixExpandWidthLine,
  remixFocusLine,
  remixFunctions,
  remixLineChartLine,
  remixPieChartLine,
} from '@ng-icons/remixicon';
import * as Plot from '@observablehq/plot';

import { FOSolverState, FunctionOptimizationSolver } from '../../core/solver';
import { FOExecutionService } from '../../services/execution.service';

@Component({
  selector: 'app-fo-solving-panel',
  imports: [AsyncPipe, NgIcon, DecimalPipe],
  templateUrl: './solving-panel.component.html',
  viewProviders: [
    provideIcons({
      remixArrowDownLine,
      remixArrowUpLine,
      remixBarChartLine,
      remixCalculatorLine,
      remixEqualizerLine,
      remixExpandWidthLine,
      remixFocusLine,
      remixFunctions,
      remixLineChartLine,
      remixPieChartLine,
    }),
  ],
})
export class FOSolvingPanelComponent implements AfterViewInit, OnDestroy {
  executionService = inject(FOExecutionService);

  SolverState = FOSolverState;

  runningSolverSubscription: Subscription | null = null;

  ngAfterViewInit() {
    this.runningSolverSubscription =
      this.executionService.runningSolver$.subscribe((solver) => {
        if (!solver?.statistics) {
          return;
        }
        this.renderCharts(solver);
      });
  }

  renderCharts(solver: FunctionOptimizationSolver) {
    const statistics = solver.statistics!;
    const iterations = Array.from(
      { length: statistics.fitness.best.length },
      (_, index) => index,
    );

    const data = iterations.map((iteration) => ({
      iteration,
      bestFitness: statistics.fitness.best[iteration],
      worstFitness: statistics.fitness.worst[iteration],
      meanFitness: statistics.fitness.average[iteration],
      medianFitness: statistics.fitness.median[iteration],
      standardDeviationFitness: statistics.fitness.standardDeviation[iteration],
      meanAge: statistics.age.average[iteration],
      oldestAge: statistics.age.oldest[iteration],
      earlierIteration: statistics.age.earlierIterationAlive[iteration],
      // Add sigma data if available
      sigmaMean: statistics.sigma?.average[iteration],
      sigmaBest: statistics.sigma?.best[iteration],
      sigmaWorst: statistics.sigma?.worst[iteration],
    }));

    const commonStyle = {
      background: 'transparent',
      fontSize: '14px',
      fontFamily: "'IBM Plex Sans', sans-serif",
      color: '#37332f',
    };

    const commonOptions = {
      x: {
        label: 'Iteração →',
        grid: true,
      },
      style: commonStyle,
      color: {
        legend: true,
      },
      marginTop: 32,
      marginBottom: 48,
    };

    const fitnessChart = Plot.plot({
      ...commonOptions,
      y: {
        grid: true,
        label: 'Fitness →',
      },
      marks: [
        Plot.ruleY([0]),
        Plot.line(data, {
          x: 'iteration',
          y: 'bestFitness',
          stroke: '#0d9488',
          strokeWidth: 2,
          tip: true,
          title: 'Melhor',
        }),
        Plot.line(data, {
          x: 'iteration',
          y: 'worstFitness',
          stroke: '#d97706',
          strokeWidth: 1,
          tip: true,
          title: 'Pior',
        }),
        Plot.line(data, {
          x: 'iteration',
          y: 'meanFitness',
          stroke: '#0d9488',
          strokeWidth: 1,
          opacity: 0.6,
          tip: true,
          title: 'Média',
        }),
        Plot.line(data, {
          x: 'iteration',
          y: 'medianFitness',
          stroke: '#0d9488',
          strokeWidth: 1,
          opacity: 0.8,
          strokeDasharray: '4',
          tip: true,
          title: 'Mediana',
        }),
      ],
    });

    const standardDeviationChart = Plot.plot({
      ...commonOptions,
      y: {
        grid: true,
        label: 'Desvio padrão →',
      },
      marks: [
        Plot.line(data, {
          x: 'iteration',
          y: 'standardDeviationFitness',
          stroke: '#0d9488',
          strokeWidth: 2,
          tip: true,
          title: 'Desvio padrão',
        }),
      ],
    });

    const ageChart = Plot.plot({
      ...commonOptions,
      y: {
        grid: true,
        label: 'Idade →',
      },
      marks: [
        Plot.ruleY([0]),
        Plot.line(data, {
          x: 'iteration',
          y: 'meanAge',
          stroke: '#0d9488',
          strokeWidth: 2,
          tip: true,
          title: 'Idade média',
        }),
        Plot.line(data, {
          x: 'iteration',
          y: 'oldestAge',
          stroke: '#d97706',
          strokeWidth: 1,
          tip: true,
          title: 'Indivíduo mais velho',
        }),
      ],
    });

    const earlierIterationChart = Plot.plot({
      ...commonOptions,
      y: {
        grid: true,
        label: 'Iteração mais antiga →',
      },
      marks: [
        Plot.ruleY([0]),
        Plot.line(data, {
          x: 'iteration',
          y: 'earlierIteration',
          stroke: '#0d9488',
          strokeWidth: 2,
          tip: true,
          title: 'Iteração mais antiga',
        }),
      ],
    });

    const currentFitnessValues = solver.individuals.map(
      (individual) => individual.fitness,
    );

    const fitnessHistogramChart = Plot.plot({
      ...commonOptions,
      x: {
        label: 'Fitness →',
        grid: true,
      },
      y: {
        label: 'Frequência →',
        grid: true,
      },
      marks: [
        Plot.rectY(currentFitnessValues, {
          ...Plot.binX(
            { y: 'count' },
            {
              x: (d) => d,
            },
          ),
          fill: '#0d9488',
        }),
      ],
    });

    let sigmaChart = null;
    let sigmaHistogramChart = null;

    if (
      statistics.sigma &&
      solver.parameters.mutationMethod === 'SelfAdaptiveGaussianMutation'
    ) {
      sigmaChart = Plot.plot({
        ...commonOptions,
        y: {
          grid: true,
          label: 'Sigma →',
        },
        marks: [
          Plot.ruleY([0]),
          Plot.line(data, {
            x: 'iteration',
            y: 'sigmaMean',
            stroke: '#0d9488',
            strokeWidth: 2,
            tip: true,
            title: 'Sigma médio',
          }),
          Plot.line(data, {
            x: 'iteration',
            y: 'sigmaBest',
            stroke: '#0d9488',
            strokeWidth: 1,
            tip: true,
            title: 'Sigma mínimo',
          }),
          Plot.line(data, {
            x: 'iteration',
            y: 'sigmaWorst',
            stroke: '#d97706',
            strokeWidth: 1,
            tip: true,
            title: 'Sigma máximo',
          }),
        ],
      });

      const currentSigmaValues = solver.individuals
        .filter((individual) => individual.sigmas)
        .flatMap((individual) => individual.sigmas!);

      if (currentSigmaValues.length > 0) {
        sigmaHistogramChart = Plot.plot({
          ...commonOptions,
          x: {
            label: 'Sigma →',
            grid: true,
          },
          y: {
            label: 'Frequência →',
            grid: true,
          },
          marks: [
            Plot.rectY(currentSigmaValues, {
              ...Plot.binX(
                { y: 'count' },
                {
                  x: (d) => d,
                },
              ),
              fill: '#0d9488',
            }),
          ],
        });
      }
    }

    requestAnimationFrame(() => {
      const fitnessChartElement = document.getElementById('fitness-chart');
      const standardDeviationChartElement = document.getElementById(
        'fitness-standard-deviation-chart',
      );
      const ageChartElement = document.getElementById('age-chart');
      const earlierIterationChartElement = document.getElementById(
        'earlier-iteration-alive-chart',
      );
      const fitnessHistogramChartElement = document.getElementById(
        'fitness-histogram-chart',
      );
      const sigmaChartElement = document.getElementById('sigma-chart');
      const sigmaHistogramChartElement = document.getElementById(
        'sigma-histogram-chart',
      );

      if (fitnessChartElement) {
        fitnessChartElement.replaceChildren(fitnessChart);
      }
      if (standardDeviationChartElement) {
        standardDeviationChartElement.replaceChildren(standardDeviationChart);
      }
      if (ageChartElement) {
        ageChartElement.replaceChildren(ageChart);
      }
      if (earlierIterationChartElement) {
        earlierIterationChartElement.replaceChildren(earlierIterationChart);
      }
      if (fitnessHistogramChartElement) {
        fitnessHistogramChartElement.replaceChildren(fitnessHistogramChart);
      }
      if (sigmaChart && sigmaChartElement) {
        sigmaChartElement.replaceChildren(sigmaChart);
      }
      if (sigmaHistogramChart && sigmaHistogramChartElement) {
        sigmaHistogramChartElement.replaceChildren(sigmaHistogramChart);
      }
    });
  }

  ngOnDestroy() {
    this.runningSolverSubscription?.unsubscribe();
  }
}
