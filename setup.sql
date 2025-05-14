-- Drop and recreate the database
DROP DATABASE IF EXISTS tulospalvelu;
CREATE DATABASE tulospalvelu;
USE tulospalvelu;

-- Table: ryhmat (groups)
CREATE TABLE ryhmat (
    ryhmaid INT AUTO_INCREMENT PRIMARY KEY,
    nimi VARCHAR(255) NOT NULL UNIQUE,
    salasana VARCHAR(255) NOT NULL
);

-- Table: pelaajat (players)
CREATE TABLE pelaajat (
    pelaajaid INT AUTO_INCREMENT PRIMARY KEY,
    nimi VARCHAR(255) NOT NULL,
    ryhmaid INT NOT NULL,
    FOREIGN KEY (ryhmaid) REFERENCES ryhmat(ryhmaid)
);

-- Table: statistiikat (stats)
CREATE TABLE statistiikat (
    statistiikkaid INT AUTO_INCREMENT PRIMARY KEY,
    pelaajaid INT UNIQUE, -- assuming one-to-one relationship
    pelatutlkm INT DEFAULT 0,
    voitotlkm INT DEFAULT 0,
    p0 INT DEFAULT 0,
    p1 INT DEFAULT 0,
    p2 INT DEFAULT 0,
    p3 INT DEFAULT 0,
    p4 INT DEFAULT 0,
    p5 INT DEFAULT 0,
    p6 INT DEFAULT 0,
    p7 INT DEFAULT 0,
    p8 INT DEFAULT 0,
    p9 INT DEFAULT 0,
    p10 INT DEFAULT 0,
    p11 INT DEFAULT 0,
    p12 INT DEFAULT 0,
    FOREIGN KEY (pelaajaid) REFERENCES pelaajat(pelaajaid)
);

-- Table: pelit (games)
CREATE TABLE pelit (
    peliid INT AUTO_INCREMENT PRIMARY KEY,
    ryhmaid INT NOT NULL,
    voittajaid INT NOT NULL,
    pvm DATE NOT NULL,
    FOREIGN KEY (ryhmaid) REFERENCES ryhmat(ryhmaid),
    FOREIGN KEY (voittajaid) REFERENCES pelaajat(pelaajaid)
);