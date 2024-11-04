import { Component, Input, OnDestroy } from '@angular/core';
import { ApparatusEntryExponent } from 'src/app/models/evt-models';
import { register } from 'src/app/services/component-register.service';
import { EVTStatusService } from 'src/app/services/evt-status.service';
import { BehaviorSubject, combineLatest, map, pipe, retry, Subscription, tap } from 'rxjs';
import { HoverService } from 'src/app/services/hover.service';

@register(ApparatusEntryExponent)
@Component({
  selector: 'evt-apparatus-entry-exponent',
  templateUrl: './apparatus-entry-exponent.component.html',
  styleUrls: ['./apparatus-entry-exponent.component.scss']
})
export class ApparatusEntryExponentComponent implements OnDestroy {
  @Input() data: ApparatusEntryExponent;
  noteType: string = 'critical'; // Temp, it's probably correct but needs confirmation
  apparatusDetailsShown$ = combineLatest([
    this.statusService.currentViewMode$,
    this.hoverService.selectedApparatusEntries$
  ]).pipe(
    map(([viewMode, selectedAppEntries]) => {
      if (viewMode.id === 'readingText') {
        return false;
      }
      const id = this.data.id();
      const result = selectedAppEntries.find(app => id.equals(app.additionalAttributes.exponentId));
      return result;
    })
  );

  private updatehoveredAppExponent$ = new BehaviorSubject<boolean>(false);
  isHighlighted$ = combineLatest([
    this.updatehoveredAppExponent$,
    this.hoverService.selectedApparatusEntries$,
  ]).pipe(
    map(([updatehoveredAppExponent, selectedAppEntries]) => {
      if (updatehoveredAppExponent) {
        return true;
      }

      const result = selectedAppEntries.some(app => this.data.id().equals(app.additionalAttributes.exponentId));
      return result;

      // const { id, element, isHovering } = hoveredTextOrDefault;
      // if (!isHovering) {
      //   this.hoverService.hoveredAppExponentOrDefault$.next(this.data);
      // }
      // else {
      //   const key = id;
      //   if (!this.isBetweenElementMemo.has(key)) {
      //     const { fromEl, toEl } = this.getDepaElements();
      //     const result = this.isElementBetween(fromEl, element, toEl);
      //     this.isBetweenElementMemo.set(key, result);
      //   }

      //   const memo = this.isBetweenElementMemo.get(key);
      //   if (memo) {
      //     this.hoverService.hoveredAppExponentOrDefault$.next(this.data);
      //     return true;
      //   }
      // }

      // this.hoverService.hoveredAppExponentOrDefault$.next(null);
      // return false;
    })
  );

  private isBetweenElementMemo = new Map<string, boolean>();

constructor(
  private statusService: EVTStatusService,
  private hoverService: HoverService,
) {
}

ngOnInit(): void {

}

onExponentButtonClicked() {
  this.hoverService.toggleApparatusEntry(this.data.appEntries);
}

onHover(isHovering: boolean) {
  this.updatehoveredAppExponent$.next(isHovering);
}

  private getDepaElements() {
  const from = this.data.from();
  const fromEl = document.getElementById(from.valueWithoutRef);
  const to = this.data.to();
  const toEl = document.getElementById(to.valueWithoutRef);
  return { fromEl, toEl };
}

  private isElementBetween(fromEl: HTMLElement, element: HTMLElement, toEl: HTMLElement): boolean {
  const isAfterFrom = fromEl.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING;
  const isBeforeTo = element.compareDocumentPosition(toEl) & Node.DOCUMENT_POSITION_FOLLOWING;
  const isBetween = isAfterFrom && isBeforeTo;
  return !!isBetween;
}

ngOnDestroy(): void {
}
}

