import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-error',
  imports: [RouterModule],
  templateUrl: './error.component.html',
})
export class ErrorPageComponent implements OnInit, OnDestroy {
  ErrorType = ErrorType;
  errorType?: ErrorType;

  route = inject(ActivatedRoute);
  routeSubscription?: Subscription;

  ngOnInit(): void {
    this.route.data.subscribe((data) => {
      this.errorType = data['errorType'];
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
  }
}

export enum ErrorType {
  NotFound = 'NotFound',
}
