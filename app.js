/**
 * Tulospalvelupalvelin
 */
import {createRequire} from 'module';

const require = createRequire(import.meta.url);
const bodyParser = require('body-parser');
const express = require('express');
const request = require('request');
let app = express();
let url = require('url');
let util = require('util');
let bcrypt = require('bcrypt');
const saltRounds = 10;
let hashedPw;

let mysql = require('mysql');
let con = mysql.createConnection({
  host: 'eu-cdbr-west-03.cleardb.net',
  user: 'bc2d76b34dd02e',
  password: '012b2e53',
  database: 'heroku_b0cb4b903fd386b',
});

/**
 * Mitä tehdään jos menetetään yhteys tietokantaan
 */
function handleDisconnect() {
  con = mysql.createConnection({
    host: 'eu-cdbr-west-03.cleardb.net',
    user: 'bc2d76b34dd02e',
    password: '012b2e53',
    database: 'heroku_b0cb4b903fd386b',
  });

  con.connect(function(err) {
    if (err) {
      console.log('Tietokantaan ei saatu yhteyttä: ', err);
      setTimeout(handleDisconnect, 2000);
    }
  });

  con.on('error', function(err) {
    console.log('Virhe tietokannassa: ', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      handleDisconnect();
    } else {
      throw err;
    }
  });
}

handleDisconnect();

app.use(bodyParser.urlencoded({
  extended: false,
}));
app.use(bodyParser.json());

/*app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
});*/

app.use(function(req, res, next) {

  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods',
      'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers',
      'X-Requested-With,content-type');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Pass to next layer of middleware
  next();
});

// parametrien kirjoitustapa selaimessa : http://localhost:3000/api/players?group=Sikailijat

app.get('/api/players',
    /**
     * Palauta pelaajat ryhmästä x
     */
    function(req, res) {
      console.log('Get players from a certain group');
      let q = url.parse(req.url, true).query;
      let group = q.group;
      let alteredResult;
      let string;

      let sql = 'SELECT pelaajat.nimi, statistiikat.pelatutlkm, statistiikat.voitotlkm'
          + ' FROM pelaajat, statistiikat, ryhmat'
          + ' WHERE pelaajat.ryhmaid = ryhmat.ryhmaid and ryhmat.nimi = ? and'
          + ' pelaajat.pelaajaid = statistiikat.pelaajaid'
          + ' ORDER BY pelaajat.nimi';

      const query = util.promisify(con.query).bind(con);
      if (textInputCheck(group) === true) {
        (async () => {
          try {
            const rows = await query(sql, [group]);
            string = JSON.stringify(rows);
            alteredResult = '{"numOfRows":' + rows.length + ',"rows":' +
                string + '}';
            console.log(rows);
            res.send(alteredResult);
          } catch (err) {
            console.log('Database error!' + err);
          } finally {
            //conn.end();
          }
        })();
      } else {
        console.log('Syöte ei hyväksytty!');
      }
    });

// parametrien kirjoitustapa selaimessa : http://localhost:3000/api/login?group=Sikailijat&password=asd
app.get('/api/login',
    /**
     * Tarkista kirjautumistiedot
     */
    function(req, res) {
      console.log('Checks your group');
      let q = url.parse(req.url, true).query;
      let group = q.group;
      let password = q.password;
      let alteredResult;
      let string;

      let sql = 'SELECT ryhmat.nimi, ryhmat.salasana'
          + ' FROM ryhmat'
          + ' WHERE ryhmat.nimi = ?';

      const query = util.promisify(con.query).bind(con);
      if (textInputCheck(group) === true && textInputCheck(password) === true) {
        (async () => {
          try {
            const rows = await query(sql, [group, password]);
            string = JSON.stringify(rows);
            alteredResult = '{"numOfRows":' + rows.length + ',"rows":' +
                string + '}';
            hashedPw = rows[0].salasana
            console.log(rows);
            console.log(password);
            console.log(hashedPw);
            bcrypt.compare(password, hashedPw, function(err, result) {
              if(result) {
                console.log('salasana oikein');
                res.send(alteredResult);
              }

              else {
                console.log('salasana väärin');
                alteredResult = 'Salasana väärin'
                res.send(alteredResult)
              }

            });



          } catch (err) {
            console.log('Database error!' + err);
          } finally {
            //conn.end();
          }
        })();
      } else {
        console.log('Syöte ei hyväksytty!');
      }
    });

