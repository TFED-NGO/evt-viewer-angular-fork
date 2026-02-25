import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { AppConfig } from 'src/app/app.config';
import { BibliographicEntry } from 'src/app/models/evt-models';

@Component({
  selector: 'evt-biblio-entry',
  templateUrl: './biblio.component.html',
  styleUrls: ['./biblio.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BiblioEntryComponent {
  @Input() data: BibliographicEntry;

  public showList = AppConfig.evtSettings.edition.biblTab.propsToShow;
  public showAttrNames = AppConfig.evtSettings.edition.biblTab.showAttrNames;
  public showEmptyValues = AppConfig.evtSettings.edition.biblTab.showEmptyValues;
  public inline = AppConfig.evtSettings.edition.biblTab.inline;
  public isCommaSeparated = AppConfig.evtSettings.edition.biblTab.commaSeparated;
  public showMainElemTextContent = AppConfig.evtSettings.edition.biblTab.showMainElemTextContent;

}

