import { Injectable } from '@angular/core';
import { AttributesMap } from 'ng-dynamic-component';
import { AppConfig } from '../app.config';
import { EditorialConvention, EditorialConventionLayouts } from '../models/evt-models';

// List of handled editorial convention
export type EditorialConventionDefaults = 'addition' | 'additionAbove' | 'additionBelow' | 'additionInline' | 'additionLeft' | 'additionRight' |
  'damage' | 'deletion' | 'sicCrux' | 'surplus' | 'sources' | 'analogues' | 'mod' ;

@Injectable({
  providedIn: 'root',
})
export class EditorialConventionsService {
  getLayouts(name: string, attributes: AttributesMap) {
    const excludedFromAttributeControl = ['sources', 'analogues'];
    let layouts: Partial<EditorialConventionLayouts> = null;

    const externalConfig = this.getExternalConfigs()
    const externalLayouts = externalConfig.find((c) => c.element === name &&
      (excludedFromAttributeControl.includes(name) || !attributes || Object.keys(attributes).concat(
        Object.keys(c.attributes)).every((k) => attributes[k] === c.attributes[k])))?.layouts ?? undefined;

    if (externalLayouts) {
      layouts = {
        ...externalLayouts || {},
      }
    }

    return layouts;
  }

  private getExternalConfigs(): EditorialConvention[] {
    const customs = AppConfig.evtSettings.editorialConventions;

    return Object.keys(customs).map((key) => ({
      element: customs[key].markup?.element ?? key,
      attributes: customs[key].markup?.attributes ?? {},
      layouts: customs[key].layouts ?? {},
    }));
  }
}
