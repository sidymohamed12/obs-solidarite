import { Component, inject, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { Programme } from '../../../../models/programme.model';
import { ProgrammeService } from '../../services/programme.service';

@Component({
  selector: 'app-programme',
  imports: [],
  templateUrl: './programme.component.html',
  styleUrl: './programme.component.css',
})
export class ProgrammeComponent implements OnInit {
  programmes: Programme[] = [];
  isProgramsLoading: boolean = false;
  private readonly programmeService: ProgrammeService = inject(ProgrammeService);

  ngOnInit(): void {
    this.loadProgrammes();
  }

  loadProgrammes(): void {
    this.isProgramsLoading = true;
    this.programmeService
      .getPrograms()
      .pipe(finalize(() => (this.isProgramsLoading = false)))
      .subscribe({
        next: (programmes) => {
          this.programmes = programmes;
        },
        error: (error) => {
          console.error(error);
        },
      });
  }
}
