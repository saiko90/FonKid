#!/bin/sh
# Construit le site statique dans public/ (utilisé par Vercel, voir vercel.json)
set -e
rm -rf public
mkdir -p public
cp index.html styles.css app.js phone.js i18n.js favicon.svg public/

# Image de partage 1200×630 (nécessite « npm install », fait automatiquement par Vercel)
if [ -d node_modules/@resvg/resvg-js ]; then
  node og.mjs public/og.png
else
  echo "Attention : lancez « npm install » pour générer public/og.png"
fi

# URL absolue du site pour les balises de partage (og:image, canonical).
# Domaine officiel fonkid.ch ; SITE_URL permet de le remplacer si besoin.
SITE="${SITE_URL:-https://fonkid.ch}"
SITE="${SITE%/}"
sed -i "s#__SITE__#$SITE#g" public/index.html
echo "public/ prêt ($SITE)"
