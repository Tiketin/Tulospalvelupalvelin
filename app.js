/**
 * Tulospalvelupalvelin
 */
import {createRequire} from 'module';
import { PrismaClient } from '@prisma/client'

const require = createRequire(import.meta.url);
const dotenv = require('dotenv');
dotenv.config();
const bodyParser = require('body-parser');
const express = require('express');
let app = express();
let bcrypt = require('bcrypt');
const saltRounds = 10;

export const prisma = new PrismaClient()

app.use(bodyParser.urlencoded({
  extended: false,
}));

app.use(bodyParser.json());

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


app.get('/api/players', async (req, res) => {
  const group = req.query.group
  console.log('Get players from group ' + group)
  
  if (!textInputCheck(group)) return res.status(400).send('Syöte ei hyväksytty!')
    
  try {
    const players = await prisma.pelaajat.findMany({
      where: {
        ryhmat: { is: { nimi: group } },
        statistiikat: { isNot: null },
      },
      select: {
        nimi: true,
        statistiikat: { select: { pelatutlkm: true, voitotlkm: true } },
      },
      orderBy: { nimi: 'asc' },
    })
    
    const rows = players.map(p => ({
      nimi: p.nimi,
      pelatutlkm: p.statistiikat?.pelatutlkm ?? 0,
      voitotlkm: p.statistiikat?.voitotlkm ?? 0,
    }))
    
    res.json({ numOfRows: rows.length, rows })
  } catch (err) {
    console.error('Database error!', err)
    res.status(500).send('Database error!')
  }
})

// parametrien kirjoitustapa selaimessa : http://localhost:3000/api/login?group=Sikailijat&password=asd
app.get('/api/login', async (req, res) => {
  const { group, password } = req.query
  console.log('Login for group ' + group)

  if (!textInputCheck(group) || !textInputCheck(password)) {
    return res.status(400).send('Syöte ei hyväksytty!')
  }

  try {
    const row = await prisma.ryhmat.findUnique({
      where: { nimi: String(group) },
      select: { nimi: true, salasana: true },
    })

    if (!row) return res.status(401).send('Salasana väärin')

    const ok = await bcrypt.compare(String(password), row.salasana)
    if (!ok) return res.status(401).send('Salasana väärin')

    const rows = [{ nimi: row.nimi }]
    return res.json({ numOfRows: rows.length, rows })
  } catch (err) {
    console.error('Database error!', err)
    return res.status(500).send('Database error!')
  }
})

// parametrien kirjoitustapa selaimessa : http://localhost:3000/api/player?group=Sikailijat&player=Onni
app.get('/api/player', async (req, res) => {
  const { group, player } = req.query
  console.log('Get stats of player ' + player + ' in group ' + group)

  if (!textInputCheck(group) || !textInputCheck(player)) {
    return res.status(400).send('Syöte ei hyväksytty!')
  }

  try {
    const row = await prisma.pelaajat.findFirst({
      where: {
        nimi: String(player),
        ryhmat: { is: { nimi: String(group) } },
        statistiikat: { isNot: null },
      },
      select: {
        nimi: true,
        statistiikat: true 
      },
    })

    const rows = row
      ? [{ nimi: row.nimi, ...row.statistiikat }]
      : []

    return res.json({ numOfRows: rows.length, rows })
  } catch (err) {
    console.error('Database error!', err)
    return res.status(500).send('Database error!')
  }
})

// parametrien kirjoitustapa selaimessa : http://localhost:3000/api/games?group=asd
app.get('/api/games', async (req, res) => {
  const group = req.query.group
  console.log('Get list of played games for group ' + group)

  if (!textInputCheck(group)) return res.status(400).send('Syöte ei hyväksytty!')

  try {
    const games = await prisma.pelit.findMany({
      where: { ryhmat: { is: { nimi: String(group) } } },
      include: { pelaajat: { select: { nimi: true } } },
      orderBy: { pvm: 'asc' },
    })

    const rows = games.map(g => ({
      pvm: g.pvm.toISOString().slice(0, 10),
      nimi: g.pelaajat.nimi,
    }))

    res.json({ numOfRows: rows.length, rows })
  } catch (err) {
    console.error('Database error!', err)
    res.status(500).send('Database error!')
  }
})

// parametrien kirjoitustapa selaimessa : http://localhost:3000/api/newgroup
app.post('/api/newgroup', async (req, res) => {
  const { nimi, salasana } = req.body || {}
  console.log('Create a new group ' + nimi)

  if (!textInputCheck(nimi) || !textInputCheck(salasana)) {
    return res.status(400).send('Syöte ei hyväksytty!')
  }

  try {
    const hash = await bcrypt.hash(String(salasana), saltRounds)

    await prisma.ryhmat.create({
      data: { nimi: String(nimi), salasana: hash },
    })

    return res.json({ ok: true, nimi })
  } catch (err) {
    if (err?.code === 'P2002') {
      return res.status(409).send('Ryhmän nimi on jo käytössä')
    }
    console.error('Database error!', err)
    return res.status(500).send('Database error!')
  }
})

