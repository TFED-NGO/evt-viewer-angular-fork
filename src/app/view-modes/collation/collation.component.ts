import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { CompactType, DisplayGrid, GridsterConfig, GridsterItem, GridType } from 'angular-gridster2';
import { BehaviorSubject, combineLatest, Observable, Subject, Subscription } from 'rxjs';
import { debounceTime, map, tap } from 'rxjs/operators';
import { EVTModelService } from 'src/app/services/evt-model.service';
import { EVTStatusService } from 'src/app/services/evt-status.service';
import { EvtIconInfo } from 'src/app/ui-components/icon/icon.component';

@Component({
  selector: 'evt-collation',
  templateUrl: './collation.component.html',
  styleUrls: ['./collation.component.scss'],
})
export class CollationComponent implements OnDestroy {
  @ViewChild('collationPanel', { static: false }) collationPanel: ElementRef;
  @ViewChild('popover', { static: false }) popover: NgbPopover;

  private latestWitnesses$ = new BehaviorSubject<WitnessItem[]>([]);
  private itemsChanged$ = new Subject<void>();
  private itemsChangedSubs: Subscription;

  public currentWitnesses$: Observable<WitnessItem[]> = combineLatest([
    this.evtModelService.witnesses$,
    this.evtStatusService.currentStatus$
  ]).pipe(
    map(([witnesses, status]) => {
      const currentWitnessesIds = status.witnesses;
      const result: WitnessItem[] = witnesses
        .filter(w => currentWitnessesIds.includes(w.id))
        .sort((a, b) => currentWitnessesIds.indexOf(a.id) - currentWitnessesIds.indexOf(b.id))
        .map((w, i) => {
          if (typeof w.name !== 'string') {
            throw new Error("Witness name must be a string but was: " + w.name);
          }

          return {
            id: w.id,
            label: w.name,
            itemConfig: { cols: 1, rows: 1, y: 0, x: i },
            currentPageId: status.page.id,
          };
        });
      return result;
    }),
    tap(witnesses => {
      this.latestWitnesses$.next(witnesses);
      this.updateGridsterOptions(witnesses);
    })
  );

  public popoverWitnesses$: Observable<PopoverWitnessItem[]> = combineLatest([
    this.evtModelService.witnesses$,
    this.evtStatusService.currentStatus$
  ]).pipe(
    map(([witnesses, status]) => {
      const currentWitnessesIds = status.witnesses;
      const result = witnesses
        .filter(w => !currentWitnessesIds.includes(w.id))
        .map(w => {
          if (typeof w.name !== 'string') {
            throw new Error("Witness name must be a string but was: " + w.name);
          }

          return {
            id: w.id,
            label: w.name
          };
        });
      return result;
    }),
  );

  public options: GridsterConfig = {
    gridType: GridType.Fit,
    displayGrid: DisplayGrid.None,
    margin: 0,
    maxCols: 2,
    maxRows: 1,
    draggable: {
      enabled: false,
    },
    resizable: {
      enabled: false,
    },
  };
  public textPanelItem: GridsterItem = { cols: 1, rows: 1, y: 0, x: 0 };
  public collationPanelItem: GridsterItem = { cols: 1, rows: 1, y: 0, x: 1 };
  public collationOptions: GridsterConfig = {
    gridType: GridType.Fit,
    displayGrid: DisplayGrid.None,
    compactType: CompactType.CompactLeft,
    scrollToNewItems: true,
    margin: 0,
    maxRows: 1,
    draggable: {
      enabled: true,
      ignoreContent: true,
      dragHandleClass: 'panel-header',
    },
    resizable: {
      enabled: false,
    },
    mobileBreakpoint: 0,
    itemResizeCallback: () => this.updateFixedColWidth(this.latestWitnesses$.value),
    itemChangeCallback: () => this.itemsChanged$.next(),
  };

  public currentPageID$ = this.evtStatusService.currentStatus$.pipe(
    map(({ page }) => page.id),
  );

  public witnessBtn$: Observable<{
    label: string,
    additionalClasses: string,
    title: string,
    icon: EvtIconInfo,
    placement: string,
    floatRight: boolean
  }> = this.currentWitnesses$.pipe(
    map(witnesses => {
      return {
        label: witnesses.length > 0 ? '' : 'addWitness',
        title: witnesses.length > 0 ? 'addWitness' : '',
        additionalClasses: `btn-floating ${witnesses.length > 0 ? 'rounded-circle' : ''}`,
        icon: { iconSet: 'fas', icon: 'plus' },
        placement: witnesses.length > 0 ? 'left' : 'right',
        floatRight: witnesses.length > 0
      };
    })
  );

  constructor(
    private evtStatusService: EVTStatusService,
    private evtModelService: EVTModelService,
  ) {
    this.itemsChangedSubs = this.itemsChanged$.pipe(
      debounceTime(100)
    ).subscribe(() => {
      const value = this.latestWitnesses$.value
        .sort((a, b) => a.itemConfig.x - b.itemConfig.x)
        .map(x => x.id);
      this.evtStatusService.updateWitnesses$.next(value)
    })
  }

  changePage(pageId: string) {
    this.evtStatusService.updatePageId$.next(pageId);
  }

  addWitness(witnessId: string) {
    if (this.latestWitnesses$.value.some(w => w.id === witnessId)) {
      throw new Error("Witness is already present: " + witnessId);
    }

    this.evtStatusService.updateWitnesses$.next(
      [...this.latestWitnesses$.value.filter(w => w.id !== witnessId).map(w => w.id), witnessId]
    )
    this.closePopover();
  }

  removeWitness(witnessId: string) {
    this.evtStatusService.updateWitnesses$.next(
      [...this.latestWitnesses$.value.filter(w => w.id !== witnessId).map(w => w.id)]
    )
    this.closePopover();
  }

  private closePopover() {
    this.popover.close();
  }

  private updateGridsterOptions(witnesses: WitnessItem[]) {
    this.options.maxCols = witnesses.length <= 1 ? 2 : 3;
    this.collationPanelItem.cols = witnesses.length <= 1 ? 1 : 2;

    this.collationOptions.maxCols = witnesses.length;
    this.collationOptions.gridType = witnesses.length <= 2 ? GridType.Fit : GridType.HorizontalFixed;
    this.changedOptions();
    this.updateFixedColWidth(witnesses);
  }

  private changedOptions() {
    if (this.options.api && this.options.api.optionsChanged) {
      this.options.api.optionsChanged();
    }
    if (this.collationOptions.api && this.collationOptions.api.optionsChanged) {
      this.collationOptions.api.optionsChanged();
    }
  }

  private updateFixedColWidth(witnesses: WitnessItem[]) {
    if (!this.collationPanel) return;
    const collationPanelEl = this.collationPanel.nativeElement as HTMLElement;
    const fixedColWidth = collationPanelEl.clientWidth * 0.416666666667;
    this.collationOptions.fixedColWidth = witnesses.length > 2 ? fixedColWidth : undefined;
    this.changedOptions();
  }

  ngOnDestroy(): void {
    this.itemsChangedSubs?.unsubscribe();
  }
}

export interface WitnessItem {
  id: string,
  label: string;
  itemConfig: GridsterItem;
  currentPageId: string;
}

interface PopoverWitnessItem {
  id: string,
  label: string;
}