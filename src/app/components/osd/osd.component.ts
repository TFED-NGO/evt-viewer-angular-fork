import { AppConfig } from 'src/app/app.config';
import {
  AfterViewInit, ChangeDetectionStrategy, Component,
  ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild
} from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { BehaviorSubject, combineLatest, Observable, of, Subject, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, takeUntil, withLatestFrom } from 'rxjs/operators';
import { Page, Point, Surface, ViewerDataType } from '../../models/evt-models';
import { OsdTileSource, ViewerDataInput } from '../../models/evt-polymorphic-models';
import { uuid } from '../../utils/js-utils';
import { EvtLinesHighlightService } from 'src/app/services/evt-lines-highlight.service';
import { EVTModelService } from '../../services/evt-model.service';
import { sameIds } from 'src/app/utils/xml-utils';

// eslint-disable-next-line no-var
declare var OpenSeadragon;

interface OsdAnnotation {
  id: string;
  element: HTMLElement;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  text: string;
  modalService?: NgbModal;
}

interface OsdAnnotationAPI {
  elements: OsdAnnotation[];
  getElements: () => OsdAnnotation[];
  getElementById: (id: string) => OsdAnnotation;
  addElement: (e: OsdAnnotation) => OsdAnnotation[];
  addElements: (es: OsdAnnotation[]) => OsdAnnotation[];
  removeElementById: (id: string) => void;
  removeElementsById: (ids: string[]) => void;
  goToElementLocation: (id: string) => void;
}

interface OsdViewerAPI {
  addHandler: (eventName: string, handler: (x: { page?: number, position: {} }) => void) => void;
  goToPage: (page: number) => void;
  viewport;
  gestureSettingsMouse;
  container;
  raiseEvent: (evtName: string) => void;
  forceRedraw: () => void;
  destroy: () => void;
  canvasOverlay: ({ }) => OpenSeaDragonOverlay;
}

interface OpenSeaDragonOverlay {
  canvas: () => HTMLCanvasElement;
  context2d: () => CanvasRenderingContext2D;
}

