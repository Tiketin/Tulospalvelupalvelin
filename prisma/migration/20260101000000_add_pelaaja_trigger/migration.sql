-- 1. Create the trigger for ALL future player insertions
CREATE TRIGGER trg_after_insert_pelaaja
AFTER INSERT ON pelaajat
FOR EACH ROW
BEGIN
    INSERT INTO statistiikat (pelaajaid) VALUES (NEW.pelaajaid);
END;

-- 2. Backfill missing statistiikat rows for EXISTING players
INSERT INTO statistiikat (pelaajaid)
SELECT pelaajaid 
FROM pelaajat 
WHERE pelaajaid NOT IN (
    SELECT pelaajaid FROM statistiikat WHERE pelaajaid IS NOT NULL
);