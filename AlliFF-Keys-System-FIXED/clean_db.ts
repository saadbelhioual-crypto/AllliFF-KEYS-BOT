import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'alliff.db');
const db = new Database(DB_PATH);

try {
    console.log('Cleaning reward links...');
    const result = db.prepare('DELETE FROM reward_links').run();
    console.log(`Deleted ${result.changes} reward links.`);
    
    console.log('Cleaning link usage...');
    const usageResult = db.prepare('DELETE FROM link_usage').run();
    console.log(`Deleted ${usageResult.changes} usage records.`);
    
    console.log('Database cleaned successfully.');
} catch (error) {
    console.error('Error cleaning database:', error);
} finally {
    db.close();
}