// parametrien kirjoitustapa selaimessa : http://localhost:3000/api/player?group=Sikailijat&player=Onni
app.get('/api/player',
    /**
     * Hae pelaaja y ryhmästä x
     */
    function(req, res) {
      console.log('Get stats of one player');
      let q = url.parse(req.url, true).query;
      let group = q.group;
      let player = q.player;
      let alteredResult;
      let string;

      let sql = 'SELECT pelaajat.nimi, statistiikat.pelatutlkm, statistiikat.voitotlkm,'
          +
          ' statistiikat.p0, statistiikat.p1, statistiikat.p2, statistiikat.p3, statistiikat.p4,'
          +
          ' statistiikat.p5, statistiikat.p6, statistiikat.p7, statistiikat.p8, statistiikat.p9,'
          + ' statistiikat.p10, statistiikat.p11, statistiikat.p12'
          + ' FROM pelaajat, statistiikat, ryhmat'
          + ' WHERE pelaajat.ryhmaid = ryhmat.ryhmaid and ryhmat.nimi = ? and'
          +
          ' pelaajat.pelaajaid = statistiikat.pelaajaid and pelaajat.nimi = ?';

      const query = util.promisify(con.query).bind(con);
      if (textInputCheck(group) === true && textInputCheck(player) === true) {
        (async () => {
          try {
            const rows = await query(sql, [group, player]);
            string = JSON.stringify(rows);
            alteredResult = '{"numOfRows":' + rows.length + ',"rows":' +
                string + '}';
            console.log(rows);
            res.send(alteredResult);

          } catch (err) {
            console.log('Database error!' + err);
          } finally {
            //conn.end();
          }
        })();
      } else {
        console.log('Syöte ei hyväksytty!');
      }
    });

// parametrien kirjoitustapa selaimessa : http://localhost:3000/api/games?group=asd
app.get('/api/games',
    /**
     * Hae pelit ryhmältä x
     */
    function(req, res) {
      console.log('Get list of played games');
      let q = url.parse(req.url, true).query;
      let group = q.group;
      let alteredResult;
      let string;

      let sql = 'SELECT pelit.pvm, pelaajat.nimi'
          + ' FROM pelit, ryhmat, pelaajat'
          + ' WHERE pelit.ryhmaid = ryhmat.ryhmaid and ryhmat.nimi = ?'
          + ' and pelaajat.pelaajaid = pelit.voittajaid'
          + ' ORDER BY pelit.pvm';

      const query = util.promisify(con.query).bind(con);
      if (textInputCheck(group) === true) {
        (async () => {
          try {
            const rows = await query(sql, [group]);
            string = JSON.stringify(rows);
            alteredResult = '{"numOfRows":' + rows.length + ',"rows":' +
                string + '}';
            console.log(rows);
            res.send(alteredResult);

          } catch (err) {
            console.log('Database error!' + err);
          } finally {
            //conn.end();
          }
        })();
      } else {
        console.log('Syöte ei hyväksytty!');
      }
    });

// parametrien kirjoitustapa selaimessa : http://localhost:3000/api/newgroup
app.post('/api/newgroup',

    /**
     * Lisää uusi ryhmä
     */
    function(req, res) {
      console.log('Got a POST request for the homepage');
      const query = util.promisify(con.query).bind(con);
      let jsonOBJ = req.body;
      console.log(jsonOBJ);
      let sqlquery = 'SELECT nimi FROM ryhmat';
      if (textInputCheck(jsonOBJ.nimi) === true &&
          textInputCheck(jsonOBJ.salasana) === true) {
        (async () => {
          try {
            const rows = await query(sqlquery);
            console.log(rows);
            let equals = false;
            for (let i = 0; i < rows.length; i++) {
              if (jsonOBJ.nimi === rows[i].nimi) {
                equals = true;
              }
            }
            if (equals === false) {
              console.log(jsonOBJ.salasana)
              hashedPw = await bcrypt.hash(jsonOBJ.salasana, saltRounds);
              console.log(hashedPw)
              sqlquery = 'INSERT INTO ryhmat (nimi, salasana) VALUES (?, ?)';
              await query(sqlquery, [jsonOBJ.nimi, hashedPw]);
              res.send('Post successful' + req.body);
            } else {
              res.send('Ryhmän nimi on jo käytössä');
            }
          } catch (err) {
            console.log('Database error!' + err);
          } finally {
            //conn.end();
          }
        })();
      } else {
        console.log('Syöte ei hyväksytty!');
      }
    });

