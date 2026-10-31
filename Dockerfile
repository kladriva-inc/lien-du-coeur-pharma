# Site vitrine Lien du Cœur Pharma : fichiers statiques + /api/contact (server/server.mjs).
# Image construite par .github/workflows/deploy.yml → ghcr.io/kladriva-inc/lien-du-coeur-pharma:<sha8>
FROM node:22-alpine
# Relie le paquet GHCR au repo : sans ce lien, le GITHUB_TOKEN de la CI ne peut pas y pousser.
LABEL org.opencontainers.image.source=https://github.com/kladriva-inc/lien-du-coeur-pharma
WORKDIR /app
ARG GIT_SHA=dev
ENV NODE_ENV=production GIT_SHA=$GIT_SHA PORT=8080 PUBLIC_DIR=/app/public DATA_DIR=/data
# Seuls les fichiers publiés : pas de k8s/, docs/, scripts/ ni de README dans l'image.
COPY *.html robots.txt* sitemap.xml* /app/public/
COPY css /app/public/css
COPY js /app/public/js
COPY fonts /app/public/fonts
COPY images /app/public/images
COPY demos /app/public/demos
COPY server /app/server
RUN mkdir -p /data && chown node:node /data
USER node
EXPOSE 8080
HEALTHCHECK CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
CMD ["node", "server/server.mjs"]
