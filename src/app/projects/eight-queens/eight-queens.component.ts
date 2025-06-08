import { AsyncPipe, NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
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
} from '@ng-icons/remixicon';

import { NewExecutionCardComponent } from '@app/projects/eight-queens/components/new-execution-card/new-execution-card.component';
import { SolvingPanelComponent } from '@app/projects/eight-queens/components/solving-panel/solving-panel.component';
import { SolverState } from '@app/projects/eight-queens/core/solver';
import { ExecutionService } from '@app/projects/eight-queens/services/execution.service';

@Component({
  selector: 'app-eight-queens',
  imports: [
    RouterModule,
    NgIcon,
    NewExecutionCardComponent,
    AsyncPipe,
    NgClass,
    SolvingPanelComponent,
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
    }),
  ],
})
export class EightQueensPageComponent {
  executionService = inject(ExecutionService);

  SolverState = SolverState;
}
