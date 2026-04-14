// src/app/components/leaflet-map/leaflet-map.component.ts
import { Component, OnInit, OnDestroy, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RegionService } from '../../services/region.service';

export interface Region {
  name: string;
  pos: [number, number];
  count: number;
  color: string;
  beneficiaries: string;
}

@Component({
  selector: 'app-leaflet-map',
  templateUrl: './leaflet-map.component.html',
  styleUrls: ['./leaflet-map.component.css'],
})
export class LeafletMapComponent implements OnInit, AfterViewInit, OnDestroy {
  private map: any;
  private L: any;
  private readonly senegalCenter: [number, number] = [14.4974, -14.4524];
  private readonly defaultZoom = 7;
  private readonly isBrowser: boolean;

  regions: Region[] = [];

  constructor(
    @Inject(PLATFORM_ID) private readonly platformId: Object,
    private readonly regionService: RegionService,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.loadRegions();
  }

  async ngAfterViewInit(): Promise<void> {
    if (this.isBrowser) {
      // Import Leaflet dynamically only in browser
      this.L = await import('leaflet');
      this.initMap();
      this.addMarkers();
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  loadRegions(): void {
    this.regionService.getRegions().subscribe((regions) => {
      this.regions = regions;
      this.addMarkers();
    });
  }

  private initMap(): void {
    if (!this.L) return;

    this.map = this.L.map('map-senegal', {
      zoomControl: true,
      scrollWheelZoom: false,
    }).setView(this.senegalCenter, this.defaultZoom);

    this.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(this.map);
  }

  private addMarkers(): void {
    if (!this.L || !this.map) return;

    this.regions.forEach((region) => {
      const customIcon = this.L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <div style="background-color: ${region.color}; width: 35px; height: 35px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px;">
              ${region.count}
            </div>
            <span style="font-size: 10px; font-weight: bold; color: #333; margin-top: 2px; text-shadow: 1px 1px 1px white;">${region.name}</span>
          </div>
        `,
        iconSize: [40, 50],
        iconAnchor: [20, 20],
      });

      const marker = this.L.marker(region.pos, { icon: customIcon }).addTo(this.map);

      const popupContent = `
        <div style="font-family: 'Inter', sans-serif; min-width: 180px;">
          <h4 style="margin: 0 0 8px 0; font-weight: 700; color: #111827; border-bottom: 2px solid ${region.color}; padding-bottom: 4px;">
            Région de ${region.name}
          </h4>
          <div style="font-size: 13px; color: #4b5563; line-height: 1.5;">
            <p style="margin: 4px 0;">📍 <b>${region.count}</b> actions</p>
            <p style="margin: 4px 0;">👥 <b>${region.beneficiaries}</b> bénéficiaires</p>
          </div>
          <button style="width: 100%; margin-top: 10px; background: #16a34a; color: white; border: none; padding: 6px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: background 0.2s;">
            Voir les détails
          </button>
        </div>
      `;

      marker.bindPopup(popupContent, {
        closeButton: true,
        autoPan: false,
      });

      marker.on('click', () => {
        this.map.flyTo(region.pos, 10, {
          animate: true,
          duration: 1.2,
        });
      });
    });
  }

  recenterMap(): void {
    if (this.map && this.isBrowser) {
      this.map.closePopup();
      this.map.flyTo(this.senegalCenter, this.defaultZoom, {
        animate: true,
        duration: 1.5,
      });
    }
  }
}

// src/app/components/leaflet-map/leaflet-map.component.html
/*
<div class="map-placeholder relative h-[400px] sm:h-[500px] lg:h-[600px] xl:h-[700px]">
  <div id="map-senegal"></div>

  <div class="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4 border border-gray-200 z-[1000]">
    <h4 class="text-sm font-bold text-gray-900 mb-3">Légende</h4>
    <div class="space-y-2">
      <div class="flex items-center space-x-2">
        <div class="w-3 h-3 bg-green-500 rounded-full"></div>
        <span class="text-[10px] text-gray-700">Dakar (+200)</span>
      </div>
      <div class="flex items-center space-x-2">
        <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
        <span class="text-[10px] text-gray-700">Thiès/Kaolack (100-200)</span>
      </div>
      <div class="flex items-center space-x-2">
        <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
        <span class="text-[10px] text-gray-700">Saint-Louis (50-100)</span>
      </div>
    </div>
  </div>
</div>
*/
