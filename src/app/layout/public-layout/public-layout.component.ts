import { Component } from '@angular/core';
import { NavabrComponent } from '../../shared/components/navabr/navabr.component';
import { RouterModule } from '@angular/router';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-public-layout',
  imports: [NavabrComponent, RouterModule, FooterComponent],
  templateUrl: './public-layout.component.html',
  styleUrl: './public-layout.component.css',
})
export class PublicLayoutComponent {}
