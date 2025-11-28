-- Add email column to user table
ALTER TABLE "slider-omni_user" ADD COLUMN IF NOT EXISTS "email" varchar(255) NOT NULL DEFAULT '';

-- Update existing users to use username as email (temporary, should be updated manually)
UPDATE "slider-omni_user" SET "email" = "username" WHERE "email" = '';

-- Make email NOT NULL without default (after updating existing rows)
ALTER TABLE "slider-omni_user" ALTER COLUMN "email" DROP DEFAULT;


