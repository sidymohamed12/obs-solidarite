import { TestBed } from '@angular/core/testing';

import { LeafletLoaderService } from './leaflet-loader.service';

describe('LeafletLoaderService', () => {
  let service: LeafletLoaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LeafletLoaderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
