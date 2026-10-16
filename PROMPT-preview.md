# Prompt — Prototype du site « Lien du Cœur Pharma »

> À coller tel quel dans Claude Code ou Cursor, ouvert à la racine du dossier de travail.
> Agence : Kladriva Studio. Livrable attendu : un **prototype navigable** (vrai site statique, pas une maquette), prêt à être montré à la cliente via un lien de preview.

---

## 1. Ton rôle et la règle d'or

Tu es développeur front-end senior au sein de Kladriva Studio. La **direction créative est déjà décidée par un humain** : tu ne réinventes pas le design, tu adaptes un template validé et tu fais les finitions (contenus, couleurs, pages, qualité).

- Base imposée : la démo **« medical » du template Crafto** (ThemeForest, Bootstrap 5), présente dans la banque de templates de l'agence :
  `kladriva-templates/catalog/themeforest/crafto/src/demo-medical*.html` (dépôt privé `kladriva-inc/kladriva-templates`).
- Si tu n'as pas accès à ce dépôt, **arrête-toi et demande-le**. Ne recrée pas un design de zéro.
- N'invente **aucun** chiffre, avis client, nom d'employé, partenaire, logo de laboratoire ou distinction. Tout le contenu est fourni ci-dessous. Si une info manque, marque-la `<!-- À CONFIRMER : … -->` et affiche un texte neutre.

---

## 2. Le client

| | |
|---|---|
| **Nom** | Lien du Cœur Pharma (SARL) |
| **Métier** | Agence de représentation, de promotion médicale, de développement stratégique et de formation dans l'industrie pharmaceutique |
| **Lieu** | N'Djamena, Tchad (Quartier Gassi, 7ᵉ arrondissement) |
| **Zone** | Tchad d'abord, puis pays de la CEEAC, puis toute l'Afrique francophone |
| **Slogan** | « Relier l'innovation pharmaceutique aux besoins des patients » |
| **Cible principale du site** | **B2B : laboratoires pharmaceutiques internationaux**, fabricants de dispositifs médicaux, de compléments alimentaires, de dermocosmétique, sociétés de biotechnologie |
| **Cible secondaire** | Professionnels de santé, grossistes, pharmacies, hôpitaux, ministères, ONG |
| **Objectif n°1 du site** | Crédibilité, puis **demande de partenariat d'un laboratoire** (conversion principale) |
| **Langue** | Français (prévoir la structure pour une version anglaise plus tard, sans la produire) |

⚠️ **Piège à éviter** : la démo Crafto « medical » est écrite pour des **patients** (« Trouver un médecin », « Prendre rendez-vous », avis patients, médecins…). Tout le discours doit être **réorienté vers les laboratoires**. Aucun vocabulaire hôpital, patient-client, rendez-vous médical ou équipe de médecins ne doit subsister.

---

## 3. Identité visuelle

