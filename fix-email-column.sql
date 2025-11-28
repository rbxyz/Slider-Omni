-- Script para adicionar a coluna email se ela não existir
-- Execute este script diretamente no banco de dados PostgreSQL

-- Verifica se a coluna não existe antes de adicionar
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'slider-omni_user' 
        AND column_name = 'email'
    ) THEN
        -- Adiciona a coluna com valor padrão temporário
        ALTER TABLE "slider-omni_user" 
        ADD COLUMN "email" varchar(255) NOT NULL DEFAULT '';
        
        -- Atualiza usuários existentes para usar username como email
        UPDATE "slider-omni_user" 
        SET "email" = "username" 
        WHERE "email" = '' OR "email" IS NULL;
        
        -- Remove o default após atualizar
        ALTER TABLE "slider-omni_user" 
        ALTER COLUMN "email" DROP DEFAULT;
        
        RAISE NOTICE 'Coluna email adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna email já existe!';
    END IF;
END $$;


