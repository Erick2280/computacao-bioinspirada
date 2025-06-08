import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

import { EightQueensSolver, SolverState } from '../core/solver';

@Injectable({
  providedIn: 'root',
})
export class ExecutionService {
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
      throw new Error('NoSolverRunning');
    }

    if (this.#runningSolver.state !== 'InProgress') {
      throw new Error('SolverNotInProgress');
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
        this.#runningSolver?.state === SolverState.InProgress &&
        this.#runningContinuously
      ) {
        // Schedule the next iteration after a short delay
        // This allows the UI to update and prevents blocking the main thread.
        setTimeout(runNextIteration, 20);
      }
    };

    // Start the first iteration
    setTimeout(runNextIteration, 20);
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
