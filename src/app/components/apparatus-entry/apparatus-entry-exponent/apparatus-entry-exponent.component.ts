import { Component, Input, OnDestroy } from '@angular/core';
import { ApparatusEntryExponent, Attribute } from 'src/app/models/evt-models';
import { register } from 'src/app/services/component-register.service';
import { ApparatusEntryExponentService } from './apparatus-entry-exponent.service';
import { EVTStatusService } from 'src/app/services/evt-status.service';
import { BehaviorSubject, combineLatest, map, Subject, Subscription, switchMap, tap } from 'rxjs';
import { ReadingTextService } from 'src/app/view-modes/reading-text/reading-text.service';
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
  isHovering: boolean = false;

  private onHoverTextSubs: Subscription;
  private onNotHoveringSubs: Subscription;

  private get id(): Attribute {
    return this.data.id();
  }

  private onNotHovering$ = new Subject<void>();
  private updateApparatusDetailsShown$ = new BehaviorSubject<boolean>(false);
  public apparatusDetailsShown$ = combineLatest([
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
    private hoverService: HoverService,
    private readingTextService: ReadingTextService,
  ) {
  }

  ngOnInit(): void {
    this.onHoverTextSubs = combineLatest([
      this.apparatusDetailsShown$,
      this.hoverService.onTextHover$
    ])
      .subscribe(([appDetailsShown, elements]) => {
        this.isHovering = false;
        const { fromEl, toEl } = this.getDepaElements();
        for (let { id, element, isHovering } of elements) {

          if (this.isElementBetween(fromEl, element, toEl)) {
            this.isHovering = isHovering || appDetailsShown;
            const value = this.hoverService.onUnderline$.value.filter(x => x !== id);
            const newValue = this.isHovering ? [...value, id] : [...value];
            this.hoverService.onUnderline$.next(newValue);
          }
        }
      });

    this.onNotHoveringSubs = this.onNotHovering$.pipe(
      switchMap(() => this.apparatusDetailsShown$),
      tap(appShown => {
        if (!appShown) {
          this.hoverService.onExponentHover$.next([]);
        }
      })).subscribe();
  }

  onExponentButtonClicked() {
    this.updateApparatusDetailsShown$.next(!this.updateApparatusDetailsShown$.value);
    this.readingTextService.updateSelectedAppEntry(this.data.appEntries[0])
  }

  onHover(isHovering: boolean) {
    if (!isHovering) {
      this.onNotHovering$.next();
    }
    else {
      const elements = this.exponentService.allEvtTextSpans;
      const { fromEl, toEl } = this.getDepaElements();
      for (let element of elements) {
        const { isChildOfAppDetails } = this.shouldSkip(element);
        if (isChildOfAppDetails) continue;

        if (this.isElementBetween(fromEl, element, toEl)) {
          const value = this.hoverService.onExponentHover$.value.filter(x => x !== element.id);
          const newValue = [...value, element.id];
          this.hoverService.onExponentHover$.next(newValue);
        }
      }
    }
  }

  private getDepaElements() {
    const from = this.data.from();
    const fromEl = this.data.requiresParentAsFrom() ? document.getElementById(this.id.valueWithoutRef).parentElement
      : document.getElementById(from.valueWithoutRef);
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

  private shouldSkip(element: HTMLElement) {
    return {
      isChildOfAppDetails: element.closest('evt-apparatus-entry-detail')
    };
  }

  ngOnDestroy(): void {
    this.onHoverTextSubs.unsubscribe();
    this.onNotHoveringSubs.unsubscribe();
  }
}

