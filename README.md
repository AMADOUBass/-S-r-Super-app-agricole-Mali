# Sɔrɔ — Super-app agricole Mali

> "Sɔrɔ" = obtenir / récolter / gagner en bambara

Plateforme PWA qui connecte agriculteurs, acheteurs et éleveurs au Mali.

---

## Installation

### 1. Backend

```bash
cd backend

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# → Éditez .env avec vos vraies valeurs (Supabase, AfricasTalking, CinetPay, Cloudinary)

# Générer le client Prisma
npm run prisma:generate

# Créer les tables en base de données
npm run prisma:migrate

# Lancer en développement (port 5000)
npm run dev
```

### 2. Frontend

```bash
cd frontend

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.local.example .env.local
# → Éditez .env.local (NEXT_PUBLIC_API_URL=http://localhost:5000)

# Lancer en développement (port 3000)
npm run dev
```

---

## Variables d'environnement requises

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | URL PostgreSQL Supabase |
| `JWT_SECRET` | Clé secrète pour les tokens JWT |
| `AT_API_KEY` | Clé API AfricasTalking (SMS/USSD) |
| `AT_USERNAME` | Nom d'utilisateur AfricasTalking |
| `CINETPAY_API_KEY` | Clé API CinetPay (Orange Money) |
| `CINETPAY_SITE_ID` | Site ID CinetPay |
| `CLOUDINARY_CLOUD_NAME` | Nom cloud Cloudinary |
| `CLOUDINARY_API_KEY` | Clé API Cloudinary |
| `CLOUDINARY_API_SECRET` | Secret Cloudinary |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL du backend (http://localhost:5000 en dev) |

---

## Déploiement

### Backend → Railway
1. Connecter le repo GitHub à Railway
2. Sélectionner le dossier `backend/`
3. Ajouter les variables d'environnement
4. Railway détecte automatiquement Node.js

### Frontend → Vercel
1. Connecter le repo GitHub à Vercel
2. Sélectionner le dossier `frontend/`
3. Ajouter `NEXT_PUBLIC_API_URL` pointant vers Railway
4. Vercel déploie automatiquement

---

## Architecture

```
Agriculteur (Android 3G)
    ↓ HTTPS
Vercel (Next.js PWA)  ←→  Railway (Express API)  ←→  Supabase (PostgreSQL)
                               ↓
                    AfricasTalking (SMS/USSD)
                    CinetPay (Orange Money)
                    Cloudinary (Photos)
                    Open-Meteo (Météo)
```

---

## Modèle économique

- **L'agriculteur paie 0%** — toujours
- Acheteur : 3% de commission sur les récoltes
- Location matériel : 5% de commission
- Élevage : 2% de commission
- Boutiques Pro : 15 000–30 000 FCFA/mois
