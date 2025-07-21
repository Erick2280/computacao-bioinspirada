import { AsyncPipe, NgClass } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  remixBracketsFill,
  remixCheckFill,
  remixContractRightFill,
  remixHand,
  remixLayoutGridFill,
  remixLoaderFill,
  remixPauseFill,
  remixPlayFill,
  remixResetLeftFill,
  remixSwordLine,
} from '@ng-icons/remixicon';

import { EQNewExecutionCardComponent } from '@app/projects/eight-queens/components/new-execution-card/new-execution-card.component';
import {
  EQSolvingPanelComponent,
  ViewingOptions,
} from '@app/projects/eight-queens/components/solving-panel/solving-panel.component';
import { EQSolverState } from '@app/projects/eight-queens/core/solver';
import { EQExecutionService } from '@app/projects/eight-queens/services/execution.service';

@Component({
  selector: 'app-eight-queens',
  imports: [
    RouterModule,
    NgIcon,
    EQNewExecutionCardComponent,
    AsyncPipe,
    NgClass,
    EQSolvingPanelComponent,
    FormsModule,
  ],
  templateUrl: './eight-queens.component.html',
  viewProviders: [
    provideIcons({
      remixLayoutGridFill,
      remixBracketsFill,
      remixCheckFill,
      remixHand,
      remixPlayFill,
      remixPauseFill,
      remixResetLeftFill,
      remixContractRightFill,
      remixLoaderFill,
      remixSwordLine,
    }),
  ],
})
export class EightQueensPageComponent {
  executionService = inject(EQExecutionService);
  viewingOptions = signal<ViewingOptions>({
    showChessBoards: true,
    showGenotypes: true,
    highlightCollisionsOnHover: false,
  });

  SolverState = EQSolverState;
}
