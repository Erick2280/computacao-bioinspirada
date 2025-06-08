import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';

import { ChessBoardComponent } from '@app/projects/eight-queens/components/chess-board/chess-board.component';
import { SolverState } from '@app/projects/eight-queens/core/solver';
import { ExecutionService } from '@app/projects/eight-queens/services/execution.service';

@Component({
  selector: 'app-solving-panel',
  imports: [AsyncPipe, ChessBoardComponent],
  templateUrl: './solving-panel.component.html',
})
export class SolvingPanelComponent {
  executionService = inject(ExecutionService);

  SolverState = SolverState;
}
