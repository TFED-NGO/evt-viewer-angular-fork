import { EditionLevel } from "src/app/app.config";
import { Page } from "src/app/models/evt-models";

export interface Attribute {
    key: string;
    value: string;
}

export interface SynopsisEdition {
    editionId: string;
    editionData: HTMLElement;
    selectedPage: SynopsisSelectedPage;
    pages: Page[];
    editionLevel: EditionLevel;
    editionTitle: string;
}

export interface SynopsisPageSelection {
    pageId: string;
    pageLabel: string;
}

export interface SynopsisPageSelectionList {
    pages: SynopsisPageSelection[]
    selectedPage: SynopsisPageSelection
}

export interface SynopsisSelectedPage {
    page: Page;
    xmlIds: string[]
    selectedXmlId: string,
    pageSelectionList: SynopsisPageSelectionList
}

export interface PageChangedArgs {
    editionId: string;
    pageId: string;
}

export interface XmlIdChangedArgs {
    editionId: string;
    xmlId: string;
}

export interface EditionLevelChangedArgs{
    editionId: string;
    editionLevel: EditionLevel;
}