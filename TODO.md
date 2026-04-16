# 📋 TODO Phase 2 — Projet Sɔrɔ (Scale & Features)

Maintenant que l'architecture fondamentale est robuste, voici les prochaines étapes stratégiques.

## 🚀 1. Fonctionnalités prioritaires (Lancement & Confiance)

- [ ] **Surveillance des Erreurs (Sentry)**
  - Configurer `@sentry/nextjs` et `@sentry/node`.
  - Assurer la remontée des erreurs critiques en production (Railway/Vercel).

- [ ] **Messages Vocaux (Inclusion Numérique)**
  - Support de l'enregistrement et de l'envoi de voix dans le chat P2P.
  - Stockage compressé sur Cloudinary.
  - Lecteur audio intégré dans les bulles de discussion.

## 💡 2. Intelligence & Expertise (Valeur Ajoutée)

- [ ] **Optimisation de l'Expertise (Agro-Conseils IA)**
  - Intégrer un module de chat (GPT-based) pour poser des questions techniques agricoles.
  - Support multilingue (Français / Bamanankan).

- [ ] **Analytique Agriculteur**
  - Graphiques simples montrant l'évolution des prix de vente VS les prix moyens du marché malien.

## 🌍 3. Communauté & Engagement

- [ ] **Espace "Conseils du Village"**
  - Forum de discussion par région pour échanger des astuces (engrais, semences, climat).

---

<details>
<summary>✅ <b>Archive : Tâches Terminées (Phase 2)</b></summary>
<br>

- **Inclusion & UX :**
  - **Internationalisation (i18n) :** Support complet FR, EN, BM (Bamanankan) avec sélecteur dans le Header.
  - **Badges notifications :** Indicateur visuel des messages non lus dans la barre de navigation.
  - **Confiance (Avis & Notations) :** Système de réputation P2P avec étoiles et commentaires vérifiés suite à un achat.
- **Fonctionnalités Métier :**
  - **Portefeuille / Wallet :** Gestion du solde, historique des gains et demandes de retrait (min 2000 FCFA).
  - **Chat P2P :** Système de négociation en temps réel (polling) lié aux annonces.
  - **Notifications SMS :** Alertes automatiques via Africa's Talking pour paiements, annulations, retraits et **suivi de commande (étapes P2P)**.
  - **Suivi de Commande (Workflow) :** Système d'étapes (Payé ➔ Prêt ➔ Livré) avec notifications de statut en temps réel.
  - **Géolocalisation :** Carte interactive (Leaflet) avec marqueurs dynamiques pour les annonces.
- **Acquisition & SEO :**
  - **SEO Dynamique :** Metadata et OpenGraph configurés pour le partage WhatsApp/Facebook.
- **DevOps :**
  - **CI/CD :** Pipeline GitHub Actions pour tests et builds automatisés.

</details>

<details>
<summary>✅ <b>Archive : Tâches Terminées (Phase 1)</b></summary>
<br>

- **UX/PWA :** Configuration PWA, Offline Indicator, Lecture Vocale.
- **Sécurité :** Rate Limiting OTP, Webhooks Flutterwave sécurisés, Transactions Prisma.
- **Tests :** Couverture Vitest (Commissions, Cautions, JWT).

</details>
