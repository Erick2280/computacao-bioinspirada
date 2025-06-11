import { Pipe, PipeTransform } from '@angular/core';

import { BoardPositions } from '../core/board';

@Pipe({
  name: 'genotype',
})
export class GenotypePipe implements PipeTransform {
  transform(positions: BoardPositions): string {
    return positions
      .map((row) => row.map((cell) => (cell ? '1' : '0')).join(''))
      .join(' ');
  }
}
