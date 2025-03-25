import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ErrorsService {
  private errors$$ = new BehaviorSubject<SourceError[]>([]);
  errors$ = this.errors$$.asObservable();

  private _isLoading = true;

  get isLoading() {
    return this._isLoading;
  }

  constructor() { }

  onError(error: string, elements?: HTMLElement[]) {
    const outherHtmlsOrDefault = elements?.map(x => x.outerHTML) ?? [];
    const sourceError: SourceError = { errorMessage: error, type: 'error', outerHTMLs: outherHtmlsOrDefault }
    const errors = this.errors$$.getValue();
    if(errors.some(e => e.errorMessage === sourceError.errorMessage)){
      return;
    }
    
    console.error(error, elements);
    this.errors$$.next([...errors, sourceError]);
  }

  onWarning(error: string, elements?: HTMLElement[]) {
    const outherHtmlsOrDefault = elements?.map(x => x.outerHTML) ?? [];
    const sourceError: SourceError = { errorMessage: error, type: 'warning', outerHTMLs: outherHtmlsOrDefault }
    const errors = this.errors$$.getValue();
    if(errors.some(e => e.errorMessage === sourceError.errorMessage)){
      return;
    }
    
    console.warn(error, elements);
    this.errors$$.next([...errors, sourceError]);
  }

  loadingStart() {
    this._isLoading = true;
  }

  loadingEnd() {
    this._isLoading = false;
  }
}

export interface SourceError {
  errorMessage: String,
  outerHTMLs: string[];
  type: 'error' | 'warning',
}
