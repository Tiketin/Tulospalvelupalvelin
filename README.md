# TulospalveluPalvelin

Palvelinpuoli tulospalvelu sovellukseen, joka tehtiin ryhmätyönä Metropolia-ammattikorkeakoulussa.
Palvelin tehtiin Node.js/Express-pohjaisesti REST-apia hyödyntäen. 

Asiakaspuolen toteutus: https://github.com/HenrikAho/client

React-client: https://github.com/Tiketin/Tulospalveluclient-react

Kehitysympäristöä varten Node.js ja mysql


Luo projektin juureen .env niminen tiedosto ja laita oikeat tiedot:
```conf
DATABASE_URL="mysql://<DB_USER>:<DB_PASSWORD>@<DB_HOST>:3306/<DB_NAME>"
```

Tietokannan pystytys:
```bash
npx prisma db push
```

Palvelimen riippuvuudet:
npm install

Palvelimen ajo:
npm start