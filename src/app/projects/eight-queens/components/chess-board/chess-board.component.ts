import { NgClass } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';

import { NgIcon } from '@ng-icons/core';
import { provideIcons } from '@ng-icons/core';
import { remixVipCrown2Fill, remixVipCrown2Line } from '@ng-icons/remixicon';

import { EQBoard } from '@app/projects/eight-queens/core/board';

@Component({
  selector: 'app-chess-board',
  imports: [NgClass, NgIcon],
  templateUrl: './chess-board.component.html',
  viewProviders: [provideIcons({ remixVipCrown2Fill, remixVipCrown2Line })],
})
export class ChessBoardComponent {
  board = input.required<EQBoard>();
  highlightCollisionsOnHover = input<boolean>(false);
  hoveredPosition = signal<number | null>(null);
  hoveredCollisionIndexes = computed(() => {
    const hoveredPosition = this.hoveredPosition();

    if (hoveredPosition === null) {
      return [];
    }

    const collisionIndexes =
      this.board().collisionIndexes.get(hoveredPosition) ?? [];

    return collisionIndexes;
  });

  bidimensionalPositions = computed(() => {
    const indexedPositions = this.board().positions.map((queen) =>
      EQBoard.ORDERED_POSITIONS.indexOf(queen),
    );

    const bidimensionalPositions: boolean[][] = Array(8)
      .fill(false)
      .map(() => Array(8).fill(false));

    indexedPositions.forEach((verticalPosition, horizontalPosition) => {
      bidimensionalPositions[verticalPosition][horizontalPosition] = true;
    });

    return bidimensionalPositions;
  });

  applyHover(colIndex: number, hasQueen: boolean) {
    if (this.highlightCollisionsOnHover() && hasQueen) {
      this.hoveredPosition.set(colIndex);
    }
  }

  removeHover() {
    this.hoveredPosition.set(null);
  }

  isHighlighted(colIndex: number, hasQueen: boolean): boolean {
    if (this.highlightCollisionsOnHover() && hasQueen) {
      return (
        this.hoveredCollisionIndexes().includes(colIndex) ||
        colIndex === this.hoveredPosition()
      );
    } else {
      return false;
    }
  }
}
