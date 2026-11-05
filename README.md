# FonKid

Page de présentation et de **réservation gratuite** (étude de marché) pour FonKid : le premier téléphone des enfants, sans écran.

Site statique (HTML/CSS/JS, sans framework), en français, allemand et anglais. Les réservations et le questionnaire sont enregistrés dans Supabase.

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html`, `styles.css` | La page |
| `i18n.js` | Tous les textes FR / DE / EN (à modifier ici) |
| `phone.js` | Illustration SVG du téléphone et des 11 coques |
| `app.js` | Langue, choix de coque, réservation, questionnaire, statistiques de visites |
| `favicon.svg` | Icône |
| `og.mjs` | Génère l'image de partage `og.png` (1200×630) au build |
| `build.sh`, `vercel.json`, `package.json` | Build vers `public/` pour Vercel |
| `design/` | Planches prototypes (`render.html` + `render.py`, Playwright) |

## Tester en local

```sh
npm install   # une fois (sert à générer l'image de partage)
sh build.sh
cd public && python3 -m http.server 8765
# http://localhost:8765  (les visites locales ne sont pas comptées)
```

## Liens utiles

- `?lang=fr|de|en` force la langue.
- `?ref=nom-du-canal` (ou `utm_source`, `utm_campaign`) est enregistré avec la réservation (colonne `source`).
  Exemple : `https://fonkid.vercel.app/?ref=fb-parents-sion` pour savoir quel post amène des inscrits.

## Lire les résultats (Supabase → SQL Editor)

```sql
-- Réservations et téléphones demandés
select count(*) as reservations, sum(phones) as telephones from fonkid_reservations;

-- Coques préférées
select style, count(*) from fonkid_reservations group by 1 order by 2 desc;

-- Prix jugé correct
select fair_price, count(*) from fonkid_survey group by 1 order by 2 desc;

-- Intérêt pour les options (oui / peut-être / non)
select opt_pen_pal, count(*) from fonkid_survey group by 1;
select opt_custom_shell, count(*) from fonkid_survey group by 1;

-- D'où viennent les inscrits
select coalesce(source, referrer, 'direct') as canal, count(*) from fonkid_reservations group by 1 order by 2 desc;

-- Visites par jour et par canal (une ligne par session, sans cookie ni IP)
select created_at::date as jour, coalesce(source, referrer, 'direct') as canal, count(*)
from fonkid_visits group by 1, 2 order by 1 desc, 3 desc;

-- Taux de conversion visites -> réservations
select round(100.0 * (select count(*) from fonkid_reservations) / nullif((select count(*) from fonkid_visits), 0), 1) as conversion_pct;
```

Mentions légales et protection des données : bas de page (`#legal`), textes dans `i18n.js` (clés `legal.*`).

## Sécurité

La clé Supabase dans `app.js` est la clé *publishable* (publique par nature). Les tables `fonkid_*` n'acceptent que des insertions depuis la page ; la lecture se fait uniquement depuis le tableau de bord Supabase.
