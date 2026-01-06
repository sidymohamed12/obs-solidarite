import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LeafletLoaderService {
  private leafletLoaded = false;
  private leafletInstance: any = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  async loadLeaflet(): Promise<any> {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    if (this.leafletLoaded && this.leafletInstance) {
      return this.leafletInstance;
    }

    try {
      // Dynamic import only in browser
      const L = await import('leaflet');
      this.leafletInstance = L.default || L;
      this.leafletLoaded = true;

      // Fix for default marker icons
      if (this.leafletInstance && this.leafletInstance.Icon) {
        delete (this.leafletInstance.Icon.Default.prototype as any)._getIconUrl;
        this.leafletInstance.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
      }

      return this.leafletInstance;
    } catch (error) {
      console.error('Error loading Leaflet:', error);
      return null;
    }
  }

  isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
