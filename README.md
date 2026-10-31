# Lien du Cœur Pharma — site vitrine (v1)

Base : démo « medical » du template Crafto (banque kladriva-templates), réorientée B2B laboratoires.
Charte : vert #0a7a3a / #04642b, rouge #e00913 (extraits du logo).

## Production

lienducoeurpharma.com — k3s Kladriva via ArgoCD (image GHCR). Runbook : `docs/DEPLOIEMENT.md`.
Aperçu GitHub Pages conservé : https://kladriva-inc.github.io/lien-du-coeur-pharma/

## Pages
- index.html — accueil
- a-propos.html — mission, vision, valeurs, méthodologie en 9 étapes
- expertises.html — lancement de produits + 8 prestations
- partenariat.html — formulaire « Devenir partenaire »
- contact.html — coordonnées, plan, FAQ, horaires

## Reste à faire avant mise en ligne
- [ ] Photos réelles (chaque visuel « Photo à fournir » indique laquelle)
- [x] Brancher les formulaires → `/api/contact` (persistance + courriel Resend), voir `docs/DEPLOIEMENT.md`
- [ ] Confirmer horaires, liens Facebook / LinkedIn, numéro d'autorisation MSP affiché
- [ ] Version anglaise ? (laboratoires internationaux)
- [ ] Alléger pour l'internet mobile au Tchad : compresser images, retirer animations lourdes
- [ ] Licence Crafto dédiée à ce projet
- [ ] Mentions légales + politique de confidentialité
