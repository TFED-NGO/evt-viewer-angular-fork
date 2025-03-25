import { AppConfig } from 'src/app/app.config';
import { ParserRegister, xmlParser } from '.';
import { AdditionalAttributes, ApparatusEntry, Attribute, GenericElement, Mod, Note, Reading, XMLElement } from '../../models/evt-models';
import { removeSpaces } from '../../utils/xml-utils';
import { AttributeParser, EmptyParser, NoteParser } from './basic-parsers';
import { createParser, getID, Parser, ParseResult } from './parser-models';
import { XMLID_ATTRIBUTE } from 'src/app/models/constants';
import { getTopMostAncestor } from 'src/app/utils/dom-utils';

@xmlParser('rdg', RdgParser)
export class RdgParser extends EmptyParser implements Parser<XMLElement> {
    private readingGroupTagName = 'rdgGrp';
    attributeParser = createParser(AttributeParser, this.genericParse);
    noteParser = createParser(NoteParser, this.genericParse);


    public parse(rdg: XMLElement): Reading {
        const result = {
            type: Reading,
            id: getID(rdg),
            attributes: this.attributeParser.parse(rdg),
            witIDs: this.parseReadingWitnesses(rdg) || [],
            excludedWitIDs: this.parseExcludedWitnesses(rdg),
            content: this.parseAppReadingContent(rdg),
            significant: this.isReadingSignificant(rdg),
            class: rdg.tagName.toLowerCase(),
            varSeq: parseInt(rdg.getAttribute('varSeq')),
            notes: this.parseReadingNotes(rdg),
        };
        return result;
    }

    private parseReadingWitnesses(rdg: XMLElement) {
        return rdg.getAttribute('wit')?.split('#')
            .map((el) => removeSpaces(el))
            .filter((el) => el.length !== 0);
    }

    private parseExcludedWitnesses(rdg: XMLElement) {
        const result = rdg.getAttribute('exclude')?.split('#')
            .map((el) => removeSpaces(el))
            .filter((el) => el.length !== 0);
        return result ?? [];
    }

    private parseAppReadingContent(rdg: XMLElement) {
        return Array.from(rdg.childNodes)
            .map((child: XMLElement) => this.genericParse(child));
    }

    private isReadingSignificant(rdg: XMLElement): boolean {
        const notSignificantReadings = AppConfig.evtSettings.edition.notSignificantVariants;
        let isSignificant = true;

        if (notSignificantReadings.length > 0) {
            isSignificant = this.isSignificant(notSignificantReadings, rdg.attributes);
            if (isSignificant && rdg.parentElement.tagName === this.readingGroupTagName) {
                isSignificant = this.isSignificant(notSignificantReadings, rdg.parentElement.attributes);
            }
        }

        return isSignificant;
    }

    private isSignificant(notSignificantReading: string[], attributes: NamedNodeMap): boolean {
        return !Array.from(attributes).some(({ name, value }) => notSignificantReading.includes(`${name}=${value}`));
    }

    private parseReadingNotes(rdg: XMLElement): Note[] {
        const notes = Array.from(rdg.querySelectorAll('note'))
            .map((note: XMLElement) => this.noteParser.parse(note))
        return notes;
    }
}

@xmlParser('evt-apparatus-entry-parser', AppParser)
export class AppParser extends EmptyParser implements Parser<XMLElement> {
    private noteTagName = 'note';
    private appEntryTagName = 'app';
    private readingTagName = 'rdg';
    private lemmaTagName = 'lem';

    attributeParser = createParser(AttributeParser, this.genericParse);
    noteParser = createParser(NoteParser, this.genericParse);
    rdgParser = createParser(RdgParser, this.genericParse);

    public static create() {
        return ParserRegister.get('evt-apparatus-entry-parser');
    }

