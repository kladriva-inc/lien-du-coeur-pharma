#!/usr/bin/env python3
"""Vhost Nginx Proxy Manager -> Traefik NodePort + certificat Let's Encrypt + cron de renouvellement.

Seul geste hors GitOps du déploiement (NPM détient les ports 80/443 de la VM).
Modèle : kladriva-inc/kladrichat deploy/k8s/npm-vhost.py. Idempotent, relançable.

  python3 scripts/npm-vhost.py            # vhost HTTP, puis certificat si le DNS pointe ici
  python3 scripts/npm-vhost.py --check    # n'écrit rien : état DNS + vhost + certificat

Garde-fous :
- le certificat n'est demandé que si l'apex ET www résolvent vers le VPS (@8.8.8.8) ;
- `nginx -t` avant chaque reload, sinon arrêt sans recharger ;
- cron de renouvellement posé dans la crontab de l'utilisateur (NPM ne renouvelle
  que les certificats de sa propre base : sans cron, expiration silencieuse au bout de
  90 jours, cf. studio.kladriva.com le 2026-10-27).
"""
from __future__ import annotations

import os
import subprocess
import sys

APEX = "lienducoeurpharma.com"
NAMES = [APEX, f"www.{APEX}"]
VPS_IP = os.environ.get("VPS_IP", "161.97.186.244")
TRAEFIK_HTTP = os.environ.get("TRAEFIK_HTTP", "30080")
NPM = os.environ.get("NPM_CONTAINER", "nginx-proxy-manager-app-1")
CERT = "npm-lienducoeurpharma-com"
CONF_PATH = "/data/nginx/proxy_host/zz-lienducoeurpharma-com.conf"
LE_EMAIL = os.environ.get("LE_EMAIL", "contact@kladriva.com")
CRON = (f"17 4 * * 1 docker exec {NPM} certbot renew --cert-name {CERT} --quiet "
        f"&& docker exec {NPM} nginx -s reload >> $HOME/backups/{CERT}-renew.log 2>&1")


def run(*cmd: str, **kw) -> subprocess.CompletedProcess:
    return subprocess.run(list(cmd), text=True, capture_output=True, **kw)


def dns_ok() -> bool:
    ok = True
    for name in NAMES:
        ips = run("dig", "+short", "@8.8.8.8", name).stdout.split()
        good = VPS_IP in ips
        ok &= good
        print(f"DNS {name} → {' '.join(ips) or 'rien'} {'✓' if good else f'✗ (attendu {VPS_IP})'}")
    return ok


def cert_exists() -> bool:
    return run("docker", "exec", NPM, "test", "-f", f"/etc/letsencrypt/live/{CERT}/fullchain.pem").returncode == 0


def write_conf(body: str) -> None:
    run("docker", "exec", "-i", NPM, "sh", "-c", f"cat > {CONF_PATH}", input=body, check=True)
    test = run("docker", "exec", NPM, "nginx", "-t")
    if test.returncode != 0:
        sys.stderr.write(test.stdout + test.stderr)
        raise SystemExit("nginx -t échoué : rien n'a été rechargé")
    if run("docker", "exec", NPM, "nginx", "-s", "reload").returncode != 0:
        raise SystemExit("nginx reload échoué")


def server_block(tls: bool) -> str:
    ssl = ""
    if tls:
        ssl = f"""
  listen 443 ssl;
  listen [::]:443 ssl;
  include conf.d/include/ssl-cache.conf;
  include conf.d/include/ssl-ciphers.conf;
  ssl_certificate /etc/letsencrypt/live/{CERT}/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/{CERT}/privkey.pem;
  include conf.d/include/force-ssl.conf;
"""
    # www → apex : redirection 301 faite dans le cluster (Middleware redirect-www, k8s/ingress.yaml).
    return f"""# Généré par kladriva-inc/lien-du-coeur-pharma scripts/npm-vhost.py — ne pas éditer à la main.
server {{
  set $forward_scheme http;
  set $server "{VPS_IP}";
  set $port {TRAEFIK_HTTP};
  listen 80;
  listen [::]:80;
  server_name {' '.join(NAMES)};
  include conf.d/include/letsencrypt-acme-challenge.conf;
{ssl}
  location / {{
    include conf.d/include/proxy.conf;
  }}
}}
"""


def ensure_cron() -> None:
    current = run("crontab", "-l").stdout
    if CERT in current:
        print("cron de renouvellement : déjà présent")
        return
    run("crontab", "-", input=current.rstrip("\n") + f"\n{CRON}\n", check=True)
    print("cron de renouvellement : ajouté (lundi 04:17)")


def main() -> None:
    check_only = "--check" in sys.argv
    dns = dns_ok()
    has_cert = cert_exists()
    print(f"certificat {CERT} : {'présent' if has_cert else 'absent'}")
    if check_only:
        return
    if has_cert:
        write_conf(server_block(tls=True))
        ensure_cron()
        print(f"https://{APEX}")
        return
    write_conf(server_block(tls=False))
    print("vhost HTTP en place")
    if not dns:
        print("DNS pas encore sur le VPS : certificat NON demandé. Relancer après la bascule DNS.")
        return
    cert = run("docker", "exec", NPM, "certbot", "certonly", "--webroot", "-w", "/data/letsencrypt-acme-challenge",
               *sum((["-d", n] for n in NAMES), []), "--agree-tos", "-m", LE_EMAIL,
               "--non-interactive", "--cert-name", CERT)
    sys.stderr.write(cert.stdout + cert.stderr)
    if cert.returncode != 0:
        raise SystemExit("Let's Encrypt a refusé : vhost HTTP laissé en place, voir le message ci-dessus")
    write_conf(server_block(tls=True))
    ensure_cron()
    print(f"https://{APEX}")


if __name__ == "__main__":
    main()
