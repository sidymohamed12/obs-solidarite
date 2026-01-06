import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavabrComponent } from './shared/components/navabr/navabr.component';
import { FooterComponent } from './shared/components/footer/footer.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavabrComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('TAXAWU');
}
