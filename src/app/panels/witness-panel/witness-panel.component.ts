import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { map, shareReplay } from 'rxjs';
import { getFromAttributeOrDefault, getToAttributeOrDefault } from 'src/app/extensions/apparatus.extensions';
import { ApparatusEntry, Attribute, GenericElement, Page } from 'src/app/models/evt-models';
import { EVTModelService } from 'src/app/services/evt-model.service';
import { ParserRegister } from 'src/app/services/xml-parsers';
import { StructureXmlParserService } from 'src/app/services/xml-parsers/structure-xml-parser.service';
import { WitnessItem } from 'src/app/view-modes/collation/collation.component';
import { WitnessPanelService } from './witness-panel.service';

@Component({
  selector: 'evt-witness-panel',
  templateUrl: './witness-panel.component.html',
  styleUrls: ['./witness-panel.component.scss'],
  providers: [WitnessPanelService]
})
export class WitnessPanelComponent implements OnInit {
  @Input() witnessItem: WitnessItem;
  @Output() hide = new EventEmitter<boolean>();
  @Output() changePage = new EventEmitter<string>();

  pages: Page[] = null;
  currentPage: Page = null;

  constructor(
    private evtModelService: EVTModelService,
    private structureParser: StructureXmlParserService,
    private witnessPanelService: WitnessPanelService
  ) { }

  ngOnInit(): void {
    this.witnessPanelService.witnessId = this.witnessItem.id;

    const appParser = ParserRegister.get('evt-apparatus-entry-parser');
    this.evtModelService.editionSource$.pipe(
      map(source => {
        const originalPages = this.structureParser.parsePages(source).pages;
        const appsData = this.structureParser.backApps
          .map(app => {
            const parsedApp = appParser.parse(app) as ApparatusEntry;

            const from = Attribute.createOrDefault(getFromAttributeOrDefault(app));
            if (!from) {
              console.error("App has no from attribute", app);
              throw new Error("From attribute is required");
            }

            const to = Attribute.createOrDefault(getToAttributeOrDefault(app));
            return { parsedApp, from, to };
          });

        for (const page of originalPages) {
          for (let i = 0; i < page.parsedContent.length; i++) {
            const element = page.parsedContent[i] as GenericElement;

            const foundAppDatas = appsData.filter(({ parsedApp, from, to }) => {
              const hasAnyReading = parsedApp.orderedReadings.some(r => r.witIDs.includes(this.witnessItem.id));
              if (!hasAnyReading) return false;

              const elementId = element.attributes['id'];
              if (elementId) {
                const isFrom = elementId === from.valueWithoutRef;
                const isTo = elementId === to?.valueWithoutRef;
                if (isFrom || isTo) {
                  return true;
                }
              }

              const fromEl = this.findElementByAttribute(element, { name: 'id', value: from.valueWithoutRef });
              const toEl = to ? this.findElementByAttribute(element, { name: 'id', value: to.valueWithoutRef }) : null;
              return fromEl || toEl;
            });

            for (const { parsedApp, from, to, } of foundAppDatas) {
              const fromResult = this.findElementIndex(page.parsedContent as GenericElement[], from.valueWithoutRef);
              if (!fromResult) continue;

              const { index: fromIndex, parent: fromParent } = fromResult;

              let toResult = { index: fromIndex, parent: fromParent };
              if (to) {
                const foundElement = this.findElementIndex(page.parsedContent as GenericElement[], to.valueWithoutRef);
                toResult = foundElement ?? toResult;
              }

              const { index: toIndex, parent: toParent } = toResult;
              if (fromParent === toParent) {
                //const anyWitnessReading = parsedApp.orderedReadings.some(r => r.witIDs.includes(this.witnessItem.id));
                // if (!anyWitnessReading && !parsedApp.lemma) {

                // } else {
                fromParent.splice(fromIndex, fromIndex - toIndex + 1, parsedApp);
                // }

              } else {
                console.error("from and to elements are in different parent nodes. Cannot splice.");
              }
            }

          }
        }

        return originalPages;
      }),
      shareReplay(1)
    )
      .subscribe(originalPages => {
        if (this.pages) return;

        this.pages = originalPages;
        this.currentPage = this.pages.find(p => p.id === this.witnessItem.currentPageId);
      });
  }

  private findElementIndex(content: GenericElement[], targetId: string, currentIndex = 0) {
    for (let i = 0; i < content.length; i++) {
      const element = content[i];
      const id = element.attributes['id'];
      if (id === targetId) {
        return { index: currentIndex + i, parent: content };
      }

      if (element.content && element.content.length > 0) {
        const result = this.findElementIndex(element.content as GenericElement[], targetId, currentIndex);
        if (result) return result;
      }
    }

    return null;
  }

  private findElementByAttribute(element: GenericElement, target: { name: string, value: string }): GenericElement {
    const result = element.attributes[target.name];
    if (result && result === target.value) return element;
    if ((Symbol.iterator in Object(element.content)) === false) return null;

    for (const child of element.content) {
      const result = this.findElementByAttribute(child as GenericElement, target);
      if (result) return result;
    }

    return null;
  }

  emitHide() {
    this.hide.emit(true);
  }

  onChangePage(pageId: string) {
    this.currentPage = this.pages.find(x => x.id === pageId);
    this.changePage.emit(pageId);
  }
}
