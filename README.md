# 🌟 Longrich Stockiste System 🌟
### *Système Intelligent de Gestion de Stock, Ventes & Kits pour Stockistes Longrich*

Bienvenue dans le **Longrich Stockiste System**, une application web moderne et haut de gamme conçue spécifiquement pour digitaliser, simplifier et optimiser l'ensemble des activités d'un bureau de stockiste Longrich. 

Propulsée par **Next.js (App Router)** et **Firebase (Firestore & Auth)**, cette plateforme offre un suivi en temps réel des ventes, de la caisse, des kits de démarrage, et intègre un scanner de codes-barres directement via caméra ou douchette externe.

---

## 🚀 Fonctionnalités Clés

### 1. 📊 Tableau de Bord Dynamique & Analytique
*   **Indicateurs de Performance (KPIs) :** Suivi en temps réel du chiffre d'affaires (FCFA), des Points Valeur (PV) cumulés, du nombre total de ventes, et du stock global restant.
*   **Filtres Temporels Avancés :** Analyse dynamique par période (Aujourd'hui, Cette semaine, Ce mois-ci, Cette année, ou Historique global).
*   **Tendances de Vente :** Comparaisons de croissance automatiques avec la période précédente (flèches de tendance et pourcentages d'évolution).
*   **Activité Récente :** Liste des dernières transactions avec accès instantané aux détails.

### 2. 📦 Gestion du Stock en Temps Réel
*   **Catalogue Produits :** Liste complète des produits Longrich avec nom, catégorie, prix (FCFA), PV, et quantité disponible.
*   **Alertes de Stock Bas :** Coloration automatique des stocks critiques (quantité < 10) pour anticiper les réapprovisionnements.
*   **Impression de Codes-barres :** Module intégré permettant de générer et d'imprimer des planches de codes-barres propres au format Longrich pour chaque produit.
*   **Scanner Intégré :** Ajout ou mise à jour de stock ultra-rapide par simple scan (via caméra de téléphone/ordinateur ou scanner externe).

### 3. 🛒 Module de Caisse & Ventes (POS)
*   **Panier Interactif :** Ajout rapide de produits au panier par sélection visuelle ou par scan de code-barres.
*   **Calcul en Direct :** Totalisation automatique du montant en FCFA et du cumul des PV.
*   **Fiche Client / Membre :** Saisie rapide du nom du client et de son identifiant membre Longrich (Code SN) pour l'attribution des PV.
*   **Modes de Paiement Flexibles :** Prise en charge des paiements en **Espèces**, **Wave**, et **Orange Money (OM)**.

### 4. 🎁 Gestion des Kits de Démarrage Longrich
*   **Kits Prédéfinis :** 
    *   **Kit Q-Silver :** 85 000 FCFA | 60 PV (Options : *KR1 / KR2*)
    *   **Kit Silver :** 160 000 FCFA | 120 PV (Options : *Combo 1 / Combo 2*)
    *   **Kit Gold :** 340 000 FCFA | 240 PV
    *   **Kit Platinum :** 860 000 FCFA | 720 PV
    *   **Kit Platinum VIP :** 1 860 000 FCFA | 1680 PV
*   **Personnalisation :** Choix des combos et options de kits, liaison avec le code SN du nouveau membre, et ajout immédiat au panier.

### 5. 🧾 Génération de Reçus Professionnels & Historique
*   **Reçus PDF & Impression :** Création de reçus professionnels contenant le nom du point de vente, le code SN du client, la liste des produits, les totaux FCFA/PV et le mode de paiement.
*   **Historique Complet :** Journal de toutes les ventes passées, entièrement consultable avec barre de recherche multicritères (ID transaction, client, Code SN) et réimpression de reçu à la demande.

### 6. 🔐 Sécurité & Authentification
*   **Accès Protégé :** Connexion sécurisée des administrateurs via Firebase Authentication.
*   **Routage Robuste :** Protection automatique des pages privées en cas d'absence de session.

---

## 🛠️ Stack Technique

*   **Framework :** [Next.js 14+ (React)](https://nextjs.org/) (App Router, Rendering hybride)
*   **Langage :** [TypeScript](https://www.typescriptlang.org/) (Typage fort pour une meilleure maintenabilité)
*   **Styling :** [Tailwind CSS](https://tailwindcss.com/) (Design ultra-fluide, harmonieux, avec thème personnalisé vert-teal de marque Longrich)
*   **Base de Données / Backend :** [Firebase Firestore](https://firebase.google.com/docs/firestore) (Mises à jour des données en temps réel via sockets)
*   **Authentification :** [Firebase Authentication](https://firebase.google.com/docs/auth) (Gestion sécurisée des comptes)
*   **Librairie d'Icônes :** [Lucide React](https://lucide.dev/)

---

## ⚙️ Configuration & Installation

### 1. Prérequis
Assurez-vous d'avoir installé **Node.js (version 18+)** sur votre machine.

### 2. Cloner le Projet
```bash
git clone https://github.com/votre-compte/longrich-system.git
cd longrich-system
```

### 3. Installer les Dépendances
```bash
npm install
```

### 4. Variables d'Environnement
Créez un fichier `.env.local` à la racine du projet et ajoutez-y vos clés Firebase :
```env
NEXT_PUBLIC_FIREBASE_API_KEY=votre_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=votre_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=votre_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=votre_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=votre_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=votre_app_id
```

### 5. Lancer le Serveur de Développement
```bash
npm run dev
```
Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur pour tester l'application.

---

## 📂 Architecture du Code Source

```text
longrich-system/
├── public/                 # Assets statiques (Logos, Icons...)
├── src/
│   ├── app/                # Système de pages (App Router)
│   │   ├── api/            # API d'envoi et de vérification 2FA (si activé)
│   │   ├── history/        # Page de l'historique des ventes
│   │   ├── kits/           # Page de gestion des kits Longrich
│   │   ├── login/          # Page de connexion d'administration
│   │   ├── products/       # Page de gestion du stock et codes-barres
│   │   ├── sales/          # Page de caisse et facturation
│   │   ├── layout.tsx      # Layout global (Polices, Tailwind)
│   │   └── page.tsx        # Tableau de bord principal (Dashboard)
│   ├── components/         # Composants réutilisables
│   │   ├── AdminLayout.tsx # Layout enveloppant la navigation privée
│   │   ├── Sidebar.tsx     # Menu de navigation rétractable (Desktop/Mobile)
│   │   ├── Header.tsx      # Barre supérieure (Profil, Déconnexion)
│   │   ├── ReceiptModal.tsx# Modale de génération de ticket de caisse
│   │   ├── BarcodePrintModal.tsx   # Modale d'édition et d'impression des codes-barres
│   │   └── BarcodeScannerModal.tsx # Scanner de codes-barres avec accès caméra
│   ├── context/            # Gestion des états globaux
│   │   └── AuthContext.tsx # Contexte d'authentification utilisateur Firebase
│   └── lib/                # Fichiers de configuration externe et utilitaires
│       ├── firebase.ts     # Initialisation sécurisée du SDK Firebase
│       └── utils.ts        # Fonctions utilitaires génériques (cn Tailwind)
```

---

## 🔥 Règles de Sécurité Firestore Recommandées

Pour garantir la sécurité de vos données de stock et de transactions sur Firebase, appliquez les règles suivantes dans votre console Firebase Firestore :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

*Développé pour simplifier l'excellence commerciale chez Longrich.* 🟢💚
