import { Injectable } from "@angular/core";
import { EditionDataService } from "./edition-data.service";
import { NamedEntitiesParserService } from "./xml-parsers/named-entities-parser.service";
import { map, shareReplay, Observable } from "rxjs";
import { NamedEntities, NamedEntityOccurrence } from "../models/evt-models";
import { StructureXmlParserService } from "./xml-parsers/structure-xml-parser.service";
import { Map } from '../utils/js-utils';

@Injectable({
    providedIn: 'root',
})
export class NamedEntitiesService {
    private readonly allEditionSources$: Observable<AllEditionSources> = this.editionDataService.allEditionSources$.pipe(
        map((editionSources) => new AllEditionSources(editionSources)),
        shareReplay(1)
    );

    private readonly allPages$ = this.allEditionSources$.pipe(
        map(sources => sources
            .getAllEditionSources()
            .map(({ editionInfo, editionData }) => ({
                editionInfo,
                pages: this.editionStructureParser.parsePages(editionData).pages
            }))),
        shareReplay(1),
    );

    readonly allEntitiesOccurrences$: Observable<EditionNamedEntitiesOccurrences[]> = this.allPages$.pipe(
        map((pages) => pages.map(({ editionInfo, pages }) => ({
            editionInfo,
            entitiesOccurrences: this.namedEntitiesParser.parseNamedEntitiesOccurrences(pages)
        }))),
        shareReplay(1),
    );

    constructor(
        private editionDataService: EditionDataService,
        private namedEntitiesParser: NamedEntitiesParserService,
        private editionStructureParser: StructureXmlParserService,
    ) { }
}

export class AllEditionSources {
    constructor(private editionSources: EditionSource[]) { }

    getAllEditionSources(): EditionSource[] {
        return [...this.editionSources];
    }

    getEditionSource(editionTitle: string): EditionSource {
        const edition = this.editionSources.find(x => x.editionInfo.editionTitle === editionTitle);
        if (!edition) throw new Error('No edition found with title' + editionTitle);

        return edition;
    }
}

export interface EditionSource {
    id: string;
    editionInfo: EditionInfo;
    editionData: HTMLElement;
    glossary: HTMLElement;
}

export interface EditionInfo {
    editionTitle: string;
    editionFriendlyName: string;
}

export interface EditionNamedEntities {
    editionInfo: EditionInfo;
    namedEntities: NamedEntities;
}

export interface EditionNamedEntitiesOccurrences {
    editionInfo: EditionInfo;
    entitiesOccurrences: Map<NamedEntityOccurrence[]>;
}