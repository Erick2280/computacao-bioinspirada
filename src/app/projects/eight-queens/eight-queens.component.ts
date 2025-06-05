import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { remixPlayCircleFill } from '@ng-icons/remixicon';

@Component({
  selector: 'app-eight-queens',
  imports: [RouterModule, NgIcon],
  templateUrl: './eight-queens.component.html',
  viewProviders: [provideIcons({ remixPlayCircleFill })],
})
export class EightQueensPageComponent {}
