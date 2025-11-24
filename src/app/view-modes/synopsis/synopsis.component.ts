import { Component, OnDestroy, OnInit } from '@angular/core';
import { SynopsisService } from './synopsis.service';
import { Subscription, tap } from 'rxjs';
import { EditionLevelChangedArgs, PageChangedArgs, SynopsisEdition, XmlIdChangedArgs } from './synopsis.models';
import { CompactType, DisplayGrid, GridsterConfig, GridsterItem, GridType } from 'angular-gridster2';

@Component({
  selector: 'evt-synopsis',
  templateUrl: './synopsis.component.html',
  styleUrls: ['./synopsis.component.scss']
})
export class SynopsisComponent implements OnInit, OnDestroy {
  public editions: SynopsisEdition[] = [];
  public editionsItems: SynopsisEditionItem[] = [];
  public gridsterOptions: GridsterConfig = {}; // cant be null at the start
  private editionsSubscription: Subscription;
  error: string | null;

  constructor(
    private synopsisService: SynopsisService
  ) {
  }

  ngOnInit() {
    this.editionsSubscription = this.synopsisService.allEditions$.pipe(
      tap((editionSources) => {
        this.editionsItems = editionSources.map((x, i) => ({
          edition: x,
          gridsterItem: { cols: 1, rows: 1, y: 0, x: i }
        }));
        this.editions = [...this.editionsItems.map(x => x.edition)];
        this.gridsterOptions = {
          gridType: this.editionsItems.length <= 3 ? GridType.Fit : GridType.ScrollHorizontal,
          displayGrid: DisplayGrid.OnDragAndResize,
          compactType: CompactType.CompactLeft,
          scrollToNewItems: true,
          margin: 0,
          maxRows: 1,
          draggable: {
            enabled: true,
            ignoreContent: true,
            dragHandleClass: 'panel-header',
          },
          resizable: {
            enabled: false,
          },
          mobileBreakpoint: 0
        };
      })).subscribe(() => this.changePage({
        editionId: this.editions[0].editionInfo.editionId,
        pageId: this.editions[0].selectedPage.page.id
      }));
  }

  changePage(args: PageChangedArgs): void {
    const edition = this.editions.find(x => x.editionInfo.editionId === args.editionId);
    const newPage = edition.pages.find(x => x.id == args.pageId);
    const newPageXmlIds = this.synopsisService.getXmlIdsWithCorrespInOtherEditions(this.editions.map(x => x.editionData), edition.editionData, newPage);
    edition.selectedPage.page = newPage;
    edition.selectedPage.xmlIds = newPageXmlIds;

    this.changeXmlId({ editionId: edition.editionInfo.editionId, xmlId: newPageXmlIds[0] })
  }

  changeXmlId(args: XmlIdChangedArgs): void {
    const edition = this.editions.find(x => x.editionInfo.editionId === args.editionId);
    const newXmlId = edition.selectedPage.xmlIds.find(x => x === args.xmlId);
    edition.selectedPage.selectedXmlId = newXmlId;

    this.scrollIntoView(newXmlId);

    const otherEditions = this.editions.filter(x => x.editionInfo.editionId !== args.editionId);
    for (const otherEdition of otherEditions) {
      console.group(otherEdition.editionInfo.editionTitle)

      const newPage = this.synopsisService.getCorrespPageOrDefault(otherEdition.pages, newXmlId);
      if (!newPage) {
        console.log("No corresp page found", newXmlId);
        console.groupEnd();
        continue;
      }

      console.log("Corresp page found", newPage);

      if (newPage.id === otherEdition.selectedPage.page.id) {
        console.log("The corresp page found is the current one")
      }

      const newPageXmlIds = this.synopsisService.getXmlIdsWithCorrespInOtherEditions(this.editions.map(x => x.editionData), otherEdition.editionData, newPage);
      const element = this.synopsisService.getPageElementByAttributeOrDefault(newPage, { key: "corresp", value: newXmlId });
      const elementXmlId = element?.getAttribute("xml:id");
      console.log("Element found is", element, newXmlId, elementXmlId);

      this.scrollIntoView(elementXmlId);

      if (!newPageXmlIds.length && elementXmlId) {
        newPageXmlIds.push(elementXmlId)
      }

      otherEdition.selectedPage.page = newPage;
      otherEdition.selectedPage.xmlIds = newPageXmlIds;
      otherEdition.selectedPage.selectedXmlId = elementXmlId;
      otherEdition.selectedPage.pageSelectionList.selectedPage = {
        pageId: newPage.id,
        pageLabel: newPage.label,
      }

      console.groupEnd();
    }
  }

  private readonly intersectionObservers = new Map<string, IntersectionObserver>();

  private scrollIntoView(xmlId: string) {
    const tryFind = () => {
      const el = document.querySelector(`[data-id='${xmlId}']`) as HTMLElement;
      if (!el) {
        requestAnimationFrame(tryFind); // try again next frame
      } else {
        if (!this.intersectionObservers.has(xmlId)) {
          const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
              if (entry.isIntersecting && entry.intersectionRatio === 1) {
                const highlightClass = "flash-highlight";
                el.classList.toggle(highlightClass);
                observer.disconnect();
                this.intersectionObservers.delete(xmlId);
              }
            });
          }, { threshold: 1.0 });
          observer.observe(el);
        }
      }
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    requestAnimationFrame(tryFind);
  }

  changeEditionLevel(args: EditionLevelChangedArgs) {
    const edition = this.editions.find(x => x.editionInfo.editionId === args.editionId);
    edition.editionLevel = args.editionLevel;
  }

  getGridsterItemForIndex(index: number) {
    return { cols: 1, rows: 1, y: 0, x: index }
  }

  ngOnDestroy(): void {
    this.editionsSubscription.unsubscribe();
    this.intersectionObservers.forEach(x => x.disconnect());
  }
}

export interface SynopsisEditionItem {
  edition: SynopsisEdition;
  gridsterItem: GridsterItem;
}