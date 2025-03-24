import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ErrorsService {

  errors$ = new BehaviorSubject<SourceError[]>([]);

  constructor() { }

  onError(error: string) {
    console.error(error);
    const sourceError: SourceError = { error, type: 'error' }
    const errors = this.errors$.getValue();
    this.errors$.next([...errors, sourceError]);
  }

  onWarning(error: string) {
    console.warn(error);
    const sourceError: SourceError = { error, type: 'warning' }
    const errors = this.errors$.getValue();
    this.errors$.next([...errors, sourceError]);
  }
}

export interface SourceError {
  error: String,
  type: 'error' | 'warning'
}
