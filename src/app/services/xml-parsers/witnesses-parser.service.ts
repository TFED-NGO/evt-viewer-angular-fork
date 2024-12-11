import { Injectable } from '@angular/core';
import { parse } from '.';
import { Description, Witness, XMLElement } from '../../models/evt-models';
import { AttributeParser } from './basic-parsers';
import { GenericParserService } from './generic-parser.service';
import { createParser, getID } from './parser-models';

@Injectable({
  providedIn: 'root',
})
export class WitnessesParserService {
  private attributeParser = createParser(AttributeParser, parse);

  constructor(
    private genericParserService: GenericParserService,
  ) {
  }

  public parseWitnesses(document: XMLElement): Witness[] {
    return this.parseWitnessesInternal(document);
  }

  // At the time of TEI version: P5 Version 4.8.1. Last updated on 1st November 2024, revision 0a2bff95a,
  // a wit can only be contained by a listWit. So we can start from the "top level" listWit's.
  private parseWitnessesInternal(element: XMLElement): Witness[] {
    // Since we want to get the listWit's from everywhere in the document, we use querySelectorAll
    // which returns them flattened, regardless of their hierarchical position.
    let lists = this.getTopLevelListWits(element);
    const witnesses = lists.flatMap(list => this.parseList(list));
    return witnesses;
  }

  private getTopLevelListWits(element: HTMLElement) {
    let lists = Array.from(element.querySelectorAll<XMLElement>('listWit'));
    // Why don't we care to also check if the top level listWit is contained by a witness? 
    // Because a witness can only be contained by a listWit, so we will never encounter a top level witness on its own
    lists = lists.filter((list) => {
      // list.closest('listWit') would return the list itself, so we search from its parentElement
      const parentListWit = list.parentElement.closest('listWit');
      return parentListWit === null;
    });
    return lists;
  }

  private parseList(list: HTMLElement): Witness[] {
    const witnesses: Witness[] = [];
    for (const child of Array.from(list.childNodes) as XMLElement[]) {
      if (child.nodeName === 'witness') {
        const witness = this.parseWitness(child);
        witnesses.push(witness);
      }
      else if (child.nodeName === 'listWit') {
        const witness = this.parseList(child);
        witnesses.push(...witness);
      }
    }
    return witnesses;
  }

  private parseWitness(wit: XMLElement): Witness {
    const id = getID(wit);
    const lists = Array.from(wit.childNodes).filter(child => child.nodeName === 'listWit');
    const witness: Witness = {
      id,
      name: id,
      attributes: this.attributeParser.parse(wit),
      content: this.parseWitnessContent(wit),
      witnesses: lists.flatMap(list => this.parseList(list as XMLElement))
    };
    return witness;
  }

  private parseWitnessContent(wit: XMLElement): Description {
    return Array.from(wit.childNodes)
      .filter((child) => child.nodeName !== 'listWit')
      .map((child: XMLElement) => this.genericParserService.parse(child));
  }
}
