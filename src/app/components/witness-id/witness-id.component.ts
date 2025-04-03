import { Component, Input } from '@angular/core';
import { map, Observable, shareReplay } from 'rxjs';
import { Attribute, GenericElement } from 'src/app/models/evt-models';
import { EVTModelService } from 'src/app/services/evt-model.service';
import { EVTStatusService } from 'src/app/services/evt-status.service';
import { ApparatusEntryDetailService } from '../apparatus-entry/apparatus-entry-detail/apparatus-entry-detail.service';
import { ParseResult } from 'src/app/services/xml-parsers/parser-models';

@Component({
  selector: 'evt-witness-id',
  templateUrl: './witness-id.component.html',
  styleUrls: ['./witness-id.component.scss']
})
export class WitnessIdComponent {

  @Input() witnessId: string;

  witnessItem$: Observable<WitnessItem> = this.modelService.flattenedWitnesses$.pipe(
    map(witnesses => {
      const witnessId = Attribute.create(this.witnessId);
      const witness = witnesses.find(y => witnessId.equals(y.id));
      if(!witness) {
        console.warn("Cannot find witness with id: ", this.witnessId)
        return;
      }

      if (witness.label) {
        return {
          id: null,
          label: witness.label
        }
      } 
      else {
        return { id: witness.id }
      }
    }),
    shareReplay(1)
  );

  constructor(
    private statusService: EVTStatusService,
    private modelService: EVTModelService,
    private apparatusEntryDetailService: ApparatusEntryDetailService
  ) { }

  onWitnessClicked() {
    const witnessId = Attribute.create(this.witnessId).valueWithoutRef;
    this.statusService.updateViewMode$.next(this.statusService.availableViewModes.find(v => v.id === 'collation'));
    let newValue = [...this.statusService.updateWitnesses$.value, witnessId];
    newValue = newValue.filter(this.onlyUnique);
    this.statusService.updateWitnesses$.next(newValue);
    this.statusService.updateApparatusExponent$.next(this.apparatusEntryDetailService.apparatusEntry.exponent);
  }

  private onlyUnique(value, index, array) {
    return array.indexOf(value) === index;
  }
}

export interface WitnessItem {
  id?: string,
  label?: ParseResult<GenericElement>
} 