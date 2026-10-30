# Déploiement — lienducoeurpharma.com

Modèle du parc Kladriva (`kladriva-context/REGLES.md` §3, guide `kladriva-inc/gitops`
`docs/GUIDE-ARGOCD.md`) : runners GitHub → image GHCR → ArgoCD tire. Aucun kubeconfig en CI.

```
push sur main ─▶ .github/workflows/deploy.yml
                  1. image ghcr.io/kladriva-inc/lien-du-coeur-pharma:<sha8>
                  2. bump k8s/kustomization.yaml (commit [skip ci])
                  3. preuve : https://lienducoeurpharma.com/api/version = <sha8>
              ─▶ ArgoCD, Application lien-du-coeur-pharma (kladriva-inc/gitops envs/prod/)
              ─▶ k3s ns lien-du-coeur-pharma : Deployment (Node, server/server.mjs) + PVC messages
              ─▶ Traefik :30080 ◀─ NPM (TLS Let's Encrypt, zz-lienducoeurpharma-com.conf) ◀─ DNS
```

| Fichier | Rôle |
|---|---|
| `server/server.mjs` | sert le site statique, `/api/contact`, `/api/version`, `/healthz` (Node 22, aucune dépendance) |
| `Dockerfile` | image : seuls les fichiers publics + le serveur, utilisateur non root |
| `k8s/deployment.yaml` | Deployment `RollingUpdate maxUnavailable: 0` + PVC `/data` (messages) |
| `k8s/ingress.yaml` | Ingress apex ; Ingress `www` + Middleware `redirect-www` (301 → apex) |
| `k8s/mail.sealed.yaml` | SealedSecret (strict) : `RESEND_API_KEY` |
| `k8s/ghcr-registry.sealed.yaml` | pull secret GHCR (SealedSecret cluster-wide du parc) |
| `scripts/npm-vhost.py` | vhost NPM + certificat + cron de renouvellement (seul geste hors GitOps) |

GitHub Pages (`kladriva-inc.github.io/lien-du-coeur-pharma`) reste actif comme aperçu ;
le formulaire n'y fonctionne pas (pas de `/api/contact`).

## SEO

- Indexable uniquement sur `lienducoeurpharma.com` : tout autre hôte reçoit
  `X-Robots-Tag: noindex` (`CANONICAL_HOST`, `server/server.mjs`).
- Chaque page a un `canonical` vers la prod : l'aperçu GitHub Pages lui est rattaché.
- `robots.txt` + `sitemap.xml` à la racine (mettre à jour `sitemap.xml` à chaque nouvelle page).
- JSON-LD `Organization` dans `index.html` : uniquement des coordonnées publiées sur le site.
- Après la mise en ligne : ajouter la propriété dans Google Search Console (vérification DNS
  TXT chez WHC) et y soumettre `https://lienducoeurpharma.com/sitemap.xml`.

## Formulaire de contact

`index.html` (source `accueil`) et `partenariat.html` (source `partenariat`) postent vers
`/api/contact` (le JS du thème, `js/main.js`, envoie en AJAX et affiche `{alert, message}`).

1. Pot de miel `website` (hors écran, jamais `display:none`), case de consentement non
   pré-cochée (Loi 25, version du texte enregistrée), champs requis, 5 envois / IP / 10 min.
2. **Persistance d'abord** : une ligne JSON dans `/data/messages.jsonl` (PVC).
3. Courriel ensuite, sans bloquer la réponse : Resend, de `formulaire@kladriva.com` vers
   `lienducoeurpharma@gmail.com`, `Reply-To` = l'adresse du visiteur.

Lire les messages (y compris ceux dont le courriel aurait échoué) :

```bash
kubectl -n lien-du-coeur-pharma exec deploy/lien-du-coeur-pharma -- cat /data/messages.jsonl
kubectl -n lien-du-coeur-pharma logs deploy/lien-du-coeur-pharma | grep contact
```

Changer le destinataire : `CONTACT_TO` dans `k8s/deployment.yaml` (PR).

Resceller la clé Resend (rotation) — certificat public du contrôleur, jamais de clé en clair :

```bash
kubeseal --fetch-cert --controller-namespace kube-system --controller-name sealed-secrets-controller > pub-cert.pem
kubectl create secret generic lien-du-coeur-pharma-mail -n lien-du-coeur-pharma \
  --from-literal=RESEND_API_KEY=… --dry-run=client -o yaml \
  | kubeseal --cert pub-cert.pem --scope strict -o yaml > k8s/mail.sealed.yaml
```

## Mise en service (une fois, dans l'ordre)

1. **DNS chez WHC** : `A @ → 161.97.186.244`, `www` en CNAME vers l'apex. Vérifier :
   `dig +short @8.8.8.8 lienducoeurpharma.com www.lienducoeurpharma.com`.
2. **Image** : fusionner la PR sur `main` → le workflow pousse l'image et bumpe le tag
   (`newTag: pending-first-build` tant qu'aucune image n'existe).
   ⚠️ Au 2026-10-30, GitHub Actions est bloqué pour toute l'organisation `kladriva-inc`
   (facturation) : rien ne se construit tant que ce n'est pas réglé.
3. **ArgoCD** : fusionner la PR `kladriva-inc/gitops` (Application + namespace dans
   l'AppProject `prod`), Sync de `root` puis `env-prod`, puis **Sync manuelle** de
   `lien-du-coeur-pharma`. Contrôle avant DNS :
   `curl -s -H 'Host: lienducoeurpharma.com' http://161.97.186.244:30080/api/version`.
4. **NPM + certificat** (sur la VM) : `python3 scripts/npm-vhost.py` — refuse de demander
   le certificat tant que le DNS ne pointe pas ici ; pose le cron de renouvellement.
5. **Smoke test** : `https://lienducoeurpharma.com/` 200, certificat valide,
   `https://www.lienducoeurpharma.com/x` → 301 `https://lienducoeurpharma.com/x`,
   `/api/version` = sha, un envoi de formulaire reçu dans la boîte Gmail.
6. Après deux ou trois cycles build → bump → sync propres : `automated` dans
   `envs/prod/lien-du-coeur-pharma.yaml` (repo gitops).

## Revenir en arrière

Revert du commit fautif (ou du commit `chore(deploy): image … [skip ci]`) par PR ; ArgoCD
redéploie l'état de git. Jamais de `kubectl set image` / `rollout undo`.
