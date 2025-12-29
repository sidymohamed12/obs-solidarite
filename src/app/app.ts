import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavabrComponent } from './shared/components/navabr/navabr.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavabrComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('obs-solidarite');
}
