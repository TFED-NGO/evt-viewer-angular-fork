import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApparatusEntryExponentService {
  private evtTexts: HTMLElement[] = null;

  /**
   * Get all the DOM elements with tag 'evt-text'.
   * It should be called when page is rendered, after that,
   * the elements are cached for performance.
   */
  get allEvtTexts(): HTMLElement[] {
    if (!this.evtTexts) {
      this.evtTexts = Array.from(document.querySelectorAll('evt-text'));
    }
    return this.evtTexts;
  }
}
