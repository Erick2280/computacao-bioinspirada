import { PercentPipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  OnDestroy,
  inject,
  signal,
} from '@angular/core';

import { Subscription } from 'rxjs';

import * as Plot from '@observablehq/plot';

import {
  ChanceCounter,
  EightQueensSolver,
} from '@app/projects/eight-queens/core/solver';
import { ExecutionService } from '@app/projects/eight-queens/services/execution.service';

@Component({
  selector: 'app-statistics-dashboard',
  imports: [PercentPipe],
  templateUrl: './statistics-dashboard.component.html',
})
export class StatisticsDashboardComponent implements AfterViewInit, OnDestroy {
  executionService = inject(ExecutionService);

  mutationObservedProbability = signal<number>(0);
  recombinationObservedProbability = signal<number>(0);
  mutationChanceCounter = signal<ChanceCounter | null>(null);
  recombinationChanceCounter = signal<ChanceCounter | null>(null);

  runningSolverSubscription: Subscription | null = null;

  ngAfterViewInit() {
    this.runningSolverSubscription =
      this.executionService.runningSolver$.subscribe((solver) => {
        if (!solver?.statistics) {
          return;
        }
        this.updateProbabilities(solver);
        this.renderCharts(solver);
      });
  }

  renderCharts(solver: EightQueensSolver) {
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
          title: 'Tabuleiro mais velho',
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

    requestAnimationFrame(() => {
      const fitnessChartElement = document.getElementById('fitness-chart');
      const standardDeviationChartElement = document.getElementById(
        'fitness-standard-deviation-chart',
      );
      const ageChartElement = document.getElementById('age-chart');
      const earlierIterationChartElement = document.getElementById(
        'earlier-iteration-alive-chart',
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
    });
  }

  updateProbabilities(solver: EightQueensSolver) {
    this.mutationChanceCounter.set(solver.statistics!.mutation);
    this.recombinationChanceCounter.set(solver.statistics!.recombination);

    this.mutationObservedProbability.set(
      this.calculateProbabilityFromChanceCounter(solver.statistics!.mutation),
    );
    this.recombinationObservedProbability.set(
      this.calculateProbabilityFromChanceCounter(
        solver.statistics!.recombination,
      ),
    );
  }

  calculateProbabilityFromChanceCounter(counter: ChanceCounter) {
    return counter.chancesHit / counter.chancesRolled;
  }

  ngOnDestroy() {
    this.runningSolverSubscription?.unsubscribe();
  }
}
