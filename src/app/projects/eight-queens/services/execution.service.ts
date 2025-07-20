import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

import { EQSolverState, EightQueensSolver } from '../core/solver';

@Injectable({
  providedIn: 'root',
})
export class EQExecutionService {
  #runningSolver: EightQueensSolver | null = null;
  #runningContinuously = false;

  #runningSolverBehaviorSubject = new BehaviorSubject<EightQueensSolver | null>(
    null,
  );
  runningSolver$ = this.#runningSolverBehaviorSubject.asObservable();

  get runningContinuously(): boolean {
    return this.#runningContinuously;
  }

  start(solver: EightQueensSolver) {
    this.#runningSolver = solver;
    this.#runningSolver.initialize();
    this.updateObservable();
  }

  step() {
    if (!this.#runningSolver) {
      throw new Error('No solver running');
    }

    if (this.#runningSolver.state !== 'InProgress') {
      throw new Error('Solver not in progress');
    }

    this.#runningSolver.iterate();
    this.updateObservable();
  }

  runContinuously() {
    this.#runningContinuously = true;

    const runNextIteration = () => {
      this.step();
      this.updateObservable();

      if (
        this.#runningSolver?.state === EQSolverState.InProgress &&
        this.#runningContinuously
      ) {
        // Schedule the next iteration after a short delay
        // This allows the UI to update and prevents blocking the main thread.
        setTimeout(runNextIteration, 100);
      }
    };

    if (this.#runningSolver?.state !== EQSolverState.InProgress) {
      return;
    }

    // Start the first iteration
    setTimeout(runNextIteration, 100);
  }

  pauseContinuousRun() {
    this.#runningContinuously = false;
  }

  clear() {
    this.pauseContinuousRun();
    this.#runningSolver = null;
    this.updateObservable();
  }

  private updateObservable() {
    this.#runningSolverBehaviorSubject.next(this.#runningSolver);
  }
}
