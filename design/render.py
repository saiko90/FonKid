"""Génère les visuels prototypes FonKid (planche des coques, héros, alignement).
(L'image de partage og.png est générée au build par og.mjs.)
Usage : python3 design/render.py  (depuis la racine du dépôt)"""
import asyncio, pathlib
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent
OUT = ROOT / 'out'
OUT.mkdir(exist_ok=True)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        # Planche + alignement en haute définition
        pg = await b.new_page(viewport={'width': 1800, 'height': 1400}, device_scale_factor=2)
        await pg.goto((ROOT / 'render.html').as_uri())
        await pg.wait_for_timeout(300)
        await (await pg.query_selector('#sheet')).screenshot(path=str(OUT / 'fonkid-coques.png'))
        await (await pg.query_selector('#lineup')).screenshot(path=str(OUT / 'fonkid-alignement.png'))
        for style in ['rouge', 'vache', 'perso', 'vintage']:
            await pg.goto((ROOT / 'render.html').as_uri() + '?hero=' + style)
            await pg.wait_for_timeout(200)
            await (await pg.query_selector('#hero')).screenshot(path=str(OUT / f'fonkid-{style}.png'))
        await b.close()

asyncio.run(main())
