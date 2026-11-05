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
# Ordre : SITE_URL (à définir à la main si besoin) > domaine de production Vercel > défaut.
if [ -n "$SITE_URL" ]; then
  SITE="$SITE_URL"
elif [ -n "$VERCEL_PROJECT_PRODUCTION_URL" ]; then
  SITE="https://$VERCEL_PROJECT_PRODUCTION_URL"
else
  SITE="https://fonkid.vercel.app"
fi
SITE="${SITE%/}"
sed -i "s#__SITE__#$SITE#g" public/index.html
echo "public/ prêt ($SITE)"
