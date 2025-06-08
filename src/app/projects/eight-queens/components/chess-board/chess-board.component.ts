import { NgClass } from '@angular/common';
import { Component, computed, input } from '@angular/core';

import { NgIcon } from '@ng-icons/core';
import { provideIcons } from '@ng-icons/core';
import { remixVipCrown2Fill } from '@ng-icons/remixicon';

import { Board, BoardPositions } from '@app/projects/eight-queens/core/board';

@Component({
  selector: 'app-chess-board',
  imports: [NgClass, NgIcon],
  templateUrl: './chess-board.component.html',
  viewProviders: [provideIcons({ remixVipCrown2Fill })],
})
export class ChessBoardComponent {
  positions = input.required<BoardPositions>();

  bidimensionalPositions = computed(() => {
    const indexedPositions = this.positions().map((queen) =>
      Board.ORDERED_POSITIONS.indexOf(queen),
    );

    const bidimensionalPositions: boolean[][] = Array(8)
      .fill(false)
      .map(() => Array(8).fill(false));

    indexedPositions.forEach((verticalPosition, horizontalPosition) => {
      bidimensionalPositions[verticalPosition][horizontalPosition] = true;
    });

    return bidimensionalPositions;
  });
}
