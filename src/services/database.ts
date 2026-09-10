import * as SQLite from 'expo-sqlite';

export interface LessonProgress {
  id: number;
  lesson_id: string;
  completed: number; // 0 or 1
  last_opened_at: string;
}

export interface VoiceDemoScenario {
  id: number;
  recognized_text: string;
  translated_text: string;
  audio_file: string;
}

export interface TeacherCorrectionRecord {
  id: number;
  hindi_text: string;
  original_santali: string;
  corrected_santali: string;
  sync_status: string;
  created_at: string;
}

export interface GeneratedWorksheet {
  id: string;
  class_id: number;
  subject_id: string;
  topic: string;
  title: string;
  english_content: string;
  santali_content: string;
  created_at: string;
}

let dbInstance: SQLite.SQLiteDatabase | null = null;

async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('shikshasetu.db');
  }
  return dbInstance;
}

/**
 * Initializes the SQLite database and creates the required tables & default seeds.
 */
export async function initDatabase(): Promise<void> {
  const db = await getDB();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      class_id INTEGER NOT NULL,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lesson_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id TEXT UNIQUE NOT NULL,
      completed INTEGER DEFAULT 0,
      last_opened_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS voice_demo_scenarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recognized_text TEXT NOT NULL,
      translated_text TEXT NOT NULL,
      audio_file TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS teacher_corrections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hindi_text TEXT NOT NULL,
      original_santali TEXT NOT NULL,
      corrected_santali TEXT NOT NULL,
      sync_status TEXT DEFAULT 'pending',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS generated_worksheets (
      id TEXT PRIMARY KEY,
      class_id INTEGER NOT NULL,
      subject_id TEXT NOT NULL,
      topic TEXT NOT NULL,
      title TEXT NOT NULL,
      english_content TEXT NOT NULL,
      santali_content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // Seed default classes if empty
  const classCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM classes;');
  if (!classCount || classCount.count === 0) {
    await db.runAsync('INSERT INTO classes (id, name) VALUES (1, ?), (2, ?), (3, ?);', [
      'Class 1',
      'Class 2',
      'Class 3',
    ]);
  }

  // Seed default subjects if empty
  const subjectCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM subjects;');
  if (!subjectCount || subjectCount.count === 0) {
    await db.execAsync(`
      INSERT OR IGNORE INTO subjects (id, class_id, name) VALUES
      ('1_mathematics', 1, 'Mathematics'),
      ('1_science', 1, 'Science'),
      ('1_language', 1, 'Language'),
      ('2_mathematics', 2, 'Mathematics'),
      ('2_science', 2, 'Science'),
      ('2_language', 2, 'Language'),
      ('3_mathematics', 3, 'Mathematics'),
      ('3_science', 3, 'Science'),
      ('3_language', 3, 'Language');
    `);
  }

  // Seed voice scenarios if empty
  const scenarioCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM voice_demo_scenarios;');
  if (!scenarioCount || scenarioCount.count === 0) {
    await db.execAsync(`
      INSERT INTO voice_demo_scenarios (recognized_text, translated_text, audio_file) VALUES
      ('कक्षा 1 के गणित का पहला अध्याय खोलें', 'Open Class 1 Mathematics Chapter 1', 'audio_math_ch1.wav'),
      ('संख्या 1 से 10 तक गिनती कैसे सिखाएं', 'How to teach counting from 1 to 10', 'audio_counting_1_10.wav'),
      ('विज्ञान में सजीव और निर्जीव वस्तुओं का अंतर बताएं', 'Explain difference between living and non-living things in science', 'audio_science_living.wav');
    `);
  }

  // Seed initial settings
  await db.execAsync(`
    INSERT OR IGNORE INTO settings (key, value) VALUES
    ('app_name', 'ShikshaSetu'),
    ('team_name', 'Stark Dynamics'),
    ('sih_edition', 'SIH 2026 Prototype'),
    ('offline_storage', 'SQLite enabled');
  `);
}

/**
 * Gets progress record for a specific lessonId.
 */
export async function getLessonProgress(lessonId: string): Promise<LessonProgress | null> {
  const db = await getDB();
  const row = await db.getFirstAsync<LessonProgress>(
    'SELECT * FROM lesson_progress WHERE lesson_id = ?;',
    [lessonId]
  );
  return row || null;
}

/**
 * Records when a lesson is opened by the teacher.
 */
export async function markLessonOpened(lessonId: string): Promise<void> {
  const db = await getDB();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO lesson_progress (lesson_id, completed, last_opened_at)
     VALUES (?, 0, ?)
     ON CONFLICT(lesson_id) DO UPDATE SET last_opened_at = excluded.last_opened_at;`,
    [lessonId, now]
  );
}

/**
 * Marks a lesson as completed.
 */
export async function markLessonComplete(lessonId: string): Promise<void> {
  const db = await getDB();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO lesson_progress (lesson_id, completed, last_opened_at)
     VALUES (?, 1, ?)
     ON CONFLICT(lesson_id) DO UPDATE SET completed = 1, last_opened_at = excluded.last_opened_at;`,
    [lessonId, now]
  );
}