    public parse(appEntry: XMLElement): ApparatusEntry {
        const root = getTopMostAncestor(appEntry);
        const lemma = this.parseLemma(appEntry);
        const attributes = this.attributeParser.parse(appEntry);
        let parsedResult: ParseResult<GenericElement>[] = [];

        const from = Attribute.createOrDefault(attributes.from);
        const to = Attribute.createOrDefault(attributes.to);
        const fromEl = root.querySelector(`[*|id='${from.valueWithoutRef}']`) as HTMLElement;
        if (!to) {
            parsedResult.push(this.genericParse(fromEl));
        }
        else {
            const fromParent = fromEl.parentElement;
            if (!fromParent) throw new Error("From parent is required");

            parsedResult = Array
                .from(fromParent.children)
                .skipWhile(element => !this.isElementByXmlId(element, from))
                .takeWhile(element => !this.isElementByXmlId(element, to), { includeLastItem: true })
                .map(this.genericParse);
        }

        if (lemma && !lemma.content.length) {
            lemma.content.push(...parsedResult);
        }

        const criticalContent = parsedResult;

        const readings = this.parseReadings(appEntry);
        const allReadings = (lemma !== undefined) ? readings.concat(lemma) : readings;
        return {
            type: ApparatusEntry,
            id: getID(appEntry),
            attributes: this.attributeParser.parse(appEntry),
            content: [],
            criticalContent: criticalContent,
            lemma: lemma,
            readings: readings,
            notes: this.parseAppNotes(appEntry),
            originalEncoding: appEntry,
            class: appEntry.tagName.toLowerCase(),
            nestedAppsIDs: this.getNestedAppsIDs(appEntry),
            changes: (lemma !== undefined) ? this.orderChanges(allReadings, lemma) : [],
            orderedReadings: Array.from(allReadings).sort((r1, r2) => r1.varSeq - r2.varSeq),
            additionalAttributes: new AdditionalAttributes(),
            exponent: '',
            isWitnessExcluded: ApparatusEntry.prototype.isWitnessExcluded
        };
    }

    private isElementByXmlId(element: Element, attribute: Attribute) {
        const xmlId = element.getAttribute(XMLID_ATTRIBUTE);
        if (!xmlId) {
            const message = 'Element must have an xml id';
            console.error(message, element)
            throw new Error(message);
        }

        return attribute.equals(xmlId);
    }

    private getNestedAppsIDs(app: XMLElement): string[] {
        const nesApps = app.querySelectorAll('app');

        return Array.from(nesApps).map((a: XMLElement) => getID(a));
    }

    private parseAppNotes(appEntry: XMLElement): Note[] {
        const notes = Array.from(appEntry.querySelectorAll(this.noteTagName))
            .map((note: XMLElement) => this.noteParser.parse(note));
        return notes;
    }

    private parseLemma(appEntry: XMLElement): Reading {
        return appEntry.querySelector(`${this.lemmaTagName}`) ?
            this.rdgParser.parse(appEntry.querySelector(`${this.lemmaTagName}`)) : undefined;
    }

    private parseReadings(appEntry: XMLElement): Reading[] {
        return Array.from(appEntry.querySelectorAll(`${this.readingTagName}`))
            .filter((el) => el.closest(this.appEntryTagName) === appEntry)
            .map((rdg: XMLElement) => this.rdgParser.parse(rdg));
    }

    /**
     * This function order readings for varSeq attributes and retrieves lem's first
     * (and hopefully unique) mod element '@change'.
     * This info is useful to mod-component in order to decide when to switch
     * between lemma and reading.
     */
    private orderChanges(readings: Reading[], lemma: Reading): Mod[] {
        const changes = [];
        let lemmaLayer: string;
        Array.from(lemma.content).map((el) => {
            if (el['type'] && el['type'] === Mod) {
                if (el['changeLayer']) {
                    lemmaLayer = el['changeLayer'];
                } else {
                    lemmaLayer = null;
                }
            }
        })
        Array.from(readings).map((reading) => reading.content.map((el) => {
            if (el['type'] && el['type'] === Mod) {
                el['insideApp'] = [true, lemmaLayer];
                changes.push(el);
            }
        }));

        return changes;
    }
}
