import { EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { Component } from '@angular/core';
import { NgSelectComponent } from '@ng-select/ng-select';
import { filter, fromEvent, merge, skip, Subscription } from 'rxjs';
import { MsDesc } from 'src/app/models/evt-models';
import { EVTModelService } from 'src/app/services/evt-model.service';
import { EVTStatusService } from 'src/app/services/evt-status.service';

@Component({
  selector: 'evt-ms-desc-selector',
  templateUrl: './ms-desc-selector.component.html',
  styleUrls: ['./ms-desc-selector.component.scss'],
})
export class MsDescSelectorComponent implements OnInit, OnDestroy {

  public msDesc$ = this.evtModelService.msDesc$;
  private resetMsDescSub: Subscription;
  msDescId: string;

  @Output() selectionChange: EventEmitter<string> = new EventEmitter<string>();
  @Output() msDescOpen: EventEmitter<boolean> = new EventEmitter<boolean>();
  @ViewChild('ngSelectComponent') ngSelectComponent: NgSelectComponent;

  constructor(
    public evtModelService: EVTModelService,
    public evitStatusService: EVTStatusService
  ) {
  }

  ngOnInit(): void {
    const escape$ = fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(
        filter(event => event.key === 'Escape')
      )
    this.resetMsDescSub = merge(
      escape$,
      this.evitStatusService.currentPage$.pipe(
        skip(1)
      )
    ).subscribe((_) => this.resetMsDesc());
  }

  onMsDescBtnClick(item: MsDesc) {
    if (this.msDescId) {
      this.msDescId = null;
      this.resetMsDesc();
    }
    else {
      this.msDescId = item.id;
      this.openMsDescContent();
    }

  }

  openMsDescContent() {
    this.selectionChange.emit(this.msDescId);
    this.msDescOpen.emit(true);
  }

  resetMsDesc() {
    this.msDescId = null;
    this.selectionChange.emit(this.msDescId);
    this.msDescOpen.emit(false);
  }

  ngOnDestroy(): void {
    this.resetMsDescSub?.unsubscribe();
  }
}
