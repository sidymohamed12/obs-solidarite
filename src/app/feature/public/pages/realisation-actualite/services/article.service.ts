import { Injectable } from '@angular/core';
import { Article } from '../../../models/article.model';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ArticleService {
  private readonly articles: Article[] = [
    {
      id: 1,
      type: 'actualite',
      image: 'realisations/collab-styliste.jpg',
      date: 'hier',
      title:
        'Autonomisation des femmes : le ministère de la Famille s’ouvre à l’expertise d’Oumou Sy',
      description:
        'Madame le Ministre de la Famille, de l’Action sociale et des Solidarités, Madame Maïmouna Dièye, a reçu en audience, le lundi 02 février 2026, la grande styliste sénégalaise Madame Oumou Sy. Cette rencontre a été l’occasion d’échanger sur les perspectives de collaboration entre le ministère et la styliste autour des questions de solidarité et d’autonomisation à travers la mode. Madame le Ministre a salué la qualité du travail de Madame Oumou Sy ainsi que l’ensemble de son parcours. De son côté, Madame Oumou Sy a exprimé sa joie et sa satisfaction d’avoir été reçue en audience par Madame le Ministre. Les échanges ont permis d’envisager une collaboration visant à renforcer les compétences des femmes, à travers des programmes d’apprentissage, notamment au sein des CEDAF. Dans cette dynamique, Madame Oumou Sy a exprimé sa disponibilité à mettre son expérience et son savoir-faire au service du ministère afin de contribuer à l’autonomie et à l’amélioration des performances dans le domaine de la mode.',
    },
    {
      id: 2,
      type: 'actualite',
      image: 'realisations/tournoi-foot.jpg',
      date: 'Il y a 5 jours',
      title: 'Tournoi de la Solidarité 2025',
      description: '#Mifass #Sénégal',
    },
    {
      id: 3,
      type: 'realisation',
      image: 'realisations/kdo-bb.jpg',
      date: 'Il y a 6 jours',
      title: 'Célébration du « Bébé de l’Équité » à Bafata (Sédhiou)',
      description:
        'Ce lundi 26 janvier 2026, Madame Maïmouna Dièye, Ministre de la Famille, de l’Action sociale et des Solidarités, a présidé la 6ᵉ édition du Bébé de l’Équité à Bafata, localité frontalière avec la Guinée-Bissau, dans le cadre du PUMA. À cette occasion, d’importants appuis sociaux ont été remis : équipements médicaux, aides alimentaires, registres d’état civil, bourses, financement d’activités génératrices de revenus, riz et moulin pour les femmes. Madame le Ministre a réaffirmé l’engagement de l’État en faveur des zones frontalières et du bien-être de la mère et de l’enfant.',
      isFeatured: true,
    },
    {
      id: 4,
      type: 'actualite',
      image: 'realisations/collab-coumba.jpg',
      date: 'Il y a 1 sem',
      title: 'Partenariat social : Mme Maïmouna Dièye reçoit l’artiste Coumba Gawlo Seck',
      description:
        'Renforcement des partenariats sociaux et culturels : Mme Maimouna Dièye reçoit Mme Coumba Gawlo Seck Le mercredi 21 janvier 2025, Mme Maimouna Dièye, Ministre de la Famille, de l’Action sociale et des Solidarités, a reçu en audience l’artiste chanteuse Mme Coumba Gawlo Seck. Au cours de cette rencontre, plusieurs pistes de collaboration ont été abordées, notamment l’organisation du Festival international « Chants des Linguères », la célébration de la Journée de l’Enfant Africain, ainsi que le programme « Dakar Zéro Noyade », dont Mme le Ministre a été choisie comme marraine, entre autres initiatives. Les échanges ont également porté sur le programme SWEDD+, dédié à l’autonomisation des femmes et des adolescentes et à la promotion de l’égalité de genre, pour lequel Mme Coumba Gawlo Seck est ambassadrice. Au terme de l’audience, Mme le Ministre a réaffirmé son engagement et sa disponibilité pour la mise en œuvre d’actions en faveur de la famille, notamment au bénéfice des enfants, des femmes et des groupes vulnérables.',
    },
    {
      id: 5,
      type: 'actualite',
      image: 'realisations/collab-ligue-islamique.jpg',
      date: 'Il y a 1 sem',
      title:
        'Le Ministère de la Famille et la Ligue Islamique Mondiale unissent leurs efforts pour les populations vulnérables',
      description:
        'Renforcement de la coopération entre le Ministère de la Famille, de l’Action Sociale et des Solidarités et la Ligue Islamique Mondiale — Sénégal Le Ministre de la Famille, de l’Action Sociale et des Solidarités, Mme Maimouna Dieye a reçu en audience, le mercredi 21 janvier 2025, Mr Abdallah Khalid Otheimin Directeur général régional de la Ligue Islamique Mondiale – Sénégal avec sa délégation. Cette audience s’inscrit dans le cadre du renforcement de la coopération institutionnelle, en particulier autour des actions de prise en charge et d’accompagnement des familles vulnérables. Les échanges ont permis d’explorer des axes de collaboration entre le Ministère et la Ligue Islamique Mondiale, en vue de la mise en œuvre d’initiatives conjointes, durables et inclusives, au bénéfice des populations les plus vulnérables, conformément aux orientations stratégiques de l’État en matière de solidarité nationale.',
    },
    {
      id: 6,
      type: 'realisation',
      image: 'realisations/appel-sey-lima.jpg',
      date: 'Il y a 2 sem',
      title:
        'Organisation de l’Appel de Seydina Limamou Lahi : le Ministre de la Famille apporte le soutien de l’État',
      description:
        '𝐀𝐩𝐩𝐞𝐥 𝐝𝐞 𝐒𝐞𝐲𝐝𝐢𝐧𝐚 𝐋𝐢𝐦𝐚𝐦𝐨𝐮 𝐋𝐚𝐡𝐢 : 𝐥𝐞 𝐌𝐢𝐧𝐢𝐬𝐭𝐫𝐞 𝐝𝐞 𝐥𝐚 𝐅𝐚𝐦𝐢𝐥𝐥𝐞 𝐫𝐞́𝐚𝐟𝐟𝐢𝐫𝐦𝐞 𝐥𝐞 𝐬𝐨𝐮𝐭𝐢𝐞𝐧 𝐝𝐞 𝐥’𝐄́𝐭𝐚𝐭… En prélude au 146ᵉ anniversaire de l’Appel de Seydina Limamou Lahi, le Ministre de la Famille, de l’Action sociale et des Solidarités, Madame Maïmouna Dièye, a effectué, ce jeudi 15 janvier 2026, une visite de courtoisie et de soutien auprès du Khalife général des Layennes, Seydina Mouhamadou Lamine Lahi. A cette occasion, Madame le Ministre a réaffirmé, au nom du Gouvernement, l’engagement de l’État à accompagner l’organisation de cet important événement religieux. Madame le Ministre a également remis, entre les mains du Khalife général, un lot d’appui destiné à contribuer à la bonne organisation de l’événement. Pour sa part, le Khalife général a magnifié ce geste, tout en formulant des prières pour la réussite des missions confiées au Ministre. Il a rappelé l’importance de ce département ministériel, soulignant que la famille constitue le lieu de construction du citoyen.',
    },
  ];

  getArticles(): Observable<Article[]> {
    return of(this.articles);
  }

  getArticleById(id: number): Observable<Article | undefined> {
    return of(this.articles.find((article) => article.id === id));
  }

  getArticlesByType(type: string): Observable<Article[]> {
    return of(this.articles.filter((article) => article.type === type));
  }
}
