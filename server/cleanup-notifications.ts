import 'dotenv/config';
import { db } from './db';
import { notifications } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function cleanupSpamNotifications() {
    console.log('Cleaning up spam notifications...');

    // Delete all transaction_reminder notifications
    const result = await db.delete(notifications)
        .where(eq(notifications.type, 'transaction_reminder'));

    console.log('✓ Deleted all transaction_reminder spam notifications');

    // Show remaining count
    const remaining = await db.select().from(notifications);
    console.log(`Remaining notifications: ${remaining.length}`);

    process.exit(0);
}

cleanupSpamNotifications().catch(e => {
    console.error('Error:', e);
    process.exit(1);
});
