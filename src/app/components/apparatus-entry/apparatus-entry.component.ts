import { ChangeDetectionStrategy, Component, HostListener, Input, OnInit, Optional, SkipSelf } from '@angular/core';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { AppConfig } from 'src/app/app.config';
import { ApparatusEntry, Reading } from '../../models/evt-models';
import { register } from '../../services/component-register.service';
import { EVTModelService } from '../../services/evt-model.service';
import { EditionlevelSusceptible, Highlightable, ShowDeletionsSusceptible } from '../components-mixins';
import { ApparatusEntryDetailComponent } from './apparatus-entry-detail/apparatus-entry-detail.component';
import { WitnessPanelService } from 'src/app/panels/witness-panel/witness-panel.service';
import { EVTStatusService } from 'src/app/services/evt-status.service';

export interface ApparatusEntryComponent extends EditionlevelSusceptible, Highlightable, ShowDeletionsSusceptible { }

@Component({
  selector: 'evt-apparatus-entry',
  templateUrl: './apparatus-entry.component.html',
  styleUrls: ['./apparatus-entry.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
})
@register(ApparatusEntry)
export class ApparatusEntryComponent implements OnInit {
  @Input() data: ApparatusEntry;
  @Input() selectedLayer: string;

  public updateIsOpened$ = new BehaviorSubject<boolean>(false);
  public isOpened$ = combineLatest([
    this.statusService.currentApparatusExponent$.pipe(
      map(exponent => this.data.exponent != null && this.data.exponent === exponent)
    ),
    this.updateIsOpened$
  ]).pipe(
    map(([matchesExponent, localUpdate]) => matchesExponent || localUpdate)
  );



  get lacunaStart() {
    const reading = this.getWitnessReadingOrDefault();
    if (!reading) return null;

    return reading.lacunas.lacunaStart;
  }

  get lacunaEnd() {
    const reading = this.getWitnessReadingOrDefault();
    if (!reading) return null;

    return reading.lacunas.lacunaEnd;
  }


  getWitnessReadingOrDefault() {
    const readings = this.data.readings;
    const reading = readings.find(x => x.witIDs.includes(this.witnessPanelService.witnessId))
    return reading;
  }

  public isInsideAppDetail: boolean;
  public isNestedApp: boolean;
  public nestedApps: ApparatusEntry[] = [];

  isInWitnessPanel: boolean;
  selectedReading?: Reading;

  private toggleAppBoxStrategy: Function;
  private closeAppBoxStrategy: Function;

  variance$ = this.evtModelService.appVariance$.pipe(
    map((variances) => variances[this.data.id]),
    shareReplay(1),
  );

  highlightColor$ = new BehaviorSubject<string>(AppConfig.evtSettings.edition.readingColorLight);
  highlightData$ = this.highlightColor$.pipe(
    map((color) => ({
      highlight: true,
      highlightColor: color,
    })),
  );

  constructor(
    private evtModelService: EVTModelService,
    private statusService: EVTStatusService,
    @Optional() private parentDetailComponent?: ApparatusEntryDetailComponent,
    @Optional() @SkipSelf() private parentAppComponent?: ApparatusEntryComponent,
    @Optional() private witnessPanelService?: WitnessPanelService,
  ) {
    this.isInsideAppDetail = !!this.parentDetailComponent;
    this.isNestedApp = !!this.parentAppComponent;
  }

  ngOnInit(): void {
    this.isInWitnessPanel = !!this.witnessPanelService;
    if (this.isInWitnessPanel) {
      const isWitnessExcluded = this.data.isWitnessExcluded(this.witnessPanelService.witnessId);
      this.selectedReading = isWitnessExcluded ? this.data.lemma : this.data.orderedReadings
        .find(r => r.witIDs.includes(this.witnessPanelService.witnessId)
          || r.witIDs.some(x => this.witnessPanelService.anchestorsIds.includes(x)));
    }

    if (this.data.exponent) { // depa
      this.toggleAppBoxStrategy = () => {
        const value = this.statusService.updateApparatusExponent$.value === this.data.exponent ? null : this.data.exponent;
        this.statusService.updateApparatusExponent$.next(value)
      }
      this.closeAppBoxStrategy = () => this.statusService.updateApparatusExponent$.next(null);
    }
    else { // inline
      this.toggleAppBoxStrategy = () => {
        const value = this.updateIsOpened$.value;
        this.updateIsOpened$.next(!value);
      }
      this.closeAppBoxStrategy = () => this.updateIsOpened$.next(false);
    }
  }

  @HostListener('mouseenter') onMouseEnter() {
    if (this.isNestedApp) {
      this.parentAppComponent.highlightColor$.next(AppConfig.evtSettings.edition.readingColorLight);
    }
    this.highlightColor$.next(AppConfig.evtSettings.edition.readingColorDark);
  }

  @HostListener('mouseleave') onMouseLeave() {
    if (this.isNestedApp) {
      this.highlightColor$.next(AppConfig.evtSettings.edition.readingColorDark);
    } else {
      this.highlightColor$.next(AppConfig.evtSettings.edition.readingColorLight)
    }
  }

  toggleAppEntryBox(e: MouseEvent) {
    e.stopPropagation();
    this.toggleAppBoxStrategy();
  }

  closeAppEntryBox() {
    this.closeAppBoxStrategy();
  }

  stopPropagation(e: MouseEvent) {
    e.stopPropagation();
  }
}
