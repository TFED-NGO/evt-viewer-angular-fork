import { Component, ElementRef, Input } from '@angular/core';
import { Text } from '../../models/evt-models';
import { register } from '../../services/component-register.service';
import { v4 as uuidv4 } from 'uuid';
import { combineLatest, map } from 'rxjs';
import { HoverService } from 'src/app/services/hover.service';

@Component({
  selector: 'evt-text',
  templateUrl: './text.component.html',
  styleUrls: ['./text.component.scss'],
})
@register(Text)
export class TextComponent {
  @Input() data: Text;

  id: string = uuidv4();

  underline$ = combineLatest([
    this.hoverService.onUnderline$,
    this.hoverService.onExponentHover$,
  ]
  ).pipe(
    map(([underline, expHover]) => underline.includes(this.id) || expHover.includes(this.id))
  );

  constructor(
    private hoverService: HoverService,
    private elementRef: ElementRef<HTMLElement>
  ) { }

  onHover(isHovering: boolean) {
    const value = this.hoverService.onTextHover$.value.filter(x => x.id !== this.id);
    const newValue = {
      id: this.id,
      element: this.elementRef.nativeElement,
      isHovering: isHovering,
    }
    this.hoverService.onTextHover$.next([...value, newValue]);
  }
}
