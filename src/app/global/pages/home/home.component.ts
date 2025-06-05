import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { remixGithubFill } from '@ng-icons/remixicon';

@Component({
  selector: 'app-home',
  imports: [RouterModule, NgIcon],
  templateUrl: './home.component.html',
  viewProviders: [provideIcons({ remixGithubFill })],
})
export class HomePageComponent {}
