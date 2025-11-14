import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, map, Observable, Subscription } from 'rxjs';
import { EVTModelService } from 'src/app/services/evt-model.service';

@Component({
  selector: 'evt-edition-selector',
  templateUrl: './edition-selector.component.html',
  styleUrls: ['./edition-selector.component.scss']
})
export class EditionSelectorComponent implements OnInit, OnDestroy {
  public editions$: Observable<Edition[]> = this.evtModelService.editionSources$.pipe(
    map(editions => editions.map(ed => {
      return {
        id: ed.id,
        title: ed.editionInfo.editionFriendlyName ?? ed.editionInfo.editionTitle
      };
    }))
  );
  private editionsSubs: Subscription;
  public selectedEdition$ = new BehaviorSubject<string>(undefined);

  constructor(
    private evtModelService: EVTModelService,
  ) {
  }

  ngOnInit(): void {
    this.editionsSubs = this.editions$.subscribe(editions => {
      const firstEdition = editions[0];
      this.selectedEdition$.next(firstEdition.id);
    });
  }

  public onEditionChanged(id: string) {
    this.evtModelService.updateEditionId$.next(id);
  }

  ngOnDestroy(): void {
    this.editionsSubs?.unsubscribe();
  }
}

interface Edition {
  id: string;
  title: string;
}