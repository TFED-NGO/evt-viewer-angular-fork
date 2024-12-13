import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrDottedComponent } from './hr-dotted.component';

describe('HrDottedComponent', () => {
  let component: HrDottedComponent;
  let fixture: ComponentFixture<HrDottedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HrDottedComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HrDottedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