// parametrien kirjoitustapa selaimessa : http://localhost:3000/api/newplayer
app.post('/api/newplayer',
    /**
     * Lisää uusi pelaaja ryhmään x
     */
    function(req, res) {
      console.log('Create a new player');
      const query = util.promisify(con.query).bind(con);
      let jsonOBJ = req.body;
      console.log(jsonOBJ);
      let ryhmaid;
      let sqlquery = 'SELECT ryhmaid FROM ryhmat WHERE nimi = ?';
      if (textInputCheck(jsonOBJ.pelaajan_nimi) === true) {
        (async () => {
          try {
            ryhmaid = await query(sqlquery, [jsonOBJ.ryhman_nimi]);
            sqlquery = 'SELECT nimi FROM pelaajat WHERE ryhmaid = ?';
            const rows = await query(sqlquery, [ryhmaid[0].ryhmaid]);
            console.log(ryhmaid);
            console.log(rows);
            let equals = false;
            for (let i = 0; i < rows.length; i++) {
              if (jsonOBJ.pelaajan_nimi === rows[i].nimi) {
                equals = true;
              }
            }
            if (equals === false) {
              sqlquery = 'INSERT INTO pelaajat (nimi, ryhmaid) VALUES (?, ?)';
              await query(sqlquery,
                  [jsonOBJ.pelaajan_nimi, ryhmaid[0].ryhmaid]);
              sqlquery = 'INSERT INTO statistiikat (voitotlkm) VALUES (0)';
              await query(sqlquery);
              res.send('Post successful' + req.body);
            } else {
              res.send('Saman niminen pelaaja on jo lisätty');
            }
          } catch (err) {
            console.log('Database error! ' + err);
          } finally {
            //conn.end();
          }
        })();
      } else {
        console.log('Syöte ei hyväksytty!');
      }
    });

