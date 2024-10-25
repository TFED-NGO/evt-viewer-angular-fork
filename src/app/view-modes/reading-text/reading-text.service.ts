import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ApparatusEntry } from 'src/app/models/evt-models';

@Injectable({
  providedIn: 'root'
})
export class ReadingTextService {

  private updateSelectedAppEntry$ = new Subject<ApparatusEntry>();
  selectedAppEntry = this.updateSelectedAppEntry$.asObservable();

  constructor() { }

  updateSelectedAppEntry(app: ApparatusEntry) {
    this.updateSelectedAppEntry$.next(app);
  }
}
