import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, Observable, of, throwError } from 'rxjs';
import { catchError, map, mergeMap, shareReplay, tap } from 'rxjs/operators';
import { AppConfig, EditionTextSource } from '../app.config';
import { parseXml } from '../utils/xml-utils';
import { PrefatoryMatterParserService } from './xml-parsers/prefatory-matter-parser.service';
import { EditionInfo, EditionSource } from './named-entities.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root',
})
export class EditionDataService {
  private readonly editionTextSources = AppConfig.evtSettings.editionTextSources;
  public readonly allEditionSources$: Observable<EditionSource[]> =
    forkJoin(
      this.editionTextSources.map(s =>
        this.loadAndParseEditionData(s)
      )
    ).pipe(
      shareReplay(1)
    );

  constructor(
    private http: HttpClient,
    private prefatoryMatterParser: PrefatoryMatterParserService
  ) {
  }

  private loadAndParseEditionData(source: EditionTextSource): Observable<EditionSource> {
    const { url, friendlyName, glossaryUrl } = source;
    return this.http.get(url, { responseType: 'text' }).pipe(
      map((source) => parseXml(source)),
      tap(source => {
        setId(source.lastElementChild as HTMLElement);
        console.log('edited source', source);

        function setId(element: HTMLElement) {
          if (element.setAttributeNS) {
            if (element.getAttribute('xml:id') === null) {
              element.setAttributeNS("http://www.w3.org/XML/1998/namespace", 'xml:id', `evt-${uuidv4()}`);
            }
            for (const child of Array.from(element.children)) {
              setId(child as HTMLElement);
            }
          }
        }
      }),
      // merge lists if both urls and xi:include are specified
      mergeMap((editionData) => this.loadXIinclude(editionData, url.substring(0, url.lastIndexOf('/') + 1))),
      mergeMap(editionData =>
        forkJoin({
          editionData: of(editionData),
          glossary: glossaryUrl ? this.http.get(glossaryUrl, { responseType: 'text' }) : of(''),
        })
      ),
      map(({ editionData, glossary }) => {
        const editionInfo: EditionInfo = {
          editionId: url.split('/').pop().split('.')[0], // assets/data/myFile.xml => myFile --- TODO: improve with proper id in xml 
          editionTitle: this.prefatoryMatterParser.parseEditionTitle(editionData),
          editionFriendlyName: friendlyName
        };
        const parsedGlossary = glossary ? parseXml(glossary) : null;
        const editionSource: EditionSource = { editionSource: source, editionData, editionInfo, glossary: parsedGlossary };
        return editionSource;
      }),
      catchError((e) => throwError(() => {
        console.error(e.message);
        return this.createError()
      }
      ))
    );
  }

  loadXIinclude(doc: HTMLElement, baseUrlPath: string) {
    const filesToInclude = Array.from(doc.getElementsByTagName('xi:include'));
    const xiIncludeLoadsSubs = filesToInclude.map((element) =>
      this.http.get(baseUrlPath + element.getAttribute('href'), { responseType: 'text' })
        .pipe(
          tap((fileData) => {
            const includedDoc = parseXml(fileData);
            const fileXpointer = element.getAttribute('xpointer');
            let includedElement: Node;
            if (fileXpointer) {
              includedElement = doc.querySelector(`[*|id="${fileXpointer}"]`)
                || includedDoc.querySelector(`[*|id="${fileXpointer}"]`)
                || includedDoc.querySelector('text');
            } else {
              includedElement = includedDoc.querySelector('text');
            }

            if (!includedElement) throw new Error("No element to include found");
            // element.parentNode.replaceChild(includedTextElem, element);
            element.parentNode.appendChild(includedElement);
          }),
          catchError((e) => {
            console.error(`Loading XInclude failed for element`, element, e);
            Array.from(element.getElementsByTagName('xi:fallback')).map((el) => {
              const divEl = document.createElement('div');
              divEl.classList.add('xiinclude-fallback');
              divEl.setAttribute('xml:id', element.getAttribute('xpointer'));
              divEl.innerHTML = `<p>${el.innerHTML}</p>`;

              return divEl;
            }).forEach((el) => element.parentNode.replaceChild(el, element));

            return of(doc);
          }),
        ));
    if (xiIncludeLoadsSubs.length > 0) {
      return forkJoin(xiIncludeLoadsSubs).pipe(map(() => doc));
    }

    return of(doc);
  }

  private createError() {
    if (!this.editionTextSources || this.editionTextSources.length === 0) {
      return new Error('Missing configuration for edition files. Data cannot be loaded.');
    } else {
      return new Error('There was an error in loading edition files.');
    }
  }
}
