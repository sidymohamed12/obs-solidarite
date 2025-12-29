# 🏛️ Observatoire des Solidarités — Developer Guide

Plateforme web officielle du **Ministère de la Famille, de l’Action sociale et des Solidarités** destinée à la gestion, au suivi et à l’analyse des actions de solidarité et des aides sociales.

---

## 📌 Objectif du projet

Ce projet vise à fournir une plateforme numérique moderne permettant :

- L’information et la vulgarisation des politiques sociales
- La soumission et le suivi des demandes d’aides sociales
- La visualisation géographique des actions de solidarité
- L’aide à la décision via des données consolidées

---

## 👥 Utilisateurs cibles

- **Citoyens / bénéficiaires**
- **Travailleurs sociaux**
- **Administrateurs**
- **Décideurs institutionnels**

---

## 🧱 Architecture globale

### Frontend

- SPA basée sur **Angular 20**
- Architecture **feature-based**
- Séparation claire **Public / Admin**
- Sécurité renforcée via **multi-guards**
- Respect strict des principes **Clean Code**, **SOLID** et **DDD light**
- Lazy loading des modules
- Respect des principes **Clean Code** et **SOLID**

---

## 📂 Architecture Frontend (Angular)

```text

after...


```

## 🗺️ Modules fonctionnels

### 🏠 Home

- Présentation de la plateforme
- Chiffres clés
- Partenaires

### 📑 Programmes

- Liste des politiques et programmes sociaux
- Conditions d’éligibilité

### 🗺️ Carte des actions

- Carte interactive par territoire
- Filtres dynamiques :
  - Programme
  - Population cible

### 📝 Demandes

- Dépôt de demande d’aide sociale
- Téléversement de documents justificatifs
- Validation et contrôle des données

### 🔍 Suivi

- Suivi de l’état des demandes
- Historique des aides reçues
- Notifications de mise à jour

### 📰 Actualités

- Publications officielles
- Réalisations et annonces institutionnelles

### 📞 Contact

- Foire Aux Questions (FAQ)
- Formulaire de contact

---

## 🚀 Installation & lancement

### Prérequis

- Node.js ≥ 18
- Angular CLI ≥ 20
- Git

### Installation

```bash
git clone https://github.com/ministere/observatoire-solidarites.git
cd observatoire-solidarites
npm install

```

### Lancement

```bash
ng serve
```

### 📝 Licence

Projet institutionnel – usage interne
© Ministère de la Famille, de l’Action sociale et des Solidarités

### 📬 Contact technique

Équipe DEV – Accel Tech
