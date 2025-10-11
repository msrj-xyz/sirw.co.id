SELECT typname FROM pg_type WHERE typname = 'residencestatus';
SELECT column_name, data_type FROM information_schema.columns WHERE table_name='Resident' AND column_name='residenceStatus';
