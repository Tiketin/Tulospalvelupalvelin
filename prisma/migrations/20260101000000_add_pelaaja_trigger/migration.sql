CREATE TRIGGER trg_after_insert_pelaaja
AFTER INSERT ON pelaajat
FOR EACH ROW
INSERT INTO statistiikat (pelaajaid) VALUES (NEW.pelaajaid);