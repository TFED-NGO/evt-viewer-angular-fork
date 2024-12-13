import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'evt-witness-metadata',
  templateUrl: './witness-metadata.component.html',
  styleUrls: ['./witness-metadata.component.scss']
})
export class WitnessMetadataComponent implements OnInit {
  @Input() witnessMetadata: string;

  witnessIds: string[] = [];

  constructor() { }

  ngOnInit(): void {
    const witnessMetadata = this.witnessMetadata;
    if (witnessMetadata.includes(' ')) {
      const witnessIds = witnessMetadata.split(' ');
      this.witnessIds = witnessIds;
    }
    else {
      this.witnessIds = [witnessMetadata];
    }
  }
}
