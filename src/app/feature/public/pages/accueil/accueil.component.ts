import { Component } from '@angular/core';

@Component({
  selector: 'app-accueil',
  imports: [],
  templateUrl: './accueil.component.html',
  styleUrl: './accueil.component.css',
})
export class AccueilComponent {
  partners: any = [
    {
      name: 'ONU FEMMES',
      color: 'text-blue-600',
      sub: 'Égalité des sexes',
      logo: 'https://apf-francophonie.org/sites/default/files/2023-01/onu-femmes.svg',
    },
    {
      name: 'UNFPA',
      color: 'text-orange-500',
      sub: 'Santé & Population',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/UNFPA_logo.svg/2560px-UNFPA_logo.svg.png',
    },
    {
      name: 'UNICEF',
      color: 'text-sky-500',
      sub: "Protection de l'enfance",
      logo: 'https://i.pinimg.com/564x/08/5a/d4/085ad448933875d5c3f3da93bfaac820.jpg',
    },
    {
      name: 'QATAR CHARITY',
      color: 'text-red-700',
      sub: 'Aide Humanitaire',
      logo: 'https://www.theworldfolio.com/img_db/companies/company-578f819a443b0.jpg',
    },
    {
      name: 'TOSTAN',
      color: 'text-emerald-700',
      sub: 'Développement Local',
      logo: 'https://www.novojob.com/senegal/attachments/company_logo/logo_2493217.jpg',
    },
  ];
}