/**
 * Retrieves all progress records as a dictionary keyed by lesson_id.
 */
export async function getAllLessonProgress(): Promise<Record<string, { completed: boolean; last_opened_at: string }>> {
  const db = await getDB();
  const rows = await db.getAllAsync<LessonProgress>('SELECT * FROM lesson_progress;');
  const progressMap: Record<string, { completed: boolean; last_opened_at: string }> = {};

  for (const row of rows) {
    progressMap[row.lesson_id] = {
      completed: row.completed === 1,
      last_opened_at: row.last_opened_at,
    };
  }

  return progressMap;
}

/**
 * Retrieves a setting value by key.
 */
export async function getSetting(key: string): Promise<string | null> {
  const db = await getDB();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?;',
    [key]
  );
  return row ? row.value : null;
}

/**
 * Sets a setting key/value.
 */
export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value;',
    [key, value]
  );
}

/**
 * Retrieves all voice demo scenarios.
 */
export async function getVoiceDemoScenarios(): Promise<VoiceDemoScenario[]> {
  const db = await getDB();
  return await db.getAllAsync<VoiceDemoScenario>('SELECT * FROM voice_demo_scenarios ORDER BY id ASC;');
}

/**
 * Saves an edited teacher translation correction into SQLite.
 */
export async function saveTeacherCorrection(
  hindiText: string,
  originalSantali: string,
  correctedSantali: string
): Promise<number> {
  const db = await getDB();
  const now = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT INTO teacher_corrections (hindi_text, original_santali, corrected_santali, sync_status, created_at)
     VALUES (?, ?, ?, 'pending', ?);`,
    [hindiText, originalSantali, correctedSantali, now]
  );
  return result.lastInsertRowId;
}

/**
 * Retrieves all teacher corrections that are pending upload/sync.
 */
export async function getPendingCorrections(): Promise<TeacherCorrectionRecord[]> {
  const db = await getDB();
  return await db.getAllAsync<TeacherCorrectionRecord>(
    `SELECT * FROM teacher_corrections WHERE sync_status = 'pending' ORDER BY id ASC;`
  );
}

/**
 * Marks a list of correction IDs as synced.
 */
export async function markCorrectionsSynced(ids: number[]): Promise<void> {
  if (!ids || ids.length === 0) return;
  const db = await getDB();
  const placeholders = ids.map(() => '?').join(',');
  await db.runAsync(
    `UPDATE teacher_corrections SET sync_status = 'synced' WHERE id IN (${placeholders});`,
    ids
  );
}

/**
 * Retrieves the last sync timestamp string from settings.
 */
export async function getLastSyncTime(): Promise<string | null> {
  return await getSetting('last_synced_at');
}

/**
 * Records the last successful sync timestamp in settings.
 */
export async function setLastSyncTime(timestamp: string): Promise<void> {
  await setSetting('last_synced_at', timestamp);
}

/**
 * Retrieves the custom API Base URL stored in SQLite settings (if configured).
 */
export async function getCustomApiUrl(): Promise<string | null> {
  return await getSetting('custom_api_url');
}

/**
 * Persists the custom API Base URL into SQLite settings.
 */
export async function setCustomApiUrl(url: string): Promise<void> {
  await setSetting('custom_api_url', url);
}

/**
 * Saves a newly generated bilingual worksheet into SQLite for offline access.
 */
export async function saveGeneratedWorksheet(ws: GeneratedWorksheet): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    `INSERT OR REPLACE INTO generated_worksheets (id, class_id, subject_id, topic, title, english_content, santali_content, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [ws.id, ws.class_id, ws.subject_id, ws.topic, ws.title, ws.english_content, ws.santali_content, ws.created_at]
  );
}

/**
 * Retrieves all offline generated worksheets, optionally filtered by class and/or subject.
 */
export async function getGeneratedWorksheets(
  classId?: number,
  subjectId?: string
): Promise<GeneratedWorksheet[]> {
  const db = await getDB();
  let query = 'SELECT * FROM generated_worksheets';
  const params: any[] = [];
  const conditions: string[] = [];

  if (classId !== undefined) {
    conditions.push('class_id = ?');
    params.push(classId);
  }
  if (subjectId !== undefined) {
    conditions.push('subject_id = ?');
    params.push(subjectId.toLowerCase());
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY created_at DESC;';

  return await db.getAllAsync<GeneratedWorksheet>(query, params);
}

/**
 * Deletes a generated worksheet from SQLite.
 */
export async function deleteGeneratedWorksheet(id: string): Promise<void> {
  const db = await getDB();
  await db.runAsync('DELETE FROM generated_worksheets WHERE id = ?;', [id]);
}

