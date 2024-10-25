import { Component, Input } from '@angular/core';
import { ApparatusEntryExponent, Attribute } from 'src/app/models/evt-models';
import { register } from 'src/app/services/component-register.service';
import { ApparatusEntryExponentService } from './apparatus-entry-exponent.service';
import { EVTStatusService } from 'src/app/services/evt-status.service';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { ReadingTextService } from 'src/app/view-modes/reading-text/reading-text.service';

@register(ApparatusEntryExponent)
@Component({
  selector: 'evt-apparatus-entry-exponent',
  templateUrl: './apparatus-entry-exponent.component.html',
  styleUrls: ['./apparatus-entry-exponent.component.scss']
})
export class ApparatusEntryExponentComponent {
  @Input() data: ApparatusEntryExponent;
  noteType: string = 'critical'; // Temp, it's probably correct but needs confirmation
  private get id(): Attribute {
    return this.data.id();
  }

  private updateApparatusDetailsShown$ = new BehaviorSubject<boolean>(false);
  apparatusDetailsShown$ = combineLatest([
    this.statusService.currentViewMode$,
    this.updateApparatusDetailsShown$
  ]).pipe(
    map(([viewMode, apparatusShown]) => {
      if (viewMode.id === 'readingText') {
        return false;
      }
      return apparatusShown;
    })
  );

  constructor(
    private exponentService: ApparatusEntryExponentService,
    private statusService: EVTStatusService,
    private readingTextService: ReadingTextService,
  ) {
  }

  onExponentButtonClicked() {
    this.updateApparatusDetailsShown$.next(!this.updateApparatusDetailsShown$.value);
    this.readingTextService.updateSelectedAppEntry(this.data.appEntries[0])
  }

  onHover(isHovering: boolean) {
    const allEvtTexts = this.exponentService.allEvtTexts;
    if (!isHovering) {
      for (let evtText of allEvtTexts) {
        evtText = evtText as HTMLElement;
        evtText.classList.remove("text-decoration-underline");
      }
    }
    else {
      const from = this.data.from()
      const fromEl = this.data.requiresParentAsFrom() ? document.getElementById(this.id.valueWithoutRef).parentElement
        : document.getElementById(from.valueWithoutRef);
      const to = this.data.to();
      const toEl = document.getElementById(to.valueWithoutRef);

      for (let evtText of allEvtTexts) {
        evtText = evtText as HTMLElement;
        const isChildOfAppDetails = evtText.closest('evt-apparatus-entry-detail');
        if (isChildOfAppDetails) continue;

        const isAfterFrom = fromEl.compareDocumentPosition(evtText) & Node.DOCUMENT_POSITION_FOLLOWING;
        const isBeforeTo = evtText.compareDocumentPosition(toEl) & Node.DOCUMENT_POSITION_FOLLOWING;
        const isBetween = isAfterFrom && isBeforeTo;
        if (isBetween) {
          evtText.classList.add("text-decoration-underline")
        }
      }
    }
  }
}