// parametrien kirjoitustapa selaimessa : http://localhost:3000/api/newplayer
app.post('/api/newplayer', async (req, res) => {
  const { pelaajan_nimi, ryhman_nimi } = req.body || {}
  console.log('Create a new player ' + pelaajan_nimi + ' for group ' + ryhman_nimi)

  if (!textInputCheck(pelaajan_nimi) || !textInputCheck(ryhman_nimi)) {
    return res.status(400).send('Syöte ei hyväksytty!')
  }

  try {
    // 1) Find group by unique name
    const group = await prisma.ryhmat.findUnique({
      where: { nimi: String(ryhman_nimi) },
      select: { ryhmaid: true },
    })
    if (!group) return res.status(404).send('Ryhmää ei löytynyt')

    // 2) Check if a player with the same name already exists in this group
    const exists = await prisma.pelaajat.findFirst({
      where: { ryhmaid: group.ryhmaid, nimi: String(pelaajan_nimi) },
      select: { pelaajaid: true },
    })
    if (exists) return res.status(409).send('Saman niminen pelaaja on jo lisätty')

    // 3) Create player
    await prisma.pelaajat.create({
      data: {
        nimi: String(pelaajan_nimi),
        ryhmat: { connect: { ryhmaid: group.ryhmaid } },
        statistiikat: { create: {} }, 
      },
    })

    return res.send('Post successful' + req.body)
  } catch (err) {
    console.error('Database error! ', err)
    return res.status(500).send('Database error!')
  }
})


app.post('/api/newgame', async (req, res) => {
  try {
    const body = req.body
    console.log('Save a new game for group ' + body.ryhman_nimi)

    if (!textInputCheck(body.ryhman_nimi)) {
      return res.status(400).send('Syöte ei hyväksytty!')
    }

    const group = await prisma.ryhmat.findUnique({
      where: { nimi: body.ryhman_nimi },
      select: { ryhmaid: true },
    })
    if (!group) return res.status(404).send('Ryhmää ei löytynyt')

    const winner = await prisma.pelaajat.findFirst({
      where: { nimi: body.voittajan_nimi, ryhmaid: group.ryhmaid },
      select: { pelaajaid: true },
    })
    if (!winner) return res.status(404).send('Voittajaa ei löytynyt ryhmästä')

    const n = (v) => (v == null || Number.isNaN(Number(v)) ? 0 : Number(v))

    const peli = await prisma.$transaction(async (tx) => {
      const created = await tx.pelit.create({
        data: {
          pvm: body.pvm ? new Date(body.pvm) : new Date(),
          ryhmat:   { connect: { ryhmaid: group.ryhmaid } },
          pelaajat: { connect: { pelaajaid: winner.pelaajaid } },
        },
        select: { peliid: true },
      })

      for (let i = 1; i <= 10; i++) {
        const p = body[`pelaaja${i}`]
        if (!p || !p.nimi) continue

        const dbPlayer = await tx.pelaajat.findFirst({
          where: { nimi: p.nimi, ryhmaid: group.ryhmaid },
          select: { pelaajaid: true },
        })
        if (!dbPlayer) continue // or throw if you want strict behavior

        const isWinner = dbPlayer.pelaajaid === winner.pelaajaid

        const POINTS = ['p0','p1','p2','p3','p4','p5','p6','p7','p8','p9','p10','p11','p12']

        const initialPoints = Object.fromEntries(POINTS.map(point => [point, n(p[point])]))
        const onCreate = {
            pelaajaid:  dbPlayer.pelaajaid,
            pelatutlkm: 1,
            voitotlkm:  isWinner ? 1 : 0,
            ...initialPoints,
        }

        const pointIncs = Object.fromEntries(POINTS.map(point => [point, { increment: n(p[point]) }]))
        const onUpdate = {
          pelatutlkm: { increment: 1 },
          ...(isWinner ? { voitotlkm: { increment: 1 } } : {}),
          ...pointIncs,
        }

        await tx.statistiikat.upsert({
          where: { pelaajaid: dbPlayer.pelaajaid }, // unique in your schema
          create: onCreate,
          update: onUpdate
        })
      }

      return created
    })

    return res.json({ ok: true, peliid: peli.peliid })
  } catch (err) {
    console.error('Database error!', err)
    return res.status(500).send('Database error!')
  }
})

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