import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, filter, map, withLatestFrom } from 'rxjs';
import { EVTModelService } from './evt-model.service';
import { EVTStatusService } from './evt-status.service';
import { Lb, Paragraph, Verse, Word } from '../models/evt-models';

@Injectable({ providedIn: 'root' })
export class EvtLinesHighlightService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private parsedContent: any;
  constructor(private evtModelService: EVTModelService, private evtStatusService: EVTStatusService) {
    this.evtStatusService.currentPage$.subscribe((page) => {
      this.clearHighlightText();
      this.lineBeginningSelected$.next(null);
      this.parsedContent = page.parsedContent;
      if (page) {
        setTimeout(() => {
          page.parsedContent?.forEach((pc) => {
            if (pc) { this.assignLbId(pc, false); }
          })
        }, 500);
      }
    })

    combineLatest([
      this.lineBeginningHovered$,
      this.lineBeginningSelected$
    ]).pipe(
      filter(() => this.syncTextImage$.value),
    ).subscribe(([hovered, selected]) => {

      this.clearHighlightText();

      // selected = base (persistent)
      if (selected) {
        this.highlightLineText({
          id: selected.corresp,
          selected: true
        });
      }

      // hover = overlay (temporary)
      if (hovered) {
        this.highlightLineText({
          id: hovered.corresp,
          selected: false
        });
      }
    });
  }

  public syncTextImage$ = new BehaviorSubject<boolean>(false);

  lineBeginningHovered$ = new BehaviorSubject<{ id: string; corresp: string; }>(null);
  lineBeginningSelected$ = new BehaviorSubject<{ id: string; corresp: string; }>(null);

  currentSurfaces$ = this.evtStatusService.currentPage$.pipe(
    withLatestFrom(this.evtModelService.surfaces$),
    map(([cp, surfaces]) => surfaces.find((surface) => surface.corresp === cp.id)),
  );

  private tempLbId = '';
  private tempCorrespId = '';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private assignLbId(startingContent: any, ignoreFindLbElement: boolean): void {
    if (startingContent.type.name === Verse.name && startingContent.attributes['facs']) {
      const facsId = startingContent.attributes['facs'].replace('#', '');
      const id = startingContent.attributes['id'];

      this.tempLbId = facsId;
      this.tempCorrespId = id;

      startingContent.lbId = this.tempLbId;
      startingContent.correspId = this.tempCorrespId;

      for (const insideContent of startingContent.content) {
        this.assignLbId(insideContent, true);
      }
      this.tempLbId = '';
      this.tempCorrespId = '';

      return;
    }

    if (startingContent.type.name === Lb.name && !ignoreFindLbElement) {
      this.tempLbId = startingContent.facs?.replace('#', '');
      this.tempCorrespId = startingContent.id?.replace('#', '');

      return;
    }
    startingContent.lbId = this.tempLbId;
    startingContent.correspId = this.tempCorrespId;
    if (startingContent.content !== undefined) {
      for (const insideContent of startingContent.content) {
        this.assignLbId(insideContent, ignoreFindLbElement);
      }
    }
  }

  clearHighlightText(): void {
    if (this.parsedContent === undefined) {
      return;
    }
    for (const pc of this.parsedContent) {
      this.recursiveHighlight(pc, { id: 'empty', selected: false });
    }
  }

  highlightLineText(lbId: { id: string, selected: boolean }) {
    if (!lbId) return;

    for (const pc of this.parsedContent) {
      this.recursiveHighlight(pc, lbId);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private recursiveHighlight(pc: any, lbId: { id: string, selected: boolean }): void {
    if (pc && pc.type.name !== Verse.name && pc.type.name !== Paragraph.name && pc.type.name !== Word.name) {
      const f = pc.correspId === lbId.id;
      if (f) {
        if (lbId.selected) {
          pc.class = pc.class + ' highlightverse selected';
        } else {
          pc.class = pc.class + ' highlightverse';
        }
      } else {
        if (pc.class) {
          pc.class = pc.class.replace(/(highlightverse)(\s)?(selected)?/, '');
        }
      }
    }

    if (pc?.content) {
      for (const insidePc of pc.content) {
        this.recursiveHighlight(insidePc, lbId);
      }
    }
  }
}
