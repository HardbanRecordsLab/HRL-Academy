import Database from 'better-sqlite3';

const db = new Database('hrl_academy_core.db');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database tables matching the HRL Academy Core PRD
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      role TEXT CHECK(role IN ('admin','student','creator')) DEFAULT 'student',
      status TEXT CHECK(status IN ('active','blocked','pending')) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE,
      description LONGTEXT,
      thumbnail TEXT,
      access_type TEXT CHECK(access_type IN ('free','premium','subscription')),
      visibility TEXT CHECK(visibility IN ('public','private','hidden')) DEFAULT 'public',
      price REAL DEFAULT 0,
      status TEXT CHECK(status IN ('draft','published')) DEFAULT 'draft',
      created_by INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      external_url TEXT,
      FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS modules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER,
      title TEXT,
      module_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER,
      module_id INTEGER,
      title TEXT,
      slug TEXT,
      source_url TEXT,
      source_type TEXT CHECK(source_type IN ('video','pdf','audio','iframe','external','download')),
      access_level TEXT CHECK(access_level IN ('free','premium')),
      lesson_order INTEGER DEFAULT 0,
      drip_days INTEGER DEFAULT 0,
      duration_minutes INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY(module_id) REFERENCES modules(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      course_id INTEGER,
      access_type TEXT CHECK(access_type IN ('free','paid','subscription')),
      expires_at DATETIME,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE,
      UNIQUE(user_id, course_id)
  );

  CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      course_id INTEGER,
      payment_provider TEXT,
      transaction_id TEXT,
      amount REAL,
      currency TEXT,
      status TEXT CHECK(status IN ('pending','completed','failed','refunded')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      provider_subscription_id TEXT,
      plan_name TEXT,
      status TEXT CHECK(status IN ('active','cancelled','expired')),
      started_at DATETIME,
      expires_at DATETIME,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS lesson_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      lesson_id INTEGER,
      progress_percent INTEGER DEFAULT 0,
      completed BOOLEAN DEFAULT FALSE,
      last_accessed DATETIME,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
      UNIQUE(user_id, lesson_id)
  );

  CREATE TABLE IF NOT EXISTS access_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      lesson_id INTEGER,
      token TEXT UNIQUE,
      expires_at DATETIME,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS hrl_activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      course_id INTEGER,
      certificate_code TEXT UNIQUE,
      pdf_url TEXT,
      template_style TEXT DEFAULT 'classical',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE,
      UNIQUE(user_id, course_id)
  );

  CREATE TABLE IF NOT EXISTS ch_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      token TEXT UNIQUE,
      is_revoked BOOLEAN DEFAULT 0,
      last_activity_at INTEGER,
      expires_at INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS quiz_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER,
      question_text TEXT NOT NULL,
      options_json TEXT NOT NULL DEFAULT '[]',
      correct_option_index INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS quiz_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      lesson_id INTEGER,
      score_percent INTEGER DEFAULT 0,
      passed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
  );

  -- High-performance database indexing for self-hosted VPS production load
  CREATE INDEX IF NOT EXISTS idx_enrollments_user_course ON enrollments (user_id, course_id);
  CREATE INDEX IF NOT EXISTS idx_lessons_course_module ON lessons (course_id, module_id);
  CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_lesson ON lesson_progress (user_id, lesson_id);
  CREATE INDEX IF NOT EXISTS idx_certificates_user_course ON certificates (user_id, course_id);
  CREATE INDEX IF NOT EXISTS idx_ch_tokens_token ON ch_tokens (token);
  CREATE INDEX IF NOT EXISTS idx_hrl_activity_logs_user_action ON hrl_activity_logs (user_id, action);
`);

try {
  db.exec("ALTER TABLE courses ADD COLUMN external_url TEXT;");
  console.log("Migration: Added external_url column to courses table successfully.");
} catch (e: any) {
  console.log("Migration external_url (Ignore if columns exist):", e.message);
}

try {
  db.exec("ALTER TABLE certificates ADD COLUMN template_style TEXT DEFAULT 'classical';");
  console.log("Migration: Added template_style column to certificates table successfully.");
} catch (e: any) {
  console.log("Migration template_style (Ignore if columns exist):", e.message);
}

try {
  db.exec("ALTER TABLE lessons ADD COLUMN passing_score INTEGER DEFAULT 0;");
  console.log("Migration: Added passing_score column to lessons table successfully.");
} catch (e: any) {
  console.log("Migration passing_score (Ignore if columns exist):", e.message);
}

// =============================================================================
// SEED DANYCH — niezbędne przy Vercel cold start (SQLite jest za każdym razem pusta)
// Wstawia domyślnego admina i demo kursy tylko jeśli tabela users jest pusta.
// =============================================================================
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  console.log("[SEED] Baza pusta — wstawiam dane startowe...");

  // Hash dla hasła "Admin123!" (SHA256 z solą)
  const ADMIN_PASSWORD_HASH = "ee6d37fefcdf935f609b37cdbeb749dccac430638a0e537078a964ff20944754";

  db.prepare(`
    INSERT INTO users (email, password_hash, first_name, last_name, role, status)
    VALUES
      ('admin@hrl.pl', '${ADMIN_PASSWORD_HASH}', 'HRL', 'Administrator', 'admin', 'active'),
      ('student@hrl.pl', '${ADMIN_PASSWORD_HASH}', 'Jan', 'Kowalski', 'student', 'active'),
      ('creator@hrl.pl', '${ADMIN_PASSWORD_HASH}', 'Anna', 'Nowak', 'creator', 'active')
  `).run();
  console.log("[SEED] Wstawiono 3 użytkowników (admin@hrl.pl / Admin123!)");

  // Demo kurs
  const courseResult = db.prepare(`
    INSERT INTO courses (title, slug, description, thumbnail, access_type, price, status, created_by)
    VALUES ('Wprowadzenie do HRL Academy', 'wprowadzenie-hrl', 'Podstawowy kurs demonstracyjny platformy HRL Academy.', 'https://picsum.photos/seed/hrlc/800/450', 'free', 0, 'published', 1)
  `).run();
  const courseId = courseResult.lastInsertRowid;
  console.log(`[SEED] Wstawiono kurs demo (id=${courseId})`);

  // Moduł i lekcja demo
  const moduleResult = db.prepare(`
    INSERT INTO modules (course_id, title, module_order) VALUES (?, 'Moduł 1: Podstawy', 1)
  `).run(courseId);
  const moduleId = moduleResult.lastInsertRowid;

  db.prepare(`
    INSERT INTO lessons (course_id, module_id, title, slug, source_url, source_type, access_level, lesson_order, duration_minutes)
    VALUES (?, ?, 'Lekcja 1: Witamy w HRL Academy', 'witamy-hrl', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'video', 'free', 1, 5)
  `).run(courseId, moduleId);
  console.log("[SEED] Wstawiono moduł i lekcję demo");

  // Enrollment dla studenta
  db.prepare(`
    INSERT INTO enrollments (user_id, course_id, access_type) VALUES (2, ?, 'free')
  `).run(courseId);
  console.log("[SEED] Seed zakończony.");
}

export default db;
