import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { buildNotePreview } from "../notes/buildNotePreview";

// Load environment variables (.env.local takes precedence, .env fills the rest)
config({ path: '.env.local' });
config();

const main = async () => {
  const prisma = new PrismaClient();

  try {
    console.log('Backfilling note previews...');

    const notes = await prisma.note.findMany({
      where: { content: { not: null } },
      select: { id: true, content: true },
    });

    console.log(`Found ${notes.length} notes with content to backfill`);

    let updated = 0;
    for (const note of notes) {
      try {
        await prisma.note.update({
          where: { id: note.id },
          data: { preview: buildNotePreview(note.content) },
        });
        updated++;
      } catch (error) {
        console.error(`Error backfilling note ${note.id}:`, error);
      }
    }

    console.log(`Successfully backfilled ${updated} note previews`);
  } catch (error) {
    console.error('Error during note preview backfill:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

if (require.main === module) {
  main()
    .then(() => {
      console.log('Backfill script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Backfill script failed:', error);
      process.exit(1);
    });
}

export default main;
