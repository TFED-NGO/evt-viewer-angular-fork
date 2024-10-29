import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HoverService {

  public onTextHover$ = new BehaviorSubject<OnTextHoverArgs[]>([]);
  public onUnderline$ = new BehaviorSubject<string[]>([]);
  public onExponentHover$ = new BehaviorSubject<string[]>([]);

  constructor() { }
}


export interface OnTextHoverArgs {
  id: string;
  element: HTMLElement;
  isHovering: boolean;
}
