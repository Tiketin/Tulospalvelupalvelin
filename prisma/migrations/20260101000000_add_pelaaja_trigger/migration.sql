-- 1. Create trigger (single statement, no BEGIN/END needed)
CREATE TRIGGER trg_after_insert_pelaaja
AFTER INSERT ON pelaajat
FOR EACH ROW
INSERT INTO statistiikat (pelaajaid) VALUES (NEW.pelaajaid);

-- 2. Backfill missing statistiikat rows for EXISTING players
INSERT INTO statistiikat (pelaajaid)
SELECT pelaajaid 
FROM pelaajat 
WHERE pelaajaid NOT IN (
    SELECT pelaajaid FROM statistiikat WHERE pelaajaid IS NOT NULL
);