import { AsyncPipe, NgClass } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { remixCheckFill } from '@ng-icons/remixicon';

import { ChessBoardComponent } from '@app/projects/eight-queens/components/chess-board/chess-board.component';
import { EQSolverState } from '@app/projects/eight-queens/core/solver';
import { GenotypePipe } from '@app/projects/eight-queens/pipes/genotype.pipe';
import { EQExecutionService } from '@app/projects/eight-queens/services/execution.service';

import { EQStatisticsDashboardComponent } from '../statistics-dashboard/statistics-dashboard.component';

@Component({
  selector: 'app-eq-solving-panel',
  imports: [
    AsyncPipe,
    ChessBoardComponent,
    EQStatisticsDashboardComponent,
    NgIcon,
    GenotypePipe,
    NgClass,
  ],
  templateUrl: './solving-panel.component.html',
  viewProviders: [provideIcons({ remixCheckFill })],
})
export class EQSolvingPanelComponent {
  readonly TAB_ID_PREFIX = 'solving-panel-tab-';
  readonly TABPANEL_ID_PREFIX = 'solving-panel-tabpanel-';

  executionService = inject(EQExecutionService);
  viewingOptions = input.required<ViewingOptions>();

  SolverState = EQSolverState;
  PanelTab = PanelTab;

  selectedTab = signal<PanelTab>(PanelTab.Boards);
  tabs = Object.values(PanelTab);
  labeledTabs: LabeledTab[] = [
    { label: 'Tabuleiros', value: PanelTab.Boards },
    { label: 'Estatísticas', value: PanelTab.Statistics },
  ];

  selectTab(tab: PanelTab) {
    this.selectedTab.set(tab);
  }

  handleKeypressOnTabSelector(currentTab: PanelTab, event: KeyboardEvent) {
    const modulo = (n: number, m: number) => ((n % m) + m) % m;
    let keypressHandled = false;

    switch (event.key) {
      case 'ArrowLeft':
        this.moveFocusToTabSelector(
          this.tabs[
            modulo(this.tabs.indexOf(currentTab) - 1, this.tabs.length)
          ],
        );
        keypressHandled = true;
        break;

      case 'ArrowRight':
        this.moveFocusToTabSelector(
          this.tabs[
            modulo(this.tabs.indexOf(currentTab) + 1, this.tabs.length)
          ],
        );
        keypressHandled = true;
        break;

      case 'Home':
        this.moveFocusToTabSelector(this.tabs[0]);
        keypressHandled = true;
        break;

      case 'End':
        this.moveFocusToTabSelector(this.tabs[this.tabs.length - 1]);
        keypressHandled = true;
        break;

      default:
        break;
    }

    if (keypressHandled) {
      event.stopPropagation();
      event.preventDefault();
    }
  }

  moveFocusToTabSelector(tab: PanelTab) {
    document.getElementById(`${this.TAB_ID_PREFIX}${tab}`)?.focus();
  }
}

export interface ViewingOptions {
  showChessBoards: boolean;
  showGenotypes: boolean;
  highlightCollisionsOnHover: boolean;
}

export enum PanelTab {
  Boards = 'boards',
  Statistics = 'statistics',
}

export interface LabeledTab {
  label: string;
  value: PanelTab;
}
