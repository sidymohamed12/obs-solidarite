import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { UserDto } from '../../../../core/auth/models/auth.models';
import { AuthService } from '../../../../core/auth/services/auth.service';

@Component({
  selector: 'app-admin-citoyens',
  imports: [CommonModule],
  templateUrl: './admin-citoyens.component.html',
  styleUrl: './admin-citoyens.component.css',
})
export class AdminCitoyensComponent implements OnInit {
  private readonly auth = inject(AuthService);

  protected citoyens: UserDto[] = [];

  ngOnInit(): void {
    this.citoyens = this.auth.getCitoyens();
  }
}
