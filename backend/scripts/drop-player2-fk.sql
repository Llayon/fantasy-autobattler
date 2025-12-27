-- Drop foreign key constraint on battle_logs.player2Id
-- This allows bot opponents (random UUIDs) to be stored without referencing players table

-- First, find and drop the constraint
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find the foreign key constraint name
    SELECT tc.constraint_name INTO constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'battle_logs' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'player2Id';
    
    -- Drop the constraint if it exists
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE battle_logs DROP CONSTRAINT ' || quote_ident(constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    ELSE
        RAISE NOTICE 'No foreign key constraint found on player2Id';
    END IF;
END $$;