// parametrien kirjoitustapa selaimessa : http://localhost:3000/api/newgame
app.post('/api/newgame',
    /**
     * Lisää peli
     */
    function(req, res) {
      console.log('Got a POST request for the homepage');
      const query = util.promisify(con.query).bind(con);
      let jsonOBJ = req.body;
      console.log(jsonOBJ);
      let ryhmaid;
      let voittajaid;
      let pelaajaid;
      let sqlquery = 'SELECT ryhmaid FROM ryhmat WHERE nimi = ?';
      if (textInputCheck(jsonOBJ.ryhman_nimi) === true) {
        (async () => {
          try {
            ryhmaid = await query(sqlquery, [jsonOBJ.ryhman_nimi]);

            sqlquery = 'SELECT pelaajaid FROM pelaajat WHERE nimi = ? and ryhmaid = ?';
            voittajaid = await query(sqlquery,
                [jsonOBJ.voittajan_nimi, ryhmaid[0].ryhmaid]);

            sqlquery = 'INSERT INTO pelit (ryhmaid, voittajaid, pvm) VALUES (?, ?, ?)';
            await query(sqlquery,
                [ryhmaid[0].ryhmaid, voittajaid[0].pelaajaid, jsonOBJ.pvm]);
            res.send('Post successful' + req.body);

            let sqlqueryVoitto = 'UPDATE statistiikat SET pelatutlkm = pelatutlkm + 1, '
                + 'voitotlkm = voitotlkm + 1, p0 = p0 + ?, p1 = p1 + ?, '
                + 'p2 = p2 + ?, p3 = p3 + ?, p4 = p4 + ?, p5 = p5 + ?, '
                + 'p6 = p6 + ?, p7 = p7 + ?, p8 = p8 + ?, p9 = p9 + ?,'
                + ' p10 = p10 + ?, p11 = p11 + ?, p12 = p12 + ? '
                + 'WHERE pelaajaid = ?';

            let sqlqueryHavio = 'UPDATE statistiikat SET pelatutlkm = pelatutlkm + 1, '
                + 'p0 = p0 + ?, p1 = p1 + ?, '
                + 'p2 = p2 + ?, p3 = p3 + ?, p4 = p4 + ?, p5 = p5 + ?, '
                + 'p6 = p6 + ?, p7 = p7 + ?, p8 = p8 + ?, p9 = p9 + ?,'
                + ' p10 = p10 + ?, p11 = p11 + ?, p12 = p12 + ? '
                + 'WHERE pelaajaid = ?';

            // const pelaajat = [
            //     "pelaaja1",
            //     "pelaaja2",
            //     "pelaaja3",
            //     "pelaaja4",
            //     "pelaaja5",
            //     "pelaaja6",
            //     "pelaaja7",
            //     "pelaaja8",
            //     "pelaaja9",
            //     "pelaaja10"
            // ];

            // const points = ["p1","p2","p3","p4","p5","p6","p7","p8","p9","p10","p11","p12"];

            // for (const playerID in pelaajat) {
            //   const queryParamArr = [
            //       ...points.reduce((acc,cur) => [...acc, jsonOBJ[playerID][cur]], []),
            //       pelaajaid[0].pelaajaid
            //   ];

            //   if (jsonOBJ[playerID].nimi !== "") {
            //     sqlquery = "SELECT pelaajaid FROM pelaajat WHERE nimi = ? and ryhmaid = ?";
            //     pelaajaid = await query(sqlquery, [jsonOBJ[playerID].nimi, ryhmaid[0].ryhmaid]);
            //     if (voittajaid[0].pelaajaid === pelaajaid[0].pelaajaid) {
            //       console.log("p1voitto");
            //       await query(sqlqueryVoitto, queryParamArr);
            //     } else {
            //       console.log("p1häviö");
            //       await query(sqlqueryHavio, queryParamArr);
            //     }
            //   }
            // }

            if (jsonOBJ.pelaaja1.nimi !== '') {
              sqlquery = 'SELECT pelaajaid FROM pelaajat WHERE nimi = ? and ryhmaid = ?';
              pelaajaid = await query(sqlquery,
                  [jsonOBJ.pelaaja1.nimi, ryhmaid[0].ryhmaid]);
              if (voittajaid[0].pelaajaid === pelaajaid[0].pelaajaid) {
                console.log('p1voitto');
                await query(sqlqueryVoitto, [
                  jsonOBJ.pelaaja1.p0,
                  jsonOBJ.pelaaja1.p1,
                  jsonOBJ.pelaaja1.p2
                  ,
                  jsonOBJ.pelaaja1.p3,
                  jsonOBJ.pelaaja1.p4,
                  jsonOBJ.pelaaja1.p5,
                  jsonOBJ.pelaaja1.p6
                  ,
                  jsonOBJ.pelaaja1.p7,
                  jsonOBJ.pelaaja1.p8,
                  jsonOBJ.pelaaja1.p9,
                  jsonOBJ.pelaaja1.p10
                  ,
                  jsonOBJ.pelaaja1.p11,
                  jsonOBJ.pelaaja1.p12,
                  pelaajaid[0].pelaajaid]);
              } else {
                console.log('p1häviö');
                await query(sqlqueryHavio, [
                  jsonOBJ.pelaaja1.p0,
                  jsonOBJ.pelaaja1.p1,
                  jsonOBJ.pelaaja1.p2
                  ,
                  jsonOBJ.pelaaja1.p3,
                  jsonOBJ.pelaaja1.p4,
                  jsonOBJ.pelaaja1.p5,
                  jsonOBJ.pelaaja1.p6
                  ,
                  jsonOBJ.pelaaja1.p7,
                  jsonOBJ.pelaaja1.p8,
                  jsonOBJ.pelaaja1.p9,
                  jsonOBJ.pelaaja1.p10
                  ,
                  jsonOBJ.pelaaja1.p11,
                  jsonOBJ.pelaaja1.p12,
                  pelaajaid[0].pelaajaid]);
              }

            }

            if (jsonOBJ.pelaaja2.nimi !== '') {
              sqlquery = 'SELECT pelaajaid FROM pelaajat WHERE nimi = ? and ryhmaid = ?';
              pelaajaid = await query(sqlquery,
                  [jsonOBJ.pelaaja2.nimi, ryhmaid[0].ryhmaid]);
              if (voittajaid[0].pelaajaid === pelaajaid[0].pelaajaid) {

                await query(sqlqueryVoitto, [
                  jsonOBJ.pelaaja2.p0,
                  jsonOBJ.pelaaja2.p1,
                  jsonOBJ.pelaaja2.p2
                  ,
                  jsonOBJ.pelaaja2.p3,
                  jsonOBJ.pelaaja2.p4,
                  jsonOBJ.pelaaja2.p5,
                  jsonOBJ.pelaaja2.p6
                  ,
                  jsonOBJ.pelaaja2.p7,
                  jsonOBJ.pelaaja2.p8,
                  jsonOBJ.pelaaja2.p9,
                  jsonOBJ.pelaaja2.p10
                  ,
                  jsonOBJ.pelaaja2.p11,
                  jsonOBJ.pelaaja2.p12,
                  pelaajaid[0].pelaajaid]);
              } else {

                await query(sqlqueryHavio, [
                  jsonOBJ.pelaaja2.p0,
                  jsonOBJ.pelaaja2.p1,
                  jsonOBJ.pelaaja2.p2
                  ,
                  jsonOBJ.pelaaja2.p3,
                  jsonOBJ.pelaaja2.p4,
                  jsonOBJ.pelaaja2.p5,
                  jsonOBJ.pelaaja2.p6
                  ,
                  jsonOBJ.pelaaja2.p7,
                  jsonOBJ.pelaaja2.p8,
                  jsonOBJ.pelaaja2.p9,
                  jsonOBJ.pelaaja2.p10
                  ,
                  jsonOBJ.pelaaja2.p11,
                  jsonOBJ.pelaaja2.p12,
                  pelaajaid[0].pelaajaid]);

              }

            }

            if (jsonOBJ.pelaaja3.nimi !== '') {
              sqlquery = 'SELECT pelaajaid FROM pelaajat WHERE nimi = ? and ryhmaid = ?';
              pelaajaid = await query(sqlquery,
                  [jsonOBJ.pelaaja3.nimi, ryhmaid[0].ryhmaid]);

              if (voittajaid[0].pelaajaid === pelaajaid[0].pelaajaid) {

                await query(sqlqueryVoitto, [
                  jsonOBJ.pelaaja1.p0,
                  jsonOBJ.pelaaja1.p1,
                  jsonOBJ.pelaaja1.p2
                  ,
                  jsonOBJ.pelaaja3.p3,
                  jsonOBJ.pelaaja3.p4,
                  jsonOBJ.pelaaja3.p5,
                  jsonOBJ.pelaaja3.p6
                  ,
                  jsonOBJ.pelaaja3.p7,
                  jsonOBJ.pelaaja3.p8,
                  jsonOBJ.pelaaja3.p9,
                  jsonOBJ.pelaaja3.p10
                  ,
                  jsonOBJ.pelaaja3.p11,
                  jsonOBJ.pelaaja3.p12,
                  pelaajaid[0].pelaajaid]);
              } else {

                await query(sqlqueryHavio, [
                  jsonOBJ.pelaaja3.p0,
                  jsonOBJ.pelaaja3.p1,
                  jsonOBJ.pelaaja3.p2
                  ,
                  jsonOBJ.pelaaja3.p3,
                  jsonOBJ.pelaaja3.p4,
                  jsonOBJ.pelaaja3.p5,
                  jsonOBJ.pelaaja3.p6
                  ,
                  jsonOBJ.pelaaja3.p7,
                  jsonOBJ.pelaaja3.p8,
                  jsonOBJ.pelaaja3.p9,
                  jsonOBJ.pelaaja3.p10
                  ,
                  jsonOBJ.pelaaja3.p11,
                  jsonOBJ.pelaaja3.p12,
                  pelaajaid[0].pelaajaid]);
              }

            }

            if (jsonOBJ.pelaaja4.nimi !== '') {
              sqlquery = 'SELECT pelaajaid FROM pelaajat WHERE nimi = ? and ryhmaid = ?';
              pelaajaid = await query(sqlquery,
                  [jsonOBJ.pelaaja4.nimi, ryhmaid[0].ryhmaid]);

              if (voittajaid[0].pelaajaid === pelaajaid[0].pelaajaid) {

                await query(sqlqueryVoitto, [
                  jsonOBJ.pelaaja4.p0,
                  jsonOBJ.pelaaja4.p1,
                  jsonOBJ.pelaaja4.p2
                  ,
                  jsonOBJ.pelaaja4.p3,
                  jsonOBJ.pelaaja4.p4,
                  jsonOBJ.pelaaja4.p5,
                  jsonOBJ.pelaaja4.p6
                  ,
                  jsonOBJ.pelaaja4.p7,
                  jsonOBJ.pelaaja4.p8,
                  jsonOBJ.pelaaja4.p9,
                  jsonOBJ.pelaaja4.p10
                  ,
                  jsonOBJ.pelaaja4.p11,
                  jsonOBJ.pelaaja4.p12,
                  pelaajaid[0].pelaajaid]);
              } else {

                await query(sqlqueryHavio, [
                  jsonOBJ.pelaaja4.p0,
                  jsonOBJ.pelaaja4.p1,
                  jsonOBJ.pelaaja4.p2
                  ,
                  jsonOBJ.pelaaja4.p3,
                  jsonOBJ.pelaaja4.p4,
                  jsonOBJ.pelaaja4.p5,
                  jsonOBJ.pelaaja4.p6
                  ,
                  jsonOBJ.pelaaja4.p7,
                  jsonOBJ.pelaaja4.p8,
                  jsonOBJ.pelaaja4.p9,
                  jsonOBJ.pelaaja4.p10
                  ,
                  jsonOBJ.pelaaja4.p11,
                  jsonOBJ.pelaaja4.p12,
                  pelaajaid[0].pelaajaid]);
              }

            }

            if (jsonOBJ.pelaaja5.nimi !== '') {
              sqlquery = 'SELECT pelaajaid FROM pelaajat WHERE nimi = ? and ryhmaid = ?';
              pelaajaid = await query(sqlquery,
                  [jsonOBJ.pelaaja5.nimi, ryhmaid[0].ryhmaid]);

              if (voittajaid[0].pelaajaid === pelaajaid[0].pelaajaid) {

                await query(sqlqueryVoitto, [
                  jsonOBJ.pelaaja5.p0,
                  jsonOBJ.pelaaja5.p1,
                  jsonOBJ.pelaaja5.p2
                  ,
                  jsonOBJ.pelaaja5.p3,
                  jsonOBJ.pelaaja5.p4,
                  jsonOBJ.pelaaja5.p5,
                  jsonOBJ.pelaaja5.p6
                  ,
                  jsonOBJ.pelaaja5.p7,
                  jsonOBJ.pelaaja5.p8,
                  jsonOBJ.pelaaja5.p9,
                  jsonOBJ.pelaaja5.p10
                  ,
                  jsonOBJ.pelaaja5.p11,
                  jsonOBJ.pelaaja5.p12,
                  pelaajaid[0].pelaajaid]);
              } else {

                await query(sqlqueryHavio, [
                  jsonOBJ.pelaaja5.p0,
                  jsonOBJ.pelaaja5.p1,
                  jsonOBJ.pelaaja5.p2
                  ,
                  jsonOBJ.pelaaja5.p3,
                  jsonOBJ.pelaaja5.p4,
                  jsonOBJ.pelaaja5.p5,
                  jsonOBJ.pelaaja5.p6
                  ,
                  jsonOBJ.pelaaja5.p7,
                  jsonOBJ.pelaaja5.p8,
                  jsonOBJ.pelaaja5.p9,
                  jsonOBJ.pelaaja5.p10
                  ,
                  jsonOBJ.pelaaja5.p11,
                  jsonOBJ.pelaaja5.p12,
                  pelaajaid[0].pelaajaid]);
              }

            }

            if (jsonOBJ.pelaaja6.nimi !== '') {
              sqlquery = 'SELECT pelaajaid FROM pelaajat WHERE nimi = ? and ryhmaid = ?';
              pelaajaid = await query(sqlquery,
                  [jsonOBJ.pelaaja6.nimi, ryhmaid[0].ryhmaid]);

              if (voittajaid[0].pelaajaid === pelaajaid[0].pelaajaid) {

                await query(sqlqueryVoitto, [
                  jsonOBJ.pelaaja6.p0,
                  jsonOBJ.pelaaja6.p1,
                  jsonOBJ.pelaaja6.p2
                  ,
                  jsonOBJ.pelaaja6.p3,
                  jsonOBJ.pelaaja6.p4,
                  jsonOBJ.pelaaja6.p5,
                  jsonOBJ.pelaaja6.p6
                  ,
                  jsonOBJ.pelaaja6.p7,
                  jsonOBJ.pelaaja6.p8,
                  jsonOBJ.pelaaja6.p9,
                  jsonOBJ.pelaaja6.p10
                  ,
                  jsonOBJ.pelaaja6.p11,
                  jsonOBJ.pelaaja6.p12,
                  pelaajaid[0].pelaajaid]);
              } else {

                await query(sqlqueryHavio, [
                  jsonOBJ.pelaaja6.p0,
                  jsonOBJ.pelaaja6.p1,
                  jsonOBJ.pelaaja6.p2
                  ,
                  jsonOBJ.pelaaja6.p3,
                  jsonOBJ.pelaaja6.p4,
                  jsonOBJ.pelaaja6.p5,
                  jsonOBJ.pelaaja6.p6
                  ,
                  jsonOBJ.pelaaja6.p7,
                  jsonOBJ.pelaaja6.p8,
                  jsonOBJ.pelaaja6.p9,
                  jsonOBJ.pelaaja6.p10
                  ,
                  jsonOBJ.pelaaja6.p11,
                  jsonOBJ.pelaaja6.p12,
                  pelaajaid[0].pelaajaid]);
              }

            }

            if (jsonOBJ.pelaaja7.nimi !== '') {
              sqlquery = 'SELECT pelaajaid FROM pelaajat WHERE nimi = ? and ryhmaid = ?';
              pelaajaid = await query(sqlquery,
                  [jsonOBJ.pelaaja7.nimi, ryhmaid[0].ryhmaid]);

              if (voittajaid[0].pelaajaid === pelaajaid[0].pelaajaid) {

                await query(sqlqueryVoitto, [
                  jsonOBJ.pelaaja7.p0,
                  jsonOBJ.pelaaja7.p1,
                  jsonOBJ.pelaaja7.p2
                  ,
                  jsonOBJ.pelaaja7.p3,
                  jsonOBJ.pelaaja7.p4,
                  jsonOBJ.pelaaja7.p5,
                  jsonOBJ.pelaaja7.p6
                  ,
                  jsonOBJ.pelaaja7.p7,
                  jsonOBJ.pelaaja7.p8,
                  jsonOBJ.pelaaja7.p9,
                  jsonOBJ.pelaaja7.p10
                  ,
                  jsonOBJ.pelaaja7.p11,
                  jsonOBJ.pelaaja7.p12,
                  pelaajaid[0].pelaajaid]);
              } else {

                await query(sqlqueryHavio, [
                  jsonOBJ.pelaaja7.p0,
                  jsonOBJ.pelaaja7.p1,
                  jsonOBJ.pelaaja7.p2
                  ,
                  jsonOBJ.pelaaja7.p3,
                  jsonOBJ.pelaaja7.p4,
                  jsonOBJ.pelaaja7.p5,
                  jsonOBJ.pelaaja7.p6
                  ,
                  jsonOBJ.pelaaja7.p7,
                  jsonOBJ.pelaaja7.p8,
                  jsonOBJ.pelaaja7.p9,
                  jsonOBJ.pelaaja7.p10
                  ,
                  jsonOBJ.pelaaja7.p11,
                  jsonOBJ.pelaaja7.p12,
                  pelaajaid[0].pelaajaid]);
              }

            }

            if (jsonOBJ.pelaaja8.nimi !== '') {
              sqlquery = 'SELECT pelaajaid FROM pelaajat WHERE nimi = ? and ryhmaid = ?';
              pelaajaid = await query(sqlquery,
                  [jsonOBJ.pelaaja8.nimi, ryhmaid[0].ryhmaid]);

              if (voittajaid[0].pelaajaid === pelaajaid[0].pelaajaid) {

                await query(sqlqueryVoitto, [
                  jsonOBJ.pelaaja8.p0,
                  jsonOBJ.pelaaja8.p1,
                  jsonOBJ.pelaaja8.p2
                  ,
                  jsonOBJ.pelaaja8.p3,
                  jsonOBJ.pelaaja8.p4,
                  jsonOBJ.pelaaja8.p5,
                  jsonOBJ.pelaaja8.p6
                  ,
                  jsonOBJ.pelaaja8.p7,
                  jsonOBJ.pelaaja8.p8,
                  jsonOBJ.pelaaja8.p9,
                  jsonOBJ.pelaaja8.p10
                  ,
                  jsonOBJ.pelaaja8.p11,
                  jsonOBJ.pelaaja8.p12,
                  pelaajaid[0].pelaajaid]);
              } else {

                await query(sqlqueryHavio, [
                  jsonOBJ.pelaaja8.p0,
                  jsonOBJ.pelaaja8.p1,
                  jsonOBJ.pelaaja8.p2
                  ,
                  jsonOBJ.pelaaja8.p3,
                  jsonOBJ.pelaaja8.p4,
                  jsonOBJ.pelaaja8.p5,
                  jsonOBJ.pelaaja8.p6
                  ,
                  jsonOBJ.pelaaja8.p7,
                  jsonOBJ.pelaaja8.p8,
                  jsonOBJ.pelaaja8.p9,
                  jsonOBJ.pelaaja8.p10
                  ,
                  jsonOBJ.pelaaja8.p11,
                  jsonOBJ.pelaaja8.p12,
                  pelaajaid[0].pelaajaid]);
              }

            }

            if (jsonOBJ.pelaaja9.nimi !== '') {
              sqlquery = 'SELECT pelaajaid FROM pelaajat WHERE nimi = ? and ryhmaid = ?';
              pelaajaid = await query(sqlquery,
                  [jsonOBJ.pelaaja9.nimi, ryhmaid[0].ryhmaid]);

              if (voittajaid[0].pelaajaid === pelaajaid[0].pelaajaid) {

                await query(sqlqueryVoitto, [
                  jsonOBJ.pelaaja9.p0,
                  jsonOBJ.pelaaja9.p1,
                  jsonOBJ.pelaaja9.p2
                  ,
                  jsonOBJ.pelaaja9.p3,
                  jsonOBJ.pelaaja9.p4,
                  jsonOBJ.pelaaja9.p5,
                  jsonOBJ.pelaaja9.p6
                  ,
                  jsonOBJ.pelaaja9.p7,
                  jsonOBJ.pelaaja9.p8,
                  jsonOBJ.pelaaja9.p9,
                  jsonOBJ.pelaaja9.p10
                  ,
                  jsonOBJ.pelaaja9.p11,
                  jsonOBJ.pelaaja9.p12,
                  pelaajaid[0].pelaajaid]);
              } else {

                await query(sqlqueryHavio, [
                  jsonOBJ.pelaaja9.p0,
                  jsonOBJ.pelaaja9.p1,
                  jsonOBJ.pelaaja9.p2
                  ,
                  jsonOBJ.pelaaja9.p3,
                  jsonOBJ.pelaaja9.p4,
                  jsonOBJ.pelaaja9.p5,
                  jsonOBJ.pelaaja9.p6
                  ,
                  jsonOBJ.pelaaja9.p7,
                  jsonOBJ.pelaaja9.p8,
                  jsonOBJ.pelaaja9.p9,
                  jsonOBJ.pelaaja9.p10
                  ,
                  jsonOBJ.pelaaja9.p11,
                  jsonOBJ.pelaaja9.p12,
                  pelaajaid[0].pelaajaid]);
              }

            }

            if (jsonOBJ.pelaaja10.nimi !== '') {
              sqlquery = 'SELECT pelaajaid FROM pelaajat WHERE nimi = ? and ryhmaid = ?';
              pelaajaid = await query(sqlquery,
                  [jsonOBJ.pelaaja10.nimi, ryhmaid[0].ryhmaid]);

              if (voittajaid[0].pelaajaid === pelaajaid[0].pelaajaid) {

                await query(sqlqueryVoitto, [
                  jsonOBJ.pelaaja10.p0,
                  jsonOBJ.pelaaja10.p1,
                  jsonOBJ.pelaaja10.p2
                  ,
                  jsonOBJ.pelaaja10.p3,
                  jsonOBJ.pelaaja10.p4,
                  jsonOBJ.pelaaja10.p5,
                  jsonOBJ.pelaaja10.p6
                  ,
                  jsonOBJ.pelaaja10.p7,
                  jsonOBJ.pelaaja10.p8,
                  jsonOBJ.pelaaja10.p9,
                  jsonOBJ.pelaaja10.p10
                  ,
                  jsonOBJ.pelaaja10.p11,
                  jsonOBJ.pelaaja10.p12,
                  pelaajaid[0].pelaajaid]);
              } else {

                await query(sqlqueryHavio, [
                  jsonOBJ.pelaaja10.p0,
                  jsonOBJ.pelaaja10.p1,
                  jsonOBJ.pelaaja10.p2
                  ,
                  jsonOBJ.pelaaja10.p3,
                  jsonOBJ.pelaaja10.p4,
                  jsonOBJ.pelaaja10.p5,
                  jsonOBJ.pelaaja10.p6
                  ,
                  jsonOBJ.pelaaja10.p7,
                  jsonOBJ.pelaaja10.p8,
                  jsonOBJ.pelaaja10.p9,
                  jsonOBJ.pelaaja10.p10
                  ,
                  jsonOBJ.pelaaja10.p11,
                  jsonOBJ.pelaaja10.p12,
                  pelaajaid[0].pelaajaid]);
              }
            }

          } catch (err) {
            console.log('Database error!' + err);
          } finally {
            //conn.end();
          }
        })();
      } else {
        console.log('Syöte ei hyväksytty!');
      }
    });

const port = process.env.PORT || 3000;

let server = app.listen(port, function() {
  let host = server.address().address;

  console.log('Example app listening at http://%s:%s', host, port);
});

/**
 * Tarkista Clientiltä saadut syötteet
 */
function textInputCheck(inputtxt)
//Tekstisyötteen tarkistus
{
  let inputType = /^[A-Za-z0-9äöåÄÖÅ]+$/;
  if (inputtxt.match(inputType)) {
    return true;
  } else {
    return false;
  }
}