# Atlas Rouge Immobilier — Instructions GitHub + IDE

## 🚀 Télécharge le projet

Fichier: `atlas-rouge-immobilier.zip` (6.7 MB)

Ce fichier contient le code source complet (exclut `node_modules/` et `dist/`).

---

## 📁 Structure du projet

```
atlas-rouge-immobilier/
├── public/                    # Images des propriétés (37 fichiers JPG)
├── src/
│   ├── components/            # Navbar, Footer, Layout, Cards, etc.
│   │   ├── ui/               # 40+ composants shadcn/ui
│   ├── pages/                # 13 pages React
│   │   ├── Home.tsx          # Page d'accueil
│   │   ├── Search.tsx        # Recherche avec filtres + carte MapLibre
│   │   ├── PropertyDetail.tsx # Fiche détail
│   │   ├── Sell.tsx          # Vendre
│   │   ├── BuyerGuide.tsx    # Guide d'achat
│   │   ├── Blog.tsx          # Conseils
│   │   ├── About.tsx         # À propos
│   │   ├── Contact.tsx       # Contact
│   │   ├── Estimation.tsx    # Estimation
│   │   ├── GestionLocative.tsx
│   │   ├── Favorites.tsx     # Favoris
│   │   ├── Estimer.tsx
│   ├── data/                 # Données mock
│   │   ├── properties.ts     # 12 propriétés (5 images chacune)
│   │   ├── neighborhoods.ts  # 6 quartiers
│   │   └── filters.ts        # Configuration des filtres
│   ├── hooks/                # useFavorites, useCurrency
│   ├── lib/                  # Utils
│   ├── App.tsx               # Routing HashRouter
│   ├── main.tsx              # Entry point
│   └── index.css             # Styles globaux + overrides MapLibre
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── README.md
```

---

## 🐙 Publier sur GitHub

### Option A — Via ligne de commande (terminal)

```bash
# 1. Extraire le zip
cd ~/Downloads
unzip atlas-rouge-immobilier.zip
cd atlas-rouge-immobilier

# 2. Initialiser git
git init
git add -A
git commit -m "Initial commit — Atlas Rouge Immobilier"

# 3. Créer repo sur GitHub (via web), puis:
git remote add origin https://github.com/TON-USERNAME/atlas-rouge-immobilier.git
git branch -M main
git push -u origin main
```

### Option B — Via GitHub Desktop / GitKraken

1. Extraire le zip
2. Ouvrir le dossier dans GitHub Desktop
3. Publish repository → GitHub.com
4. Choisir public ou private

---

## 💻 Travailler dans ton IDE (Antigravity / VS Code / etc.)

### 1. Cloner depuis GitHub

```bash
git clone https://github.com/TON-USERNAME/atlas-rouge-immobilier.git
cd atlas-rouge-immobilier
```

### 2. Installer les dépendances

**Prérequis:** Node.js 20+ et npm

```bash
npm install
```

> Installe automatiquement : React 19, Vite, Tailwind CSS, shadcn/ui, MapLibre GL, GSAP, Lenis, lucide-react

### 3. Lancer le serveur de développement

```bash
npm run dev
```

Ouvre http://localhost:5173 dans ton navigateur.

### 4. Build pour production

```bash
npm run build
```

Le dossier `dist/` est généré et prêt à déployer.

---

## 🗺️ Configurer MapLibre / Carte

Le projet utilise **MapLibre GL** (open-source, gratuit, pas de token requis) avec les tiles CartoDB Voyager basées sur OpenStreetMap.

Aucune configuration nécessaire — ça fonctionne immédiatement.

Si tu veux changer le style de la carte, modifie dans `src/pages/Search.tsx`:

```typescript
style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'
```

Autres styles disponibles (gratuits):
- `'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'` (gris clair)
- `'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'` (noir)

---

## 🧰 Stack technique

| Technologie | Version | Rôle |
|------------|---------|------|
| React | 19 | UI library |
| TypeScript | 5.x | Typage |
| Vite | 7.2.4 | Build tool |
| Tailwind CSS | 3.4.19 | CSS utility |
| shadcn/ui | — | Composants UI |
| MapLibre GL | — | Cartes interactives |
| GSAP + ScrollTrigger | — | Animations scroll |
| Lenis | — | Smooth scroll |
| lucide-react | — | Icônes |

---

## 📝 Points d'entrée pour modifications

| Tu veux modifier... | Va dans... |
|---------------------|-----------|
| Les couleurs / thème | `tailwind.config.js` |
| Les textes français | `src/pages/*.tsx` |
| Les propriétés mock | `src/data/properties.ts` |
| Les filtres de recherche | `src/data/filters.ts` |
| Le design du mapa | `src/pages/Search.tsx` (ligne ~280, MapView) |
| La carte détail | `src/pages/PropertyDetail.tsx` (LocationMap) |
| Le header | `src/components/Navbar.tsx` |
| Le footer | `src/components/Footer.tsx` |
| Le routing | `src/App.tsx` |

---

## 🔮 Prochaines étapes suggérées

- [ ] Connecter un backend (Supabase / Firebase / API custom)
- [ ] Remplacer les données mock par un CMS (Strapi / Contentful)
- [ ] Intégrer un vrai système d'authentification
- [ ] Connecter un CRM pour les leads (contact forms)
- [ ] SEO avancé avec Next.js (migration future)
- [ ] Photos réelles des propriétés

---

**Questions?** Le projet est entièrement modulaire — chaque page est un composant React indépendant avec ses propres styles Tailwind.
