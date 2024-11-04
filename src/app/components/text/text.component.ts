import { Component, ElementRef, Input, OnInit } from '@angular/core';
import { ApparatusEntryExponent, Text } from '../../models/evt-models';
import { register } from '../../services/component-register.service';
import { v4 as uuidv4 } from 'uuid';
import { BehaviorSubject, combineLatest, filter, map, Observable } from 'rxjs';
import { HoverService, TextHoverArgs } from 'src/app/services/hover.service';
import { StructureXmlParserService } from 'src/app/services/xml-parsers/structure-xml-parser.service';

@Component({
  selector: 'evt-text',
  templateUrl: './text.component.html',
  styleUrls: ['./text.component.scss'],
})
@register(Text)
export class TextComponent implements OnInit {
  @Input() data: Text;

  id: string = uuidv4();

  underline$: Observable<boolean> | null = null;

  constructor(
    private structureService: StructureXmlParserService,
    private hoverService: HoverService,
    private elementRef: ElementRef<HTMLElement>
  ) { }

  private exponentMemo = new Map<string, boolean>();

  ngOnInit(): void {
    if (this.canBeUnderlined(this.elementRef.nativeElement)) return;

    this.underline$ = this.hoverService.highlightedAppExponents$.pipe(
      map(exponents => {
        for (const exponent of exponents) {
          const exponentId = exponent.id().valueWithoutRef;
          if (!this.exponentMemo.has(exponentId)) {
            const { fromEl, toEl } = this.getDepaElements(exponent);
            const isElementBetween = this.isElementBetween(fromEl, this.elementRef.nativeElement, toEl);
            this.exponentMemo.set(exponentId, isElementBetween);
          }

          const isElementBetweenMemo = this.exponentMemo.get(exponentId);
          if (isElementBetweenMemo) return true;
        }
      })
    );
  }

  onHover(isHovering: boolean) {
    const value = {
      id: this.id,
      element: this.elementRef.nativeElement,
      isHovering: isHovering,
    }
    this.hoverService.hoveredText$.next(value);
  }

  private getDepaElements(exponent: ApparatusEntryExponent) {
    const from = exponent.from();
    const fromEl = document.getElementById(from.valueWithoutRef);
    const to = exponent.to();
    const toEl = document.getElementById(to.valueWithoutRef);
    return { fromEl, toEl };
  }

  private isElementBetween(fromEl: HTMLElement, element: HTMLElement, toEl: HTMLElement): boolean {
    const isAfterFrom = fromEl.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING;
    const isBeforeTo = element.compareDocumentPosition(toEl) & Node.DOCUMENT_POSITION_FOLLOWING;
    const isBetween = isAfterFrom && isBeforeTo;
    return !!isBetween;
  }

  private canBeUnderlined(element: HTMLElement): boolean {
    const isChildOfAppDetails = element.closest('evt-apparatus-entry-detail') !== null;
    return isChildOfAppDetails;
  }
}