@Component({
  selector: 'evt-osd',
  templateUrl: './osd.component.html',
  styleUrls: ['./osd.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OsdComponent implements AfterViewInit, OnDestroy {

  @ViewChild('osd', { read: ElementRef, static: true }) div: ElementRef;
  private unsubscribeAll$ = new Subject<void>();

  private surface$ = new BehaviorSubject<Surface | undefined>(undefined);

  @Input() set surface(v: Surface | undefined) {
    this.surface$.next(v);
  }

  get surface(): Surface | undefined {
    return this.surface$.value;
  }

  @Input() pageElement: Page;
  // tslint:disable-next-line: variable-name
  private _options;
  @Input() set options(v) { // TODO: add interface to better type this object
    if (v !== this._options) {
      this._options = v;
      this.optionsChange.next(this._options);
    }
  }
  get options() { return this._options; }
  optionsChange = new BehaviorSubject({});

  private viewerDataType: ViewerDataType;
  public _viewerSource: ViewerDataInput; // tslint:disable-line: variable-name
  @Input() set viewerData(v: ViewerDataType) {
    this.viewerDataType = v;
    this._viewerSource = v.source.getSource(v);
    this.sourceChange.next(this._viewerSource);
  }
  sourceChange = new BehaviorSubject<ViewerDataInput>([]);

  // tslint:disable-next-line: variable-name
  private _page: number;
  @Input() set page(v: number) {
    if (v !== this._page) {
      this._page = v;
      this.viewer?.goToPage(v);
    }
  }

  get page() { return this._page; }

  @Output() pageChange = new EventEmitter<number>();

  @Input() text: string;

  viewer: Partial<OsdViewerAPI>;
  viewerId: string;
  overlay: OpenSeaDragonOverlay;
  annotationsHandle: OsdAnnotationAPI;

  private subscriptions: Subscription[] = [];

  tileSources: Observable<OsdTileSource[]>;

  @Input() sync: boolean;

  private lineSelected: Array<{
    id: string; corresp: string;
    // ul: { x: number; y: number; },
    // lr: { x: number; y: number; },
    coords: Point[],
    selected: boolean | undefined
  }> = [];
  mouseMoved$ = new Subject<{ x: number; y: number; }>();
  mouseClicked$ = new Subject<{ x: number; y: number; }>();

  constructor(
    private http: HttpClient, private linesHighlightService: EvtLinesHighlightService,
    private evtModelService: EVTModelService
  ) {
    this.subscriptions.push(
      this.pageChange.pipe(
        distinctUntilChanged(),
      ).subscribe((x) => this.viewer?.goToPage(x - 1)),
    );
  }

  private isPointInsidePolygon(coords: Point[], x: number, y: number): boolean {
    let intersections = 0;

    for (let i = 0; i < coords.length; i++) {
      const p1 = coords[i];
      const p2 = coords[(i + 1) % coords.length];

      if ((p1.y > y) !== (p2.y > y) &&
        x < ((p2.x - p1.x) * (y - p1.y)) / (p2.y - p1.y) + p1.x) {
        intersections++;
      }
    }

    return intersections % 2 === 1;
  }

  ngAfterViewInit() {
    this.viewerId = uuid('openseadragon');
    this.div.nativeElement.id = this.viewerId;

    try {
      this.tileSources = this.viewerDataType.source.getTileSource(this.sourceChange, this.http);
    } catch {
      this.tileSources = of([]);
    }

    const commonOptions = {
      visibilityRatio: 0.66,
      minZoomLevel: 0.3,
      maxZoomLevel: AppConfig.evtSettings.edition.maxImageZoomLevel,
      defaultZoomLevel: AppConfig.evtSettings.edition.defaultImageZoomLevel,
      sequenceMode: true,
      prefixUrl: 'assets/osd/images/',
      id: this.div.nativeElement.id,
      navigatorBackground: '#606060',
      showNavigator: true,
      gestureSettingsMouse: {
        clickToZoom: false,
        dblClickToZoom: true,
      },
      aspectRatio: 0.66,
      immediateRender: true,
      preload: true,
      placeholderFillStyle: 'assets/images/empty-image.jpg',
    };

    this.subscriptions.push(
      combineLatest([
        this.optionsChange,
        this.tileSources,
        this.evtModelService.pages$
      ])
        .pipe(takeUntil(this.unsubscribeAll$))
        .subscribe(([_, tileSources, pages]) => {

          const sortedUrls = pages.map(p => p.facsUrl ?? p.url);
          const orderMap = new Map<string, number>();
          sortedUrls.forEach((url, index) => orderMap.set(url, index));

          const sortedTileSources = [...tileSources]
            .filter(x => orderMap.has(x.url))
            .sort((a, b) =>
              (orderMap.get(a.url) ?? 0) - (orderMap.get(b.url) ?? 0)
            );

          // destroy previous viewer
          if (this.viewer) {
            this.viewer.destroy();
            this.viewer = undefined;
          }

          const tiles = sortedTileSources.length === 0
            ? pages.map(p => ({
              type: 'image',
              url: p.facsUrl,
            } as OsdTileSource))
            : sortedTileSources;

          this.viewer = OpenSeadragon({
            ...commonOptions,
            ...this.options,
            tileSources: tiles,
          });

          this.viewer.goToPage(this.page);

          this.viewer.addHandler('page', ({ page }) => {
            this.pageChange.next(page + 1);
          });

          this.viewer.addHandler('open-failed', () => {
            const canvasEl: HTMLCanvasElement =
              this.div?.nativeElement?.querySelector('.openseadragon-canvas canvas');

            if (canvasEl) {
              const context = canvasEl.getContext('2d');
              context.clearRect(0, 0, canvasEl.width, canvasEl.height);
            }
          });

          this.viewer.addHandler('canvas-click', (evt) => {
            const webPoint = evt.position;
            const viewportPoint = this.viewer.viewport.pointFromPixel(webPoint);
            const imagePoint = this.viewer.viewport.viewportToImageCoordinates(viewportPoint);
            this.mouseClicked$.next({ x: imagePoint.x, y: imagePoint.y });
          });

          this.viewer.addHandler('open', () => {
            const tracker = new OpenSeadragon.MouseTracker({
              element: this.viewer.container,
              moveHandler: (event) => {
                const webPoint = event.position;
                const viewportPoint = this.viewer.viewport.pointFromPixel(webPoint);
                const imagePoint = this.viewer.viewport.viewportToImageCoordinates(viewportPoint);
                this.mouseMoved$.next({ x: imagePoint.x, y: imagePoint.y });
              },
            });

            tracker.setTracking(true);
          });

          // overlay (depends on surface)
          combineLatest([this.surface$])
            .pipe(takeUntil(this.unsubscribeAll$))
            .subscribe(([surface]) => {
              if (!surface) return;

              const originalImageWidth = +surface.graphics[0].width.replace('px', '');
              const originalImageHeight = +surface.graphics[0].height.replace('px', '');
              const aspectRatio = originalImageHeight / originalImageWidth;

              this.overlay = this.viewer.canvasOverlay({
                onRedraw: () => {
                  for (const lineSelected of this.lineSelected) {
                    const ctx = this.overlay.context2d();
                    ctx.beginPath();

                    ctx.moveTo(
                      lineSelected.coords[0].x / originalImageWidth,
                      (lineSelected.coords[0].y / originalImageHeight) * aspectRatio
                    );

                    for (let i = 1; i < lineSelected.coords.length; i++) {
                      ctx.lineTo(
                        lineSelected.coords[i].x / originalImageWidth,
                        (lineSelected.coords[i].y / originalImageHeight) * aspectRatio
                      );
                    }

                    ctx.closePath();
                    ctx.fillStyle = lineSelected.selected ? '#aaaa19' : '#d36019';
                    ctx.globalAlpha = 0.2;
                    ctx.strokeStyle = 'black';
                    ctx.fill();
                  }
                },
                clearBeforeRedraw: true,
              });
            });
        })
    );

    this.mouseMoved$.pipe(
      withLatestFrom(
        this.surface$,
        this.linesHighlightService.syncTextImage$
      ),
      filter(([_, surface, isSync]) => !!surface?.zones?.lines?.length && isSync),
      takeUntil(this.unsubscribeAll$),
    ).subscribe(([imagePoint, surface]) => {

      const linesOver = surface.zones.lines.filter(line =>
        this.isPointInsidePolygon(line.coords, imagePoint.x, imagePoint.y)
      );

      const elementsSelected =
        this.linesHighlightService.lineBeginningSelected$
          .getValue()
          .filter(e => e.selected);

      const linesOverMapped = linesOver
        .filter(lo => !elementsSelected.some(es => es.corresp === lo.corresp))
        .map(lo => ({
          id: lo.corresp,
          corresp: lo.corresp,
          selected: undefined,
        }));

      this.linesHighlightService.lineBeginningSelected$.next([
        ...elementsSelected,
        ...linesOverMapped,
      ]);
    });

    this.mouseClicked$.pipe(
      withLatestFrom(
        this.surface$,
        this.linesHighlightService.syncTextImage$
      ),
      filter(([_, surface, isSync]) => !!surface?.zones?.lines?.length && isSync),
      takeUntil(this.unsubscribeAll$),
    ).subscribe(([imagePoint, surface]) => {

      const linesOver = surface.zones.lines.filter(line => {
        const ul = line.coords[0];
        const lr = line.coords[2];

        return imagePoint.x > ul.x &&
          imagePoint.x < lr.x &&
          imagePoint.y > ul.y &&
          imagePoint.y < lr.y;
      });

      const clicked = linesOver[linesOver.length - 1];
      if (clicked) {
        this.linesHighlightService.lineBeginningSelected$.next([
          {
            id: clicked.corresp,
            corresp: clicked.corresp,
            selected: true,
          }
        ]);
      } else {
        this.linesHighlightService.lineBeginningSelected$.next([]);
      }
    });

    this.linesHighlightService.zonesHighlights$.pipe(
      distinctUntilChanged(sameIds),
      withLatestFrom(this.linesHighlightService.syncTextImage$),
      filter(([_zones, sync]) => sync),
      takeUntil(this.unsubscribeAll$),
    ).subscribe(([zones]) => {
      this.lineSelected = zones ?? [];

      if (zones?.length > 0) {
        this.linesHighlightService.highlightLineText(
          zones.map(z => ({ id: z.corresp, selected: z.selected }))
        );
      } else {
        this.linesHighlightService.clearHighlightText();
      }

      this.viewer?.forceRedraw();
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
    try {
      this.linesHighlightService.clearHighlightText();
    } catch (e) {
      console.error(e);
    }
    this.unsubscribeAll$.next();
    this.unsubscribeAll$.complete();
  }
}
