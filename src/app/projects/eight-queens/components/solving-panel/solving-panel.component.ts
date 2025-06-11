import { AsyncPipe, NgClass } from '@angular/common';
import { Component, inject, input } from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { remixCheckFill } from '@ng-icons/remixicon';

import { ChessBoardComponent } from '@app/projects/eight-queens/components/chess-board/chess-board.component';
import { SolverState } from '@app/projects/eight-queens/core/solver';
import { GenotypePipe } from '@app/projects/eight-queens/pipes/genotype.pipe';
import { ExecutionService } from '@app/projects/eight-queens/services/execution.service';

@Component({
  selector: 'app-solving-panel',
  imports: [AsyncPipe, ChessBoardComponent, NgIcon, GenotypePipe, NgClass],
  templateUrl: './solving-panel.component.html',
  viewProviders: [provideIcons({ remixCheckFill })],
})
export class SolvingPanelComponent {
  executionService = inject(ExecutionService);
  viewingOptions = input.required<ViewingOptions>();

  SolverState = SolverState;
}

export interface ViewingOptions {
  showChessBoards: boolean;
  showGenotypes: boolean;
}
