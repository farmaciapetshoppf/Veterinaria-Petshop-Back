import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateConversationsParticipantsColumn1733971200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Si la tabla ya existe, modificar la columna
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'conversations'
        ) THEN
          -- Primero, intentar convertir datos existentes
          ALTER TABLE conversations 
          ALTER COLUMN participants TYPE uuid[] 
          USING string_to_array(participants, ',')::uuid[];
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir a simple-array (text)
    await queryRunner.query(`
      ALTER TABLE conversations 
      ALTER COLUMN participants TYPE text 
      USING array_to_string(participants, ',');
    `);
  }
}
