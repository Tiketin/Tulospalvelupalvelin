# TulospalveluPalvelin

Palvelinpuoli tulospalvelu sovellukseen, joka tehtiin ryhmätyönä Metropolia-ammattikorkeakoulussa.
Palvelin tehtiin Node.js/Express-pohjaisesti REST-apia hyödyntäen. 

Asiakaspuolen toteutus: https://github.com/HenrikAho/client

Kehitysympäristöä varten Node.js ja mysql

Tietokannan pystytys MariaDb clientilla:
mysql -u root -p < polku_projektiin\TulosPalveluPalvelin\setup.sql

Luo projektin juureen .env niminen tiedosto ja laita oikeat tiedot:
DB_HOST=localhost
DB_USER=oma_db_kayttaja
DB_PASSWORD=oma_salasana
DB_NAME=tulospalvelu

Palvelimen riippuvuudet:
npm install

Palvelimen ajo:
npm start