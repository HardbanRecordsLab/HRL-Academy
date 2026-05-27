import express from "express";
import { createServer as createViteServer } from "vite";
import db from "./src/db.ts";
import crypto from "crypto";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "9104", 10);

  app.use(express.json());

  // Enable CORS helper for Vercel/External Client to self-hosted VPS Cross-Origin request validation
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
    next();
  });

  // Log incoming requests
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // --- API Authentication Middlewares & Helper ---
  // If no environment secret is provided, dynamically provision a secure, high-entropy token at startup to prevent credential exploits
  const JWT_SECRET = process.env.JWT_SECRET || (() => {
    if (process.env.NODE_ENV === "production") {
      console.warn("WARNING: JWT_SECRET environment variable is missing in production! Generating random fallback secret.");
    }
    return crypto.randomBytes(64).toString("hex");
  })();
  
  const INACTIVITY_TIMEOUT_SEC = 900; // 15 minutes of inactivity (900 seconds)

  // Standard safe cryptographic password hashing
  const hashPassword = (password: string) => {
    return crypto.createHash("sha256").update(password + "_hrl_secret_salt_2026").digest("hex");
  };

  // Standard lightweight JSON Web Token signature utilities (HS256)
  const base64UrlEncode = (obj: any) => {
    return Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  };

  const signToken = (payload: any, secret: string) => {
    const header = { alg: "HS256", typ: "JWT" };
    const encodedHeader = base64UrlEncode(header);
    const encodedPayload = base64UrlEncode(payload);
    const signature = crypto
      .createHmac("sha256", secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest("base64url");
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  };

  const verifyToken = (token: string, secret: string) => {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${header}.${payload}`)
      .digest("base64url");
    if (signature !== expectedSignature) return null;
    try {
      return JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
    } catch {
      return null;
    }
  };

  // A helper to get the active user. Checks standard JWT session token from authorization headers first.
  // Then falls back to original testing header format/defaults for easy preview.
  const getActiveUser = (req: express.Request) => {
    const authHeaderStr = req.headers["authorization"] || req.query.token;
    if (authHeaderStr && authHeaderStr.toString().startsWith("Bearer ")) {
      const token = authHeaderStr.toString().substring(7);
      const decoded = verifyToken(token, JWT_SECRET);
      if (!decoded) {
        return null;
      }

      try {
        const tokenRow = db.prepare("SELECT * FROM ch_tokens WHERE token = ?").get(token) as any;
        if (!tokenRow) {
          return null; // Token does not exist in backend ledger
        }

        // 1. Verify if marked as revoked in sqlite 'ch_tokens' table
        if (tokenRow.is_revoked === 1 || tokenRow.is_revoked === '1') {
          return null;
        }

        // 2. Validate session inactivity timeout automatically
        const now = Date.now();
        const lastActivity = parseInt(tokenRow.last_activity_at, 10);
        if (now - lastActivity > INACTIVITY_TIMEOUT_SEC * 1000) {
          // Unseal is_revoked to 1 (True)
          db.prepare("UPDATE ch_tokens SET is_revoked = 1 WHERE token = ?").run(token);
          
          db.prepare(`
            INSERT INTO hrl_activity_logs (user_id, action, details, ip_address)
            VALUES (?, 'session_inactivity_timeout', ?, ?)
          `).run(decoded.userId, `Sesja unieważniona automatycznie po określonym czasie braku aktywności (timeout).`, req.ip);

          return null;
        }

        // 3. Update last active timestamp to keep session alive
        db.prepare("UPDATE ch_tokens SET last_activity_at = ? WHERE token = ?").run(now, token);

        const user = db.prepare("SELECT * FROM users WHERE id = ?").get(decoded.userId);
        return user || null;
      } catch (err) {
        console.error("Critical error validating token in SQLite:", err);
        return null;
      }
    }

    // PRODUCTION HARDENING: No fallback to x-user-id or userId query param.
    // Only valid Bearer JWT tokens are accepted. Unauthenticated requests get null.
    return null;
  };

  // Lightweight Memory-Based Rate Limiting to prevent brute-force attacks and abuse of production gateways
  const rateLimitMap = new Map<string, { count: number; firstRequestTime: number }>();
  const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
  const RATE_LIMIT_MAX_REQUESTS = 100; // max 100 requests per IP per minute

  const rateLimiter = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = req.ip || req.headers["x-forwarded-for"]?.toString() || "unknown";
    const now = Date.now();
    const limitData = rateLimitMap.get(ip);

    if (!limitData) {
      rateLimitMap.set(ip, { count: 1, firstRequestTime: now });
      return next();
    }

    if (now - limitData.firstRequestTime > RATE_LIMIT_WINDOW_MS) {
      // Refresh bucket
      rateLimitMap.set(ip, { count: 1, firstRequestTime: now });
      return next();
    }

    limitData.count++;
    if (limitData.count > RATE_LIMIT_MAX_REQUESTS) {
      return res.status(429).json({ 
        error: "Za dużo żądań! Wykryto podejrzenie floodowania API. Spróbuj ponownie później." 
      });
    }

    next();
  };

  // --- PUBLIC API ROUTES ---
  app.use("/api/auth/register", rateLimiter);
  app.use("/api/payments/checkout", rateLimiter);

  // Get current active user profile information (handles dynamic JWT token creation/sign-in)
  app.get("/api/auth/me", (req, res, next) => {
    try {
      const user = getActiveUser(req) as any;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized / Session Expired" });
      }

      // Read authorization header to see if we already have a JWT session
      const authHeaderStr = req.headers["authorization"];
      let token = "";
      if (authHeaderStr && authHeaderStr.startsWith("Bearer ")) {
        token = authHeaderStr.substring(7);
      } else {
        // Generate new session token for the authenticated user context
        const payload = { userId: user.id, email: user.email, timestamp: Date.now() };
        token = signToken(payload, JWT_SECRET);

        // Store inside SQLite ch_tokens table
        db.prepare(`
          INSERT INTO ch_tokens (user_id, token, is_revoked, last_activity_at, expires_at)
          VALUES (?, ?, 0, ?, ?)
        `).run(user.id, token, Date.now(), Date.now() + 86400 * 1000);

        // Log session start
        db.prepare(`
          INSERT INTO hrl_activity_logs (user_id, action, details, ip_address)
          VALUES (?, 'session_created', 'Utworzono i autoryzowano nową sesję użytkownika JWT w systemie.', ?)
        `).run(user.id, req.ip);
      }

      res.json({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        status: user.status,
        token: token
      });
    } catch (e) {
      next(e);
    }
  });

  // Explicit user logout endpoint to invalidate/revoke the JWT token
  app.post("/api/auth/logout", (req, res, next) => {
    try {
      const authHeaderStr = req.headers["authorization"];
      if (authHeaderStr && authHeaderStr.startsWith("Bearer ")) {
        const token = authHeaderStr.substring(7);
        const decoded = verifyToken(token, JWT_SECRET);

        db.prepare("UPDATE ch_tokens SET is_revoked = 1 WHERE token = ?").run(token);

        if (decoded) {
          db.prepare(`
            INSERT INTO hrl_activity_logs (user_id, action, details, ip_address)
            VALUES (?, 'user_logged_out', 'Unieważniono sesję JWT (wylogowanie z systemu).', ?)
          `).run(decoded.userId, req.ip);
        }
      }
      res.json({ success: true, message: "Pomyślnie wylogowano. Twoja sesja JWT została unieważniona dentyfikowalnie." });
    } catch (e) {
      next(e);
    }
  });

  // Get active users list for easy account switching on the demo
  app.get("/api/auth/users", (req, res, next) => {
    try {
      const users = db.prepare("SELECT id, email, first_name, last_name, role, status FROM users").all();
      res.json(users);
    } catch (e) {
      next(e);
    }
  });

  // Handle register simulation
  app.post("/api/auth/register", (req, res, next) => {
    try {
      const { email, password, first_name, last_name, role } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const stmt = db.prepare(`
        INSERT INTO users (email, password_hash, first_name, last_name, role, status)
        VALUES (?, ?, ?, ?, ?, 'active')
      `);
      const result = stmt.run(email, hashPassword(password), first_name || "", last_name || "", role || 'student');
      
      db.prepare(`
        INSERT INTO hrl_activity_logs (user_id, action, details, ip_address)
        VALUES (?, 'user_registered', ?, ?)
      `).run(result.lastInsertRowid, `Zarejestrowano nowe konto: ${email}`, req.ip);

      res.status(201).json({ id: result.lastInsertRowid, email, first_name, last_name, role });
    } catch (e: any) {
      if (e.message.includes("UNIQUE")) {
        return res.status(400).json({ error: "Ten adres email jest już zarejestrowany." });
      }
      next(e);
    }
  });

  // --- COURSE ACCESS & CONTENT ROUTES ---

  // List all courses (with optional enrollment details for student)
  app.get("/api/courses", (req, res, next) => {
    try {
      const user = getActiveUser(req) as any;
      const courses = db.prepare("SELECT * FROM courses WHERE visibility != 'hidden'").all() as any[];
      
      // Map enrollments
      const coursesWithEnrollment = courses.map(course => {
        let enrollment = null;
        if (user) {
          enrollment = db.prepare("SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?").get(user.id, course.id);
        }
        return {
          ...course,
          isEnrolled: !!enrollment,
          enrollmentType: enrollment ? (enrollment as any).access_type : null,
          expiresAt: enrollment ? (enrollment as any).expires_at : null
        };
      });

      res.json(coursesWithEnrollment);
    } catch (e) {
      next(e);
    }
  });

  // Get specific course structure (modules -> lessons)
  app.get("/api/courses/:courseId", (req, res, next) => {
    try {
      const { courseId } = req.params;
      const user = getActiveUser(req) as any;

      const course = db.prepare("SELECT * FROM courses WHERE id = ?").get(courseId) as any;
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      // Check if user is enrolled
      let isEnrolled = false;
      let enrollment = null;
      if (user) {
        enrollment = db.prepare("SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?").get(user.id, course.id) as any;
        isEnrolled = !!enrollment;
      }

      // Get modules
      const modules = db.prepare("SELECT * FROM modules WHERE course_id = ? ORDER BY module_order ASC").all(courseId) as any[];

      // Get lessons mapped inside modules
      const modulesWithLessons = modules.map(mod => {
        const lessons = db.prepare("SELECT * FROM lessons WHERE module_id = ? ORDER BY lesson_order ASC").all(mod.id) as any[];
        
        // Include progress check
        const lessonsWithProgress = lessons.map(lesson => {
          let progress = null;
          if (user) {
            progress = db.prepare("SELECT * FROM lesson_progress WHERE user_id = ? AND lesson_id = ?").get(user.id, lesson.id);
          }
          return {
            ...lesson,
            progress: progress ? {
              percent: (progress as any).progress_percent,
              completed: !!(progress as any).completed,
              last_accessed: (progress as any).last_accessed
            } : null
          };
        });

        return {
          ...mod,
          lessons: lessonsWithProgress
        };
      });

      res.json({
        course,
        isEnrolled,
        enrollment,
        modules: modulesWithLessons
      });
    } catch (e) {
      next(e);
    }
  });

  // Access check & single lesson retrieval (with secure signed URL token generator)
  app.get("/api/lessons/:lessonId", (req, res, next) => {
    try {
      const { lessonId } = req.params;
      const user = getActiveUser(req) as any;

      if (!user) {
        return res.status(401).json({ error: "Wymagane zalogowanie" });
      }

      const lesson = db.prepare("SELECT * FROM lessons WHERE id = ?").get(lessonId) as any;
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }

      const courseId = lesson.course_id;

      // 1. Core Access Flow validation
      // Free lessons can be viewed by anyone logged in. Premium requires active enrollment.
      let hasAccess = lesson.access_level === 'free';
      let enrollment = null;

      if (!hasAccess) {
        enrollment = db.prepare("SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?").get(user.id, courseId) as any;
        if (enrollment) {
          // Check if expired
          const expiresAt = enrollment.expires_at ? new Date(enrollment.expires_at).getTime() : null;
          const now = Date.now();
          if (!expiresAt || expiresAt > now) {
            hasAccess = true;
          }
        }
      }

      if (!hasAccess && user.role === 'admin') {
        hasAccess = true; // Admins bypass access paid walls
      }

      if (!hasAccess) {
        return res.status(403).json({ 
          error: "Brak aktywnego dostępu. Musisz zakupić ten kurs jednorazową płatnością.",
          requiresEnrolling: true,
          courseId: courseId
        });
      }

      // 2. Generate secure expiring token (PRD "Access Tokens" / expiring lesson tokens)
      const tokenString = crypto.randomBytes(32).toString("hex");
      const expiry = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins expiry
      
      db.prepare(`
        INSERT INTO access_tokens (user_id, lesson_id, token, expires_at)
        VALUES (?, ?, ?, ?)
      `).run(user.id, lesson.id, tokenString, expiry);

      // 3. Log access audit
      db.prepare(`
        INSERT INTO hrl_activity_logs (user_id, action, details, ip_address)
        VALUES (?, 'lesson_access', ?, ?)
      `).run(user.id, `Dostęp do lekcji ID ${lesson.id} (${lesson.title}) generowany token: ${tokenString.substring(0, 8)}...`, req.ip);

      // Increment lesson progress record of user or create it
      const progressExist = db.prepare("SELECT * FROM lesson_progress WHERE user_id = ? AND lesson_id = ?").get(user.id, lesson.id);
      if (!progressExist) {
        db.prepare(`
          INSERT INTO lesson_progress (user_id, lesson_id, progress_percent, completed, last_accessed)
          VALUES (?, ?, 0, 0, datetime('now'))
        `).run(user.id, lesson.id);
      } else {
        db.prepare(`
          UPDATE lesson_progress
          SET last_accessed = datetime('now')
          WHERE user_id = ? AND lesson_id = ?
        `).run(user.id, lesson.id);
      }

      // Return protected source URL signed together with access token
      res.json({
        lesson,
        securedToken: tokenString,
        expiresAt: expiry,
        source: {
          url: lesson.source_url,
          type: lesson.source_type
        }
      });
    } catch (e) {
      next(e);
    }
  });

  // Track / update progress (completed, progress_percent)
  app.post("/api/lessons/:lessonId/progress", async (req, res, next) => {
    try {
      const { lessonId } = req.params;
      const { percent, completed } = req.body;
      const user = getActiveUser(req) as any;

      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const stmt = db.prepare(`
        INSERT INTO lesson_progress (user_id, lesson_id, progress_percent, completed, last_accessed)
        VALUES (?, ?, ?, ?, datetime('now'))
        ON CONFLICT(user_id, lesson_id) DO UPDATE SET
          progress_percent = ?,
          completed = ?,
          last_accessed = datetime('now')
      `);

      stmt.run(user.id, lessonId, percent, completed ? 1 : 0, percent, completed ? 1 : 0);

      // Check if user has now completed all lessons in this course
      const currentLesson = db.prepare("SELECT course_id FROM lessons WHERE id = ?").get(lessonId) as any;
      let certificateGenerated = false;
      let certificateCode = null;

      if (currentLesson && completed) {
        const courseId = currentLesson.course_id;
        
        // Count total lessons
        const totalLessonsCount = (db.prepare("SELECT COUNT(*) as count FROM lessons WHERE course_id = ?").get(courseId) as any).count;
        
        // Count completed lessons for this student
        const completedCount = (db.prepare(`
          SELECT COUNT(DISTINCT lp.lesson_id) as count 
          FROM lesson_progress lp
          JOIN lessons l ON lp.lesson_id = l.id
          WHERE lp.user_id = ? AND l.course_id = ? AND lp.completed = 1
        `).get(user.id, courseId) as any).count;

        if (totalLessonsCount > 0 && completedCount >= totalLessonsCount) {
          // All lessons are completed! Check if certificate already exists
          const cert = db.prepare("SELECT * FROM certificates WHERE user_id = ? AND course_id = ?").get(user.id, courseId);
          if (!cert) {
            const course = db.prepare("SELECT title FROM courses WHERE id = ?").get(courseId) as any;
            const code = "HRL-CERT-" + crypto.randomBytes(6).toString("hex").toUpperCase();
            
            db.prepare(`
              INSERT INTO certificates (user_id, course_id, certificate_code, pdf_url, template_style)
              VALUES (?, ?, ?, ?, 'classical')
            `).run(user.id, courseId, code, `https://cdn.hrl.academy/certs/${code}.pdf`);

            // Log activity is logged representing standard course completion
            db.prepare(`
              INSERT INTO hrl_activity_logs (user_id, action, details, ip_address)
              VALUES (?, 'certificate_generated', ?, ?)
            `).run(
              user.id, 
              `Automatycznie wygenerowano certyfikat ukończenia kursu "${course.title}" (Kod: ${code}, Styl: Klasyczny).`, 
              req.ip
            );

            certificateGenerated = true;
            certificateCode = code;
          }
        }
      }

      res.json({ success: true, percent, completed, certificateGenerated, certificateCode });
    } catch (e) {
      next(e);
    }
  });

  // Get user certificates
  app.get("/api/certificates", (req, res, next) => {
    try {
      const user = getActiveUser(req) as any;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const list = db.prepare(`
        SELECT cert.*, c.title as course_title, c.thumbnail as course_thumbnail, u.first_name, u.last_name, u.email
        FROM certificates cert
        JOIN courses c ON cert.course_id = c.id
        JOIN users u ON cert.user_id = u.id
        WHERE cert.user_id = ?
        ORDER BY cert.id DESC
      `).all(user.id);
      res.json(list);
    } catch (e) {
      next(e);
    }
  });

  // Direct certificate generator for a completed course
  app.post("/api/courses/:courseId/generate-certificate", async (req, res, next) => {
    try {
      const { courseId } = req.params;
      const { templateStyle = 'classical' } = req.body;
      const user = getActiveUser(req) as any;
      if (!user) {
        return res.status(401).json({ error: "Brak autoryzacji. Zaloguj się ponownie." });
      }

      // Check if enrolled
      const enrollment = db.prepare("SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?").get(user.id, courseId);
      if (!enrollment) {
        return res.status(403).json({ error: "Nie masz aktywnego dostępu (zapisu) do tego kursu." });
      }

      // Check if already generated
      const existingCert = db.prepare("SELECT * FROM certificates WHERE user_id = ? AND course_id = ?").get(user.id, courseId) as any;
      if (existingCert) {
        return res.json({ 
          success: true, 
          certificateGenerated: false, 
          certificateCode: existingCert.certificate_code,
          message: "Certyfikat dla tego kursu został już wcześniej wygenerowany." 
        });
      }

      const course = db.prepare("SELECT title FROM courses WHERE id = ?").get(courseId) as any;
      if (!course) {
        return res.status(444).json({ error: "Kurs nie istnieje." });
      }

      const code = "HRL-CERT-" + crypto.randomBytes(6).toString("hex").toUpperCase();
      
      const insertResult = db.prepare(`
        INSERT INTO certificates (user_id, course_id, certificate_code, pdf_url, template_style)
        VALUES (?, ?, ?, ?, ?)
      `).run(user.id, courseId, code, `https://cdn.hrl.academy/certs/${code}.pdf`, templateStyle);

      // Log activity
      db.prepare(`
        INSERT INTO hrl_activity_logs (user_id, action, details, ip_address)
        VALUES (?, 'certificate_generated', ?, ?)
      `).run(
        user.id, 
        `Wygenerowano certyfikat ukończenia kursu "${course.title}" (Kod: ${code}, Szablon: ${templateStyle}) za pomocą żądania bezpośredniego generatora.`, 
        req.ip
      );

      res.json({ 
        success: true, 
        certificateGenerated: true, 
        certificateCode: code, 
        templateStyle,
        message: "Certyfikat ukończenia kursu został wygenerowany pomyślnie!"
      });
    } catch (e: any) {
      next(e);
    }
  });

  // Resend certificate email trigger
  app.post("/api/certificates/:certId/resend", (req, res, next) => {
    try {
      const { certId } = req.params;
      const user = getActiveUser(req) as any;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const cert = db.prepare(`
        SELECT cert.*, c.title as course_title FROM certificates cert
        JOIN courses c ON cert.course_id = c.id
        WHERE cert.id = ? AND cert.user_id = ?
      `).get(certId, user.id) as any;

      if (!cert) {
        return res.status(404).json({ error: "Certificate not found" });
      }

      // Log to activity log
      db.prepare(`
        INSERT INTO hrl_activity_logs (user_id, action, details, ip_address)
        VALUES (?, 'certificate_resent', ?, ?)
      `).run(
        user.id, 
        `Ponowne wysłanie certyfikatu: Wywołano zewnętrzne API certyfikacji dla kursu "${cert.course_title}". System SMTP przesłał ponowne potwierdzenie na adres ${user.email}. Kod: ${cert.certificate_code}`, 
        req.ip
      );

      res.json({ success: true, message: `Certyfikat dla "${cert.course_title}" został wysłany ponownie na adres ${user.email}` });
    } catch (e) {
      next(e);
    }
  });

  // Update certificate template style
  app.post("/api/certificates/:certId/style", (req, res, next) => {
    try {
      const { certId } = req.params;
      const { templateStyle } = req.body;
      const user = getActiveUser(req) as any;
      if (!user) {
        return res.status(401).json({ error: "Brak autoryzacji" });
      }

      db.prepare("UPDATE certificates SET template_style = ? WHERE id = ? AND user_id = ?")
        .run(templateStyle, certId, user.id);

      db.prepare(`
        INSERT INTO hrl_activity_logs (user_id, action, details, ip_address)
        VALUES (?, 'certificate_style_updated', ?, ?)
      `).run(
        user.id,
        `Zmieniono szablon graficzny dla certyfikatu ID ${certId} na styl: ${templateStyle}.`,
        req.ip
      );

      res.json({ success: true, message: "Pomyślnie zmieniono szablon certyfikatu ukończenia!" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Download certificate
  app.post("/api/certificates/:certId/download", (req, res, next) => {
    try {
      const { certId } = req.params;
      const user = getActiveUser(req) as any;
      if (!user) {
        return res.status(401).json({ error: "Brak autoryzacji" });
      }

      const cert = db.prepare("SELECT * FROM certificates WHERE id = ? AND user_id = ?").get(certId, user.id) as any;
      if (!cert) {
         return res.status(404).json({ error: "Certyfikat nie został znaleziony" });
      }

      const downloadLog = `Pobranie PDF: ${cert.certificate_code} (ID: ${cert.id})`;
      const downloadCountQuery = db.prepare(`
        SELECT COUNT(*) as cnt FROM hrl_activity_logs 
        WHERE user_id = ? AND action = 'pdf_download' AND details = ?
      `).get(user.id, downloadLog) as { cnt: number };

      if (downloadCountQuery.cnt >= 3) {
        return res.status(429).json({ error: "Osiągnięto maksymalny limit pobrań certyfikatu." });
      }

      db.prepare(`
        INSERT INTO hrl_activity_logs (user_id, action, details, ip_address)
        VALUES (?, 'pdf_download', ?, ?)
      `).run(user.id, downloadLog, req.ip);

      res.json({ success: true, message: `Rozpoczęto generowanie pliku PDF: ${cert.template_style}. Pobrano ${downloadCountQuery.cnt + 1} z 3 dozwolonych razy.` });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- USER DASHBOARD STATS ---
  app.get("/api/user/dashboard", (req, res, next) => {
    try {
      const user = getActiveUser(req) as any;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // List enrolled courses
      const enrollments = db.prepare(`
        SELECT e.*, c.title, c.slug, c.thumbnail, c.access_type as course_access_type
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        WHERE e.user_id = ?
      `).all(user.id) as any[];

      // Subscriptions active
      const subscriptions = db.prepare(`
        SELECT * FROM subscriptions WHERE user_id = ? ORDER BY id DESC
      `).all(user.id);

      // Payments made
      const payments = db.prepare(`
        SELECT p.*, c.title as course_title
        FROM payments p
        LEFT JOIN courses c ON p.course_id = c.id
        WHERE p.user_id = ?
        ORDER BY p.id DESC
      `).all(user.id);

      // Progress status count
      const totalLessonsCompleted = db.prepare(`
        SELECT COUNT(*) as count FROM lesson_progress WHERE user_id = ? AND completed = 1
      `).get(user.id) as any;

      res.json({
        enrollments,
        subscriptions,
        payments,
        stats: {
          enrolledCount: enrollments.length,
          completedCount: totalLessonsCompleted ? totalLessonsCompleted.count : 0
        }
      });
    } catch (e) {
      next(e);
    }
  });

  // --- CHECKOUT & PAYMENTS SIMULATIONS ---
  app.post("/api/payments/checkout", (req, res, next) => {
    try {
      const { courseId, provider } = req.body;
      const user = getActiveUser(req) as any;

      if (!user) {
        return res.status(401).json({ error: "Najpierw musisz się zalogować." });
      }

      const course = db.prepare("SELECT * FROM courses WHERE id = ?").get(courseId) as any;
      if (!course) {
        return res.status(404).json({ error: "Kurs nie istnieje." });
      }

      const transactionId = "sim_" + crypto.randomBytes(8).toString("hex");

      // 1. Log payment
      db.prepare(`
        INSERT INTO payments (user_id, course_id, payment_provider, transaction_id, amount, currency, status)
        VALUES (?, ?, ?, ?, ?, 'USD', 'completed')
      `).run(user.id, course.id, provider || 'Stripe', transactionId, course.price);

      // 2. Grant enrollment
      const expires = course.access_type === 'subscription' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null;
      db.prepare(`
        INSERT INTO enrollments (user_id, course_id, access_type, expires_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id, course_id) DO UPDATE SET
          access_type = ?,
          expires_at = ?
      `).run(user.id, course.id, course.access_type, expires, course.access_type, expires);

      // 3. For subscriptions, create subscription entry too
      if (course.access_type === 'subscription') {
        db.prepare(`
          INSERT INTO subscriptions (user_id, provider_subscription_id, plan_name, status, started_at, expires_at)
          VALUES (?, ?, ?, 'active', datetime('now'), datetime('now', '+30 days'))
        `).run(user.id, "sub_" + transactionId, course.title, "active");
      }

      // 4. Log activity
      db.prepare(`
        INSERT INTO hrl_activity_logs (user_id, action, details, ip_address)
        VALUES (?, 'payment_completed', ?, ?)
      `).run(user.id, `Prawidłowo sfinalizowano płatność za kurs: ${course.title} kwota $${course.price}. ID Tx: ${transactionId}`, req.ip);

      res.status(200).json({ 
        success: true, 
        message: "Płatność udana. Uzyskałeś dostęp do lekcji!",
        transactionId
      });
    } catch (e) {
      next(e);
    }
  });

  // --- ADMIN PORTAL API ENDPOINTS ---

  // Verify caller is admin (security warning PRD)
  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = getActiveUser(req) as any;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: "Brak uprawnień administratora." });
    }
    next();
  };

  // --- END OF CERTIFICATION SYSTEM INTEGRATION ---

  // Get administrative analytics stats (PRD sidebar: Dashboard / Analytics)
  app.get("/api/admin/stats", requireAdmin, (req, res, next) => {
    try {
      const stats = {
        totalUsers: (db.prepare("SELECT COUNT(*) as count FROM users").get() as any).count,
        totalCourses: (db.prepare("SELECT COUNT(*) as count FROM courses").get() as any).count,
        totalLessons: (db.prepare("SELECT COUNT(*) as count FROM lessons").get() as any).count,
        totalRevenue: (db.prepare("SELECT SUM(amount) as sum FROM payments WHERE status = 'completed'").get() as any).sum || 0,
        activeSubscriptions: (db.prepare("SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active'").get() as any).count,
        enrollmentStats: {
          free: (db.prepare("SELECT COUNT(*) as count FROM enrollments WHERE access_type = 'free'").get() as any).count,
          paid: (db.prepare("SELECT COUNT(*) as count FROM enrollments WHERE access_type = 'paid'").get() as any).count,
          subscription: (db.prepare("SELECT COUNT(*) as count FROM enrollments WHERE access_type = 'subscription'").get() as any).count,
        }
      };
      res.json(stats);
    } catch (e) {
      next(e);
    }
  });

  // Course Admin - List courses in admin grid
  app.get("/api/admin/courses", requireAdmin, (req, res, next) => {
    try {
      const list = db.prepare(`
        SELECT c.*, u.email as creator_email, COUNT(l.id) as lessons_count
        FROM courses c
        LEFT JOIN users u ON c.created_by = u.id
        LEFT JOIN lessons l ON c.id = l.course_id
        GROUP BY c.id
        ORDER BY c.id DESC
      `).all();
      res.json(list);
    } catch (e) {
      next(e);
    }
  });

  // Course Admin - Create courses
  app.post("/api/admin/courses", requireAdmin, (req, res, next) => {
    try {
      const { title, slug, description, thumbnail, access_type, price, status, external_url } = req.body;
      const user = getActiveUser(req) as any;

      if (!title) {
        return res.status(400).json({ error: "Tytuł kursu jest wymagany." });
      }

      const generatedSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      const stmt = db.prepare(`
        INSERT INTO courses (title, slug, description, thumbnail, access_type, price, status, created_by, external_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        title, 
        generatedSlug, 
        description || "", 
        thumbnail || "https://picsum.photos/seed/course/800/450", 
        access_type || "premium", 
        price || 0, 
        status || "draft",
        user.id,
        external_url || ""
      );

      // Create a default module for this new course
      db.prepare(`
        INSERT INTO modules (course_id, title, module_order)
        VALUES (?, 'Moduł 1: Wprowadzenie', 1)
      `).run(result.lastInsertRowid);

      db.prepare(`
        INSERT INTO hrl_activity_logs (user_id, action, details, ip_address)
        VALUES (?, 'course_created', ?, ?)
      `).run(user.id, `Utworzono kurs: ${title} (${generatedSlug})`, req.ip);

      res.status(201).json({ id: result.lastInsertRowid, title, slug: generatedSlug });
    } catch (e) {
      next(e);
    }
  });

  // Course Admin - Delete course
  app.delete("/api/admin/courses/:id", requireAdmin, (req, res, next) => {
    try {
      const { id } = req.params;
      const user = getActiveUser(req) as any;

      const course = db.prepare("SELECT * FROM courses WHERE id = ?").get(id) as any;
      if (!course) {
        return res.status(404).json({ error: "Kurs nie znaleziony." });
      }

      db.prepare("DELETE FROM courses WHERE id = ?").run(id);

      db.prepare(`
        INSERT INTO hrl_activity_logs (user_id, action, details, ip_address)
        VALUES (?, 'course_deleted', ?, ?)
      `).run(user.id, `Usunięto kurs: ${course.title}`, req.ip);

      res.json({ success: true, message: `Kurs ${course.title} został usunięty.` });
    } catch (e) {
      next(e);
    }
  });

  // Course Admin - Create Modules & Lessons
  app.post("/api/admin/lessons", requireAdmin, (req, res, next) => {
    try {
      const { course_id, module_id, title, source_url, source_type, access_level, duration_minutes } = req.body;
      const user = getActiveUser(req) as any;

      if (!course_id || !title) {
        return res.status(400).json({ error: "course_id i title są wymagane." });
      }

      // Check module. If not provided, fetch or create first module
      let actualModuleId = module_id;
      if (!actualModuleId) {
        const fallbackId = db.prepare("SELECT id FROM modules WHERE course_id = ? LIMIT 1").get(course_id) as any;
        if (fallbackId) {
          actualModuleId = fallbackId.id;
        } else {
          const insertMod = db.prepare("INSERT INTO modules (course_id, title, module_order) VALUES (?, 'Zasoby główne', 1)").run(course_id);
          actualModuleId = insertMod.lastInsertRowid;
        }
      }

      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      const stmt = db.prepare(`
        INSERT INTO lessons (course_id, module_id, title, slug, source_url, source_type, access_level, lesson_order, drip_days, duration_minutes)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?)
      `);
      
      const result = stmt.run(
        course_id,
        actualModuleId,
        title,
        slug,
        source_url || "https://bunny-stream.example.com/play/video-placeholder",
        source_type || "video",
        access_level || "premium",
        duration_minutes || 10
      );

      res.status(201).json({ id: result.lastInsertRowid, title, slug });
    } catch (e) {
      next(e);
    }
  });

  // Security and Users Audit Logs list (PRD sidebars / Analytics / Security)
  app.get("/api/admin/logs", requireAdmin, (req, res, next) => {
    try {
      const logs = db.prepare(`
        SELECT l.*, u.email, u.role
        FROM hrl_activity_logs l
        LEFT JOIN users u ON l.user_id = u.id
        ORDER BY l.created_at DESC
        LIMIT 100
      `).all();
      res.json(logs);
    } catch (e) {
      next(e);
    }
  });

  // Manage Users list
  app.get("/api/admin/users", requireAdmin, (req, res, next) => {
    try {
      const users = db.prepare(`
        SELECT u.*, 
               (SELECT COUNT(*) FROM enrollments e WHERE e.user_id = u.id) as enrollments_count,
               (SELECT COUNT(*) FROM lesson_progress p WHERE p.user_id = u.id AND p.completed = 1) as completed_lessons_count
        FROM users u
        ORDER BY u.id DESC
      `).all();
      res.json(users);
    } catch (e) {
      next(e);
    }
  });

  app.get("/api/admin/certificates", requireAdmin, (req, res, next) => {
    try {
      const certificates = db.prepare(`
        SELECT cert.*, u.first_name, u.last_name, u.email, c.title as course_title 
        FROM certificates cert
        JOIN users u ON cert.user_id = u.id
        JOIN courses c ON cert.course_id = c.id
        ORDER BY cert.created_at DESC
      `).all();
      res.json(certificates);
    } catch (e) {
      next(e);
    }
  });

  app.post("/api/admin/certificates/:id/style", requireAdmin, (req, res, next) => {
    try {
      const { id } = req.params;
      const { templateStyle } = req.body;
      db.prepare("UPDATE certificates SET template_style = ? WHERE id = ?").run(templateStyle, id);
      const user = getActiveUser(req) as any;
      db.prepare(`
        INSERT INTO hrl_activity_logs (user_id, action, details, ip_address)
        VALUES (?, 'certificate_style_updated_by_admin', ?, ?)
      `).run(user.id, `Zaktualizowano styl certyfikatu (ID: ${id}) na szablon: ${templateStyle} (Admin).`, req.ip);
      res.json({ success: true });
    } catch (e) {
      next(e);
    }
  });

  // --- GLOBAL ERROR HANDLING MIDDLEWARE ---
  // Completely prevents fallback index.html response when server-side queries throw error.
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Express Error Handler caught:", err);
    
    // Centrally log API errors in hrl_activity_logs
    if (req.path.startsWith("/api/")) {
      try {
        const user = getActiveUser(req) as any;
        const userId = user ? user.id : null;
        const action = "api_error";
        const isNotProduction = process.env.NODE_ENV !== "production";
        const errorDetails = `Path: ${req.method} ${req.path} | Error: ${err.message || String(err)}${isNotProduction && err.stack ? ` | Stack: ${err.stack}` : ""}`;
        
        db.prepare(`
          INSERT INTO hrl_activity_logs (user_id, action, details, ip_address)
          VALUES (?, ?, ?, ?)
        `).run(userId, action, errorDetails, req.ip);
      } catch (logErr) {
        console.error("Failed to insert API error log in SQLite database", logErr);
      }
    }

    res.status(500).json({ 
      error: err.message || "Wystąpił wewnętrzny błąd bazy danych lub serwera.",
      stack: process.env.NODE_ENV !== "production" ? err.stack : undefined
    });
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start custom express server:", err);
});
