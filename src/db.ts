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
      passing_score INTEGER DEFAULT 0,
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

  CREATE TABLE IF NOT EXISTS quiz_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER NOT NULL,
      question_text TEXT NOT NULL,
      options_json TEXT NOT NULL,
      correct_option_index INTEGER NOT NULL,
      FOREIGN KEY(lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS quiz_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      lesson_id INTEGER NOT NULL,
      score_percent INTEGER NOT NULL,
      passed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
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

// Seed data function to prepopulate tables with realistic data for live preview
const seedData = () => {
  const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (usersCount.count === 0) {
    // 1. Seed users (admin, student, creator)
    const insertUser = db.prepare(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    insertUser.run('admin@hrl.academy', 'hashed_pass_123', 'Jan', 'Kowalski', 'admin', 'active');
    insertUser.run('student@hrl.academy', 'hashed_pass_456', 'Michał', 'Nowak', 'student', 'active');
    insertUser.run('creator@hrl.academy', 'hashed_pass_789', 'Maria', 'Wiśniewska', 'creator', 'active');

    // 2. Seed courses
    const insertCourse = db.prepare(`
      INSERT INTO courses (title, slug, description, thumbnail, access_type, price, status, created_by, external_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertCourse.run(
      'Docker & Kubernetes Core Accelerator', 
      'docker-kubernetes-accelerator', 
      'Przejdź od podstaw konteneryzacji do produkcyjnego wdrażania złożonych mikroserwisów w środowisku Kubernetes. Program zawiera lekcje wideo, laboratoria oraz instrukcje produkcyjne UFW/Nginx.', 
      'https://picsum.photos/seed/docker/800/450', 
      'premium', 
      499.00, 
      'published', 
      1,
      'https://v1.kubernetes.io/docs/home/'
    );

    insertCourse.run(
      'Security Engineering: Cybersec Handbook', 
      'security-engineering-handbook', 
      'Zaawansowane techniki ochrony aplikacji webowych, zapobieganie exploitom, i konfiguracja systemów IDS/IPS w chmurach. Opracowane we współpracy z ekspertami branżowymi.', 
      'https://picsum.photos/seed/security/800/450', 
      'subscription', 
      29.99, 
      'published', 
      1,
      'https://owasp.org/www-project-top-ten/'
    );

    insertCourse.run(
      'Cloud Architecture Foundations', 
      'cloud-architecture-foundations', 
      'Wprowdzenie do nowoczesnej architektury chmurowej, projektowania systemów High Availability i automatyzacji IaC przy użyciu Terraform.', 
      'https://picsum.photos/seed/cloud/800/450', 
      'free', 
      0.00, 
      'published', 
      3,
      'https://aws.amazon.com/architecture/'
    );

    // 3. Seed modules
    const insertModule = db.prepare(`
      INSERT INTO modules (course_id, title, module_order)
      VALUES (?, ?, ?)
    `);
    
    // Modules for Course 1
    insertModule.run(1, 'Wprowadzenie do Konteneryzacji (Docker)', 1);
    insertModule.run(1, 'Zaawansowana Orkiestracja w Kubernetes (K8s)', 2);
    
    // Modules for Course 2
    insertModule.run(2, 'Modelowanie Zagrożeń (Threat Modeling)', 1);
    insertModule.run(2, 'Testy Penetracyjne & Bezpieczeństwo Kodu', 2);
    
    // Modules for Course 3
    insertModule.run(3, 'Podstawowe Koncepcje Chmurowe', 1);

    // 4. Seed lessons
    const insertLesson = db.prepare(`
      INSERT INTO lessons (course_id, module_id, title, slug, source_url, source_type, access_level, lesson_order, drip_days, duration_minutes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Lessons for Docker/Kubernetes (Course 1)
    insertLesson.run(1, 1, 'Dlaczego konteneryzacja? Podstawy i architektura', 'containers-basics-and-architecture', 'https://bunny-stream.example.com/play/docker-basics-101', 'video', 'free', 1, 0, 15);
    insertLesson.run(1, 1, 'Tworzenie i optymalizacja obrazów (Dockerfile)', 'writing-optimizing-dockerfiles', 'https://bunny-stream.example.com/play/dockerfile-tips', 'video', 'premium', 2, 0, 22);
    insertLesson.run(1, 1, 'Komendy Docker-CLI: Podręczny Cheat-Sheet', 'docker-cli-cheat-sheet', 'https://bunny-stream.example.com/downloads/docker-cheat-sheet.pdf', 'download', 'premium', 3, 0, 5);
    
    insertLesson.run(1, 2, 'Architektura k8s: Control Plane i Worker Nodes', 'k8s-architecture-control-plane', 'https://bunny-stream.example.com/play/k8s-architecture', 'video', 'premium', 1, 3, 30);
    insertLesson.run(1, 2, 'Wdrożenie pierwszej aplikacji w k8s (Manifesty YAML)', 'deploying-first-app-k8s', 'https://bunny-stream.example.com/play/k8s-manifests', 'video', 'premium', 2, 5, 25);

    // Lessons for Security Engineering (Course 2)
    insertLesson.run(2, 3, 'Wstęp do OWASP Top 10 w praktyce produkcyjnej', 'intro-owasp-top-10', 'https://bunny-stream.example.com/play/owasp-intro', 'video', 'premium', 1, 0, 18);
    insertLesson.run(2, 3, 'Symulacja podatności SQL Injection - Lab Kontener', 'sqli-vulnerability-sandbox', 'https://bunny-stream.example.com/labs/sqli-sandbox', 'iframe', 'premium', 2, 0, 45);

    // Lessons for Cloud Foundations (Course 3)
    insertLesson.run(3, 5, 'Model IaaS, PaaS i SaaS - Kluczowe Różnice', 'iaas-paas-saas-differences', 'https://bunny-stream.example.com/play/cloud-models', 'video', 'free', 1, 0, 12);
    insertLesson.run(3, 5, 'Zarządzanie kosztami chmurowymi (FinOps)', 'cloud-cost-management', 'https://bunny-stream.example.com/pdfs/finops-fundamentals.pdf', 'pdf', 'free', 2, 0, 15);

    // 5. Seed enrollments for student Michał Nowak (user_id = 2)
    const insertEnrollment = db.prepare(`
      INSERT INTO enrollments (user_id, course_id, access_type, expires_at)
      VALUES (?, ?, ?, ?)
    `);
    insertEnrollment.run(2, 1, 'paid', '2027-12-31 23:59:59'); // Paid access to course 1
    insertEnrollment.run(2, 3, 'free', null); // Free access to course 3

    // 6. Seed Subscriptions
    db.prepare(`
      INSERT INTO subscriptions (user_id, provider_subscription_id, plan_name, status, started_at, expires_at)
      VALUES (?, ?, ?, ?, datetime('now', '-5 days'), datetime('now', '+25 days'))
    `).run(2, 'sub_stripe_123456', 'HRL Premium Access Plan', 'active');

    // Grant access to course 2 via active subscription
    insertEnrollment.run(2, 2, 'subscription', '2026-06-25 10:00:00');

    // 7. Seed payments
    const insertPayment = db.prepare(`
      INSERT INTO payments (user_id, course_id, payment_provider, transaction_id, amount, currency, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertPayment.run(2, 1, 'Stripe', 'txn_stripe_docker_499', 499.00, 'USD', 'completed');
    insertPayment.run(2, 2, 'LemonSqueezy', 'txn_ls_sub_29', 29.99, 'USD', 'completed');

    // 8. Seed progress
    const insertProgress = db.prepare(`
      INSERT INTO lesson_progress (user_id, lesson_id, progress_percent, completed, last_accessed)
      VALUES (?, ?, ?, ?, datetime('now', '-2 days'))
    `);
    insertProgress.run(2, 1, 100, 1);
    insertProgress.run(2, 2, 45, 0);

    // 9. Seed Quizzes for lesson 1
    db.prepare(`UPDATE lessons SET passing_score = 60 WHERE id = 1`).run();
    
    const insertQuestion = db.prepare(`
      INSERT INTO quiz_questions (lesson_id, question_text, options_json, correct_option_index)
      VALUES (?, ?, ?, ?)
    `);
    
    insertQuestion.run(
      1,
      "Czym różni się kontener od maszyny wirtualnej (VM)?",
      JSON.stringify([
        "Kontener współdzieli jądro systemu operacyjnego gospodarza, a VM posiada pełny system operacyjny-gościa.",
        "VM jest zawsze szybszy i mniejszy niż kontener.",
        "Kontener wymaga hypervisora do uruchomienia.",
        "Nie ma żadnych różnic architektonicznych."
      ]),
      0
    );

    insertQuestion.run(
      1,
      "Jaka instrukcja w pliku Dockerfile służy do zdefiniowania domyślnego polecenia startowego?",
      JSON.stringify([
        "RUN",
        "CMD",
        "EXPOSE",
        "COPY"
      ]),
      1
    );

    insertQuestion.run(
      1,
      "Co oznacza flaga '-d' w poleceniu 'docker run'?",
      JSON.stringify([
        "Uruchomienie w trybie interaktywnym (interactive)",
        "Automatyczne usunięcie kontenera po zakończeniu (rm)",
        "Uruchomienie kontenera w tle (detached mode)",
        "Przypisanie wolumenu danych (volume)"
      ]),
      2
    );

    // Log seed event
    db.prepare(`
      INSERT INTO hrl_activity_logs (user_id, action, details, ip_address)
      VALUES (null, 'system_init', 'Baza danych HRL Academy Core pomyślnie zainicjalizowana z tabelami PRD i zasilona danymi.', '127.0.0.1')
    `).run();
  }

  // Ensure "Cyfrowy Zen" is added for free to the catalog if it doesn't exist
  const zenCount = db.prepare('SELECT COUNT(*) as count FROM courses WHERE slug = ?').get('cyfrowy-zen') as { count: number };
  if (zenCount.count === 0) {
    db.prepare(`
      INSERT INTO courses (title, slug, description, thumbnail, access_type, price, status, created_by, external_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'Cyfrowy Zen',
      'cyfrowy-zen',
      'Kurs Cyfrowy Zen - osiągnij spokój umysłu w cyfrowym świecie. Pełen dostęp edukacyjny przez HRL Core.',
      'https://picsum.photos/seed/zen/800/450',
      'free',
      0.00,
      'published',
      1,
      'https://cyfrowy-zen.hardbanrecordslab.online/'
    );
     // Auto-enroll student inside the seeding
    const zenCourseId = (db.prepare('SELECT id FROM courses WHERE slug = ?').get('cyfrowy-zen') as any).id;
    // Auto-enroll admin and student to have access (userId 2 is student, 1 is admin)
    const enroll = db.prepare(`INSERT OR IGNORE INTO enrollments (user_id, course_id, access_type, expires_at) VALUES (?, ?, 'free', null)`);
    enroll.run(1, zenCourseId);
    enroll.run(2, zenCourseId);
  }
};

try {
  seedData();
} catch (e) {
  console.error("Database seeding issue:", e);
}

export default db;
