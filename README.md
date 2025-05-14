# TulospalveluPalvelin

Palvelinpuoli tulospalvelu sovellukseen, joka tehtiin ryhmätyönä Metropolia-ammattikorkeakoulussa.
Palvelin tehtiin Node.js/Express-pohjaisesti REST-apia hyödyntäen. 

Asiakaspuolen toteutus: https://github.com/HenrikAho/client

Kehitysympäristöä varten Node.js ja mysql

Tietokannan pystytys MariaDb clientilla:
mysql -u root -p < polku_projektiin\TulosPalveluPalvelin\setup.sql

.env tiedostoon oikeat arvot

Palvelimen riippuvuudet:
npm install

Palvelimen ajo:
npm start