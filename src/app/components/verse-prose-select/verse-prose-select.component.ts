import { Component, EventEmitter, Output } from '@angular/core';
import { TextFlow } from 'src/app/app.config';
import { EvtIconInfo } from 'src/app/ui-components/icon/icon.component';

@Component({
  selector: 'evt-verse-prose-select',
  templateUrl: './verse-prose-select.component.html',
  styleUrls: ['./verse-prose-select.component.scss'],
})

export class VerseProseSelectComponent {

  @Output() textModeSelectionChange: EventEmitter<TextFlow> = new EventEmitter();

  public textFlowTypes: TextFlow[] = ['prose', 'prose_mixed', 'verses'];

  public selectedType: TextFlow = 'prose';

  getProseVersesTogglerIcon(textFlowMode: TextFlow): EvtIconInfo {
    return { icon: textFlowMode === 'verses' ? 'align-justify' : 'align-left', iconSet: 'fas' };
  }

  updateSelectedType(textFlowType: TextFlow) {
    this.textModeSelectionChange.emit(textFlowType);
  };

}