### Couleurs (extraites du logo)
```css
:root {
  --base-color: #0a7a3a;        /* vert principal (vert du logo éclairci pour l'écran) */
  --brand-green-dark: #04642b;  /* vert exact du logo */
  --red: #e00913;               /* rouge exact du logo (cœur, accents ponctuels) */
  --dark-gray: #17301f;         /* texte et boutons sombres, teinté vert */
}
/* fonds clairs teintés vert à la place du turquoise de la démo */
.bg-light-turquoise-blue { background-color: #eef6f0 !important; }
.bg-light-sea-green-transparent-light { background-color: rgba(10,122,58,.12) !important; }
```
- Mettre ces surcharges dans **`css/brand.css`**, chargé **après** `demos/medical/medical.css`.
- Recolorer tous les éléments turquoise (#18bcc7, #20c3dc) de la démo : motifs SVG `demo-medical-pattern.svg` → vert `#0a7a3a`, soulignement `highlight-separator.svg` (jaune #ffea23) → rouge `#e00913`.
- Typo : garder Manrope (police de la démo).

### Logo
Fichier source : `assets-client/logo.png`. C'est un logo **vertical** sur fond blanc : un cœur vert et rouge entourant une gélule, une main verte dessous, le texte « lien du cœur » (« lien du » en vert, « cœur » en rouge) et « Pharma » souligné, puis le slogan.
À produire (Python/Pillow ou équivalent) :
1. `images/logo-horizontal.png` (+ `@2x`) : **lockup horizontal** = le cœur à gauche + « lien du cœur / Pharma » à droite, **fond transparent**. Rendre transparent uniquement le blanc connecté aux bords (flood fill), pour garder le blanc de la gélule. Hauteur affichée dans l'en-tête : 54 px max.
2. `images/logo-horizontal-white.png` (+ `@2x`) : même lockup tout en blanc, pour le pied de page sombre.
3. `images/heart.png` : le cœur seul (icône).
4. Favicon et apple-touch-icons 57/72/114 à partir du cœur.

### Photos
Pour ce prototype, utiliser les **photos d'illustration temporaires** fournies dans `assets-client/photos/` (fichiers `26298.jpg`, `122817.jpg`, `128324.jpg`, `pexels-safana-2151149986-34833825.jpg`, `pexels-tima-miroshnichenko-5452228.jpg`). Recadrer (centre intelligent), exporter en JPG qualité ~78, largeur max 1400 px, dans `images/ldc/` :

| Emplacement | Fichier | Photo source | Format |
|---|---|---|---|
| Héros accueil | `hero.jpg` | pexels-safana (femme, stéthoscope en cœur) | 823×899 |
| Bloc « À propos » accueil (grande) | `equipe.jpg` | pexels-tima (équipe médicale) | 435×559 |
| Bloc « À propos » accueil (petite) | `terrain.jpg` | 128324 (présentation d'un produit) | 336×430 |
| « Pourquoi nous choisir » | `symposium.jpg` | 26298 (panel / conférence) | 1000×751 |
| Page À propos, mission | `a-propos.jpg` | 122817 (équipe en réunion) | 580×488 |
| Page À propos, différence | `terrain-2.jpg` | 128324 | 478×600 |
| Page Expertises | `expertises.jpg` | 128324 | 580×450 |

Si un fichier manque : générer un **placeholder SVG** aux couleurs de la marque (fond `#e8f3ec`, petit cœur vert, textes « Photo à fournir » et ce qu'elle doit montrer). Jamais de `placehold.co`.

---

## 4. Préparation technique

1. **N'extraire que ce qui sert** : copier les 5 pages ci-dessous de la démo Crafto, puis **uniquement** les CSS, JS, polices et images qu'elles référencent réellement (suivre les `src`, `href`, `data-*`, `srcset` et les `url()` des CSS de façon récursive). Objectif : environ 70 fichiers au lieu des 2 200 de Crafto. Le site sera consulté en **Afrique centrale, sur mobile et avec un débit faible**.
2. Correspondance des pages :

| Démo Crafto | Nouveau fichier | Rôle |
|---|---|---|
| `demo-medical.html` | `index.html` | Accueil |
| `demo-medical-about.html` | `a-propos.html` | À propos |
| `demo-medical-treatments.html` | `expertises.html` | Expertises |
| `demo-medical-appointment.html` | `partenariat.html` | Devenir partenaire (conversion) |
| `demo-medical-contact.html` | `contact.html` | Contact |

Ne pas reprendre `demo-medical-doctors.html` ni `demo-medical-timetable.html`. Rediriger leurs anciens liens vers `a-propos.html` et `contact.html`.

3. **Commun à toutes les pages** :
   - `lang="fr"`, `<title>` et `<meta name="description">` propres à chaque page (voir § 5), `<meta name="author" content="Lien du Cœur Pharma">`.
   - `<meta name="robots" content="noindex, nofollow">` : c'est une preview.
   - **Bandeau en haut de chaque page** : « Prototype réalisé par Kladriva Studio pour Lien du Cœur Pharma — aperçu de travail, non publié » (fond `#17301f`, texte blanc, 13 px).
   - **Menu** : Accueil · À propos · Expertises · Contact. Un seul bouton d'appel à l'action à droite : **« Devenir partenaire »** (icône `feather icon-feather-briefcase`, `white-space: nowrap`) vers `partenariat.html`.
   - **Pied de page** : logo blanc, même menu, réseaux sociaux **Facebook et LinkedIn uniquement** (`href="#"` + `aria-label="… (lien à confirmer)"`), copyright « © 2026 Lien du Cœur Pharma SARL — RCCM TD/01/2026/B12/00236 », liens « Mentions légales » et « Confidentialité » (`#`).
   - **Colonne collante latérale** : « Vous êtes un laboratoire ? — Devenir partenaire » (icône `bi-briefcase`).
   - Bouton retour en haut : texte « Haut » au lieu de « Scroll ».
   - **Formulaires** : pas de back-end pour l'instant. `action="#"`, plus un petit script `js/ldc-preview.js` (chargé après `main.js`) qui intercepte `submit` et affiche dans `.form-results` : « Prototype : l'envoi du formulaire sera activé à la mise en ligne. »
   - Supprimer la vidéo YouTube (« See our virtual tour »), le script Google Maps à clé API, le logo Trustpilot et tous les avis ou notes en étoiles.

### Coordonnées (seules données de contact à publier)
- Adresse : Avenue du Lycée de Gassi, porte 956 — Quartier Gassi, 7ᵉ arrondissement, N'Djamena, Tchad (B.P. 2802)
- Téléphones : **+235 87 05 05 73** (`tel:+23587050573`) et **+235 98 05 05 73** (`tel:+23598050573`)
- E-mail : **lienducoeurpharma@gmail.com**

🔒 **Ne jamais publier** les IBAN, le NIF, les numéros de pièce d'identité ni aucune autre donnée des documents administratifs du client.

---

## 5. Contenu page par page (textes définitifs, à reprendre mot pour mot)

### 5.1 `index.html` — Accueil
`<title>` : Lien du Cœur Pharma — Promotion et représentation pharmaceutique au Tchad
`description` : Agence de représentation, de promotion médicale et de formation pour les laboratoires pharmaceutiques au Tchad et en Afrique centrale.

**Héros**
- Sur-titre : « Agence de promotion pharmaceutique · Tchad »
- H1 : « Relier l'innovation pharmaceutique aux besoins des patients. »
  ⚠️ Le titre ne doit **jamais être masqué par l'image**. Classe `ldc-hero-title` :
  `font-size: clamp(2.3rem, 3.3vw, 3.9rem); line-height: 1.06; letter-spacing: -1.5px; position: relative; z-index: 2; word-break: normal;` et sous 991 px `font-size: clamp(2.2rem, 7vw, 3.2rem)`.
  Vérifier à 1920, 1440, 1280 et 1024 px que le mot « pharmaceutique » tient entier dans sa colonne.
- Boutons : « Devenir partenaire » (sombre, vers `partenariat.html`) et « Nos expertises » (contour, icône `icon-feather-layers`, vers `expertises.html`).
- Fond du héros : remplacer l'image turquoise par un fond `#eef6f0` avec de fins cercles concentriques `#dcebe1`.
- Pastille flottante : icône `bi-patch-check-fill` verte + « Agréée MSP » / « Autorisation officielle ».
- Bandeau vert sous le héros (à la place de « Covid-19 information ») : titre « Nos engagements », messages qui défilent :
  1. Une information scientifique fondée sur les preuves.
  2. Le strict respect des réglementations pharmaceutiques.
  3. Des rapports mensuels et des KPI transparents.

**À propos**
- Sur-titre : « À propos de nous » · H2 : « Votre partenaire en Afrique centrale. »
- Texte : « Basée à N'Djamena, Lien du Cœur Pharma accompagne les laboratoires et fabricants qui veulent développer durablement leurs produits au Tchad et en Afrique francophone. Notre conviction : un médicament innovant n'a de valeur que s'il atteint les personnes qui en ont besoin. »
- À la place de « 722+ ★★★★★ » : grand « **CEEAC** » + « Le Tchad d'abord, puis toute l'Afrique centrale et francophone. »
- Badge rotatif : remplacer l'image « Most trusted health center » par un SVG au texte circulaire « LIEN DU CŒUR PHARMA • N'DJAMENA • TCHAD • », avec `heart.png` au centre.
- Boutons : « Qui sommes-nous » (vers `a-propos.html`) et « Notre méthodologie » (vers `a-propos.html#methodologie`).

**Domaines d'expertise** (carrousel de cartes, icônes Bootstrap Icons à la place des SVG médicaux)
- Sur-titre : « Nos domaines d'expertise » · H2 : « Ce que nous faisons pour vos produits. »
- Texte : « Une expertise scientifique, commerciale et réglementaire pour transformer vos innovations en traitements accessibles. » · Bouton « Toutes nos expertises ».
- 6 cartes (titre, texte, lien « En savoir plus » vers `expertises.html`) :
  1. `bi-briefcase` **Représentation commerciale** : Nous représentons votre laboratoire auprès des autorités sanitaires, grossistes, pharmacies, hôpitaux et cliniques.
  2. `bi-chat-square-heart` **Promotion médicale** : Nos délégués médicaux portent une information scientifique rigoureuse auprès des médecins et pharmaciens.
  3. `bi-graph-up-arrow` **Développement du marché** : Nous identifions les opportunités et ouvrons de nouveaux réseaux de distribution pour vos marques.
  4. `bi-megaphone` **Marketing pharmaceutique** : Positionnement, plans marketing, campagnes, communication scientifique et marketing digital.
  5. `bi-search` **Études de marché** : Analyse concurrentielle, cartographie des prescripteurs et comportements d'achat.
  6. `bi-rocket-takeoff` **Lancement de produits** : Prix, segmentation, plan de visites médicales et suivi des performances : une stratégie complète.
- Rangée de 3 repères (remplace les notes et avis) : « **9** étapes de méthodologie, de l'analyse à l'optimisation. » · « **KPI** et rapports mensuels pour chaque partenaire. » · « **7** domaines d'action, de la promotion à la formation. »

**Pourquoi nous choisir**
- Sur-titre : « Pourquoi nous choisir » · H2 : « Expertise scientifique, réseau local. »
- Texte : « Notre équipe de professionnels des sciences pharmaceutiques maîtrise les réalités du marché africain et entretient des relations solides avec les acteurs de la santé. Chaque laboratoire reçoit une stratégie conçue pour ses objectifs. »
- Bouton téléphone : +235 87 05 05 73.
- Phrase sous le bloc (icône `bi-heart-fill`) : « Un médicament innovant n'a de valeur que s'il atteint les personnes qui en ont besoin. »

**Démarche en 3 temps** (bandeau vert)
- Titre : « Notre démarche *en 3 temps* » (soulignement rouge)
- 01 **Analyse** : Besoins et marché · 02 **Stratégie** : Plan sur mesure · 03 **Déploiement** : Terrain, suivi, rapports

**Avec qui nous travaillons** (remplace « Qualified doctors » ; 4 cartes avec icône, sans photo ni réseaux sociaux)
1. `bi-capsule` **Laboratoires pharmaceutiques** : Médicaments de marque et génériques, laboratoires internationaux.
2. `bi-heart-pulse` **Dispositifs médicaux** : Fabricants d'équipements et de consommables médicaux.
3. `bi-flower1` **Nutraceutiques & biotech** : Compléments alimentaires et sociétés de biotechnologie.
4. `bi-droplet-half` **Dermocosmétique** : Fabricants de cosmétiques dermopharmaceutiques.
- Pastille « RÉSEAU » + « Grossistes, pharmacies, hôpitaux, ministères et ONG : nous parlons à tous les acteurs de la santé. »

**Formulaire partenaire** (remplace « Request an appointment »)
- H2 : « Développons vos produits en Afrique centrale. »
- Texte : « Parlez-nous de vos produits et de vos marchés cibles. Nous revenons vers vous avec une première analyse. »
- Bloc « Appelez-nous » + +235 87 05 05 73, avec `heart.png`.
- Champs : Nom et fonction* · E-mail professionnel* (type email) · Laboratoire / entreprise* · Pays · liste « Type de produits » (Médicaments, Dispositifs médicaux, Compléments alimentaires, Dermocosmétique, Biotechnologie, Autre) · zone de texte « Votre projet : produits, pays visés, calendrier… »
- Mention : « Vos informations restent confidentielles et ne servent qu'à répondre à votre demande. »
- Bouton : « Envoyer ma demande » (icône `bi-send`).

### 5.2 `a-propos.html`
`<title>` : À propos — Lien du Cœur Pharma
- Bannière de titre : sur-titre « Qui sommes-nous », H1 « À propos », icône rouge `fa-solid fa-handshake`, encart « N'Djamena, Tchad / Agence agréée MSP ». Fond `#eef6f0` (pas de placeholder).
- **Mission et vision** · H2 « Un lien durable entre l'innovation et les patients. » · accordéon :
  - 01 **Notre mission** : Accompagner les entreprises pharmaceutiques dans le développement de leurs marchés, la promotion scientifique de leurs produits, leur visibilité et la croissance de leurs ventes, pour que les patients accèdent à des traitements innovants.
  - 02 **Notre vision** : Être l'agence de représentation pharmaceutique la plus fiable et la plus influente d'Afrique centrale, reconnue pour son professionnalisme, son éthique et ses partenariats durables. À cinq ans : le partenaire privilégié des laboratoires au Tchad et dans la CEEAC.
- **Nos valeurs** (4 cartes) : `bi-shield-check` Intégrité (Nous représentons fidèlement les intérêts de nos partenaires, avec éthique et confidentialité.) · `bi-journal-medical` Excellence scientifique (Une information médicale rigoureuse, fondée sur les preuves.) · `bi-eye` Transparence (Des indicateurs et des rapports réguliers pour suivre chaque action.) · `bi-bank` Respect des réglementations (Une conformité stricte aux réglementations pharmaceutiques en vigueur.)
  Phrase dessous : « Innovation, responsabilité sociale et engagement envers la santé publique guident chacune de nos actions. »
- **Ce qui fait la différence** (sur-titre « Pourquoi nous choisir ») : la carte d'avis est remplacée par un encart « Agréée par le Ministère de la Santé publique et de la Prévention » + « Autorisation n° 323 » `<!-- À CONFIRMER -->`. 3 puces : Connaissance du marché africain · Un réseau solide · Une approche personnalisée (textes repris du corporate profil). Bouton « Voir nos expertises ».
- **Section `id="methodologie"`** (remplace « Patients reviews ») : sur-titre « Notre méthodologie », H2 « 9 étapes, de l'analyse à l'optimisation. », grille 3×3 numérotée 01→09 :
  Analyse des besoins · Étude du marché · Élaboration de la stratégie · Déploiement des équipes · Promotion scientifique · Suivi des indicateurs · Rapports mensuels · Optimisation continue · Formation continue (une ligne d'explication chacune).
  Pastille « PROMESSE » : « Nous créons un lien durable entre l'innovation pharmaceutique, les professionnels de santé et les patients. »

### 5.3 `expertises.html`
`<title>` : Expertises et prestations — Lien du Cœur Pharma
- Bannière : « Ce que nous faisons » / « Expertises », icône `fa-solid fa-capsules`, encart « Expertise complète / Scientifique · commerciale · réglementaire ».
- Bloc « Lancement de nouveaux produits » (carrousel de 3 diapositives) :
  1. **Étude de marché et stratégie de prix.** Nous analysons le marché, les prescripteurs et la concurrence pour fixer un prix juste et une cible claire.
  2. **Segmentation et plan de communication.** Chaque segment de clientèle reçoit le bon message, par le bon canal, au bon moment.
  3. **Visites médicales et suivi des performances.** Un plan de visites structuré, des indicateurs suivis et des rapports mensuels.
  Encart sur l'image : `heart.png` + « Du **lancement** au suivi des ventes. »
- **Nos prestations** (8 cartes) : Représentation de laboratoires · Promotion médicale · Formation des délégués · Symposiums & congrès · Éducation médicale continue · Veille concurrentielle · Pharmacovigilance (en collaboration avec le laboratoire) · Conseil & gestion de projets.
- Phrase finale : « Un projet de lancement ou de représentation ? **Parlons-en.** » (lien vers `partenariat.html`).

### 5.4 `partenariat.html`
`<title>` : Devenir partenaire — Lien du Cœur Pharma
- Bannière : « Laboratoires & fabricants » / « Devenir partenaire », encart « Tchad & CEEAC / Afrique francophone ».
- 4 atouts (icônes 56 px à la place des images) : Délégués médicaux formés · Rapports mensuels et KPI · Agréée par le MSP · Présence à N'Djamena.
- H2 « Parlez-nous de vos produits » + **le même formulaire partenaire** que l'accueil, bouton « Envoyer ma demande de partenariat ».
- Bas de page : « Vous préférez en parler de vive voix ? Appelez-nous au +235 87 05 05 73 » + bouton téléphone.

### 5.5 `contact.html`
`<title>` : Contact — Lien du Cœur Pharma
- Bannière : « Écrivez-nous » / « Contact ».
- 4 colonnes : Adresse · E-mail · Téléphone (les 2 numéros) · Partenariat (« Vous êtes un laboratoire ? Faites votre demande » vers `partenariat.html`).
- Carte : **pas d'iframe ni de clé API**. Un bouton « Voir le plan sur Google Maps » vers `https://www.google.com/maps/search/?api=1&query=Lyc%C3%A9e+de+Gassi+N%27Djamena`.
- **Questions fréquentes** · H2 « Ce que les laboratoires nous demandent. » :
  - Quels pays couvrez-vous ? → Le Tchad en priorité, puis les pays de la CEEAC. Nous étendons progressivement notre réseau à toute l'Afrique francophone.
  - Quels types de produits représentez-vous ? → Médicaments, dispositifs médicaux, compléments alimentaires, dermocosmétique et produits de biotechnologie.
  - Comment suivez-vous les résultats ? → Nous définissons des KPI avec vous dès le départ et vous recevez un rapport chaque mois.
- **Horaires d'ouverture** : Lundi – jeudi 08 h – 17 h *(à confirmer)* · Vendredi 08 h – 12 h *(à confirmer)* · Samedi : sur rendez-vous · Dimanche : fermé.

---

## 6. Contrôle qualité avant de rendre la main

Exécute et corrige jusqu'à ce que tout passe :

1. `grep -ril "lorem\|placehold.co\|crafto\|themezaa\|doctor\|hospital\|yourdomain\|appointment" *.html` doit renvoyer **0 résultat**.
2. Tous les liens internes pointent vers les 5 pages existantes, sans aucun `demo-medical*.html`.
3. Captures d'écran (Playwright) de chaque page en **1440 px** et en **390 px (mobile)**, après défilement complet pour déclencher les animations. Vérifie visuellement :
   - aucun texte masqué ou coupé (surtout le H1 du héros) ;
   - aucune couleur turquoise restante ;
   - logos nets ;
   - pas de défilement horizontal en mobile.
4. Console du navigateur sans erreur JavaScript.
5. Poids total du dossier : viser **moins de 12 Mo**, et des images de moins de 250 Ko chacune.

---

## 7. Livrables

1. Le dossier du site, prêt à servir en statique :
   ```
   index.html  a-propos.html  expertises.html  partenariat.html  contact.html
   css/ (dont brand.css)  js/ (dont ldc-preview.js)  fonts/  images/ (dont images/ldc/)  demos/medical/
   ```
2. `README.md` avec :
   - la liste « Reste à faire avant mise en ligne » : vraies photos, branchement des formulaires (Formspree ou PHP chez l'hébergeur), horaires, liens Facebook/LinkedIn, n° d'autorisation MSP, version anglaise, mentions légales et confidentialité, **achat d'une licence Crafto dédiée à ce projet** ;
   - la commande de prévisualisation locale : `python -m http.server 8000`.
3. Un `.gitignore` (`*.zip`, `.DS_Store`).
4. *(Si le déploiement est configuré)* `.github/workflows/preview.yml` qui envoie le site sur `https://preview.kladriva.com/lien-du-coeur-pharma/` à chaque push sur `main`.
5. En fin de session, un **résumé de 5 lignes maximum** : ce qui est fait, ce qui reste « à confirmer », et le lien ou la commande de preview.

**Référence visuelle** : un prototype conforme à ce brief existe déjà sur
https://claude.ai/artifact/93iUSGdufcFJTKmsyF8CXP
Il sert à comparer le résultat, pas à le recopier.
