import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SiteEditionEntry } from '../models/site-config';

@Component({
  selector: 'evt-edition-default-redirect',
  template: '',
})
export class EditionDefaultRedirectComponent implements OnInit {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    const edition = this.route.parent?.snapshot.data?.edition as SiteEditionEntry | undefined;
    const view = edition?.defaultViewMode ?? 'readingText';
    this.router.navigate([view], { relativeTo: this.route.parent, replaceUrl: true });
  }
}
