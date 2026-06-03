import { Injectable } from '@angular/core';
import { AppConfig } from '../app.config';
import { EditionContextService } from './edition-context.service';

@Injectable({
    providedIn: 'root',
})
export class ThemesService {
    themes: ColorTheme[];
    currentTheme: ColorTheme;

    constructor(private editionContext: EditionContextService) {
        this.themes = [
            {
                value: 'neutral',
                label: 'themeNeutral',
            },
            {
                value: 'modern',
                label: 'themeModern',
            },
            {
                value: 'classic',
                label: 'themeClassic',
            },
        ];
        this.applyThemeFromConfig();
        this.editionContext.editionChange$.subscribe(() => this.applyThemeFromConfig());
    }

    private applyThemeFromConfig() {
        const themeValue = AppConfig.evtSettings?.ui?.theme;
        this.selectTheme(this.themes.find((t) => t.value === themeValue) ?? this.themes[0]);
    }

    selectTheme(theme: ColorTheme) {
        this.currentTheme = theme;
        document.body.setAttribute('data-theme', theme.value); // Needed to let ngb-popover and ngb-modals work properly with themes
    }

    getAvailableThemes(): ColorTheme[] {
        return this.themes;
    }

    getCurrentTheme(): ColorTheme {
        return this.currentTheme;
    }
}

export interface ColorTheme {
    value: string;
    label: string;  // Key in the JSON localization for the label
}
