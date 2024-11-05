import { Component, ElementRef, Input, OnInit } from '@angular/core';
import { ApparatusEntryExponent, Text } from '../../models/evt-models';
import { register } from '../../services/component-register.service';
import { v4 as uuidv4 } from 'uuid';
import { defaultIfEmpty, filter, from, interval, map, Observable, of, shareReplay, startWith, take } from 'rxjs';
import { HoverService } from 'src/app/services/hover.service';
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

  underlineData$: Observable<UnderlineData> = of({ enabled: false, level: 0 });
  level: 3;

  constructor(
    private hoverService: HoverService,
    private elementRef: ElementRef<HTMLElement>,
    private structureService: StructureXmlParserService,
  ) { }

  private exponentMemo = new Map<string, UnderlineData>();

  ngOnInit(): void {
    if (this.canBeUnderlined(this.elementRef.nativeElement)) return;

    this.underlineData$ = this.hoverService.highlightedAppExponents$
      .pipe(
        map((exponents) => {
          for (const exponent of exponents) {
            const exponentId = exponent.id().valueWithoutRef;
            if (!this.exponentMemo.has(exponentId)) {
              const { fromEl, toEl } = this.hoverService.getDepaElements(exponent);
              const isElementBetween = this.hoverService.isElementBetween(fromEl, this.elementRef.nativeElement, toEl);
              this.exponentMemo.set(exponentId, { enabled: isElementBetween });
            }

            const memo = this.exponentMemo.get(exponentId);
            if (memo.enabled) return memo;
          }
        }),
        shareReplay(1) // because in the template there are multiple | async
      );
  }

  onHover(isHovering: boolean) {
    const value = {
      id: this.id,
      element: this.elementRef.nativeElement,
      isHovering: isHovering,
    }
    this.hoverService.hoveredTextOrDefault$.next(value);
  }

  private canBeUnderlined(element: HTMLElement): boolean {
    const isChildOfAppDetails = element.closest('evt-apparatus-entry-detail') !== null;
    return isChildOfAppDetails;
  }
}

export interface UnderlineData {
  enabled: boolean;
}
