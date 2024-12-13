import { Component, Input, OnInit } from '@angular/core';
import { map, shareReplay } from 'rxjs';
import { AppConfig } from 'src/app/app.config';
import { Attribute } from 'src/app/models/evt-models';
import { EVTModelService } from 'src/app/services/evt-model.service';
import { EVTStatusService } from 'src/app/services/evt-status.service';

@Component({
  selector: 'evt-witness-id',
  templateUrl: './witness-id.component.html',
  styleUrls: ['./witness-id.component.scss']
})
export class WitnessIdComponent implements OnInit {

  @Input() witnessId: string;

  exponent: string = null;
  formattedWitnessId: string;

  canNavigate$ = this.modelService.flattenedWitnesses$.pipe(
    map(witnesses => {
      if(!this.witnessId) return false;

      const attr = Attribute.create(this.witnessId).valueWithoutRef;
      return witnesses.some(w => w.id == attr)
    }),
    shareReplay(1)
  );

  constructor(
    private statusService: EVTStatusService,
    private modelService: EVTModelService,
  ) { }

  ngOnInit(): void {
    if(!this.witnessId) return;

    this.formattedWitnessId = Attribute.create(this.witnessId).valueWithoutRef;
    if (AppConfig.evtSettings.edition.transformWitnessId) {
      if (this.formattedWitnessId.includes('.')) {
        const parts = this.formattedWitnessId.split('.');
        this.formattedWitnessId = parts.slice(0, -1).join()
        this.exponent = parts[parts.length - 1];
      }
    }
  }

  onWitnessClicked() {
    const attr = Attribute.create(this.witnessId).valueWithoutRef;
    this.statusService.updateViewMode$.next(this.statusService.availableViewModes.find(v => v.id === 'collation'));
    this.statusService.updateWitnesses$.next([attr]);
  }
}
