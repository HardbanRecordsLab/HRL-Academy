import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  ShieldCheck, 
  Activity, 
  ExternalLink,
  PenTool,
  Key, 
  RefreshCw,
  LogOut,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  Trash2,
  Settings,
  X,
  CreditCard,
  Lock,
  Unlock,
  Download,
  PlayCircle,
  FileText,
  Layers,
  Video,
  Terminal,
  HelpCircle,
  Info,
  Eye,
  Percent,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  GripVertical,
  Award,
  Trophy,
  Sliders,
  Mail,
  Globe,
  Search,
  Sparkles,
  CheckSquare,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Course, Module, Lesson, Payment, Subscription, ActivityLog, Certificate, QuizQuestion, QuizAttempt } from './types';

// @ts-ignore
import logoUrl from './assets/images/hrl_academy_logo_1779373295965.png';
import { LandingPage } from './components/LandingPage';

// Configure standard API fetch routing and secure JWT injection for both local dev and split-tier hosting (Vercel + VPS)
const originalFetch = window.fetch.bind(window);

async function customFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const urlStr = typeof input === 'string' ? input : (input as any).url || input.toString();
  if (urlStr.startsWith('/api')) {
    const VITE_API_URL = (import.meta as any).env.VITE_API_URL || "";
    const targetUrl = VITE_API_URL ? `${VITE_API_URL.replace(/\/$/, '')}${urlStr}` : urlStr;
    
    const newInit = { ...(init || {}) };
    const headers = new Headers(newInit.headers || {});
    
    // Automatically inject secure JWT Bearer token if present
    const token = localStorage.getItem('hrl_jwt_token');
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    newInit.headers = headers;
    return originalFetch(targetUrl, newInit);
  }
  return originalFetch(input, init);
}

const fetch = customFetch;

export default function App() {
  // Global States
  const [showLanding, setShowLanding] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Secure Authentication states
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerFirstName, setRegisterFirstName] = useState('');
  const [registerLastName, setRegisterLastName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerRole, setRegisterRole] = useState<'student' | 'creator'>('student');
  const [authInFlight, setAuthInFlight] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  
  // Navigation Tabs
  const [activePortal, setActivePortal] = useState<'student' | 'creator' | 'admin'>('student');
  const [studentTab, setStudentTab] = useState<'my-courses' | 'downloads' | 'billing' | 'account' | 'faq'>('my-courses');
  const [adminTab, setAdminTab] = useState<'stats' | 'courses' | 'users' | 'certificates' | 'payments' | 'security' | 'settings'>('stats');
  const [creatorTab, setCreatorTab] = useState<'stats' | 'courses' | 'students' | 'certificates'>('stats');

  // Dynamic user profile states
  const [profileFirstName, setProfileFirstName] = useState('');
  const [profileLastName, setProfileLastName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileLogs, setProfileLogs] = useState<any[]>([]);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Creator workspace states
  const [creatorStats, setCreatorStats] = useState<any>(null);
  const [creatorCourses, setCreatorCourses] = useState<any[]>([]);
  const [creatorStudents, setCreatorStudents] = useState<any[]>([]);
  const [creatorCertificates, setCreatorCertificates] = useState<any[]>([]);
  const [creatorLoading, setCreatorLoading] = useState(false);

  // States for creator forms
  const [showCreatorAddCourse, setShowCreatorAddCourse] = useState(false);
  const [creatorNewCourseTitle, setCreatorNewCourseTitle] = useState('');
  const [creatorNewCourseSlug, setCreatorNewCourseSlug] = useState('');
  const [creatorNewCourseDesc, setCreatorNewCourseDesc] = useState('');
  const [creatorNewCourseThumbnail, setCreatorNewCourseThumbnail] = useState('');
  const [creatorNewCourseAccess, setCreatorNewCourseAccess] = useState<'free' | 'premium' | 'subscription'>('free');
  const [creatorNewCoursePrice, setCreatorNewCoursePrice] = useState(0);

  const [showCreatorAddLesson, setShowCreatorAddLesson] = useState(false);
  const [creatorSelectedCourseId, setCreatorSelectedCourseId] = useState<number | null>(null);
  const [creatorNewLessonTitle, setCreatorNewLessonTitle] = useState('');
  const [creatorNewLessonUrl, setCreatorNewLessonUrl] = useState('');
  const [creatorNewLessonType, setCreatorNewLessonType] = useState<'video' | 'pdf' | 'audio' | 'iframe' | 'external' | 'download'>('video');
  const [creatorNewLessonAccess, setCreatorNewLessonAccess] = useState<'free' | 'premium'>('free');
  const [creatorNewLessonDuration, setCreatorNewLessonDuration] = useState(10);

  // Toasts
  type ToastType = 'info' | 'success' | 'warning';
  interface ToastMsg {
    id: string;
    message: string;
    type: ToastType;
  }
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [warnedSubscriptions, setWarnedSubscriptions] = useState<Set<number>>(new Set());

  const addToast = (message: string, type: ToastType = 'info') => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  // Student Portal Logic
  const [studentCourses, setStudentCourses] = useState<Course[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseStructure, setCourseStructure] = useState<{ course: Course; isEnrolled: boolean; modules: Module[] } | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [showExternalCoursePreview, setShowExternalCoursePreview] = useState(false);
  const [lessonAccessDetails, setLessonAccessDetails] = useState<any>(null);
  const [signingToken, setSigningToken] = useState(false);

  // Student Portal Quiz States
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizPassingScore, setQuizPassingScore] = useState<number>(0);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizSubmitResult, setQuizSubmitResult] = useState<{ scorePercent: number, passed: boolean, correctCount: number, totalQuestions: number, results: any } | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);

  // Admin Quiz Editor State
  const [adminQuizCourse, setAdminQuizCourse] = useState<Course | null>(null);
  const [adminSelectedLesson, setAdminSelectedLesson] = useState<Lesson | null>(null);
  const [adminLessonQuizQuestions, setAdminLessonQuizQuestions] = useState<QuizQuestion[]>([]);
  const [adminLessonQuizPassingScore, setAdminLessonQuizPassingScore] = useState<number>(0);
  const [adminNewQuestionText, setAdminNewQuestionText] = useState('');
  const [adminNewQuestionOptions, setAdminNewQuestionOptions] = useState<string[]>(['', '', '', '']);
  const [adminNewQuestionCorrectIndex, setAdminNewQuestionCorrectIndex] = useState<number>(0);
  const [adminQuizLoading, setAdminQuizLoading] = useState(false);
  const [adminCourseStructure, setAdminCourseStructure] = useState<any>(null);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutCourse, setCheckoutCourse] = useState<Course | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [paying, setPaying] = useState(false);

  // Student Certificates
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [showCertificateCelebration, setShowCertificateCelebration] = useState(false);
  const [latestEarnedCertificateCode, setLatestEarnedCertificateCode] = useState<string | null>(null);
  const [celebrationCourseTitle, setCelebrationCourseTitle] = useState<string>('');
  const [resendingCertId, setResendingCertId] = useState<number | null>(null);
  const [resendSuccessMessage, setResendSuccessMessage] = useState<string | null>(null);

  // Student Dashboard Personalization (Drag and Drop / Layout customizer)
  const [isPersonalizing, setIsPersonalizing] = useState(false);
  const [layoutCols, setLayoutCols] = useState<'grid' | 'bento' | 'stack'>('grid');
  const [accentColor, setAccentColor] = useState<'slate' | 'emerald' | 'amber' | 'indigo'>('slate');
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
  const [widgets, setWidgets] = useState([
    { id: 'stats', label: 'Statystyki i Postępy', description: 'Blok z liczbą aktywnych kursów, ukończonych lekcji oraz statusem Premium.', visible: true },
    { id: 'courses', label: 'Programy Szkoleniowe (Kursy)', description: 'Siatka wszystkich Twoich kursów z wszystkimi lekcjami i odtwarzaczem.', visible: true },
    { id: 'certificates', label: 'Dokumenty Certyfikacji (Stripe)', description: 'Baza wygenerowanych certyfikatów ukończenia powiązanych z Stripe.', visible: true },
    { id: 'logs', label: 'Dziennik Autoryzacji Zero Trust', description: 'Audyt dostępu i tokenów bezpieczeństwa.', visible: true }
  ]);

  // Admin Portal Logic
  const [adminStats, setAdminStats] = useState<any>(null);
  const [adminCoursesList, setAdminCoursesList] = useState<any[]>([]);
  const [adminUsersList, setAdminUsersList] = useState<any[]>([]);
  const [adminLogsList, setAdminLogsList] = useState<ActivityLog[]>([]);
  const [adminCertificatesList, setAdminCertificatesList] = useState<any[]>([]);
  const [isAccessReportOpen, setIsAccessReportOpen] = useState(false);

  // Admin URL Importer & Access Control States
  const [adminImportUrl, setAdminImportUrl] = useState('');
  const [adminImportRawText, setAdminImportRawText] = useState('');
  const [adminImportLoading, setAdminImportLoading] = useState(false);
  const [adminImportPreview, setAdminImportPreview] = useState<any | null>(null);
  
  // States to edit/validate the imported course draft before finalized creation
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDesc, setDraftDesc] = useState('');
  const [draftPrice, setDraftPrice] = useState(99);
  const [draftAccessType, setDraftAccessType] = useState<'free' | 'premium' | 'subscription'>('premium');
  const [draftVisibility, setDraftVisibility] = useState<'public' | 'private'>('public');

  // Course access control states
  const [selectedCourseForEnrollments, setSelectedCourseForEnrollments] = useState<any | null>(null);
  const [courseEnrollmentsList, setCourseEnrollmentsList] = useState<any[]>([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const [manualEnrollEmail, setManualEnrollEmail] = useState('');
  const [manualEnrollAccessType, setManualEnrollAccessType] = useState('premium');

  // Inline edit state for existing courses
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [editCourseTitle, setEditCourseTitle] = useState('');
  const [editCourseDesc, setEditCourseDesc] = useState('');
  const [editCourseAccessType, setEditCourseAccessType] = useState<'free' | 'premium' | 'subscription'>('premium');
  const [editCourseVisibility, setEditCourseVisibility] = useState<'public' | 'private'>('public');
  const [editCoursePrice, setEditCoursePrice] = useState(0);

  // Internal Certificate Generator states
  const [selectedCertificateForPreview, setSelectedCertificateForPreview] = useState<Certificate | null>(null);
  const [previewSelectedStyle, setPreviewSelectedStyle] = useState<'classical' | 'modern' | 'minimalist' | 'tech_dark' | 'luxury_gold'>('classical');
  const [isSavingStyle, setIsSavingStyle] = useState(false);
  const [generationStyleOption, setGenerationStyleOption] = useState<'classical' | 'modern' | 'minimalist' | 'tech_dark' | 'luxury_gold'>('classical');
  
  // Add Course Modal Input
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseType, setNewCourseType] = useState<'free' | 'premium' | 'subscription'>('premium');
  const [newCoursePrice, setNewCoursePrice] = useState(199);
  const [newCourseDescription, setNewCourseDescription] = useState('');
  const [newCourseExternalUrl, setNewCourseExternalUrl] = useState('');

  // Add Lesson Modal Input
  const [newLessonCourseId, setNewLessonCourseId] = useState<number | ''>('');
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonSrc, setNewLessonSrc] = useState('https://bunny-stream.example.com/play/custom-video');
  const [newLessonType, setNewLessonType] = useState<any>('video');
  const [newLessonAccess, setNewLessonAccess] = useState<'free' | 'premium'>('premium');
  const [newLessonMinutes, setNewLessonMinutes] = useState(12);

  // Security Simulation State
  const [signedUrlCounter, setSignedUrlCounter] = useState(0);
  const [rateLimitingStatus, setRateLimitingStatus] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Dashboard Customization LocalStorage keys loaders
  useEffect(() => {
    const savedWidgets = localStorage.getItem('hrl_dashboard_widgets');
    if (savedWidgets) {
      try { setWidgets(JSON.parse(savedWidgets)); } catch(e){}
    }
    const savedCols = localStorage.getItem('hrl_dashboard_layout');
    if (savedCols) { setLayoutCols(savedCols as any); }
    const savedAccent = localStorage.getItem('hrl_dashboard_accent');
    if (savedAccent) { setAccentColor(savedAccent as any); }
  }, []);

  useEffect(() => {
    if (dashboardStats?.subscriptions) {
      const now = new Date().getTime();
      dashboardStats.subscriptions.forEach((sub: any) => {
        if (sub.status === 'active' && sub.expires_at) {
          const expiresAt = new Date(sub.expires_at).getTime();
          const daysLeft = (expiresAt - now) / (1000 * 3600 * 24);
          if (daysLeft > 0 && daysLeft <= 7) {
            if (!warnedSubscriptions.has(sub.id)) {
              addToast(`Subskrypcja na "${sub.plan_name}" wygasa za ${Math.ceil(daysLeft)} dni!`, 'warning');
              setWarnedSubscriptions(prev => new Set(prev).add(sub.id));
            }
          }
        }
      });
    }
  }, [dashboardStats, warnedSubscriptions]);

  // Drag and Drop Logic
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedWidgetId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedWidgetId === id) return;

    const draggedIdx = widgets.findIndex(w => w.id === draggedWidgetId);
    const targetIdx = widgets.findIndex(w => w.id === id);

    if (draggedIdx !== -1 && targetIdx !== -1) {
      const updated = [...widgets];
      const [draggedItem] = updated.splice(draggedIdx, 1);
      updated.splice(targetIdx, 0, draggedItem);
      setWidgets(updated);
      localStorage.setItem('hrl_dashboard_widgets', JSON.stringify(updated));
    }
  };

  const handleDragEnd = () => {
    setDraggedWidgetId(null);
  };

  const handleToggleWidgetVisibility = (id: string) => {
    const updated = widgets.map(w => w.id === id ? { ...w, visible: !w.visible } : w);
    setWidgets(updated);
    localStorage.setItem('hrl_dashboard_widgets', JSON.stringify(updated));
  };

  const handleResetWidgets = () => {
    const def = [
      { id: 'stats', label: 'Statystyki i Postępy', description: 'Blok z liczbą aktywnych kursów, ukończonych lekcji oraz statusem Premium.', visible: true },
      { id: 'courses', label: 'Programy Szkoleniowe (Kursy)', description: 'Siatka wszystkich Twoich kursów z wszystkimi lekcjami i odtwarzaczem.', visible: true },
      { id: 'certificates', label: 'Dokumenty Certyfikacji (Stripe)', description: 'Baza wygenerowanych certyfikatów ukończenia powiązanych z Stripe.', visible: true },
      { id: 'logs', label: 'Dziennik Autoryzacji Zero Trust', description: 'Audyt dostępu i tokenów bezpieczeństwa.', visible: true }
    ];
    setWidgets(def);
    setLayoutCols('grid');
    setAccentColor('slate');
    localStorage.removeItem('hrl_dashboard_widgets');
    localStorage.removeItem('hrl_dashboard_layout');
    localStorage.removeItem('hrl_dashboard_accent');
  };

  const handleResendCertificate = async (certId: number) => {
    setResendingCertId(certId);
    setResendSuccessMessage(null);
    try {
      const authHeader = { 'x-user-id': currentUser?.id.toString() || '2' };
      const res = await fetch(`/api/certificates/${certId}/resend`, {
        method: 'POST',
        headers: authHeader
      });
      if (res.ok) {
        const details = await res.json();
        setResendSuccessMessage(details.message);
        setTimeout(() => setResendSuccessMessage(null), 5000);
      } else {
        alert("Wysyłka nie powiodła się.");
      }
    } catch(e) {
      console.error(e);
    } finally {
      setResendingCertId(null);
    }
  };

  // Init Data Fetching
  useEffect(() => {
    fetchInitialAuth();
  }, []);

  useEffect(() => {
    if (currentUser) {
      setProfileFirstName(currentUser.first_name || '');
      setProfileLastName(currentUser.last_name || '');
      setProfileEmail(currentUser.email || '');
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchDashboardData();
    }
  }, [currentUser, activePortal, studentTab, adminTab, creatorTab]);

  const getAuthHeader = () => {
    const token = localStorage.getItem('hrl_jwt_token');
    const headers: Record<string, string> = {};
    if (currentUser) {
      headers['x-user-id'] = currentUser.id.toString();
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchInitialAuth = async () => {
    try {
      setErrorMessage(null);
      const token = localStorage.getItem('hrl_jwt_token');
      if (!token) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`
      };
      const res = await fetch("/api/auth/me", { headers });
      if (res.ok) {
        const me = await res.json();
        if (me.token) {
          localStorage.setItem('hrl_jwt_token', me.token);
        }
        setCurrentUser(me);
        if (me.role === 'admin') {
          setActivePortal('admin');
        } else {
          setActivePortal('student');
        }
      } else {
        localStorage.removeItem('hrl_jwt_token');
        setCurrentUser(null);
      }
    } catch (e: any) {
      console.error("Auth initialization failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setAuthError("Wpisz e-mail oraz hasło.");
      return;
    }
    setAuthInFlight(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("hrl_jwt_token", data.token);
        setCurrentUser(data);
        addToast(`Zalogowano pomyślnie jako ${data.first_name}!`, 'success');
        if (data.role === 'admin') {
          setActivePortal('admin');
        } else {
          setActivePortal('student');
        }
      } else {
        setAuthError(data.error || "Logowanie nie powiodło się.");
      }
    } catch (err: any) {
      console.error(err);
      setAuthError("Błąd serwera. Spróbuj ponownie później.");
    } finally {
      setAuthInFlight(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerEmail || !registerPassword || !registerFirstName || !registerLastName) {
      setAuthError("Wszystkie pola są wymagane.");
      return;
    }
    setAuthInFlight(true);
    setAuthError(null);
    setAuthSuccess(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registerEmail,
          password: registerPassword,
          first_name: registerFirstName,
          last_name: registerLastName,
          role: registerRole
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAuthSuccess("Konto zarejestrowane pomyślnie! Zaloguj się poniżej.");
        setAuthMode("login");
        setLoginEmail(registerEmail);
        setLoginPassword("");
        // Clear registration form
        setRegisterEmail("");
        setRegisterPassword("");
        setRegisterFirstName("");
        setRegisterLastName("");
      } else {
        setAuthError(data.error || "Rejestracja nie powiodła się.");
      }
    } catch (err: any) {
      console.error(err);
      setAuthError("Błąd serwera. Spróbuj ponownie później.");
    } finally {
      setAuthInFlight(false);
    }
  };

  const handleLogoutSubmit = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout endpoint cleanup warning:", e);
    }
    localStorage.removeItem("hrl_jwt_token");
    setCurrentUser(null);
    setSelectedCourse(null);
    setCourseStructure(null);
    setActiveLesson(null);
    addToast("Pomyślnie wylogowano z systemu.", 'info');
  };

  const fetchDashboardData = async () => {
    if (!currentUser) return;
    try {
      const authHeader = getAuthHeader();

      if (activePortal === 'student') {
        if (studentTab === 'my-courses') {
          const coursesRes = await fetch('/api/courses', { headers: authHeader });
          const coursesData = await coursesRes.json();
          setStudentCourses(coursesData);

          const dashboardRes = await fetch('/api/user/dashboard', { headers: authHeader });
          const dashStats = await dashboardRes.json();
          setDashboardStats(dashStats);

          const certsRes = await fetch('/api/certificates', { headers: authHeader });
          if (certsRes.ok) {
            setCertificates(await certsRes.json());
          }
        } else if (studentTab === 'billing' || studentTab === 'downloads') {
          const dashboardRes = await fetch('/api/user/dashboard', { headers: authHeader });
          const dashStats = await dashboardRes.json();
          setDashboardStats(dashStats);
        } else if (studentTab === 'account') {
          const logsRes = await fetch('/api/user/logs', { headers: authHeader });
          if (logsRes.ok) {
            setProfileLogs(await logsRes.json());
          }
        }
      } else if (activePortal === 'creator') {
        const creatorHeaders = getAuthHeader();
        setCreatorLoading(true);
        try {
          if (creatorTab === 'stats') {
            const statRes = await fetch('/api/creator/stats', { headers: creatorHeaders });
            setCreatorStats(await statRes.json());
          } else if (creatorTab === 'courses') {
            const courseRes = await fetch('/api/creator/courses', { headers: creatorHeaders });
            setCreatorCourses(await courseRes.json());
          } else if (creatorTab === 'students') {
            const studentRes = await fetch('/api/creator/students', { headers: creatorHeaders });
            setCreatorStudents(await studentRes.json());
          } else if (creatorTab === 'certificates') {
            const certRes = await fetch('/api/creator/certificates', { headers: creatorHeaders });
            setCreatorCertificates(await certRes.json());
          }
        } catch (e) {
          console.error("Failed to load creator portal data:", e);
        } finally {
          setCreatorLoading(false);
        }
      } else {
        // Admin Tab Data Fetches
        const adminHeaders = getAuthHeader();
        if (adminTab === 'stats') {
          const statRes = await fetch('/api/admin/stats', { headers: adminHeaders });
          setAdminStats(await statRes.json());
        } else if (adminTab === 'courses') {
          const courseListRes = await fetch('/api/courses', { headers: adminHeaders });
          setStudentCourses(await courseListRes.json());
          
          const adminCourseListRes = await fetch('/api/admin/courses', { headers: adminHeaders });
          setAdminCoursesList(await adminCourseListRes.json());
        } else if (adminTab === 'users') {
          const usersRes = await fetch('/api/admin/users', { headers: adminHeaders });
          setAdminUsersList(await usersRes.json());
        } else if (adminTab === 'certificates') {
          const certsRes = await fetch('/api/admin/certificates', { headers: adminHeaders });
          if (certsRes.ok) setAdminCertificatesList(await certsRes.json());
        } else if (adminTab === 'security' || adminTab === 'payments') {
          const logsRes = await fetch('/api/admin/logs', { headers: adminHeaders });
          setAdminLogsList(await logsRes.json());

          const statRes = await fetch('/api/admin/stats', { headers: adminHeaders });
          setAdminStats(await statRes.json());
        }
      }
    } catch (err) {
      console.error("Dashboard error:", err);
    }
  };


  const [generatingCert, setGeneratingCert] = useState<number | null>(null);

  const handleGenerateCertificate = async (courseId: number, templateStyle: string = 'classical') => {
    if (!currentUser) return;
    setGeneratingCert(courseId);
    try {
      const res = await fetch(`/api/courses/${courseId}/generate-certificate`, {
        method: 'POST',
        headers: {
          'x-user-id': currentUser.id.toString(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ templateStyle })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || "Certyfikat pomyślnie wygenerowany!");
        fetchDashboardData();
      } else {
        alert("Błąd: " + (data.error || "Nie udało się wygenerować certyfikatu."));
      }
    } catch (err: any) {
      alert("Error generating certificate: " + err.message);
    } finally {
      setGeneratingCert(null);
    }
  };

  const handleSaveCertificateStyle = async (certId: number, style: string) => {
    if (!currentUser) return;
    setIsSavingStyle(true);
    try {
      const res = await fetch(`/api/certificates/${certId}/style`, {
        method: 'POST',
        headers: {
          'x-user-id': currentUser.id.toString(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ templateStyle: style })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Refresh dashboard to display the updated style
        fetchDashboardData();
        if (selectedCertificateForPreview) {
          setSelectedCertificateForPreview(prev => prev ? { ...prev, template_style: style } : null);
        }
        alert("Pomyślnie zaktualizowano szablon certyfikatu!");
      } else {
        alert("Błąd: " + (data.error || "Nie udało się zapisać stylu."));
      }
    } catch (err: any) {
      alert("Error saving style: " + err.message);
    } finally {
      setIsSavingStyle(false);
    }
  };

  const handleDownloadCertificate = async (certId: number) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/certificates/${certId}/download`, {
        method: 'POST',
        headers: { 'x-user-id': currentUser.id.toString(), 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok) {
        alert(`${data.message}\nPlik pobrany pomyślnie.`);
        fetchDashboardData();
      } else {
        alert(data.error || "Wystąpił błąd komunikacji z serwerem.");
      }
    } catch (err) {
      console.error(err);
      alert('Wystąpił błąd komunikacji z serwerem.');
    }
  };

  // Student: Load detailed course hierarchy
  const handleOpenCourse = async (course: Course) => {
    setSelectedCourse(course);
    setActiveLesson(null);
    setShowExternalCoursePreview(false);
    setLessonAccessDetails(null);
    try {
      const authHeader = { 'x-user-id': currentUser?.id.toString() || '2' };
      const res = await fetch(`/api/courses/${course.id}`, { headers: authHeader });
      const struct = await res.json();
      setCourseStructure(struct);
    } catch (err) {
      console.error(err);
    }
  };

  // Student: Load premium content via sign-in JWT Access Token
  const handleOpenLesson = async (lesson: Lesson) => {
    setActiveLesson(lesson);
    setLessonAccessDetails(null);
    setSigningToken(true);
    setErrorMessage(null);

    // Reset student quiz answers and states
    setSelectedQuizAnswers({});
    setQuizSubmitted(false);
    setQuizSubmitResult(null);
    setQuizQuestions([]);
    setQuizPassingScore(0);
    setQuizAttempts([]);

    try {
      const authHeader = { 'x-user-id': currentUser?.id.toString() || '2' };
      const res = await fetch(`/api/lessons/${lesson.id}`, { headers: authHeader });
      const details = await res.json();
      
      if (res.ok) {
        setLessonAccessDetails(details);
        setSignedUrlCounter(prev => prev + 1);
      } else {
        setErrorMessage(details.error || "Nie udało się pobrać szczegółów lekcji.");
        if (details.requiresEnrolling) {
          // Open mock paywall modal trigger
          setCheckoutCourse(studentCourses.find(c => c.id === details.courseId) || null);
        }
      }

      // Fetch Quiz questions (if any exist)
      try {
        const quizRes = await fetch(`/api/lessons/${lesson.id}/quiz`, { headers: authHeader });
        if (quizRes.ok) {
          const quizData = await quizRes.json();
          setQuizQuestions(quizData.questions || []);
          setQuizPassingScore(quizData.passing_score || 0);
          setQuizAttempts(quizData.attempts || []);
        }
      } catch (err) {
        console.error("Błąd ładowania quizu lekcji:", err);
      }

    } catch (err: any) {
      setErrorMessage("Błąd weryfikacji tokena dostępu.");
    } finally {
      setSigningToken(false);
    }
  };

  const handleTriggerCheckout = (course: Course) => {
    setCheckoutCourse(course);
    setIsCheckoutOpen(true);
  };

  // ==========================================
  // QUIZ HANDLERS (STUDENT & ADMIN)
  // ==========================================

  // Student: Submit lesson quiz replies
  const handleQuizSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLesson || !currentUser) return;

    if (Object.keys(selectedQuizAnswers).length < quizQuestions.length) {
      alert("Proszę odpowiedzieć na wszystkie pytania przed zatwierdzeniem testu.");
      return;
    }

    setQuizLoading(true);
    try {
      const res = await fetch(`/api/lessons/${activeLesson.id}/quiz/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id.toString()
        },
        body: JSON.stringify({ answers: selectedQuizAnswers })
      });

      if (res.ok) {
        const resultData = await res.json();
        setQuizSubmitResult(resultData);
        setQuizSubmitted(true);

        // Reload attempts
        const quizRes = await fetch(`/api/lessons/${activeLesson.id}/quiz`, {
          headers: { 'x-user-id': currentUser.id.toString() }
        });
        if (quizRes.ok) {
          const quizData = await quizRes.json();
          setQuizAttempts(quizData.attempts || []);
        }

        // Reload course progress structures to align checkmarks
        if (selectedCourse) {
          const structRes = await fetch(`/api/courses/${selectedCourse.id}`, {
            headers: { 'x-user-id': currentUser.id.toString() }
          });
          if (structRes.ok) {
            const struct2 = await structRes.json();
            setCourseStructure(struct2);
          }
        }

        // Fetch refreshed stats metrics
        fetchDashboardData();

        if (resultData.passed) {
          alert(`Gratulacje! Zdałeś test wiedzy. Uzyskałeś: ${resultData.scorePercent}% (Próg: ${quizPassingScore}%). Lekcja kompletna!`);
        } else {
          alert(`Niestety, nie osiągnąłeś progu zaliczenia (${quizPassingScore}%). Twój wynik: ${resultData.scorePercent}%. Spróbuj jeszcze raz.`);
        }
      } else {
        const errVal = await res.json();
        alert(errVal.error || "Wystąpił błąd przy przetwarzaniu Twoich odpowiedzi.");
      }
    } catch (err) {
      console.error(err);
      alert("Komunikacja z serwerem przerwana przy wysyłce testu.");
    } finally {
      setQuizLoading(false);
    }
  };

  // Admin: Select course to customize its lessons and quizzes
  const handleAdminSelectCourseForQuiz = async (course: Course) => {
    setAdminQuizCourse(course);
    setAdminSelectedLesson(null);
    try {
      const res = await fetch(`/api/courses/${course.id}`, {
        headers: { 'x-user-id': currentUser?.id.toString() || '1' }
      });
      if (res.ok) {
        setAdminCourseStructure(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Admin: Load quiz data for the selected lesson
  const handleAdminLoadQuiz = async (lesson: Lesson) => {
    setAdminSelectedLesson(lesson);
    setAdminQuizLoading(true);
    setAdminNewQuestionText('');
    setAdminNewQuestionOptions(['', '', '', '']);
    setAdminNewQuestionCorrectIndex(0);
    try {
      const res = await fetch(`/api/lessons/${lesson.id}/quiz`, {
        headers: { 'x-user-id': currentUser?.id.toString() || '1' }
      });
      if (res.ok) {
        const quizInfo = await res.json();
        setAdminLessonQuizQuestions(quizInfo.questions || []);
        setAdminLessonQuizPassingScore(quizInfo.passing_score || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdminQuizLoading(false);
    }
  };

  // Admin: Update minimum passing score required to unlock
  const handleAdminSavePassingScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSelectedLesson) return;
    try {
      const res = await fetch(`/api/lessons/${adminSelectedLesson.id}/quiz/passing-score`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id.toString() || '1'
        },
        body: JSON.stringify({ passing_score: adminLessonQuizPassingScore })
      });
      if (res.ok) {
        alert("Zapisano pomyślnie! Nowy próg zaliczeniowy zaktualizowany w SQLite.");
        // Refresh the local struct if any
        if (selectedCourse?.id === adminSelectedLesson.course_id && currentUser) {
          const authHeader = { 'x-user-id': currentUser.id.toString() };
          const sRes = await fetch(`/api/courses/${selectedCourse.id}`, { headers: authHeader });
          if (sRes.ok) {
            setCourseStructure(await sRes.json());
          }
        }
        fetchDashboardData();
      } else {
        const errMessage = await res.json();
        alert(errMessage.error || "Błąd podczas zapisu..");
      }
    } catch (err) {
      console.error(err);
      alert("Błąd serwera przy zapisywaniu poziomu punktowego.");
    }
  };

  // Admin: Add a new multiple option question to SQLite
  const handleAdminAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSelectedLesson) return;

    const populatedOptions = adminNewQuestionOptions.map(o => o.trim()).filter(o => o !== '');
    if (populatedOptions.length < 2) {
      alert("Podaj co najmniej dwie widoczne, wartościowe odpowiedzi.");
      return;
    }

    if (adminNewQuestionCorrectIndex < 0 || adminNewQuestionCorrectIndex >= populatedOptions.length) {
      alert("Zaznaczona odpowiedź prawidłowa wykracza poza listę podanych opcji.");
      return;
    }

    try {
      const res = await fetch(`/api/lessons/${adminSelectedLesson.id}/quiz/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id.toString() || '1'
        },
        body: JSON.stringify({
          question_text: adminNewQuestionText,
          options: populatedOptions,
          correct_option_index: adminNewQuestionCorrectIndex
        })
      });

      if (res.ok) {
        setAdminNewQuestionText('');
        setAdminNewQuestionOptions(['', '', '', '']);
        setAdminNewQuestionCorrectIndex(0);
        // Refresh active list
        handleAdminLoadQuiz(adminSelectedLesson);
        alert("Pytanie quizowe dodane pomyślnie.");
      } else {
        const errorText = await res.json();
        alert(errorText.error || "Wystąpił błąd przy wstawianiu pytania.");
      }
    } catch (err) {
      console.error(err);
      alert("Błąd połączenia sieciowego.");
    }
  };

  // Admin: Delete a question
  const handleAdminDeleteQuestion = async (qId: number) => {
    if (!adminSelectedLesson) return;
    if (!confirm("Czy na pewno usunąć wybrane pytanie testowe z bazy danych?")) return;

    try {
      const res = await fetch(`/api/lessons/${adminSelectedLesson.id}/quiz/questions/${qId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': currentUser?.id.toString() || '1'
        }
      });
      if (res.ok) {
        handleAdminLoadQuiz(adminSelectedLesson);
        alert("Pytanie pomyślnie wymazane.");
      } else {
        const errResponse = await res.json();
        alert(errResponse.error || "Nie powiodło się usunięcie.");
      }
    } catch (err) {
      console.error(err);
      alert("Błąd sieci.");
    }
  };

  // Student: Simulate Checkout Gate (Stripe / LemonSqueezy payload generation)
  const handleCompleteCheckout = async (provider: 'Stripe' | 'LemonSqueezy') => {
    if (!checkoutCourse || !currentUser) return;
    setPaying(true);
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id.toString()
        },
        body: JSON.stringify({
          courseId: checkoutCourse.id,
          provider
        })
      });
      const data = await res.json();
      if (res.ok) {
        setIsCheckoutOpen(false);
        setCheckoutCourse(null);
        // Refresh Current Course details
        const detailsRes = await fetch(`/api/courses/${selectedCourse?.id || checkoutCourse.id}`, {
          headers: { 'x-user-id': currentUser.id.toString() }
        });
        const struct = await detailsRes.json();
        setCourseStructure(struct);
        
        // Refresh general list
        fetchDashboardData();
        alert("Płatność pomyślna za pomocą " + provider + "! Twój status PMPro / Enrollment został zaktualizowany zabezpieczonym kluczem.");
      } else {
        alert(data.error || "Payment simulation failed.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPaying(false);
    }
  };

  // Student: Simulate marking lesson as done in SQLite
  const handleToggleLessonComplete = async (lesson: Lesson, currentlyDone: boolean) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/lessons/${lesson.id}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id.toString()
        },
        body: JSON.stringify({
          percent: currentlyDone ? 0 : 100,
          completed: currentlyDone ? 0 : 1
        })
      });
      if (res.ok) {
        const data = await res.json();
        // Refresh course view structure
        if (selectedCourse) {
          handleOpenCourse(selectedCourse);
        }
        // If this is the active lesson, update local state indicator
        if (activeLesson && activeLesson.id === lesson.id) {
          setActiveLesson({
            ...activeLesson,
            progress: currentlyDone ? null : { percent: 100, completed: true, last_accessed: new Date().toISOString() }
          });
        }
        // Check if certificate was newly generated
        if (data && data.certificateGenerated) {
          const authHeader = { 'x-user-id': currentUser.id.toString() };
          const certsRes = await fetch('/api/certificates', { headers: authHeader });
          if (certsRes.ok) {
            setCertificates(await certsRes.json());
          }
          setLatestEarnedCertificateCode(data.certificateCode);
          setCelebrationCourseTitle(selectedCourse?.title || "Programu");
          setShowCertificateCelebration(true);
        }
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admin Actions: Create rapid courses
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle || !currentUser) return;
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id.toString()
        },
        body: JSON.stringify({
          title: newCourseTitle,
          access_type: newCourseType,
          price: newCoursePrice,
          description: newCourseDescription,
          external_url: newCourseExternalUrl,
          status: 'published'
        })
      });
      if (res.ok) {
        setNewCourseTitle('');
        setNewCourseDescription('');
        setNewCourseExternalUrl('');
        fetchDashboardData();
        addToast('Kurs został pomyślnie dodany do bazy SQL!', 'success');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admin Actions: Delete course
  const handleDeleteCourse = async (courseId: number) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': currentUser.id.toString() }
      });
      if (res.ok) {
        fetchDashboardData();
        setCourseToDelete(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admin Actions: Create rapid Module / Lesson
  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLessonCourseId || !newLessonTitle || !currentUser) return;
    try {
      const res = await fetch('/api/admin/lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id.toString()
        },
        body: JSON.stringify({
          course_id: newLessonCourseId,
          title: newLessonTitle,
          source_url: newLessonSrc,
          source_type: newLessonType,
          access_level: newLessonAccess,
          duration_minutes: newLessonMinutes
        })
      });
      if (res.ok) {
        setNewLessonTitle('');
        setNewLessonSrc('https://bunny-stream.example.com/play/custom-video');
        fetchDashboardData();
        alert('Lekcja i jej parametry drip-feed zostały zapisane w SQLite.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admin Actions: Course Importer via URL & AI mapping
  const handleAnalyzeUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminImportUrl && !adminImportRawText) {
      addToast("Wprowadź adres URL lub wklej treść sylabusu do przeanalizowania.", "warning");
      return;
    }
    setAdminImportLoading(true);
    setAdminImportPreview(null);
    try {
      const res = await fetch('/api/admin/import-course-from-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          url: adminImportUrl,
          rawText: adminImportRawText
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminImportPreview(data.course_preview);
        // Prefill draft states
        setDraftTitle(data.course_preview.title || '');
        setDraftDesc(data.course_preview.description || '');
        setDraftPrice(data.course_preview.price || 99);
        setDraftAccessType('premium');
        setDraftVisibility('public');
        addToast("Struktura kursu została przeanalizowana i wyodrębniona!", "success");
      } else {
        addToast(data.error || "Wystąpił błąd podczas analizy źródła.", "warning");
      }
    } catch (err: any) {
      console.error(err);
      addToast("Błąd połączenia z serwerem crawler'a.", "warning");
    } finally {
      setAdminImportLoading(false);
    }
  };

  const updateDraftLesson = (index: number, updatedFields: Partial<any>) => {
    if (!adminImportPreview) return;
    const updatedLessons = [...(adminImportPreview.lessons || [])];
    updatedLessons[index] = { ...updatedLessons[index], ...updatedFields };
    setAdminImportPreview({
      ...adminImportPreview,
      lessons: updatedLessons
    });
  };

  const handleConfirmImport = async () => {
    if (!draftTitle) {
      addToast("Tytuł kursu jest wymagany.", "warning");
      return;
    }
    try {
      const res = await fetch('/api/admin/courses/batch-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          title: draftTitle,
          description: draftDesc,
          price: draftPrice,
          access_type: draftAccessType,
          visibility: draftVisibility,
          lessons: adminImportPreview?.lessons || []
        })
      });
      const data = await res.json();
      if (res.ok) {
        addToast(`Zaimplementowano! Dodano kurs "${draftTitle}" z ${data.lessonsCount} lekcjami!`, 'success');
        setAdminImportUrl('');
        setAdminImportRawText('');
        setAdminImportPreview(null);
        fetchDashboardData(); // Refresh the courses lists, stats, etc
      } else {
        addToast(data.error || "Nie udało się sfinalizować importu.", "warning");
      }
    } catch (err) {
      console.error(err);
      addToast("Błąd seryjnego importowania kursu.", "warning");
    }
  };

  const handleSaveCourseAccessControl = async (courseId: number) => {
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          title: editCourseTitle,
          description: editCourseDesc,
          access_type: editCourseAccessType,
          visibility: editCourseVisibility,
          price: editCoursePrice
        })
      });
      const data = await res.json();
      if (res.ok) {
        addToast("Zaktualizowano uprawnienia dostępu do kursu!", "success");
        setEditingCourseId(null);
        fetchDashboardData();
      } else {
        addToast(data.error || "Błąd podczas modyfikacji uprawnień.", "warning");
      }
    } catch (err) {
      console.error(err);
      addToast("Błąd zapisu ustawień kursu.", "warning");
    }
  };

  const startEditingCourse = (course: any) => {
    setEditingCourseId(course.id);
    setEditCourseTitle(course.title || '');
    setEditCourseDesc(course.description || '');
    setEditCourseAccessType(course.access_type || 'premium');
    setEditCourseVisibility(course.visibility || 'public');
    setEditCoursePrice(course.price || 0);
  };

  const fetchCourseEnrollments = async (courseId: number) => {
    setEnrollmentsLoading(true);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/enrollments`, {
        headers: getAuthHeader()
      });
      if (res.ok) {
        const data = await res.json();
        setCourseEnrollmentsList(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEnrollmentsLoading(false);
    }
  };

  const selectCourseForEnrollmentsManager = (course: any) => {
    setSelectedCourseForEnrollments(course);
    setManualEnrollEmail('');
    setManualEnrollAccessType(course.access_type || 'premium');
    fetchCourseEnrollments(course.id);
  };

  const handleGrantManualAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForEnrollments || !manualEnrollEmail) return;
    try {
      const res = await fetch(`/api/admin/courses/${selectedCourseForEnrollments.id}/enrollments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          email: manualEnrollEmail,
          access_type: manualEnrollAccessType
        })
      });
      const data = await res.json();
      if (res.ok) {
        addToast("Pomyślnie nadano studentowi uprawnienia dostępu!", "success");
        setManualEnrollEmail('');
        fetchCourseEnrollments(selectedCourseForEnrollments.id);
        fetchDashboardData();
      } else {
        addToast(data.error || "Wielokrotny zapis lub nieznany email studenta.", "warning");
      }
    } catch (err) {
      console.error(err);
      addToast("Nie udało się przypisać uprawnień.", "warning");
    }
  };

  const handleRevokeManualAccess = async (userId: number) => {
    if (!selectedCourseForEnrollments) return;
    if (!window.confirm("Czy na pewno chcesz odebrać temu studentowi dostęp do tego kursu?")) return;
    try {
      const res = await fetch(`/api/admin/courses/${selectedCourseForEnrollments.id}/enrollments/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      const data = await res.json();
      if (res.ok) {
        addToast("Odebrano studentowi dostęp do kursu.", "info");
        fetchCourseEnrollments(selectedCourseForEnrollments.id);
        fetchDashboardData();
      } else {
        addToast(data.error || "Błąd podczas usuwania uprawnień.", "warning");
      }
    } catch (err) {
      console.error(err);
      addToast("Nie udało się cofnąć uprawnień dostępu.", "warning");
    }
  };

  // User Profile actions
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileFirstName || !profileLastName || !profileEmail) {
      addToast("Wszystkie pola profilu są wymagane.", "warning");
      return;
    }
    setIsUpdatingProfile(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader()
        },
        body: JSON.stringify({
          first_name: profileFirstName,
          last_name: profileLastName,
          email: profileEmail
        })
      });
      const data = await res.json();
      if (res.ok) {
        addToast(data.message || "Profil został pomyślnie zaktualizowany.", "success");
        setCurrentUser(prev => prev ? {
          ...prev,
          first_name: profileFirstName,
          last_name: profileLastName,
          email: profileEmail
        } : null);
        fetchDashboardData();
      } else {
        addToast(data.error || "Wystąpił błąd podczas aktualizacji.", "warning");
      }
    } catch (err: any) {
      console.error(err);
      addToast("Błąd połączenia z serwerem.", "warning");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      addToast("Bieżące i nowe hasło są wymagane.", "warning");
      return;
    }
    if (newPassword.length < 6) {
      addToast("Nowe hasło musi mieć przynajmniej 6 znaków.", "warning");
      return;
    }
    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader()
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        addToast(data.message || "Hasło zostało zmienione.", "success");
        setCurrentPassword("");
        setNewPassword("");
        fetchDashboardData();
      } else {
        addToast(data.error || "Błąd zmiany hasła.", "warning");
      }
    } catch (err) {
      console.error(err);
      addToast("Błąd połączenia.", "warning");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Creator portal actions
  const handleCreatorCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatorNewCourseTitle) {
      addToast("Tytuł kursu jest wymagany.", "warning");
      return;
    }
    try {
      const res = await fetch("/api/creator/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader()
        },
        body: JSON.stringify({
          title: creatorNewCourseTitle,
          slug: creatorNewCourseSlug,
          description: creatorNewCourseDesc,
          thumbnail: creatorNewCourseThumbnail,
          access_type: creatorNewCourseAccess,
          price: creatorNewCoursePrice,
          status: "published"
        })
      });
      const data = await res.json();
      if (res.ok) {
        addToast("Kurs został utworzony pomyślnie!", "success");
        setCreatorNewCourseTitle("");
        setCreatorNewCourseSlug("");
        setCreatorNewCourseDesc("");
        setCreatorNewCourseThumbnail("");
        setCreatorNewCoursePrice(0);
        setShowCreatorAddCourse(false);
        fetchDashboardData();
      } else {
        addToast(data.error || "Błąd tworzenia kursu.", "warning");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatorDeleteCourse = async (courseId: number) => {
    if (!confirm("Czy na pewno chcesz usunąć ten kurs? Operacja jest nieodwracalna.")) return;
    try {
      const res = await fetch(`/api/creator/courses/${courseId}`, {
        method: "DELETE",
        headers: getAuthHeader()
      });
      const data = await res.json();
      if (res.ok) {
        addToast("Kurs został skasowany.", "success");
        fetchDashboardData();
      } else {
        addToast(data.error || "Błąd podczas usuwania kursu.", "warning");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatorCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatorSelectedCourseId || !creatorNewLessonTitle) {
      addToast("Wybierz kurs i wpisz tytuł lekcji.", "warning");
      return;
    }
    try {
      const res = await fetch("/api/creator/lessons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader()
        },
        body: JSON.stringify({
          course_id: creatorSelectedCourseId,
          title: creatorNewLessonTitle,
          source_url: creatorNewLessonUrl,
          source_type: creatorNewLessonType,
          access_level: creatorNewLessonAccess,
          duration_minutes: creatorNewLessonDuration
        })
      });
      const data = await res.json();
      if (res.ok) {
        addToast("Lekcja została pomyślnie dodana!", "success");
        setCreatorNewLessonTitle("");
        setCreatorNewLessonUrl("");
        setCreatorNewLessonDuration(10);
        setShowCreatorAddLesson(false);
        fetchDashboardData();
      } else {
        addToast(data.error || "Błąd dodawania lekcji.", "warning");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !showLanding) {
    return (
      <div className="min-h-screen bg-[rgb(250,250,250)] flex flex-col items-center justify-center p-6">
        <RefreshCw className="animate-spin text-text-primary mb-3" size={32} />
        <p className="font-mono text-xs uppercase tracking-widest opacity-50">Inicjalizowanie HRL Academy Core...</p>
      </div>
    );
  }

  if (showLanding) {
    return <LandingPage onEnter={() => setShowLanding(false)} />;
  }

  // Secure authentication gating
  if (!currentUser) {
    return (
      <div className="min-h-screen w-full bg-brand-bg text-text-primary font-sans flex flex-col items-center justify-center p-4 md:p-8 overflow-y-auto">
        <div className="w-full max-w-md bg-brand-card border border-brand-border rounded-2xl shadow-xl overflow-hidden p-8 space-y-6">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md overflow-hidden border border-brand-border bg-brand-bg shrink-0">
              <img src={logoUrl} alt="HRL Academy Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary mt-2">HRL Academy Core</h1>
            <p className="text-xs text-text-secondary">Uwierzytelnienie i bezpieczny dostęp do portalu</p>
          </div>

          {/* Mode Tabs */}
          <div className="flex border-b border-brand-border">
            <button
              onClick={() => { setAuthMode('login'); setAuthError(null); setAuthSuccess(null); }}
              className={`flex-1 pb-3 text-sm font-semibold transition-colors focus:outline-none border-b-2 ${authMode === 'login' ? 'border-accent-purple text-accent-purple font-bold' : 'border-transparent text-text-secondary'}`}
            >
              Logowanie
            </button>
            <button
              onClick={() => { setAuthMode('register'); setAuthError(null); setAuthSuccess(null); }}
              className={`flex-1 pb-3 text-sm font-semibold transition-colors focus:outline-none border-b-2 ${authMode === 'register' ? 'border-accent-purple text-accent-purple font-bold' : 'border-transparent text-text-secondary'}`}
            >
              Rejestracja
            </button>
          </div>

          {authError && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-xs font-medium">
              {authError}
            </div>
          )}

          {authSuccess && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-xs font-medium">
              {authSuccess}
            </div>
          )}

          {authMode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-text-secondary mb-1.5 font-medium">Adres E-mail</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-brand-bg border border-brand-border rounded-xl text-sm focus:outline-none focus:border-accent-purple focus:ring-1 focus:ring-accent-purple/20 transition-all text-text-primary"
                  placeholder="name@domain.com"
                  required
                  disabled={authInFlight}
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-text-secondary mb-1.5 font-medium">Hasło</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-brand-bg border border-brand-border rounded-xl text-sm focus:outline-none focus:border-accent-purple focus:ring-1 focus:ring-accent-purple/20 transition-all text-text-primary"
                  placeholder="••••••••"
                  required
                  disabled={authInFlight}
                />
              </div>

              <button
                type="submit"
                disabled={authInFlight}
                className="w-full py-3 bg-accent-purple hover:bg-accent-purple-hover text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all focus:outline-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              >
                {authInFlight ? "Uwierzytelnianie..." : "Zaloguj się"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-text-secondary mb-1.5 font-medium">Imię</label>
                  <input
                    type="text"
                    value={registerFirstName}
                    onChange={(e) => setRegisterFirstName(e.target.value)}
                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-xl text-sm focus:outline-none focus:border-accent-purpleFocus transition-all text-text-primary"
                    placeholder="Michał"
                    required
                    disabled={authInFlight}
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-text-secondary mb-1.5 font-medium">Nazwisko</label>
                  <input
                    type="text"
                    value={registerLastName}
                    onChange={(e) => setRegisterLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-xl text-sm focus:outline-none focus:border-accent-purpleFocus transition-all text-text-primary"
                    placeholder="Nowak"
                    required
                    disabled={authInFlight}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-text-secondary mb-1.5 font-medium">Adres E-mail</label>
                <input
                  type="email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-brand-bg border border-brand-border rounded-xl text-sm focus:outline-none focus:border-accent-purple focus:ring-1 focus:ring-accent-purple/20 transition-all text-text-primary"
                  placeholder="name@domain.com"
                  required
                  disabled={authInFlight}
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-text-secondary mb-1.5 font-medium">Hasło</label>
                <input
                  type="password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-brand-bg border border-brand-border rounded-xl text-sm focus:outline-none focus:border-accent-purple focus:ring-1 focus:ring-accent-purple/20 transition-all text-text-primary"
                  placeholder="Min. 6 znaków"
                  minLength={6}
                  required
                  disabled={authInFlight}
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-text-secondary mb-1.5 font-medium">Zarejestruj jako</label>
                <select
                  value={registerRole}
                  onChange={(e) => setRegisterRole(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-brand-bg border border-brand-border rounded-xl text-sm focus:outline-none focus:border-accent-purple focus:ring-1 focus:ring-accent-purple/20 transition-all text-text-primary"
                  disabled={authInFlight}
                >
                  <option value="student">Kursant (Student)</option>
                  <option value="creator">Wykładowca (Creator)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={authInFlight}
                className="w-full py-3 bg-accent-purple hover:bg-accent-purple-hover text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all focus:outline-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              >
                {authInFlight ? "Rejestrowanie..." : "Załóż bezpłatne konto"}
              </button>
            </form>
          )}
        </div>

        {/* Demo Credentials Quick Guide Help Box */}
        <div className="w-full max-w-md mt-6 p-5 bg-brand-card/60 border border-brand-border rounded-2xl shadow-sm text-center">
          <p className="text-xs font-mono uppercase tracking-wider font-semibold text-text-primary mb-3">Konta testowe (Seedy SQLite):</p>
          <div className="grid grid-cols-1 gap-2 text-left text-xs text-text-secondary">
            <div className="p-2 bg-brand-bg/50 rounded-xl border border-brand-border flex justify-between items-center">
              <div>
                <span className="font-semibold text-text-primary text-[11px]">Administracja (ADMIN):</span>
                <p className="font-mono text-[11px] mt-0.5 select-all text-text-secondary">admin@hrl.academy</p>
              </div>
              <span className="bg-brand-card border border-brand-border px-2 py-0.5 rounded font-mono text-[10px] text-text-primary">hasło: admin123</span>
            </div>
            <div className="p-2 bg-brand-bg/50 rounded-xl border border-brand-border flex justify-between items-center">
              <div>
                <span className="font-semibold text-text-primary text-[11px]">Kursant (STUDENT):</span>
                <p className="font-mono text-[11px] mt-0.5 select-all text-text-secondary">student@hrl.academy</p>
              </div>
              <span className="bg-brand-card border border-brand-border px-2 py-0.5 rounded font-mono text-[10px] text-text-primary">hasło: student456</span>
            </div>
            <div className="p-2 bg-brand-bg/50 rounded-xl border border-brand-border flex justify-between items-center">
              <div>
                <span className="font-semibold text-text-primary text-[11px]">Wykładowca (CREATOR):</span>
                <p className="font-mono text-[11px] mt-0.5 select-all text-text-secondary">creator@hrl.academy</p>
              </div>
              <span className="bg-brand-card border border-brand-border px-2 py-0.5 rounded font-mono text-[10px] text-text-primary">hasło: creator789</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-brand-bg text-text-primary font-sans flex flex-col overflow-hidden">
      {/* Top Meta Header & Persona Swapper */}
      <header className="bg-brand-card border-b border-brand-border px-6 py-4 flex flex-col md:flex-row justify-between items-center z-40 space-y-4 md:space-y-0 relative shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm overflow-hidden border border-brand-border bg-brand-bg shrink-0">
            <img src={logoUrl} alt="HRL Academy Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="font-semibold tracking-tight text-text-primary leading-none">HRL Academy Core</h1>
            <p className="text-[10px] font-mono uppercase tracking-wider text-text-secondary mt-1">Educational Paywall & Nexus Portal</p>
          </div>
        </div>

        {/* User Session Info & Log Out Trigger */}
        <div className="flex items-center space-x-4">
          <div className="bg-brand-bg border border-brand-border px-3 py-2 rounded-xl flex items-center space-x-2 shadow-sm text-xs">
            <span className={`w-2 h-2 rounded-full ${currentUser?.role === 'admin' ? 'bg-rose-500' : currentUser?.role === 'creator' ? 'bg-blue-400' : 'bg-emerald-400'}`}></span>
            <span className="font-semibold text-text-primary">
              {currentUser?.first_name} {currentUser?.last_name} 
              <span className="text-text-secondary font-mono text-[10px] ml-1 uppercase">({currentUser?.role})</span>
            </span>
          </div>

          <button
            onClick={handleLogoutSubmit}
            className="p-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 transition-all active:scale-95 flex items-center space-x-1"
            title="Wyloguj się"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Wyloguj</span>
          </button>
        </div>
      </header>

      {/* Main Structural Division */}
      <div className="flex-1 flex flex-col md:flex-row bg-brand-bg overflow-hidden">
        
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 bg-brand-card border-r border-brand-border p-5 flex flex-col space-y-6 shrink-0 overflow-y-auto">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-secondary mb-3 block">Widoki</p>
            <div className="space-y-1">
              <button 
                onClick={() => { setActivePortal('student'); fetchDashboardData(); }}
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center space-x-3 transition-colors ${activePortal === 'student' ? 'bg-accent-blue/10 text-accent-purple shadow-sm border border-accent-blue/20' : 'hover:bg-brand-card text-text-secondary border border-transparent'}`}
              >
                <BookOpen size={18} />
                <span className="font-semibold text-sm">Panel Kursanta</span>
              </button>

              <button 
                onClick={() => { 
                  if (currentUser?.role !== 'creator' && currentUser?.role !== 'admin') {
                    alert("Musisz posiadać rólę autora/wykładowcy (Creator), aby wejść do tego panelu.");
                    return;
                  }
                  setActivePortal('creator'); 
                  fetchDashboardData(); 
                }}
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center space-x-3 transition-colors ${currentUser?.role !== 'creator' && currentUser?.role !== 'admin' ? 'opacity-50 cursor-not-allowed' : ''} ${activePortal === 'creator' ? 'bg-accent-blue/10 text-accent-purple shadow-sm border border-accent-blue/20' : 'hover:bg-brand-card text-text-secondary border border-transparent'}`}
              >
                <PenTool size={18} />
                <span className="font-semibold text-sm">Panel Wykładowcy</span>
              </button>
              
              <button 
                onClick={() => { 
                  if (currentUser?.role !== 'admin') {
                    alert("Zmień konto na 'Jan Kowalski (ADMIN)' u góry ekranu, aby wejść do panelu.");
                    return;
                  }
                  setActivePortal('admin'); 
                  fetchDashboardData(); 
                }}
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center space-x-3 transition-colors ${currentUser?.role !== 'admin' ? 'opacity-50 cursor-not-allowed' : ''} ${activePortal === 'admin' ? 'bg-accent-blue/10 text-accent-purple shadow-sm border border-accent-blue/20' : 'hover:bg-brand-card text-text-secondary border border-transparent'}`}
              >
                <LayoutDashboard size={18} />
                <span className="font-semibold text-sm">Panel Administracyjny</span>
              </button>
            </div>
          </div>

          <hr className="border-brand-border" />

          {/* Sub menu selector context */}
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-secondary mb-3 block">
              {activePortal === 'student' ? 'Nawigacja Studencka' : activePortal === 'creator' ? 'Opcje Wykładowcy' : 'Zarządzanie Platformą'}
            </p>
            
            {activePortal === 'student' ? (
              <div className="space-y-1">
                {[
                  { id: 'my-courses', label: 'Moje Kursy i Nauka', icon: BookOpen },
                  { id: 'downloads', label: 'E-booki i PDF', icon: Download },
                  { id: 'billing', label: 'Płatności i Faktury', icon: CreditCard },
                  { id: 'account', label: 'Ustawienia Profilu', icon: Settings },
                  { id: 'faq', label: 'FAQ & Pomoc', icon: HelpCircle },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setStudentTab(item.id as any)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[13px] font-medium transition-all flex items-center space-x-2.5 ${studentTab === item.id ? 'bg-brand-card shadow-sm border border-brand-border text-text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-brand-card border border-transparent'}`}
                  >
                    <item.icon size={16} className={studentTab === item.id ? 'text-accent-blue' : 'opacity-70'} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            ) : activePortal === 'creator' ? (
              <div className="space-y-1">
                {[
                  { id: 'stats', label: 'Raport i Wyniki', icon: Activity },
                  { id: 'courses', label: 'Materiały i Kursy', icon: Layers },
                  { id: 'students', label: 'Baza Kursantów', icon: Users },
                  { id: 'certificates', label: 'Wydane Certyfikaty', icon: Award },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCreatorTab(item.id as any)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[13px] font-medium transition-all flex items-center space-x-2.5 ${creatorTab === item.id ? 'bg-brand-card shadow-sm border border-brand-border text-text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-brand-card border border-transparent'}`}
                  >
                    <item.icon size={16} className={creatorTab === item.id ? 'text-accent-blue' : 'opacity-70'} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {[
                  { id: 'stats', label: 'Przegląd i Statystyki', icon: Activity },
                  { id: 'courses', label: 'Zarządzanie Kursami', icon: Layers },
                  { id: 'users', label: 'Użytkownicy i Uprawnienia', icon: Users },
                  { id: 'certificates', label: 'Rejestr Certyfikatów', icon: Award },
                  { id: 'payments', label: 'Finanse', icon: CreditCard },
                  { id: 'security', label: 'Analiza Zabezpieczeń', icon: ShieldCheck },
                  { id: 'settings', label: 'Ustawienia Platformy', icon: Settings },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setAdminTab(item.id as any)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[13px] font-medium transition-all flex items-center space-x-2.5 ${adminTab === item.id ? 'bg-brand-card shadow-sm border border-brand-border text-text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-brand-card border border-transparent'}`}
                  >
                    <item.icon size={16} className={adminTab === item.id ? 'text-accent-blue' : 'opacity-70'} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-auto pt-6 space-y-3 relative">
            {showUserMenu && (
              <div className="absolute bottom-full mb-2 right-0 w-full bg-[#1a1714] border border-[#2a2622] rounded-xl shadow-2xl z-50 p-1">
                <button 
                  onClick={() => { setShowUserMenu(false); setActivePortal('student'); setStudentTab('account'); }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-brand-card text-xs text-text-primary transition-colors flex items-center gap-2"
                >
                  <UserIcon size={14} /> Moje Konto
                </button>
                <button 
                  onClick={() => { setShowUserMenu(false); setActivePortal('student'); setStudentTab('billing'); }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-brand-card text-xs text-text-primary transition-colors flex items-center gap-2"
                >
                  <CreditCard size={14} /> Płatności
                </button>
                <button 
                  onClick={() => { setShowUserMenu(false); handleLogoutSubmit(); }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-500/10 text-xs text-rose-500 transition-colors flex items-center gap-2 mt-1"
                >
                  <LogOut size={14} /> Wyloguj
                </button>
              </div>
            )}
            <div 
              className={`bg-brand-card p-4 rounded-xl border transition-colors cursor-pointer select-none group flex justify-between items-center ${showUserMenu ? 'border-[#3a352e]' : 'border-brand-border hover:border-[#3a352e]'}`}
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div>
                <p className="text-[10px] font-mono text-text-secondary group-hover:text-text-primary transition-colors">OBECNA ROLA (DEBUG)</p>
                <p className="text-sm font-semibold mt-1 text-text-primary">
                  {currentUser?.role === 'admin' ? 'Super Administrator' : currentUser?.role === 'creator' ? 'Trener (Podgląd)' : 'Aktywny Kursant'}
                </p>
                <p className="text-[10px] font-mono text-text-secondary mt-1">{currentUser?.email}</p>
              </div>
              <ChevronUp size={16} className={`text-text-secondary transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </aside>

        {/* Dynamic Center Work Area */}
        <main className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto max-h-[100vh] bg-brand-bg text-text-primary">

          {/* Breadcrumbs Navigation */}
          {(() => {
            let b1 = activePortal === 'student' ? 'Panel Studenta' : activePortal === 'creator' ? 'Panel Wykładowcy' : 'Panel Administratora';
            let b2 = '';
            
            if (activePortal === 'student') {
                const studentTabsMap: Record<string, string> = {
                    'my-courses': 'Moje Kursy',
                    'downloads': 'Centrum Materiałów',
                    'billing': 'Rozliczenia',
                    'account': 'Ustawienia Profilu',
                    'faq': 'FAQ & Pomoc',
                };
                b2 = studentTabsMap[studentTab] || studentTab;
            } else if (activePortal === 'creator') {
                const creatorTabsMap: Record<string, string> = {
                    'stats': 'Dashboard i Analizy',
                    'courses': 'Moje Programy',
                    'students': 'Lista Kursantów',
                    'certificates': 'Wydane Certyfikaty'
                };
                b2 = creatorTabsMap[creatorTab] || creatorTab;
            } else {
                const adminTabsMap: Record<string, string> = {
                    'stats': 'Statystyki Systemu',
                    'courses': 'Katalog Kursów',
                    'users': 'Zarządzanie Użytkownikami',
                    'certificates': 'Rejestr Certyfikatów',
                    'payments': 'Finanse i Metryki',
                    'security': 'Bezpieczeństwo',
                    'settings': 'Konfiguracja'
                };
                b2 = adminTabsMap[adminTab] || adminTab;
            }

            return (
                <nav className="flex items-center flex-wrap gap-y-2 space-x-2 text-[10px] sm:text-xs font-mono text-text-secondary uppercase tracking-widest pl-1 -mt-2">
                  <button onClick={() => setShowLanding(true)} className="hover:text-accent-blue transition-colors outline-none focus:outline-none flex items-center gap-1.5"><LayoutDashboard size={12}/> <span>Portal Główny</span></button>
                  <ChevronRight size={10} className="opacity-40" />
                  <span>{b1}</span>
                  <ChevronRight size={10} className="opacity-40" />
                  <span 
                    className={(!selectedCourse && !activeLesson) ? "text-accent-blue font-bold opacity-100" : "hover:text-accent-blue cursor-pointer transition-colors"} 
                    onClick={() => { if(selectedCourse) { setSelectedCourse(null); setCourseStructure(null); setActiveLesson(null); } }}
                  >
                    {b2}
                  </span>
                  
                  {activePortal === 'student' && studentTab === 'my-courses' && selectedCourse && (
                    <>
                      <ChevronRight size={10} className="opacity-40" />
                      <span 
                        className={!activeLesson ? "text-accent-blue font-bold opacity-100 truncate max-w-[150px] sm:max-w-[200px]" : "hover:text-accent-blue cursor-pointer transition-colors truncate max-w-[150px] sm:max-w-[200px]"} 
                        onClick={() => { if(activeLesson) setActiveLesson(null); }}
                      >
                        {selectedCourse.title}
                      </span>
                    </>
                  )}
                  
                  {activePortal === 'student' && studentTab === 'my-courses' && selectedCourse && activeLesson && (
                    <>
                      <ChevronRight size={10} className="opacity-40" />
                      <span className="text-accent-blue font-bold opacity-100 truncate max-w-[150px] sm:max-w-[200px]">
                        {activeLesson.title}
                      </span>
                    </>
                  )}
                </nav>
            );
          })()}
          
          {/* Global Alert Bar if API threw or status alert exists */}
          {errorMessage && (
            <div className="bg-brand-card border-l-4 border-accent-purple p-4 rounded-xl flex items-start space-x-3">
              <AlertCircle className="text-accent-purple mt-1 flex-shrink-0" size={20} />
              <div>
                <p className="text-sm font-bold text-text-primary">Uwierzytelnienie i Bezpieczeństwo</p>
                <p className="text-xs text-text-secondary mt-1">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* PORTAL VIEW: STUDENT */}
          {activePortal === 'student' && (
            <div className="space-y-6 text-text-primary">
              
              {/* STUDENT TAB: MY COURSES */}
              {studentTab === 'my-courses' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Top Dashboard Personalization Widget Drawer */}
                  <div className="bg-brand-card p-5 md:p-6 rounded-2xl shadow-sm border border-brand-border">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-semibold text-text-primary flex items-center space-x-2">
                          <Sliders className="text-accent-blue" size={18} />
                          <span>Dostosowanie Pulpitu</span>
                        </h2>
                        <p className="text-xs text-text-secondary mt-1 font-medium">
                          Zarządzaj układem, sekcjami oraz personalizuj swoje moduły.
                        </p>
                      </div>

                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => setIsPersonalizing(!isPersonalizing)}
                          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer ${
                            isPersonalizing 
                              ? 'bg-accent-blue/10 text-accent-purple border border-accent-blue/30 hover:bg-accent-blue/20' 
                              : 'bg-brand-card text-text-primary hover:bg-neutral-800 border border-brand-border'
                          }`}
                        >
                          <span>{isPersonalizing ? 'Zakończ Edycję ✓' : 'Konfiguruj Układ ⚙️'}</span>
                        </button>

                        {isPersonalizing && (
                          <button
                            type="button"
                            onClick={handleResetWidgets}
                            className="px-3 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                          >
                            Zresetuj ułożenie
                          </button>
                        )}
                      </div>
                    </div>

                    {isPersonalizing && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="pt-5 mt-5 border-t border-brand-border space-y-6"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
                          {/* Accent Color Picker */}
                          <div className="space-y-3">
                            <p className="font-semibold text-text-secondary uppercase tracking-wide text-xs">Wybierz akcent kolorystyczny</p>
                            <div className="flex flex-wrap items-center gap-2">
                              {[
                                { id: 'slate', name: 'Klasyczny Grafit' },
                                { id: 'emerald', name: 'Leśny Szmaragd' },
                                { id: 'amber', name: 'Słoneczny Bursztyn' },
                                { id: 'indigo', name: 'Kosmiczny Indygo' }
                              ].map(col => (
                                <button
                                  key={col.id}
                                  type="button"
                                  onClick={() => { setAccentColor(col.id as any); localStorage.setItem('hrl_dashboard_accent', col.id); }}
                                  className={`px-3 py-1.5 rounded-md border text-xs font-semibold transition-all cursor-pointer ${accentColor === col.id ? 'border-text-primary bg-text-primary text-brand-bg' : 'bg-brand-card border-brand-border text-text-secondary hover:bg-brand-card'}`}
                                >
                                  {col.name}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Layout Style Picker */}
                          <div className="space-y-3">
                            <p className="font-semibold text-text-secondary uppercase tracking-wide text-xs">Wybór modelu siatki (Layout CSS)</p>
                            <div className="flex flex-wrap items-center gap-2">
                              {[
                                { id: 'grid', name: 'Siatka Klasyczna' },
                                { id: 'bento', name: 'Układ Bento-Styl' },
                                { id: 'stack', name: 'Jednokolumnowy Stos' }
                              ].map(lay => (
                                <button
                                  key={lay.id}
                                  type="button"
                                  onClick={() => { setLayoutCols(lay.id as any); localStorage.setItem('hrl_dashboard_layout', lay.id); }}
                                  className={`px-3 py-1.5 rounded-md border text-xs font-semibold transition-all cursor-pointer ${layoutCols === lay.id ? 'border-text-primary bg-text-primary text-brand-bg' : 'bg-brand-card border-brand-border text-text-secondary hover:bg-brand-card'}`}
                                >
                                  {lay.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Interactive Drag widgets checklist list */}
                        <div className="space-y-3">
                          <p className="font-semibold text-text-secondary uppercase tracking-wide text-xs">
                            Kolejność i widoczność sekcji (przeciągnij)
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {widgets.map((widget, idx) => (
                              <div
                                key={widget.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, widget.id)}
                                onDragOver={(e) => handleDragOver(e, widget.id)}
                                onDragEnd={handleDragEnd}
                                className={`p-4 rounded-xl border transition-all flex flex-col justify-between cursor-grab active:cursor-grabbing select-none ${
                                  draggedWidgetId === widget.id 
                                    ? 'bg-brand-bg border-dashed border-neutral-400 opacity-60' 
                                    : 'bg-brand-card border-brand-border hover:border-brand-border shadow-sm'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center space-x-2">
                                    <GripVertical size={16} className="text-text-secondary cursor-grab" />
                                    <span className="font-semibold text-text-primary text-sm">{widget.label}</span>
                                  </div>
                                  <input 
                                    type="checkbox"
                                    checked={widget.visible}
                                    onChange={() => handleToggleWidgetVisibility(widget.id)}
                                    className="rounded border-brand-border text-accent-blue focus:ring-indigo-600 cursor-pointer h-4 w-4 bg-brand-card"
                                  />
                                </div>
                                <p className="text-xs text-text-secondary leading-tight">{widget.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* DYNAMICALLY ORDERED & PERSONALIZED WIDGETS DECK */}
                  <div className={`space-y-6 ${layoutCols === 'stack' ? 'max-w-4xl mx-auto w-full' : ''}`}>
                    {widgets.map((widget, index) => {
                      if (!widget.visible) return null;

                      // RENDER CORE BLOCK: STATS SUMMARY
                      if (widget.id === 'stats') {
                        return (
                          <div 
                            key="stats"
                            className={`transition-all ${isPersonalizing ? 'border-[3px] border-dashed border-indigo-400 p-2 rounded-2xl bg-accent-blue/10/50' : ''}`}
                          >
                            {isPersonalizing && (
                              <div className="flex items-center space-x-2 text-xs font-mono text-amber-600 px-3 py-1 bg-amber-50 rounded-t-2xl border-b border-amber-200">
                                <GripVertical size={13} />
                                <span>Ruchomy Panel Widżetu: Statystyki i Postępy (# {index + 1})</span>
                              </div>
                            )}
                            
                            {/* Render Hero Stats summary */}
                            {dashboardStats && (
                              <div className={`grid ${layoutCols === 'bento' ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-3 gap-6'}`}>
                                <div className="bg-brand-card p-6 rounded-2xl border border-brand-border shadow-sm transition-all hover:shadow-md">
                                  <p className="text-[10px] font-mono opacity-50 uppercase tracking-widest">Zapisany w</p>
                                  <p className="text-4xl font-semibold tracking-tight mt-2">{dashboardStats.stats?.enrolledCount || 0} kursach</p>
                                  <p className="text-[10px] font-mono text-emerald-600 uppercase mt-2">Dostęp zweryfikowany chronionym kluczem JWT</p>
                                </div>
                                <div className="bg-brand-card p-6 rounded-2xl border border-brand-border/80 shadow-sm transition-all hover:shadow-md">
                                  <p className="text-[10px] font-mono opacity-50 uppercase tracking-widest">Ukończone lekcje</p>
                                  <p className="text-4xl font-semibold tracking-tight mt-2">{dashboardStats.stats?.completedCount || 0} tematów</p>
                                  <p className="text-[10px] font-mono text-blue-600 uppercase mt-2">Postęp synchronizowany z bazą SQLite</p>
                                </div>
                                <div className="bg-brand-card p-6 rounded-2xl border border-brand-border/80 shadow-sm transition-all hover:shadow-md">
                                  <p className="text-[10px] font-mono opacity-50 uppercase tracking-widest">Subskrypcja Premium</p>
                                  {dashboardStats.subscriptions?.some((s: any) => s.status === 'active') ? (
                                    <>
                                      <p className="text-2xl font-bold mt-2 text-emerald-600 flex items-center space-x-1.5">
                                        <CheckCircle2 size={24} />
                                        <span>Aktywna (Stripe)</span>
                                      </p>
                                      <p className="text-[10px] font-mono opacity-50 mt-2">Pełen paywall odblokowany</p>
                                    </>
                                  ) : (
                                    <>
                                      <p className="text-2xl font-bold mt-2 text-text-primary/40">Brak aktywnej</p>
                                      <p className="text-[10px] font-mono opacity-50 mt-2">Dostępne darmowe lekcje intro</p>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }

                      // RENDER CORE BLOCK: MOJE KURSY & SECURITY SECURED PLAYER
                      if (widget.id === 'courses') {
                        return (
                          <div 
                            key="courses"
                            className={`transition-all ${isPersonalizing ? 'border-[3px] border-dashed border-indigo-400 p-2 rounded-3xl bg-accent-blue/10/50' : ''}`}
                          >
                            {isPersonalizing && (
                              <div className="flex items-center space-x-2 text-xs font-mono text-accent-purple font-semibold px-3 py-1.5 bg-accent-blue/20 rounded-t-2xl border-b border-accent-blue/30">
                                <GripVertical size={13} />
                                <span>Ruchomy Panel Widżetu: Moje Kursy i Odtwarzacz (# {index + 1})</span>
                              </div>
                            )}

                            {selectedCourse && (
                              <div className="mb-4 flex items-center space-x-2 font-medium text-xs text-text-secondary">
                                <button
                                  type="button"
                                  onClick={() => { setSelectedCourse(null); setCourseStructure(null); setActiveLesson(null); }}
                                  className="inline-flex flex-shrink-0 items-center space-x-1 hover:text-text-primary transition-colors cursor-pointer"
                                >
                                  <ChevronLeft size={14} />
                                  <span>Wróć do listy kursów</span>
                                </button>
                                <span className="opacity-50">/</span>
                                <span className="truncate text-text-primary">{selectedCourse.title}</span>
                              </div>
                            )}

                            {/* Splits: Left Course selection, Right Interactive Lesson Viewer */}
                            <div className={`grid gap-8 ${layoutCols === 'bento' ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12'}`}>
                              
                              {/* Courses Listing Column */}
                              <div className={`${layoutCols === 'bento' ? 'w-full' : 'lg:col-span-4'} ${selectedCourse ? 'hidden lg:block' : 'block'} space-y-6`}>
                                <div className="flex justify-between items-center bg-brand-card p-4 rounded-2xl border border-brand-border shadow-sm">
                                  <h2 className="font-semibold tracking-tight text-xl text-text-primary">Moje Kursy</h2>
                                  <span className="text-[9px] font-mono font-semibold uppercase bg-accent-blue/10 text-accent-purple px-2.5 py-1 rounded border border-accent-blue/30">Stripe Engine</span>
                                </div>
                                <div className="space-y-4">
                                  {studentCourses.map(course => (
                                    <div 
                                      key={course.id}
                                      onClick={() => handleOpenCourse(course)}
                                      className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-sm disabled ${
                                        selectedCourse?.id === course.id 
                                          ? 'bg-brand-bg border-accent-blue/30 ring-1 ring-indigo-500' 
                                          : 'bg-brand-card border-brand-border hover:border-brand-border'
                                      }`}
                                    >
                                      <div className="flex justify-between items-start">
                                        <span className={`text-[9px] font-semibold font-mono uppercase px-2 py-1 rounded bg-brand-card text-text-secondary border border-brand-border`}>
                                          {course.access_type === 'subscription' ? 'Abonament Stripe' : course.access_type === 'premium' ? 'Jednorazowy Stripe' : 'Darmowy'}
                                        </span>
                                        {course.isEnrolled ? (
                                          <span className="text-[9px] font-mono text-emerald-600 uppercase flex items-center space-x-0.5">
                                            <Unlock size={10} /> <span>Zakupiony (Stripe)</span>
                                          </span>
                                        ) : (
                                          <span className="text-[9px] font-mono text-red-500 uppercase flex items-center space-x-0.5">
                                            <Lock size={10} /> <span>Brak dostępu</span>
                                          </span>
                                        )}
                                      </div>
                                      <h3 className="font-bold text-sm mt-3 leading-snug text-text-primary">{course.title}</h3>
                                      <p className="text-xs opacity-60 mt-1 line-clamp-2 text-text-secondary">{course.description}</p>
                                      
                                      {!course.isEnrolled && (
                                        <button 
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); handleTriggerCheckout(course); }}
                                          className={`w-full mt-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 text-white cursor-pointer border-none ${
                                            accentColor === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700' :
                                            accentColor === 'amber' ? 'bg-amber-600 hover:bg-amber-700' :
                                            accentColor === 'indigo' ? 'bg-accent-blue hover:bg-accent-purple' : 'bg-accent-purple hover:bg-neutral-800'
                                          }`}
                                        >
                                          <CreditCard size={13} />
                                          <span>Kup przez Stripe (USD ${course.price || 199})</span>
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Module & Lesson list column */}
                              <div className={`${layoutCols === 'bento' ? 'w-full' : 'lg:col-span-8'} ${!selectedCourse ? 'hidden lg:block' : 'block'} space-y-6`}>
                                {selectedCourse ? (
                                  <div className="space-y-6">
                                    {activeLesson ? (
                                      <div className="bg-brand-card p-5 md:p-6 rounded-2xl border border-brand-border space-y-6 shadow-sm animate-fade-in text-text-primary">
                                      {/* Lesson Header Navigation */}
                                      <div className="flex justify-between items-center border-b border-brand-border pb-4">
                                        <button
                                          type="button"
                                          onClick={() => setActiveLesson(null)}
                                          className="inline-flex items-center space-x-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors cursor-pointer bg-transparent border-none"
                                        >
                                          <ChevronLeft size={14} />
                                          <span>Powrót do modułów</span>
                                        </button>
                                        <span className="text-[10px] font-semibold bg-accent-blue/10 text-accent-purple px-2 py-1 rounded font-mono">
                                          Lekcja {activeLesson.source_type ? activeLesson.source_type.toUpperCase() : "MATERIAŁ"}
                                        </span>
                                      </div>

                                      <div className="space-y-4">
                                        <h2 className="text-xl font-semibold text-text-primary tracking-tight">{activeLesson.title}</h2>
                                        {activeLesson.duration_minutes && (
                                          <p className="text-xs text-text-secondary font-mono">Czas trwania: {activeLesson.duration_minutes} minut</p>
                                        )}
                                      </div>

                                      {/* Lesson Material / Video Player */}
                                      <div className="aspect-video w-full rounded-2xl bg-neutral-950 border border-brand-border overflow-hidden flex flex-col items-center justify-center relative group">
                                        {activeLesson.source_type === 'video' ? (
                                          <div className="text-center p-6 space-y-3">
                                            <PlayCircle size={48} className="text-accent-blue/85 group-hover:scale-105 transition-transform mx-auto cursor-pointer" />
                                            <p className="font-semibold text-sm text-white">Odtwarzacz Wideo Lekcji</p>
                                            <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
                                              Ten film instruktażowy i powiązany klucz CDN są chronione autoryzacją JWT.
                                            </p>
                                            {lessonAccessDetails?.signedUrl && (
                                              <span className="inline-block text-[10px] bg-white/5 text-emerald-400 px-3 py-1.5 rounded font-mono mt-3 max-w-xs truncate border border-emerald-500/10">
                                                Token JWT: {lessonAccessDetails.signedUrl.substring(0, 30)}...
                                              </span>
                                            )}
                                          </div>
                                        ) : (
                                          <div className="text-center p-6 space-y-3">
                                            <FileText size={48} className="text-accent-purple/85 group-hover:scale-105 transition-transform mx-auto cursor-pointer" />
                                            <p className="font-semibold text-sm text-white">Podgląd dokumentu PDF</p>
                                            <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
                                              Instrukcja do laboratorium, notatki z wykładu oraz kody źródłowe projektu.
                                            </p>
                                          </div>
                                        )}
                                      </div>

                                      {/* Interactive Tabs: Lesson Content vs Quiz Questions */}
                                      <div className="border-t border-brand-border pt-6 space-y-6">
                                        {quizQuestions.length > 0 && quizPassingScore > 0 ? (
                                          <div className="space-y-6">
                                            <div className="bg-brand-bg md:p-6 p-4 rounded-2xl border border-brand-border space-y-4 shadow-sm">
                                              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-brand-border pb-3 gap-2">
                                                <div className="flex items-center space-x-2">
                                                  <Award className="text-accent-purple" size={18} />
                                                  <h3 className="font-bold text-sm text-text-primary">Weryfikator Wiedzy (Quiz Lekcyjny)</h3>
                                                </div>
                                                <div className="flex items-center space-x-2 text-xs text-text-secondary font-mono">
                                                  <span>Próg Zaliczeniowy:</span>
                                                  <span className="font-bold text-accent-blue bg-accent-blue/10 px-2 py-0.5 rounded">{quizPassingScore}%</span>
                                                </div>
                                              </div>

                                              {/* Status Alert */}
                                              {(() => {
                                                const passedAttempts = quizAttempts.filter(a => a.passed === 1);
                                                const hasPassed = passedAttempts.length > 0;
                                                
                                                if (hasPassed) {
                                                  return (
                                                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 p-4 rounded-xl flex items-start space-x-2.5">
                                                      <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                                                      <div className="text-xs">
                                                        <p className="font-bold text-emerald-500">Gratulacje! Ten test został zaliczony pomyślnie!</p>
                                                        <p className="mt-0.5 opacity-85 text-text-secondary">Twój najlepszy wynik z prób: {Math.max(...quizAttempts.map(a => a.score_percent))}%</p>
                                                      </div>
                                                    </div>
                                                  );
                                                } else if (quizAttempts.length > 0) {
                                                  return (
                                                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-4 rounded-xl flex items-start space-x-2.5">
                                                      <AlertCircle className="text-rose-500 mt-0.5 shrink-0" size={16} />
                                                      <div className="text-xs">
                                                        <p className="font-bold text-rose-500">Test nie został jeszcze zaliczony.</p>
                                                        <p className="mt-0.5 opacity-85 text-text-secondary">Suma punktów z ostatniej próby: {quizAttempts[0].score_percent}%. Wymagany próg to co najmniej {quizPassingScore}%.</p>
                                                      </div>
                                                    </div>
                                                  );
                                                } else {
                                                  return (
                                                    <div className="bg-accent-blue/5 border border-accent-blue/20 text-text-secondary p-4 rounded-xl flex items-start space-x-2.5">
                                                      <HelpCircle className="text-accent-blue mt-0.5 shrink-0" size={16} />
                                                      <div className="text-xs">
                                                         <p className="font-semibold text-text-primary">Wykonaj sprawdzian wiedzy powiązany z lekcją.</p>
                                                         <p className="mt-0.5 text-xs text-text-secondary leading-tight">Zdobądź minimalny wynik {quizPassingScore}% poprawnych odpowiedzi, aby lekcja została automatycznie oznaczona w systemie jako zaliczona.</p>
                                                       </div>
                                                     </div>
                                                   );
                                                 }
                                               })()}

                                               {/* Quiz Body */}
                                               <form onSubmit={handleQuizSubmit} className="space-y-6 pt-2">
                                                 {quizQuestions.map((q, qIndex) => {
                                                   let optionsList: string[] = [];
                                                   try {
                                                     optionsList = typeof q.options_json === 'string' ? JSON.parse(q.options_json) : q.options_json;
                                                   } catch(e) {
                                                     optionsList = q.options_json || [];
                                                   }

                                                   const questionGrade = quizSubmitResult?.results?.[q.id];

                                                   return (
                                                     <div key={q.id} className="space-y-3 bg-brand-card p-4 rounded-xl border border-brand-border shadow-sm">
                                                       <p className="font-semibold text-xs text-text-primary flex items-start space-x-2 unique-quiz-q">
                                                         <span className="font-mono bg-brand-bg px-2 py-0.5 rounded text-text-secondary text-[10px] shrink-0">Pytanie {qIndex + 1}</span>
                                                         <span>{q.question_text}</span>
                                                       </p>
                                                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2 pt-1">
                                                         {optionsList.map((opt, oIndex) => {
                                                           const isSelected = selectedQuizAnswers[q.id] === oIndex;

                                                           // Custom styles and states based on quiz evaluation status
                                                           let optionStyleClass = '';
                                                           let showStatusIcon: React.ReactNode = null;
                                                           let statusBadge: React.ReactNode = null;

                                                           if (quizSubmitted && questionGrade) {
                                                             const isCorrectOption = questionGrade.correct_option_index === oIndex;
                                                             const isStudentSelection = selectedQuizAnswers[q.id] === oIndex;

                                                             if (isCorrectOption) {
                                                               optionStyleClass = 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 font-semibold cursor-default';
                                                               showStatusIcon = (
                                                                 <div className="w-3.5 h-3.5 rounded-full border border-emerald-500 bg-emerald-500 flex items-center justify-center shrink-0">
                                                                   <Check size={10} className="text-white font-bold" />
                                                                 </div>
                                                               );
                                                               statusBadge = (
                                                                 <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase ml-auto tracking-wider shrink-0">
                                                                   Poprawna
                                                                 </span>
                                                               );
                                                             } else if (isStudentSelection) {
                                                               optionStyleClass = 'bg-rose-500/10 border-rose-500/50 text-rose-400 font-semibold cursor-default';
                                                               showStatusIcon = (
                                                                 <div className="w-3.5 h-3.5 rounded-full border border-rose-500 bg-rose-500 flex items-center justify-center shrink-0">
                                                                   <X size={10} className="text-white font-bold" />
                                                                 </div>
                                                               );
                                                               statusBadge = (
                                                                 <span className="text-[9px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded font-bold uppercase ml-auto tracking-wider shrink-0">
                                                                   Twój błąd
                                                                 </span>
                                                               );
                                                             } else {
                                                               optionStyleClass = 'bg-brand-bg/40 border-brand-border/40 text-text-secondary/40 cursor-not-allowed opacity-60';
                                                               showStatusIcon = (
                                                                 <div className="w-3.5 h-3.5 rounded-full border border-neutral-800 bg-brand-bg shrink-0" />
                                                               );
                                                             }
                                                           } else {
                                                             optionStyleClass = isSelected 
                                                               ? 'bg-accent-blue/10 border-accent-blue/50 text-text-primary font-medium cursor-pointer' 
                                                               : 'bg-brand-bg border-brand-border text-text-secondary hover:text-text-primary hover:bg-brand-card cursor-pointer';

                                                             showStatusIcon = (
                                                               <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-accent-blue bg-accent-blue' : 'border-neutral-700 bg-brand-bg'}`}>
                                                                 {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                               </div>
                                                             );
                                                           }

                                                           return (
                                                             <label
                                                               key={oIndex}
                                                               className={`flex items-center space-x-2.5 p-2.5 rounded-lg border text-xs transition-all ${optionStyleClass}`}
                                                             >
                                                               <input
                                                                 type="radio"
                                                                 name={`q_${q.id}`}
                                                                 checked={isSelected}
                                                                 disabled={quizSubmitted}
                                                                 onChange={() => {
                                                                   if (!quizSubmitted) {
                                                                     setSelectedQuizAnswers(prev => ({ ...prev, [q.id]: oIndex }));
                                                                   }
                                                                 }}
                                                                 className="hidden"
                                                               />
                                                               {showStatusIcon}
                                                               <span>{opt}</span>
                                                               {statusBadge}
                                                             </label>
                                                           );
                                                         })}
                                                       </div>

                                                       {/* Immediate Educational Educational Feedback message */}
                                                       {quizSubmitted && questionGrade && (
                                                         <div className={`mt-2.5 p-3 rounded-xl border text-[11px] leading-relaxed flex items-start space-x-2.5 ${
                                                           questionGrade.correct 
                                                             ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                                             : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                                         }`}>
                                                           {questionGrade.correct ? (
                                                             <>
                                                               <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={13} />
                                                               <div>
                                                                 <span className="font-bold">Świetnie!</span> Twoja odpowiedź jest w pełni poprawna.
                                                               </div>
                                                             </>
                                                           ) : (
                                                             <>
                                                               <AlertCircle className="text-rose-500 mt-0.5 shrink-0" size={13} />
                                                               <div>
                                                                 <span className="font-bold">Błędna odpowiedź.</span> Prawidłowe rozwiązanie to: <span className="font-semibold underline">„{optionsList[questionGrade.correct_option_index]}”</span>.
                                                               </div>
                                                             </>
                                                           )}
                                                         </div>
                                                       )}
                                                     </div>
                                                   );
                                                 })}

                                                 <div className="flex justify-end pt-2">
                                                   {quizSubmitted ? (
                                                     <button
                                                       type="button"
                                                       onClick={() => {
                                                         setQuizSubmitted(false);
                                                         setQuizSubmitResult(null);
                                                         setSelectedQuizAnswers({});
                                                       }}
                                                       className="px-5 py-2.5 rounded-xl text-xs font-bold bg-brand-card hover:bg-brand-bg text-text-primary border border-brand-border transition-all flex items-center space-x-2 cursor-pointer"
                                                     >
                                                       <RefreshCw size={14} />
                                                       <span>Rozwiąż quiz ponownie</span>
                                                     </button>
                                                   ) : (
                                                     <button
                                                       type="submit"
                                                       disabled={quizLoading}
                                                       className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all flex items-center space-x-2 border-none cursor-pointer ${
                                                         quizLoading ? 'bg-neutral-600 opacity-60' : 'bg-accent-purple hover:bg-neutral-800 shadow-sm'
                                                       }`}
                                                     >
                                                       {quizLoading ? (
                                                         <span>Ocenianie testu...</span>
                                                       ) : (
                                                         <>
                                                           <CheckSquare size={14} />
                                                           <span>Zatwierdź i oceń test</span>
                                                         </>
                                                       )}
                                                     </button>
                                                   )}
                                                 </div>
                                               </form>

                                              {/* Attempts Log history */}
                                              {quizAttempts.length > 0 && (
                                                <div className="border-t border-brand-border pt-4 mt-6 space-y-2">
                                                  <p className="text-[10px] font-mono uppercase text-text-secondary">Archiwum nadesłanych odpowiedzi ({quizAttempts.length})</p>
                                                  <div className="space-y-1">
                                                    {quizAttempts.map((at, idx) => (
                                                      <div key={at.id} className="flex justify-between items-center bg-brand-card px-3 py-1.5 rounded border border-brand-border text-[11px] font-mono">
                                                        <span className="text-text-secondary">Próba #{quizAttempts.length - idx}</span>
                                                        <div className="flex items-center space-x-3">
                                                          <span className="font-semibold text-text-primary">Wynik: {at.score_percent}%</span>
                                                          <span className={`font-bold uppercase ${at.passed === 1 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                            {at.passed === 1 ? 'ZALICZONY ✓' : 'NIEZALICZONY ✗'}
                                                          </span>
                                                        </div>
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="space-y-4 text-center py-6 bg-brand-bg rounded-2xl border border-brand-border border-dashed">
                                            <Award className="text-text-secondary/40 mx-auto" size={36} />
                                            <div className="space-y-1">
                                              <p className="font-semibold text-xs text-text-primary">Lekcja nie wymaga testu wiedzy</p>
                                              <p className="text-[11px] text-text-secondary max-w-xs mx-auto">Te zajęcia nie mają przygotowanego sprawdzianu. Możesz odznaczyć je bezpośrednio w panelu.</p>
                                            </div>
                                            
                                            <div className="pt-2">
                                              <button
                                                type="button"
                                                onClick={async () => {
                                                  if (!currentUser) return;
                                                  try {
                                                    const isCompleted = activeLesson.progress?.completed;
                                                    const res = await fetch(`/api/lessons/${activeLesson.id}/progress`, {
                                                      method: 'POST',
                                                      headers: {
                                                        'Content-Type': 'application/json',
                                                        'x-user-id': currentUser.id.toString()
                                                      },
                                                      body: JSON.stringify({
                                                        percent: isCompleted ? 0 : 100,
                                                        completed: !isCompleted
                                                      })
                                                    });
                                                    if (res.ok) {
                                                      if (selectedCourse) {
                                                        const structRes = await fetch(`/api/courses/${selectedCourse.id}`, {
                                                          headers: { 'x-user-id': currentUser.id.toString() }
                                                        });
                                                        if (structRes.ok) {
                                                          setCourseStructure(await structRes.json());
                                                        }
                                                      }
                                                      setActiveLesson(prev => prev ? { ...prev, progress: { ...prev.progress, completed: !isCompleted } } : null);
                                                      fetchDashboardData();
                                                      alert(isCompleted ? "Oznaczono jako nieukończona." : "Lekcja oznaczona jako ukończona!");
                                                    }
                                                  } catch (e) {
                                                    console.error(e);
                                                  }
                                                }}
                                                className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all inline-flex items-center space-x-1.5 border-none cursor-pointer ${
                                                  activeLesson.progress?.completed ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-accent-blue hover:bg-indigo-600'
                                                }`}
                                              >
                                                {activeLesson.progress?.completed ? (
                                                  <>
                                                    <CheckCircle2 size={13} />
                                                    <span>Lekcja Ukończona (Wycofaj status)</span>
                                                  </>
                                                ) : (
                                                  <>
                                                    <Check size={13} />
                                                    <span>Zakończ i Oznacz Lekcję jako Ukończoną</span>
                                                  </>
                                                )}
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="bg-brand-card p-5 md:p-6 rounded-2xl border border-brand-border space-y-5 shadow-sm">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <h2 className="text-2xl font-semibold tracking-tight text-text-primary">{selectedCourse.title}</h2>
                                          <p className="text-xs opacity-60 mt-1 text-text-secondary font-mono">Dostęp do kursu zewnętrznego i generator certyfikatów</p>
                                        </div>
                                        <button 
                                          type="button"
                                          onClick={() => { setSelectedCourse(null); setCourseStructure(null); }}
                                          className="text-xs opacity-50 hover:opacity-100 font-mono text-text-primary underline uppercase cursor-pointer bg-transparent border-none"
                                        >
                                          Zamknij podgląd
                                        </button>
                                      </div>

                                      {/* Access banner */}
                                      <div className={`p-4 rounded-xl border flex items-center justify-between ${selectedCourse.isEnrolled ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-amber-50 border-amber-200 text-amber-955'}`}>
                                        <div className="flex items-center space-x-2">
                                          {selectedCourse.isEnrolled ? <Unlock size={18} className="text-emerald-700" /> : <Lock size={18} className="text-amber-700" />}
                                          <p className="text-xs font-bold leading-none">
                                            {selectedCourse.isEnrolled ? 'Status: Zakupiono / Masz aktywny dostęp.' : 'Status: Tryb podglądu (dostęp zablokowany).'}
                                          </p>
                                        </div>
                                        {!selectedCourse.isEnrolled && (
                                          <button 
                                            type="button"
                                            onClick={() => handleTriggerCheckout(selectedCourse)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition text-white border-none cursor-pointer ${
                                              accentColor === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700' :
                                              accentColor === 'amber' ? 'bg-amber-600 hover:bg-amber-700' :
                                              accentColor === 'indigo' ? 'bg-accent-blue hover:bg-accent-purple' : 'bg-accent-purple hover:bg-neutral-800'
                                            }`}
                                          >
                                            Zdobądź pełen dostęp (Stripe)
                                          </button>
                                        )}
                                      </div>

                                      {/* Selected Course Main Details */}
                                      <div className="bg-brand-bg p-6 rounded-2xl border border-brand-border space-y-4">
                                        <h3 className="font-semibold tracking-tight text-lg text-text-primary">Opis Programu</h3>
                                        <p className="text-xs text-text-secondary leading-relaxed">{selectedCourse.description}</p>
                                        
                                        {selectedCourse.isEnrolled && (
                                          <div className="pt-2">
                                            <div className="bg-brand-card p-4 rounded-xl border border-brand-border flex flex-col gap-4">
                                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                                <div>
                                                  <p className="text-[10px] font-mono uppercase text-text-secondary">Platforma Zewnętrzna</p>
                                                  <p className="text-xs font-semibold text-text-primary">Lekcje, laboratoria i pełny program hostowane są na odrębnej domenie edukacyjnej.</p>
                                                </div>
                                                <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 shrink-0">
                                                  {showExternalCoursePreview ? (
                                                    <button
                                                      onClick={() => setShowExternalCoursePreview(false)}
                                                      className="inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-neutral-800 text-white hover:bg-neutral-700 transition-colors border-none cursor-pointer"
                                                    >
                                                      <span>Zamknij podgląd</span>
                                                    </button>
                                                  ) : (
                                                    <button
                                                      onClick={() => setShowExternalCoursePreview(true)}
                                                      className={`inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all border-none cursor-pointer ${
                                                        accentColor === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700' :
                                                        accentColor === 'amber' ? 'bg-amber-600 hover:bg-amber-700' :
                                                        accentColor === 'indigo' ? 'bg-accent-blue hover:bg-accent-purple' : 'bg-accent-purple hover:bg-neutral-800'
                                                      }`}
                                                    >
                                                      <span>Uruchom kurs w HRL Core (iFrame)</span>
                                                    </button>
                                                  )}
                                                  <a 
                                                    href={selectedCourse.external_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-brand-bg border border-brand-border text-text-primary hover:bg-brand-card transition-colors"
                                                  >
                                                    <span>Otwórz w nowej karcie ↗</span>
                                                  </a>
                                                </div>
                                              </div>
                                              
                                              {showExternalCoursePreview && (
                                                <div className="mt-4 rounded-xl overflow-hidden border border-brand-border bg-neutral-950 aspect-[16/9] w-full relative">
                                                  <div className="absolute top-2 right-4 z-10 flex items-center space-x-2 bg-black/50 px-2 py-1.5 rounded-lg border border-white/10 backdrop-blur-md">
                                                    <Lock size={10} className="text-emerald-400" />
                                                    <span className="text-[9px] font-mono text-white/70">Zaufana domena ({new URL(selectedCourse.external_url).hostname})</span>
                                                  </div>
                                                  <iframe 
                                                    src={selectedCourse.external_url}
                                                    className="w-full h-full border-none"
                                                    title={`Kurs ${selectedCourse.title}`}
                                                    allow="fullscreen"
                                                  />
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      {/* Course Structure Preview */}
                                      {courseStructure && courseStructure.modules && courseStructure.modules.length > 0 && (
                                        <div className="bg-brand-bg p-6 rounded-2xl border border-brand-border space-y-4">
                                          <h3 className="font-semibold tracking-tight text-lg text-text-primary">Struktura Kursu</h3>
                                          <div className="space-y-4 pt-2">
                                            {courseStructure.modules.map((mod, mIndex) => {
                                              const totalLessons = mod.lessons?.length || 0;
                                              const completedLessons = mod.lessons?.filter(l => l.progress?.completed).length || 0;
                                              const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
                                              
                                              return (
                                                <div key={mod.id} className="bg-brand-card p-4 rounded-xl border border-brand-border">
                                                  <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-3 border-b border-brand-border pb-3 gap-3">
                                                    <h4 className="font-semibold text-sm text-text-primary flex items-center gap-2">
                                                      <span className="text-xs bg-accent-blue/10 text-accent-purple px-2 py-0.5 rounded font-mono font-bold">#{mIndex + 1}</span>
                                                      {mod.title}
                                                    </h4>
                                                    <div className="flex flex-col items-start md:items-end bg-brand-bg md:bg-transparent p-2 md:p-0 rounded-lg">
                                                      <span className="text-[10px] font-mono uppercase text-text-secondary mb-1">Postęp modułu</span>
                                                      <div className="flex items-center space-x-2">
                                                        <span className={`text-xs font-bold ${progressPercent === 100 ? 'text-emerald-600' : 'text-text-primary'}`}>
                                                          {progressPercent}%
                                                        </span>
                                                        <div className="w-24 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                                                          <div 
                                                            className={`h-full transition-all duration-500 ${progressPercent === 100 ? 'bg-emerald-500' : 'bg-accent-blue/100'}`} 
                                                            style={{ width: `${progressPercent}%` }}
                                                          />
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                  <div className="space-y-1">
                                                    {mod.lessons?.map((lesson, lIndex) => (
                                                      <div 
                                                        key={lesson.id} 
                                                        onClick={() => { if (courseStructure.isEnrolled) handleOpenLesson(lesson); }}
                                                        className={`flex justify-between items-center py-2 px-3 hover:bg-neutral-800 rounded-lg group transition-colors ${courseStructure.isEnrolled ? 'cursor-pointer' : ''}`}
                                                      >
                                                        <div className="flex items-center space-x-3">
                                                          {lesson.progress?.completed ? (
                                                            <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                                                          ) : (
                                                            <div className="w-[14px] h-[14px] rounded-full border-2 border-brand-border shrink-0" />
                                                          )}
                                                          <span className={`text-xs font-medium transition-colors ${lesson.progress?.completed ? 'text-text-secondary line-through' : 'text-text-primary group-hover:text-text-primary'}`}>
                                                            {lIndex + 1}. {lesson.title}
                                                          </span>
                                                          {lesson.passing_score > 0 && (
                                                            <span className="text-[9px] bg-accent-blue/10 text-accent-blue border border-accent-blue/20 font-mono font-bold px-1.5 py-0.5 rounded">TEST</span>
                                                          )}
                                                        </div>
                                                        <div className="flex items-center space-x-3">
                                                          <span className="text-[10px] font-mono text-text-secondary shrink-0">{lesson.duration_minutes} min</span>
                                                          {courseStructure.isEnrolled && (
                                                            <button 
                                                              type="button"
                                                              onClick={(e) => { e.stopPropagation(); handleOpenLesson(lesson); }}
                                                              className="text-[10px] bg-brand-bg hover:bg-brand-card border border-brand-border shadow-sm px-2.5 py-1 rounded text-text-secondary hover:text-accent-blue hover:border-accent-blue/30 transition-colors cursor-pointer opacity-0 group-hover:opacity-100 hidden sm:block shrink-0"
                                                            >
                                                              {lesson.progress?.completed ? 'Zobacz ponownie' : 'Uruchom'}
                                                            </button>
                                                          )}
                                                        </div>
                                                      </div>
                                                    ))}
                                                    {(!mod.lessons || mod.lessons.length === 0) && (
                                                      <p className="text-xs text-text-secondary italic py-2 text-center font-medium">Brak lekcji w tym module</p>
                                                    )}
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                    {/* Certificate Generator Panel */}
                                    {selectedCourse.isEnrolled && (
                                      <div className="border-t border-brand-border pt-6 space-y-6">
                                        <div className="flex items-center space-x-2">
                                          <Award className="text-text-primary" size={20} />
                                          <h3 className="text-lg font-semibold tracking-tight text-text-primary">Generator Certyfikatu Ukończenia</h3>
                                        </div>

                                        {(() => {
                                          const cert = certificates.find(c => c.course_id === selectedCourse.id);
                                          if (cert) {
                                            return (
                                              <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl space-y-4 shadow-sm animate-fade-in">
                                                <div className="flex items-center space-x-2 text-emerald-800">
                                                  <CheckCircle2 size={18} className="text-emerald-700" />
                                                  <p className="text-xs font-bold">Certyfikat ukończenia został wygenerowany pomyślnie!</p>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                                  <div className="bg-brand-card p-3 rounded-xl border border-emerald-150">
                                                    <span className="text-[9px] font-mono uppercase text-text-secondary block">Odbiorca</span>
                                                    <span className="font-semibold text-text-primary">{currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'Student'}</span>
                                                  </div>
                                                  <div className="bg-brand-card p-3 rounded-xl border border-emerald-150">
                                                    <span className="text-[9px] font-mono uppercase text-text-secondary block">Adres Email</span>
                                                    <span className="font-semibold text-text-primary">{currentUser?.email}</span>
                                                  </div>
                                                  <div className="bg-brand-card p-3 rounded-xl border border-emerald-150">
                                                    <span className="text-[9px] font-mono uppercase text-text-secondary block">Kod Certyfikatu</span>
                                                    <span className="font-mono font-bold text-text-primary text-accent-purple">{cert.certificate_code}</span>
                                                  </div>
                                                  <div className="bg-brand-card p-3 rounded-xl border border-emerald-150">
                                                    <span className="text-[9px] font-mono uppercase text-text-secondary block">Wystawca i Platforma</span>
                                                    <span className="font-semibold text-text-primary">{selectedCourse.title} • HRL Core API</span>
                                                  </div>
                                                </div>

                                                <div className="flex flex-wrap gap-3 pt-2">
                                                  <a 
                                                    href={cert.pdf_url || `https://cdn.hrl.academy/certs/${cert.certificate_code}.pdf`}
                                                    onClick={(e) => { e.preventDefault(); alert(`Rozpoczęto pobieranie pliku PDF certyfikatu o kodzie: ${cert.certificate_code}`); }}
                                                    className="inline-flex items-center space-x-1.5 bg-accent-purple hover:bg-neutral-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs cursor-pointer shadow-sm transition"
                                                  >
                                                    <Download size={14} />
                                                    <span>Pobierz Certyfikat PDF</span>
                                                  </a>
                                                  
                                                  <button 
                                                    type="button"
                                                    disabled={resendingCertId === cert.id}
                                                    onClick={async () => {
                                                      if (!currentUser) return;
                                                      try {
                                                        const res = await fetch(`/api/certificates/${cert.id}/resend`, {
                                                          method: 'POST',
                                                          headers: { 'x-user-id': currentUser.id.toString() }
                                                        });
                                                        if (res.ok) {
                                                          alert(`Wysłano e-mail z certyfikatem ponownie do: ${currentUser.email}`);
                                                        } else {
                                                          alert("Błąd podczas wysyłania e-maila.");
                                                        }
                                                      } catch (e: any) {
                                                        alert("Błąd: " + e.message);
                                                      }
                                                    }}
                                                    className="inline-flex items-center space-x-1.5 bg-brand-card hover:bg-neutral-200 text-text-primary font-bold py-2.5 px-4 rounded-xl text-xs cursor-pointer border border-brand-border transition"
                                                  >
                                                    <Mail size={14} />
                                                    <span>Wyślij e-mail ponownie (SMTP)</span>
                                                  </button>
                                                </div>
                                              </div>
                                            );
                                          } else {
                                            return (
                                              <div className="bg-brand-bg border border-brand-border p-6 rounded-2xl space-y-4 font-sans">
                                                <div>
                                                  <p className="text-xs text-text-primary font-extrabold uppercase tracking-widest text-[9px] mb-2">
                                                    Wybierz styl i szablon certyfikatu:
                                                  </p>
                                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-3">
                                                    {[
                                                      { id: 'classical', label: 'Klasyczny (Golden)' },
                                                      { id: 'modern', label: 'Modern (Emerald)' },
                                                      { id: 'minimalist', label: 'Minimalistyczny (Ink)' },
                                                      { id: 'tech_dark', label: 'Cyberpunk (Neon)' },
                                                      { id: 'luxury_gold', label: 'Królewski (Majestic)' },
                                                    ].map((st) => (
                                                      <button
                                                        key={st.id}
                                                        type="button"
                                                        onClick={() => setGenerationStyleOption(st.id as any)}
                                                        className={`cursor-pointer border py-2 px-3 rounded-lg text-xs font-bold text-left transition select-none ${
                                                          generationStyleOption === st.id
                                                            ? 'bg-amber-500 border-amber-500 text-neutral-950 shadow-sm font-extrabold'
                                                            : 'bg-brand-card border-brand-border text-text-primary hover:bg-brand-card font-medium'
                                                        }`}
                                                      >
                                                        {st.label}
                                                      </button>
                                                    ))}
                                                  </div>
                                                </div>
                                                <p className="text-xs text-text-secondary leading-relaxed">
                                                  Ukończyłeś już cały kurs na zewnętrznej platformie? Przejdź dalej, aby wygenerować swój certyfikat i automatycznie wysłać go na swoją skrzynkę mailową.
                                                </p>
                                                
                                                <button 
                                                  disabled={generatingCert === selectedCourse.id}
                                                  onClick={() => handleGenerateCertificate(selectedCourse.id, generationStyleOption)}
                                                  className={`w-full py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 text-white border-none cursor-pointer ${
                                                    accentColor === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700' :
                                                    accentColor === 'amber' ? 'bg-amber-600 hover:bg-amber-700' :
                                                    accentColor === 'indigo' ? 'bg-accent-blue hover:bg-accent-purple' : 'bg-accent-purple hover:bg-neutral-800'
                                                  }`}
                                                >
                                                  {generatingCert === selectedCourse.id ? (
                                                    <>
                                                      <RefreshCw className="animate-spin" size={14} />
                                                      <span>Generowanie Certyfikatu i Auto-synchronicacja...</span>
                                                    </>
                                                  ) : (
                                                    <>
                                                      <Award size={14} />
                                                      <span>Potwierdzam ukończenie i generuję Certyfikat</span>
                                                    </>
                                                  )}
                                                </button>
                                              </div>
                                            )
                                          }
                                        })()}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="h-96 bg-brand-card border border-brand-border rounded-3xl flex flex-col items-center justify-center p-8 text-center text-text-secondary shadow-sm">
                                    <BookOpen className="opacity-20 mb-4" size={48} />
                                    <p className="font-semibold tracking-tight text-xl text-text-primary">Wybierz jeden z programów z listy</p>
                                    <p className="text-xs opacity-60 max-w-sm mt-1">
                                      Po kliknięciu w kurs na panelu bocznym zobaczysz rozpiskę modułów oraz uruchomisz zabezpieczony odtwarzacz CDA.
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // RENDER CORE BLOCK: CERTIFICATES LISTING
                      if (widget.id === 'certificates') {
                        return (
                          <div 
                            key="certificates"
                            className={`transition-all bg-brand-card p-5 md:p-6 rounded-2xl border border-brand-border space-y-5 shadow-sm ${
                              isPersonalizing ? 'border-4 border-dashed border-amber-400 bg-amber-400/5' : ''
                            }`}
                          >
                            {isPersonalizing && (
                              <div className="flex items-center space-x-2 text-xs font-mono text-amber-600 px-3 py-1 bg-amber-50 rounded-t-2xl border-b border-amber-200 font-bold">
                                <GripVertical size={13} />
                                <span>Ruchomy Panel Widżetu: Dokumenty Certyfikacji (Stripe) (# {index + 1})</span>
                              </div>
                            )}

                            <div>
                              <h3 className="text-xl font-semibold tracking-tight text-text-primary flex items-center space-x-2">
                                <Award className="text-amber-500 animate-bounce" size={24} />
                                <span>Oficjalne Certyfikaty Akademii (Stripe Webhook Verified)</span>
                              </h3>
                              <p className="text-xs text-text-secondary mt-1">
                                Po ukończeniu 100% lekcji w danym programie, system automatycznie rozsyła oraz udostępnia unikalny, podpisany cyfrowo certyfikat.
                              </p>
                            </div>

                            {resendSuccessMessage && (
                              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 flex items-center space-x-2 animate-pulse">
                                <CheckCircle2 size={14} className="text-emerald-600" />
                                <span>{resendSuccessMessage}</span>
                              </div>
                            )}

                            {certificates.length === 0 ? (
                              <div className="p-8 border-2 border-dashed border-brand-border rounded-2xl text-center shadow-inner">
                                <Trophy className="mx-auto text-text-secondary scale-125 mb-3" size={32} />
                                <p className="font-semibold tracking-tight text-sm text-text-secondary">Nie posiadasz jeszcze ukończonych kursów.</p>
                                <p className="text-[10px] text-text-secondary mt-1 font-mono">Ukończ wszystkie lekcje w wybranym kursie, aby odblokować certyfikat autoryzowany przez Stripe.</p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {certificates.map(cert => (
                                  <div key={cert.id} className="p-5 rounded-2xl border border-neutral-250 bg-accent-purple/15 flex flex-col justify-between space-y-4 shadow-sm hover:shadow transition-all">
                                    <div className="flex justify-between items-start">
                                      <div className="flex items-center space-x-3">
                                        <div className="p-3 bg-amber-400/10 text-amber-700 rounded-xl">
                                          <Trophy size={20} />
                                        </div>
                                        <div>
                                          <h4 className="font-bold text-xs font-mono uppercase text-amber-800 tracking-wider">Certyfikat Ukończenia</h4>
                                          <p className="font-bold text-sm text-text-primary leading-snug mt-1">{cert.course_title}</p>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="space-y-1 bg-brand-card p-3 rounded-xl border border-brand-border font-mono text-[9px] text-text-primary">
                                      <p><span className="font-bold text-text-primary">Kod weryfikacyjny:</span> {cert.certificate_code}</p>
                                      <p><span className="font-bold text-text-primary">Odbiorca:</span> {cert.first_name} {cert.last_name}</p>
                                      <p><span className="font-bold text-text-primary">Wygenerowano:</span> {new Date(cert.created_at).toLocaleString()}</p>
                                      <p><span className="font-bold text-text-primary">Uwierzytelnienie:</span> Integracja Stripe VIP Webhook</p>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedCertificateForPreview(cert);
                                          setPreviewSelectedStyle((cert.template_style as any) || 'classical');
                                        }}
                                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-text-primary py-2 rounded-lg text-xs font-bold font-mono text-center transition cursor-pointer border-none flex items-center justify-center space-x-1"
                                      >
                                        <Award size={13} />
                                        <span>Podgląd i Szablony</span>
                                      </button>
                                      <button
                                        type="button"
                                        disabled={resendingCertId === cert.id}
                                        onClick={() => handleResendCertificate(cert.id)}
                                        className="bg-brand-card border border-brand-border text-text-primary py-2 px-3 rounded-lg text-xs font-bold font-mono hover:bg-brand-bg transition flex items-center justify-center space-x-1 cursor-pointer"
                                        title="Wyślij ponownie na adres email"
                                      >
                                        <Mail size={13} />
                                        <span>{resendingCertId === cert.id ? 'Wysyłanie...' : 'E-mail'}</span>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      }

                      // RENDER CORE BLOCK: ZERO TRUST SYSTEM LOGS
                      if (widget.id === 'logs') {
                        return (
                          <div 
                            key="logs"
                            className={`transition-all bg-brand-card p-5 md:p-6 rounded-2xl border border-brand-border space-y-4 shadow-sm ${
                              isPersonalizing ? 'border-4 border-dashed border-amber-400 bg-amber-400/5' : ''
                            }`}
                          >
                            {isPersonalizing && (
                              <div className="flex items-center space-x-2 text-xs font-mono text-amber-600 px-3 py-1 bg-amber-50 rounded-t-2xl border-b border-amber-200 font-bold">
                                <GripVertical size={13} />
                                <span>Ruchomy Panel Widżetu: Dziennik Autoryzacji Zero Trust (# {index + 1})</span>
                              </div>
                            )}

                            <div>
                              <h3 className="text-xl font-semibold tracking-tight text-text-primary flex items-center space-x-2">
                                <ShieldCheck className="text-emerald-600 animate-pulse" size={20} />
                                <span>Log Uwierzytelnienia (Zero Trust Security Logs)</span>
                              </h3>
                              <p className="text-xs text-text-secondary mt-1 pb-1">
                                Rejestr wywołań w tle dedykowany dla {currentUser?.first_name} {currentUser?.last_name}. Każde pobranie wideo i token jest szyfrowane i logowane w bazie SQLite.
                              </p>
                            </div>

                            <div className="bg-accent-purple text-text-secondary p-4 rounded-xl font-mono text-[10px] space-y-1.5 max-h-36 overflow-y-auto border border-neutral-800">
                              <p className="text-emerald-400 font-bold">// SYSTEM READY - VERIFYING ENCRYPTED SESSION KEYS</p>
                              <p className="text-text-secondary font-mono">IP: 192.168.1.100 • Platform: Cloud Run Sandboxed Engine</p>
                              <p className="text-text-secondary font-mono">JWT Key: Active HSM Symmetric Signature</p>
                              {certificates.length > 0 && (
                                <p className="text-[rgb(250,250,250)] font-mono">INFO: Wykryto {certificates.length} aktywnych rejestrów certyfikacji w systemie.</p>
                              )}
                              <p className="text-text-secondary font-mono">// End of secure debug trace</p>
                            </div>
                          </div>
                        );
                      }

                      return null;
                    })}
                  </div>

                </div>
              )}

              {/* STUDENT TAB: DOWNLOADS */}
              {studentTab === 'downloads' && (
                <div className="bg-brand-card p-6 md:p-7 rounded-2xl border border-brand-border space-y-5">
                  <h2 className="text-2xl font-semibold tracking-tight">Centrum Materiałów Integracyjnych i PDF</h2>
                  <p className="text-xs opacity-60">Pobierz autoryzowane podręczniki oraz instrukcje zintegrowane bezpośrednio z systemem.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-brand-bg border border-brand-border flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <FileText className="text-rose-500" size={24} />
                        <div>
                          <p className="text-xs font-bold font-mono text-text-primary">Krytyczny Skrypt token-handler.js</p>
                          <p className="text-[10px] opacity-50 font-mono">Format: JAVASCRIPT • Rozmiar: 12 KB</p>
                        </div>
                      </div>
                      <button onClick={() => alert("Skrypt integracji Javascript został wygenerowany i pobrany!")} className="p-2 hover:bg-black/5 rounded-lg text-text-primary">
                        <Download size={18} />
                      </button>
                    </div>

                    <div className="p-4 rounded-xl bg-brand-bg border border-brand-border flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <FileText className="text-rose-500" size={24} />
                        <div>
                          <p className="text-xs font-bold font-mono text-text-primary">Podręcznik Docker & K8s Core Cheatsheet</p>
                          <p className="text-[10px] opacity-50 font-mono">Format: PDF • Rozmiar: 4.8 MB</p>
                        </div>
                      </div>
                      <button onClick={() => alert("Arkusz skrótów Docker został pobrany pomyślnie!")} className="p-2 hover:bg-black/5 rounded-lg text-text-primary">
                        <Download size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STUDENT TAB: BILLING */}
              {studentTab === 'billing' && (
                <div className="bg-brand-card p-6 md:p-7 rounded-2xl border border-brand-border space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Rozliczenia, Zakupy i Faktury</h2>
                    <p className="text-xs opacity-60 mt-1">Zarządzaj dostępem do kursów i pobieraj potwierdzenia wpłat.</p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-text-secondary">Historia Płatności i Subskrypcji (SQLite)</h3>
                    
                    <div className="border border-brand-border rounded-2xl overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-brand-bg border-b border-brand-border">
                            <th className="p-4 text-[10px] font-mono uppercase text-text-secondary">Kurs / Plan</th>
                            <th className="p-4 text-[10px] font-mono uppercase text-text-secondary">Kwota</th>
                            <th className="p-4 text-[10px] font-mono uppercase text-text-secondary">Bramka wejściowa</th>
                            <th className="p-4 text-[10px] font-mono uppercase text-text-secondary">Identyfikator Transakcji</th>
                            <th className="p-4 text-[10px] font-mono uppercase text-text-secondary">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboardStats?.payments?.map((pay: any) => (
                            <tr key={pay.id} className="border-b border-brand-border last:border-0 text-xs">
                              <td className="p-4 font-bold">{pay.course_title || 'Pakiet Premum Access'}</td>
                              <td className="p-4 font-mono font-bold">${pay.amount}</td>
                              <td className="p-4 font-mono opacity-80">{pay.payment_provider}</td>
                              <td className="p-4 font-mono opacity-50">{pay.transaction_id}</td>
                              <td className="p-4">
                                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-mono uppercase px-2 py-0.5 rounded">
                                  {pay.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* STUDENT TAB: ACCOUNT */}
              {studentTab === 'account' && (
                <div className="space-y-6">
                  {/* EDIT PROFILE MODULE */}
                  <form onSubmit={handleUpdateProfile} className="bg-brand-card p-6 md:p-7 rounded-2xl border border-brand-border space-y-5">
                    <div>
                      <h2 className="text-xl font-semibold tracking-tight text-text-primary flex items-center space-x-2">
                        <Settings size={20} className="text-accent-blue animate-pulse" />
                        <span>Ustawienia Profilu i Integracji VPS</span>
                      </h2>
                      <p className="text-xs text-text-secondary mt-1">
                        Konfiguracja profilu studenta i tożsamości w bazie HRL Academy Core.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-text-secondary">Imię</label>
                        <input 
                          type="text" 
                          value={profileFirstName}
                          onChange={(e) => setProfileFirstName(e.target.value)}
                          placeholder="Imię"
                          className="w-full bg-brand-bg border border-brand-border px-4 py-2.5 rounded-xl text-xs font-semibold text-text-primary outline-none focus:border-accent-blue/50 transition-colors"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-text-secondary">Nazwisko</label>
                        <input 
                          type="text" 
                          value={profileLastName}
                          onChange={(e) => setProfileLastName(e.target.value)}
                          placeholder="Nazwisko"
                          className="w-full bg-brand-bg border border-brand-border px-4 py-2.5 rounded-xl text-xs font-semibold text-text-primary outline-none focus:border-accent-blue/50 transition-colors"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-text-secondary">Adres E-mail</label>
                        <input 
                          type="email" 
                          value={profileEmail}
                          onChange={(e) => setProfileEmail(e.target.value)}
                          placeholder="Adres e-mail"
                          className="w-full bg-brand-bg border border-brand-border px-4 py-2.5 rounded-xl text-xs font-semibold text-text-primary outline-none focus:border-accent-blue/50 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={isUpdatingProfile}
                        className="bg-gradient-to-r from-accent-purple to-accent-blue hover:from-accent-purple/90 hover:to-accent-blue/90 text-white text-xs px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md disabled:opacity-50"
                      >
                        {isUpdatingProfile ? 'Zapisywanie...' : 'Zapisz dane profilu'}
                      </button>
                    </div>
                  </form>

                  {/* RESET PASSWORD MODULE */}
                  <form onSubmit={handleChangePassword} className="bg-brand-card p-6 md:p-7 rounded-2xl border border-brand-border space-y-5">
                    <div>
                      <h2 className="text-xl font-semibold tracking-tight text-text-primary flex items-center space-x-2">
                        <Lock size={18} className="text-rose-500" />
                        <span>Zabezpieczenia i Zmiana Hasła</span>
                      </h2>
                      <p className="text-xs text-text-secondary mt-1">
                        Zmień swoje hasło, aby zachować najwyższy poziom bezpieczeństwa JWT sesji.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-text-secondary">Obecne Hasło</label>
                        <input 
                          type="password" 
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-brand-bg border border-brand-border px-4 py-2.5 rounded-xl text-xs font-mono text-text-primary outline-none focus:border-accent-blue/50 transition-colors"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-text-secondary">Nowe Hasło (min. 6 znaków)</label>
                        <input 
                          type="password" 
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-brand-bg border border-brand-border px-4 py-2.5 rounded-xl text-xs font-mono text-text-primary outline-none focus:border-accent-blue/50 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={isChangingPassword}
                        className="bg-brand-bg border border-rose-500/30 hover:border-rose-500/50 hover:bg-rose-500/5 text-rose-400 text-xs px-5 py-2.5 rounded-xl font-semibold transition-all disabled:opacity-50"
                      >
                        {isChangingPassword ? 'Zmienianie...' : 'Zmień hasło logowania'}
                      </button>
                    </div>
                  </form>

                  {/* USER PERSONAL ACTIVITIES LOGS TIMELINE */}
                  <div className="bg-brand-card p-6 md:p-7 rounded-2xl border border-brand-border space-y-5">
                    <div>
                      <h2 className="text-xl font-semibold tracking-tight text-text-primary flex items-center space-x-2">
                        <Terminal size={18} className="text-emerald-500" />
                        <span>Dziennik Moich Aktywności HRL</span>
                      </h2>
                      <p className="text-xs text-text-secondary mt-1">
                        Twoje ostatnie akcje, logowania i postępy zapisane bezpiecznie w rejestrze systemowym SQLite.
                      </p>
                    </div>

                    <div className="pt-2">
                      {profileLogs && profileLogs.length > 0 ? (
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                          {profileLogs.map((log: any) => (
                            <div key={log.id} className="p-3 bg-brand-bg rounded-xl border border-brand-border text-xs flex justify-between items-center space-x-4">
                              <div className="space-y-1">
                                <span className="font-mono text-[10px] uppercase font-bold text-accent-blue bg-accent-blue/10 px-2 py-0.5 rounded mr-2">
                                  {log.action}
                                </span>
                                <p className="text-text-primary font-medium text-xs mt-1 leading-relaxed">
                                  {log.details}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-mono text-[10px] text-text-secondary block">
                                  {new Date(log.created_at).toLocaleString('pl-PL')}
                                </span>
                                {log.ip_address && (
                                  <span className="font-mono text-[9px] text-[#22c55e] block">
                                    IP: {log.ip_address}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-text-secondary text-center py-4">
                          Brak zarejestrowanych zdarzeń w Twoim profilu.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-brand-card p-6 md:p-7 rounded-2xl border border-brand-border pt-6 mt-8">
                    <h3 className="font-semibold text-sm mb-4">Zgłoszenia Prawne i Kontakt z Punktem Obsługi</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      <div className="p-4 bg-accent-blue/10/50 rounded-xl border border-accent-blue/20 text-xs">
                        <p className="font-mono text-[10px] text-indigo-500 font-semibold mb-1 uppercase tracking-wider">Komunikacja Biznesowa</p>
                        <p className="font-medium text-text-primary mb-2">Zapytania ofertowe, wsparcie techniczne oraz status zamówień.</p>
                        <a href="mailto:contact@hardbanrecordslab.online" className="text-accent-blue font-semibold hover:underline">contact@hardbanrecordslab.online</a>
                      </div>
                      
                      <div className="p-4 bg-brand-bg rounded-xl border border-brand-border text-xs">
                        <p className="font-mono text-[10px] text-text-secondary font-semibold mb-1 uppercase tracking-wider">Sprawy Legal / Regulaminy</p>
                        <p className="font-medium text-text-primary mb-2">Przetwarzanie danych osobowych, RODO, oraz zgłoszenia prawne.</p>
                        <a href="mailto:info@hardbanrecordslab.online" className="text-accent-blue font-semibold hover:underline">info@hardbanrecordslab.online</a>
                      </div>

                      <div className="p-4 bg-brand-bg rounded-xl border border-brand-border text-xs md:col-span-2">
                        <p className="font-mono text-[10px] text-text-secondary font-semibold mb-1 uppercase tracking-wider">Komunikaty Systemowe</p>
                        <p className="font-medium text-text-primary mb-2">Powiadomienia systemowe wysyłane są bezpośrednio z adresu no-reply.</p>
                        <span className="text-text-secondary font-semibold">no-reply@hardbanrecordslab.online</span>
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {/* STUDENT TAB: FAQ & POMOC */}
              {studentTab === 'faq' && (
                <div className="bg-brand-card p-6 md:p-7 rounded-2xl border border-brand-border space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight">FAQ & Pomoc Techniczna</h2>
                    <p className="text-xs opacity-60 font-mono mt-1">Baza wiedzy dotycząca dostępu i rozliczeń.</p>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="border border-brand-border rounded-xl p-5 bg-brand-bg relative overflow-hidden group">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-blue opacity-50 group-hover:opacity-100 transition-opacity"></div>
                      <h3 className="font-semibold text-text-primary text-sm mb-2 flex items-center space-x-2">
                        <BookOpen size={16} className="text-accent-blue" />
                        <span>Jak uzyskać dostęp do zakupionego kursu?</span>
                      </h3>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        Po sfinalizowaniu płatności poprzez bramkę Stripe, system automatycznie autoryzuje dostęp przypisany do Twojego konta. Przejdź do zakładki "Moje Kursy i Nauka", aby zobaczyć wszystkie dostępne materiały.
                      </p>
                    </div>

                    <div className="border border-brand-border rounded-xl p-5 bg-brand-bg relative overflow-hidden group">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-purple opacity-50 group-hover:opacity-100 transition-opacity"></div>
                      <h3 className="font-semibold text-text-primary text-sm mb-2 flex items-center space-x-2">
                        <CreditCard size={16} className="text-accent-purple" />
                        <span>Gdzie mogę pobrać faktury za ukończone płatności?</span>
                      </h3>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        Wszystkie faktury są generowane automatycznie i zapisywane w systemie. Przejdź do sekcji "Płatności i Faktury" z menu bocznego, aby pobrać historię bilingową w formacie PDF (SQLite zrzut pamięci).
                      </p>
                    </div>

                    <div className="border border-brand-border rounded-xl p-5 bg-brand-bg relative overflow-hidden group">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                      <h3 className="font-semibold text-text-primary text-sm mb-2 flex items-center space-x-2">
                        <Terminal size={16} className="text-emerald-500" />
                        <span>Problem z certyfikatem NFT / Odtwarzaczem</span>
                      </h3>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        Jeśli autoryzacja sprzętowa (JWT Token) zawiedzie na zewnętrznym odtwarzaczu, spróbuj zamknąć sesję i zalogować się ponownie. W razie problemów napisz na adres contact@hardbanrecordslab.online.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* PORTAL VIEW: CREATOR */}
          {activePortal === 'creator' && (
            <div className="space-y-6 text-text-primary p-4 md:p-6 pb-20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-brand-border">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-text-primary">Konsola Wykładowcy (Creator Workspace)</h1>
                  <p className="text-xs text-text-secondary mt-1">
                    Twórz własne materiały e-learningowe, organizuj lekcje, nadzoruj postępy studentów i zarządzaj przyznanymi certyfikatami.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => { setShowCreatorAddCourse(true); }}
                    className="bg-accent-blue text-white hover:bg-accent-blue/90 font-semibold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-sm transition-all text-center"
                  >
                    <Plus size={14} />
                    <span>Nowy Kurs</span>
                  </button>
                  <button
                    onClick={() => {
                      if (creatorCourses.length === 0) {
                        alert("Musisz mieć przynajmniej jeden kurs, aby dodać lekcję.");
                        return;
                      }
                      setCreatorSelectedCourseId(creatorCourses[0].id);
                      setShowCreatorAddLesson(true);
                    }}
                    className="bg-brand-card hover:bg-brand-bg text-text-primary border border-brand-border font-semibold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-all text-center"
                  >
                    <Plus size={14} />
                    <span>Nowa Lekcja</span>
                  </button>
                </div>
              </div>

              {/* TABS NAVIGATION */}
              <div className="flex border-b border-brand-border space-x-1 overflow-x-auto shrink-0 scrollbar-none pb-0.5">
                {[
                  { id: 'stats', label: 'Dashboard i Analizy', icon: Activity },
                  { id: 'courses', label: 'Zarządzanie Kursami', icon: Layers },
                  { id: 'students', label: 'Lista Moich Studentów', icon: Users },
                  { id: 'certificates', label: 'Rejestr Certyfikatów', icon: Award },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setCreatorTab(tab.id as any)}
                    className={`px-4 py-2.5 font-semibold text-xs border-b-2 transition-all flex items-center space-x-1.5 shrink-0 ${creatorTab === tab.id ? 'border-accent-blue text-accent-purple bg-brand-card/50' : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-brand-card/30'}`}
                  >
                    <tab.icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {creatorLoading && (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue"></div>
                </div>
              )}

              {/* TAB: STATS */}
              {!creatorLoading && creatorTab === 'stats' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-brand-card p-5 rounded-xl border border-brand-border relative overflow-hidden">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-text-secondary">Własne Kursy</p>
                      <p className="text-2xl font-bold mt-2 text-text-primary">{creatorStats?.totalCourses || 0}</p>
                      <div className="absolute right-3 bottom-3 opacity-10 text-accent-blue"><Layers size={40} /></div>
                    </div>
                    <div className="bg-brand-card p-5 rounded-xl border border-brand-border relative overflow-hidden">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-text-secondary">Liczba Lekcji</p>
                      <p className="text-2xl font-bold mt-2 text-text-primary">{creatorStats?.totalLessons || 0}</p>
                      <div className="absolute right-3 bottom-3 opacity-10 text-accent-purple"><Clock size={40} /></div>
                    </div>
                    <div className="bg-brand-card p-5 rounded-xl border border-brand-border relative overflow-hidden">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-text-secondary">Aktywni Studenci</p>
                      <p className="text-2xl font-bold mt-2 text-text-primary">{creatorStats?.totalStudents || 0}</p>
                      <div className="absolute right-3 bottom-3 opacity-10 text-emerald-500"><Users size={40} /></div>
                    </div>
                    <div className="bg-brand-card p-5 rounded-xl border border-brand-border relative overflow-hidden">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-text-secondary">Wydane Certyfikaty</p>
                      <p className="text-2xl font-bold mt-2 text-text-primary">{creatorStats?.totalCertificates || 0}</p>
                      <div className="absolute right-3 bottom-3 opacity-10 text-amber-500"><Award size={40} /></div>
                    </div>
                    <div className="bg-brand-card p-5 rounded-xl border border-brand-border relative overflow-hidden">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-text-secondary">Przychód (Szacowany)</p>
                      <p className="text-2xl font-bold mt-2 text-text-primary">${creatorStats?.totalRevenue || 0}</p>
                      <div className="absolute right-3 bottom-3 opacity-10 text-rose-500"><CreditCard size={40} /></div>
                    </div>
                  </div>

                  <div className="bg-brand-card p-6 rounded-2xl border border-brand-border space-y-4">
                    <h3 className="font-semibold text-sm">Witamy w Panelu Autorskim Hardban Academy</h3>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Jako certyfikowany Wykładowca (CREATOR), posiadasz autonomię w tworzeniu portfolio materiałów dydaktycznych. Masz uprawnienia do dodawania rozbudowanych kursów z nielimitowanymi lekcjami oraz do śledzenia w czasie rzeczywistym logowań i postępów kursantów zapisanych na Twoje wykłady. 
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="p-4 bg-brand-bg rounded-xl border border-brand-border text-xs space-y-1.5 flex flex-col justify-between">
                        <div>
                          <p className="font-semibold text-text-primary">Zwracaj uwagę na jakość i drip-feed</p>
                          <p className="text-text-secondary mt-1">Każda lekcja może korzystać z zewnętrznych źródeł PDF lub wideo, co pozwoli studentom elastycznie przyswajać wiedzę.</p>
                        </div>
                      </div>
                      <div className="p-4 bg-brand-bg rounded-xl border border-brand-border text-xs space-y-1.5 flex flex-col justify-between">
                        <div>
                          <p className="font-semibold text-text-primary">Wizerunek Twoich certyfikatów</p>
                          <p className="text-text-secondary mt-1">Studenci mogą pobierać wygenerowane dyplomy z Twoim podpisem cyfrowym i uaktualniać ich styl zgodnie z zakupionymi pakietami premium.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: COURSES */}
              {!creatorLoading && creatorTab === 'courses' && (
                <div className="space-y-6">
                  {/* MODAL / COLLAPSIBLE ADD NEW COURSE FORM */}
                  {showCreatorAddCourse && (
                    <form onSubmit={handleCreatorCreateCourse} className="bg-brand-card p-5 rounded-2xl border border-accent-blue/30 space-y-4 animate-fadeIn">
                      <div className="flex justify-between items-center pb-2 border-b border-brand-border">
                        <h4 className="font-bold text-sm">Utwórz Nowy Program Kursu</h4>
                        <button type="button" onClick={() => setShowCreatorAddCourse(false)} className="text-text-secondary hover:text-text-primary"><X size={16} /></button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                          <label className="font-semibold text-text-secondary">Tytuł Kursu</label>
                          <input
                            type="text"
                            required
                            value={creatorNewCourseTitle}
                            onChange={e => setCreatorNewCourseTitle(e.target.value)}
                            placeholder="np. Architektura Sieci VPS i VPN Core"
                            className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-xs outline-none focus:border-accent-blue/50"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-semibold text-text-secondary">Adres przyjazny (Slug) - opcjonalnie</label>
                          <input
                            type="text"
                            value={creatorNewCourseSlug}
                            onChange={e => setCreatorNewCourseSlug(e.target.value)}
                            placeholder="np. architektura-sieci-vps-vpn"
                            className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-xs outline-none focus:border-accent-blue/50"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-semibold text-text-secondary">Typ dostępu</label>
                          <select
                            value={creatorNewCourseAccess}
                            onChange={e => setCreatorNewCourseAccess(e.target.value as any)}
                            className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-xs outline-none focus:border-accent-blue/50"
                          >
                            <option value="free">Bezpłatny (Freebie)</option>
                            <option value="premium">Płatny Jednorazowo (Premium)</option>
                            <option value="subscription">Dla Subskrybentów (All-Access)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="font-semibold text-text-secondary">Cena ($)</label>
                          <input
                            type="number"
                            value={creatorNewCoursePrice}
                            onChange={e => setCreatorNewCoursePrice(Number(e.target.value))}
                            className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-xs outline-none focus:border-accent-blue/50"
                          />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <label className="font-semibold text-text-secondary">Adres URL okładki (PNG/JPG)</label>
                          <input
                            type="text"
                            value={creatorNewCourseThumbnail}
                            onChange={e => setCreatorNewCourseThumbnail(e.target.value)}
                            placeholder="https://images.unsplash.com/..."
                            className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-xs outline-none focus:border-accent-blue/50"
                          />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <label className="font-semibold text-text-secondary">Krótki opis / sylabus programu</label>
                          <textarea
                            rows={3}
                            value={creatorNewCourseDesc}
                            onChange={e => setCreatorNewCourseDesc(e.target.value)}
                            placeholder="Zwięzłe streszczenie programowe dla kursantów."
                            className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-xs outline-none focus:border-accent-blue/50"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 pt-2">
                        <button type="button" onClick={() => setShowCreatorAddCourse(false)} className="px-4 py-2 bg-brand-bg border border-brand-border text-text-primary rounded-xl text-xs font-semibold">Anuluj</button>
                        <button type="submit" className="px-4 py-2 bg-accent-blue text-white rounded-xl text-xs font-semibold transition-all hover:bg-accent-blue/90">Utwórz program</button>
                      </div>
                    </form>
                  )}

                  {/* MODAL / COLLAPSIBLE ADD NEW LESSON FORM */}
                  {showCreatorAddLesson && (
                    <form onSubmit={handleCreatorCreateLesson} className="bg-brand-card p-5 rounded-2xl border border-accent-blue/30 space-y-4 animate-fadeIn">
                      <div className="flex justify-between items-center pb-2 border-b border-brand-border">
                        <h4 className="font-bold text-sm">Dodaj Lekcję do Kursu</h4>
                        <button type="button" onClick={() => setShowCreatorAddLesson(false)} className="text-text-secondary hover:text-text-primary"><X size={16} /></button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1 md:col-span-2">
                          <label className="font-semibold text-text-secondary">Wybierz docelowy kurs</label>
                          <select
                            value={creatorSelectedCourseId || ''}
                            onChange={e => setCreatorSelectedCourseId(Number(e.target.value))}
                            className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-xs outline-none focus:border-accent-blue/50"
                          >
                            {creatorCourses.map(c => (
                              <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <label className="font-semibold text-text-secondary">Tytuł Lekcji / Temat</label>
                          <input
                            type="text"
                            required
                            value={creatorNewLessonTitle}
                            onChange={e => setCreatorNewLessonTitle(e.target.value)}
                            placeholder="Wprowadzenie teoretyczne i wdrożenie serwera"
                            className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-xs outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-semibold text-text-secondary">Typ materiału dydaktycznego</label>
                          <select
                            value={creatorNewLessonType}
                            onChange={e => setCreatorNewLessonType(e.target.value as any)}
                            className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-xs outline-none focus:border-accent-blue/50"
                          >
                            <option value="video">Wideo MP4 / Bunny Stream</option>
                            <option value="pdf">Dokument PDF / Instrukcje</option>
                            <option value="audio">Ścieżka dźwiękowa podcastu / Audio</option>
                            <option value="iframe">Zewnętrzna Konsola (iFrame)</option>
                            <option value="download">Plik do pobrania (.zip, .config)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="font-semibold text-text-secondary">Orientacyjny czas nauki (minuty)</label>
                          <input
                            type="number"
                            value={creatorNewLessonDuration}
                            onChange={e => setCreatorNewLessonDuration(Number(e.target.value))}
                            className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-xs outline-none"
                          />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <label className="font-semibold text-text-secondary">Adres URL pliku / kontentu</label>
                          <input
                            type="text"
                            value={creatorNewLessonUrl}
                            onChange={e => setCreatorNewLessonUrl(e.target.value)}
                            placeholder="https://bunny-infra-files.net/lesson1.pdf"
                            className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-xs outline-none focus:border-accent-blue/50"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 pt-2">
                        <button type="button" onClick={() => setShowCreatorAddLesson(false)} className="px-4 py-2 bg-brand-bg border border-brand-border text-text-primary rounded-xl text-xs font-semibold">Anuluj</button>
                        <button type="submit" className="px-4 py-2 bg-accent-blue text-white rounded-xl text-xs font-semibold transition-all hover:bg-accent-blue/90">Dodaj lekcję</button>
                      </div>
                    </form>
                  )}

                  {adminQuizCourse ? (
                    <div className="space-y-6">
                      <div className="bg-brand-card p-5 rounded-2xl border border-brand-border space-y-4 shadow-sm animate-fade-in text-text-primary">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-brand-border pb-4">
                          <div>
                            <span className="text-[10px] font-mono bg-accent-purple/10 text-accent-purple px-2 py-0.5 rounded font-bold uppercase">Edycja Quizów</span>
                            <h3 className="font-bold text-base text-text-primary mt-1">{adminQuizCourse.title}</h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => { setAdminQuizCourse(null); setAdminSelectedLesson(null); }}
                            className="text-xs bg-brand-bg hover:bg-brand-card text-text-secondary hover:text-text-primary px-3 py-2 rounded-xl border border-brand-border cursor-pointer transition-colors"
                          >
                            Powrót do kursów
                          </button>
                        </div>

                        {/* Two columns layout: Lessons list on left, Quiz questions editor on right */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                          {/* Left Column: Lessons list */}
                          <div className="lg:col-span-4 space-y-4">
                            <h4 className="font-bold text-xs text-text-primary uppercase tracking-wider">Lekcje Kursu</h4>
                            <div className="space-y-3">
                              {adminCourseStructure?.modules?.map((mod: any, mIdx: number) => (
                                <div key={mod.id} className="space-y-1">
                                  <div className="text-[11px] font-bold text-text-secondary bg-brand-bg px-2.5 py-1 rounded border border-brand-border">
                                    Moduł {mIdx + 1}: {mod.title}
                                  </div>
                                  <div className="space-y-1 pl-1">
                                    {mod.lessons?.map((lesson: any) => {
                                      const isSelected = adminSelectedLesson?.id === lesson.id;
                                      return (
                                        <div
                                          key={lesson.id}
                                          onClick={() => handleAdminLoadQuiz(lesson)}
                                          className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                                            isSelected 
                                              ? 'bg-accent-blue/10 border-accent-blue/50 text-text-primary font-semibold' 
                                              : 'bg-brand-card hover:bg-brand-bg border-brand-border text-text-secondary'
                                          }`}
                                        >
                                          <span className="truncate">{lesson.title}</span>
                                          {(lesson.passing_score && lesson.passing_score > 0) ? (
                                            <span className="text-[8px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ml-1">PRÓG: {lesson.passing_score}%</span>
                                          ) : null}
                                        </div>
                                      );
                                    })}
                                    {(!mod.lessons || mod.lessons.length === 0) && (
                                      <p className="text-[11px] text-text-secondary italic p-2 text-center">Brak lekcji</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Right Column: Active quiz settings and questions list */}
                          <div className="lg:col-span-8 space-y-6">
                            {adminSelectedLesson ? (
                              adminQuizLoading ? (
                                <div className="h-64 flex items-center justify-center text-text-secondary text-xs font-mono">
                                  <RefreshCw className="animate-spin mr-2" size={14} />
                                  <span>Ładowanie danych quizowych...</span>
                                </div>
                              ) : (
                                <div className="space-y-6">
                                  {/* Section: Passing score threshold control */}
                                  <form onSubmit={handleAdminSavePassingScore} className="bg-brand-bg p-4 rounded-xl border border-brand-border space-y-4">
                                    <div className="flex justify-between items-center">
                                      <h5 className="font-bold text-xs text-text-primary">Próg Zaliczeniowy Lekcji: {adminSelectedLesson.title}</h5>
                                      <span className="text-[10px] font-mono text-text-secondary font-semibold">Wpisz 0 aby wyłączyć quiz</span>
                                    </div>
                                    <div className="flex items-center space-x-3 text-xs">
                                      <div className="relative max-w-xs w-full">
                                        <input
                                          type="number"
                                          min="0"
                                          max="100"
                                          required
                                          value={adminLessonQuizPassingScore}
                                          onChange={e => setAdminLessonQuizPassingScore(Number(e.target.value))}
                                          placeholder="Próg zaliczeniowy np. 85"
                                          className="w-full bg-brand-card border border-brand-border rounded-lg pl-3 pr-8 py-2 text-xs outline-none text-text-primary font-bold"
                                        />
                                        <span className="absolute right-3 top-2 text-text-secondary font-mono text-[11px]">%</span>
                                      </div>
                                      <button
                                        type="submit"
                                        className="px-4 py-2 bg-accent-blue hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer border-none"
                                      >
                                        Zapisz próg
                                      </button>
                                    </div>
                                  </form>

                                  {/* Section: Add new multiple choice question */}
                                  <form onSubmit={handleAdminAddQuestion} className="bg-brand-bg p-4 rounded-xl border border-brand-border space-y-4">
                                    <h5 className="font-bold text-xs text-text-primary">Utwórz Nowe Pytanie Quizowe</h5>
                                    <div className="space-y-3 text-xs">
                                      <div className="space-y-1">
                                        <label className="font-semibold text-text-secondary">Treść pytania</label>
                                        <input
                                          type="text"
                                          required
                                          placeholder="np. Jakie jest domyślne zachowanie zapory sieciowej typu statefull?"
                                          value={adminNewQuestionText}
                                          onChange={e => setAdminNewQuestionText(e.target.value)}
                                          className="w-full bg-brand-card border border-brand-border rounded-lg px-3 py-2 text-xs outline-none text-text-primary"
                                        />
                                      </div>

                                      <div className="space-y-1">
                                        <label className="font-semibold text-text-secondary">Opcje odpowiedzi jednokrotnego wyboru</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                          {adminNewQuestionOptions.map((opt, oIdx) => (
                                            <div key={oIdx} className="flex items-center space-x-2">
                                              <span className="font-mono text-[10px] text-text-secondary w-12 shrink-0">Opcja {oIdx + 1}</span>
                                              <input
                                                type="text"
                                                required
                                                placeholder={`Odpowiedź ${String.fromCharCode(65 + oIdx)}`}
                                                value={opt}
                                                onChange={e => {
                                                  const copy = [...adminNewQuestionOptions];
                                                  copy[oIdx] = e.target.value;
                                                  setAdminNewQuestionOptions(copy);
                                                }}
                                                className="w-full bg-brand-card border border-brand-border rounded-lg px-2.5 py-1.5 text-xs outline-none text-text-primary"
                                              />
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      <div className="space-y-1">
                                        <label className="font-semibold text-text-secondary">Wskaż prawidłową odpowiedź</label>
                                        <select
                                          value={adminNewQuestionCorrectIndex}
                                          onChange={e => setAdminNewQuestionCorrectIndex(Number(e.target.value))}
                                          className="w-full bg-brand-card border border-brand-border rounded-lg px-3 py-2 text-xs outline-none text-text-primary font-bold"
                                        >
                                          {adminNewQuestionOptions.map((_, oIdx) => (
                                            <option key={oIdx} value={oIdx}>Opcja {oIdx + 1} ({adminNewQuestionOptions[oIdx] || "brak tekstu..."})</option>
                                          ))}
                                        </select>
                                      </div>

                                      <div className="flex justify-end pt-2">
                                        <button
                                          type="submit"
                                          className="px-4 py-2 bg-accent-purple hover:bg-neutral-850 text-white rounded-lg text-xs font-bold transition-all cursor-pointer border-none"
                                        >
                                          Dodaj Pytanie do Quizu
                                        </button>
                                      </div>
                                    </div>
                                  </form>

                                  {/* Section: List existing quiz questions */}
                                  <div className="space-y-4">
                                    <h5 className="font-bold text-xs text-text-primary uppercase tracking-wider">Zdefiniowane Pytania ({adminLessonQuizQuestions.length})</h5>
                                    {adminLessonQuizQuestions.length > 0 ? (
                                      <div className="space-y-3">
                                        {adminLessonQuizQuestions.map((q, qIdx) => {
                                          let optsList: string[] = [];
                                          try {
                                            optsList = typeof q.options_json === 'string' ? JSON.parse(q.options_json) : (q.options || q.options_json || []);
                                          } catch (e) {
                                            optsList = q.options || [];
                                          }

                                          return (
                                            <div key={q.id} className="bg-brand-bg p-4 rounded-xl border border-brand-border space-y-3 text-xs shadow-sm relative text-text-primary">
                                              <button
                                                type="button"
                                                onClick={() => handleAdminDeleteQuestion(q.id)}
                                                className="absolute top-4 right-4 p-1.5 rounded hover:bg-rose-500/10 text-rose-500 hover:border hover:border-rose-500/20 cursor-pointer bg-transparent border-none transition-colors"
                                                title="Usuń to pytanie"
                                              >
                                                <Trash2 size={14} />
                                              </button>

                                              <p className="font-semibold text-xs text-text-primary pr-8 flex items-start space-x-2">
                                                <span className="font-mono bg-brand-card border border-brand-border px-1.5 py-0.5 rounded text-[10px] text-text-secondary shrink-0">{qIdx + 1}</span>
                                                <span>{q.question_text}</span>
                                              </p>

                                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-7">
                                                {optsList.map((opt, oIdx) => {
                                                  const isCorrect = q.correct_option_index === oIdx;
                                                  return (
                                                    <div
                                                      key={oIdx}
                                                      className={`p-2 rounded border text-[11px] ${
                                                        isCorrect 
                                                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 font-bold' 
                                                          : 'bg-brand-card border-brand-border text-text-secondary'
                                                      }`}
                                                    >
                                                      {isCorrect ? '✓ ' : '• '}{opt}
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-text-secondary bg-brand-bg rounded-xl border border-brand-border border-dashed p-6 text-center italic">
                                        Brak pytań przypisanych do tej lekcji. Dodaj pierwsze pytanie powyżej!
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )
                            ) : (
                              <div className="h-96 border border-brand-border border-dashed rounded-2xl flex flex-col items-center justify-center p-8 text-center text-text-secondary">
                                <Award className="opacity-25 mb-4 text-accent-purple" size={48} />
                                <p className="font-bold text-sm text-text-primary">Nie wybrano żadnej lekcji</p>
                                <p className="text-xs text-text-secondary max-w-xs mt-1">Kliknij lekcję w drzewie po lewej stronie, by edytować próg zaliczenia i układać pytania zamknięte jednokrotnego wyboru.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {creatorCourses && creatorCourses.length > 0 ? (
                        creatorCourses.map((course: any) => (
                          <div key={course.id} className="bg-brand-card p-5 rounded-2xl border border-brand-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:border-brand-border-hover">
                            <div className="flex items-center space-x-4">
                              <img
                                src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=300'}
                                alt={course.title}
                                referrerPolicy="no-referrer"
                                className="w-16 h-16 rounded-xl object-cover border border-brand-border shrink-0"
                              />
                              <div className="space-y-1">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${course.access_type === 'free' ? 'bg-[#22c55e]/10 text-[#22c55e]' : course.access_type === 'premium' ? 'bg-[#3b82f6]/10 text-[#3b82f6]' : 'bg-[#a855f7]/10 text-[#a855f7]'}`}>
                                  {course.access_type} {course.price > 0 ? `(${course.price} USD)` : ''}
                                </span>
                                <h4 className="font-bold text-sm text-text-primary leading-tight mt-1">{course.title}</h4>
                                <p className="text-xs text-text-secondary font-mono">ID: {course.id} | Slug: {course.slug} | {course.lessons_count || 0} lekcji</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 shrink-0">
                              <button
                                onClick={() => handleAdminSelectCourseForQuiz(course)}
                                className="px-3 py-1.5 bg-accent-purple/10 text-accent-purple border border-accent-purple/20 hover:bg-accent-purple/20 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1"
                              >
                                <Award size={13} />
                                <span>Quizy i Testy</span>
                              </button>
                              <button
                                onClick={() => {
                                  setCreatorSelectedCourseId(course.id);
                                  setShowCreatorAddLesson(true);
                                }}
                                className="px-3 py-1.5 bg-accent-blue/10 text-accent-blue border border-accent-blue/20 hover:bg-accent-blue/20 rounded-xl text-xs font-semibold transition-colors"
                              >
                                Dodaj Lekcję
                              </button>
                              <button
                                onClick={() => handleCreatorDeleteCourse(course.id)}
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-xl transition-colors"
                                title="Usuń kurs"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 bg-brand-card rounded-2xl border border-brand-border space-y-3">
                          <p className="text-text-secondary text-sm">Nie dodałeś jeszcze żadnych kursów.</p>
                          <button
                            onClick={() => setShowCreatorAddCourse(true)}
                            className="px-4 py-2 bg-gradient-to-r from-accent-purple to-accent-blue text-white rounded-xl text-xs font-bold transition-all transform hover:scale-105 active:scale-95 animate-pulse"
                          >
                            Utwórz Mój Pierwszy Kurs
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB: STUDENTS */}
              {!creatorLoading && creatorTab === 'students' && (
                <div className="bg-brand-card rounded-2xl border border-brand-border overflow-hidden">
                  <div className="p-5 border-b border-brand-border">
                    <h3 className="font-bold text-sm text-text-primary">Kursanci Zarejestrowani Do Twoich Wykładów</h3>
                    <p className="text-xs text-text-secondary mt-1">Ewidencja uczestników Twoich modułów.</p>
                  </div>
                  {creatorStudents && creatorStudents.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-brand-bg text-text-secondary font-mono border-b border-brand-border text-[10px] uppercase">
                            <th className="p-4 font-semibold">Dane Kursanta</th>
                            <th className="p-4 font-semibold">Nazwa Programu</th>
                            <th className="p-4 font-semibold">Typ Kontraktu</th>
                            <th className="p-4 font-semibold">Data Zapisu</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border text-text-primary">
                          {creatorStudents.map((item: any, idx: number) => (
                            <tr key={idx} className="hover:bg-brand-bg/40 transition-colors">
                              <td className="p-4 font-medium">
                                <div className="text-text-primary font-semibold">{item.first_name} {item.last_name}</div>
                                <div className="text-[10px] text-text-secondary font-mono">{item.email}</div>
                              </td>
                              <td className="p-4 font-semibold text-text-primary">{item.course_title}</td>
                              <td className="p-4 font-mono font-bold uppercase text-[10px] text-accent-blue">{item.access_type}</td>
                              <td className="p-4 text-text-secondary">{new Date(item.enrolled_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-text-secondary text-xs">
                      Brak studentów zapisanych na Twoje kursy w tym momencie.
                    </div>
                  )}
                </div>
              )}

              {/* TAB: CERTIFICATES */}
              {!creatorLoading && creatorTab === 'certificates' && (
                <div className="bg-brand-card rounded-2xl border border-brand-border overflow-hidden">
                  <div className="p-5 border-b border-brand-border">
                    <h3 className="font-bold text-sm text-text-primary">Wydane Certyfikaty Przez Twoje Kursy Portfolio</h3>
                    <p className="text-xs text-text-secondary mt-1">Rejestr wygenerowanych praw własności nauki (certyfikatów).</p>
                  </div>
                  {creatorCertificates && creatorCertificates.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-brand-bg text-text-secondary font-mono border-b border-brand-border text-[10px] uppercase">
                            <th className="p-4 font-semibold">Kod Certyfikatu</th>
                            <th className="p-4 font-semibold">Student</th>
                            <th className="p-4 font-semibold">Szkolenie</th>
                            <th className="p-4 font-semibold">Wzór Stylistyczny</th>
                            <th className="p-4 font-semibold">Udostępniono</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border text-text-primary">
                          {creatorCertificates.map((cert: any) => (
                            <tr key={cert.id} className="hover:bg-brand-bg/40 transition-colors">
                              <td className="p-4 font-mono font-bold text-accent-blue select-all text-[11px]">{cert.certificate_code}</td>
                              <td className="p-4 font-medium">
                                <div className="text-text-primary font-semibold">{cert.first_name} {cert.last_name}</div>
                                <div className="text-[10px] text-text-secondary mt-0.5">{cert.email}</div>
                              </td>
                              <td className="p-4 font-semibold text-text-primary">{cert.course_title}</td>
                              <td className="p-4">
                                <span className="bg-brand-bg px-2 py-0.5 border border-brand-border rounded font-mono text-[10px] text-text-secondary">
                                  {cert.template_style || 'classical'}
                                </span>
                              </td>
                              <td className="p-4 text-text-secondary">{new Date(cert.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-text-secondary text-xs">
                      Nie wygenerowano jeszcze żadnych dyplomów dla Twoich kursów.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* PORTAL VIEW: ADMIN */}
          {activePortal === 'admin' && (
            <div className="space-y-10 min-h-screen bg-brand-bg text-[#f5f0e6] p-6">
              
              {/* ADMIN NAVIGATION (HORIZONTAL) */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'stats', label: 'Statystyki', icon: Activity },
                  { id: 'courses', label: 'Kursy', icon: Layers },
                  { id: 'users', label: 'Użytkownicy', icon: Users },
                  { id: 'certificates', label: 'Certyfikaty', icon: Award },
                  { id: 'payments', label: 'Płatności', icon: CreditCard },
                  { id: 'security', label: 'Bezpieczeństwo', icon: ShieldCheck },
                  { id: 'settings', label: 'Ustawienia', icon: Settings },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setAdminTab(item.id as any)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${adminTab === item.id ? 'bg-brand-gold text-brand-bg' : 'bg-brand-card hover:bg-[#2a2622] text-[#f5f0e6]'}`}
                  >
                    <item.icon size={16} />
                    {item.label}
                  </button>
                ))}
                <a 
                  href="ABOUT_US_URL" 
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-brand-card hover:bg-[#2a2622] text-[#f5f0e6] flex items-center gap-2"
                >
                  <Info size={16} />
                  O nas
                </a>
              </div>

              {adminTab === 'stats' && adminStats && (
                <div className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">

                      <div className="bg-brand-card p-6 rounded-2xl border border-[#2a2622]">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-[#a3998a]">Suma Kursantów</p>
                        <p className="text-3xl font-semibold tracking-tight mt-2 text-[#f5f0e6]">{adminStats.totalUsers} kont</p>
                        <p className="text-[10px] font-mono uppercase text-brand-gold mt-1.5 font-bold">Zasilane MariaDB</p>
                      </div>
                      <div className="bg-brand-card p-6 rounded-2xl border border-[#2a2622]">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-[#a3998a]">Katalog Kursów</p>
                        <p className="text-3xl font-semibold tracking-tight mt-2 text-[#f5f0e6]">{adminStats.totalCourses} programy</p>
                        <p className="text-[10px] font-mono uppercase text-brand-gold mt-1.5 font-bold">Statyczny HTML CDN</p>
                      </div>
                      <div className="bg-brand-card p-6 rounded-2xl border border-[#2a2622]">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-[#a3998a]">Przychód (Stripe)</p>
                        <p className="text-3xl font-semibold tracking-tight mt-2 text-[#f5f0e6]">${adminStats.totalRevenue.toFixed(2)}</p>
                        <p className="text-[10px] font-mono uppercase text-brand-gold mt-1.5 font-bold">Weryfikowane Webhookiem</p>
                      </div>
                      <div className="bg-brand-card p-6 rounded-2xl border border-[#2a2622]">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-[#a3998a]">Subskrypcje PRO</p>
                        <p className="text-3xl font-semibold tracking-tight mt-2 text-[#f5f0e6]">{adminStats.activeSubscriptions} aktywnych</p>
                        <p className="text-[10px] font-mono uppercase text-brand-gold mt-1.5 font-bold">Wycofanie po 30 dniach</p>
                      </div>
                      <div className="bg-brand-card p-6 rounded-2xl border border-[#2a2622]">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-[#a3998a]">Bezpieczeństwo sesji</p>
                        <p className="text-3xl font-semibold tracking-tight mt-2 text-[#f5f0e6]">Zero Trust</p>
                        <p className="text-[10px] font-mono uppercase text-rose-500 mt-1.5 font-bold">Rate Limit Aktywny</p>
                      </div>
                    </div>

                  {/* Access System Summary Widget */}
                  {adminStats && adminStats.enrollmentStats && (
                    <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 p-6 md:p-8 rounded-3xl border border-neutral-700 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-10 blur-xl pointer-events-none">
                        <ShieldCheck size={100} />
                      </div>
                      <div className="space-y-1 z-10">
                        <h3 className="font-semibold text-xl md:text-2xl tracking-tight text-white flex items-center gap-2">
                          System Dostępu do Kursów
                        </h3>
                        <p className="text-sm text-text-secondary max-w-lg">
                          Agregacja wydanych licencji oraz przypisanych dostępów do kursów. Platforma w czasie rzeczywistym weryfikuje dostęp (Zero Trust).
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-6 z-10 w-full md:w-auto mt-2 md:mt-0">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1">Darmowe</span>
                          <span className="text-2xl font-bold font-mono text-emerald-400">{adminStats.enrollmentStats.free}</span>
                        </div>
                        <div className="h-10 w-px bg-neutral-700 hidden sm:block"></div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1">Płatne</span>
                          <span className="text-2xl font-bold font-mono text-amber-400">{adminStats.enrollmentStats.paid}</span>
                        </div>
                        <div className="h-10 w-px bg-neutral-700 hidden sm:block"></div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1">Subskrypcje</span>
                          <span className="text-2xl font-bold font-mono text-indigo-400">{adminStats.enrollmentStats.subscription}</span>
                        </div>

                        <button 
                          onClick={() => setIsAccessReportOpen(true)}
                          className="w-full sm:w-auto bg-brand-card/10 hover:bg-brand-card/20 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition ml-auto backdrop-blur-sm"
                        >
                          Dowiedz się więcej
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Anti-Leech System Diagnostics & Realtime logs */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Live system state check bento */}
                    <div className="lg:col-span-4 bg-brand-card p-6 rounded-3xl border border-brand-border space-y-6">
                      <h3 className="font-semibold tracking-tight text-xl">Bezpieczeństwo & Antileech</h3>
                      <p className="text-xs opacity-60">System ochrony i szyfrowania odtwarzaczy chroniący linki źródłowe.</p>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-center bg-brand-bg p-3.5 rounded-xl border border-brand-border">
                          <div>
                            <p className="text-xs font-bold leading-none">Signed URL Generator</p>
                            <p className="text-[10px] opacity-50 font-mono mt-1">Suma sprawdzonych linków lekcji</p>
                          </div>
                          <span className="font-mono text-xs font-bold uppercase bg-brand-card text-text-primary px-2.5 py-1 rounded">
                            {signedUrlCounter} x
                          </span>
                        </div>

                        <div className="flex justify-between items-center bg-brand-bg p-3.5 rounded-xl border border-brand-border">
                          <div>
                            <p className="text-xs font-bold leading-none">Rate Limiting API</p>
                            <p className="text-[10px] opacity-50 font-mono mt-1">Maks. 60 zapytań/min na IP</p>
                          </div>
                          <button 
                            onClick={() => setRateLimitingStatus(!rateLimitingStatus)}
                            className={`p-1 px-3.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider text-white transition-all ${rateLimitingStatus ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-500 hover:bg-red-600'}`}
                          >
                            {rateLimitingStatus ? 'AKTYWNY' : 'WYŁĄCZONY'}
                          </button>
                        </div>

                        <div className="flex justify-between items-center bg-brand-bg p-3.5 rounded-xl border border-brand-border">
                          <div>
                            <p className="text-xs font-bold leading-none">Czas wygasania tokenów</p>
                            <p className="text-[10px] opacity-50 font-mono mt-1">Wartość TTL tokenów sesji</p>
                          </div>
                          <span className="font-mono text-xs font-bold text-text-secondary">
                            15 minut
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick audit of events logs */}
                    <div className="lg:col-span-8 bg-accent-purple text-white p-6 rounded-3xl space-y-4 border border-neutral-800">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold tracking-tight text-lg leading-tight text-white flex items-center space-x-2">
                          <Terminal size={18} />
                          <span>Audyt Zabezpieczeń i Sprzedaży</span>
                        </h3>
                        <span className="text-[9px] font-mono text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded uppercase">Baza Logów MariaDB / SQLite</span>
                      </div>
                      
                      <div className="space-y-2.5 max-h-64 overflow-y-auto custom-scrollbar font-mono text-[10.5px]">
                        {adminLogsList.slice(0, 8).map(log => (
                          <div key={log.id} className="p-3 bg-brand-card/5 border border-white/5 rounded-xl flex items-start space-x-3 opacity-90">
                            <span className="text-emerald-400 font-bold">[{new Date(log.created_at).toLocaleTimeString()}]</span>
                            <div className="flex-1">
                              <p className="font-bold text-white uppercase tracking-wider">{log.action}</p>
                              <p className="text-white/60 mt-0.5">{log.details}</p>
                              {log.email && <p className="text-indigo-400 text-[9px] mt-1">Inicjator: {log.email} ({log.role})</p>}
                            </div>
                            <span className="text-white/30 hidden sm:inline-block">IP: {log.ip_address}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* ADMIN TAB: COURSES MANAGEMENT */}
              {adminTab === 'courses' && (
                <div className="space-y-12">
                  
                  {/* AI & CRAWLER COURSE IMPORT MODULE */}
                  <div className="bg-brand-card p-6 md:p-8 rounded-3xl border border-brand-border space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-brand-border">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-accent-blue font-bold">
                          <Globe size={18} />
                          <h3 className="tracking-tight text-xl font-bold">Inteligentny Importer Programów z URL (AI Crawler)</h3>
                        </div>
                        <p className="text-xs text-text-secondary">
                          Wklej link do dowolnego sylabusu technicznego lub programu studiów podyplomowych. Moduł AI dokona kompletnego parsingu i przygotuje rekomendowaną strukturę tematów oraz parametrów cenowo-uprawnieniowych.
                        </p>
                      </div>
                      <span className="shrink-0 bg-accent-blue/10 text-accent-blue border border-accent-blue/20 font-mono text-[9px] uppercase px-3 py-1 rounded-full font-bold">
                        zasilane przez google gemini
                      </span>
                    </div>

                    <form onSubmit={handleAnalyzeUrl} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase opacity-70">Zewnętrzny adres URL programu szkolenia</label>
                          <input
                            type="url"
                            placeholder="https://szkolenia.com/kurs-kubernetes-enterprise"
                            value={adminImportUrl}
                            onChange={(e) => setAdminImportUrl(e.target.value)}
                            className="w-full bg-brand-bg border border-brand-border px-4 py-3 rounded-xl text-xs font-mono outline-none focus:border-accent-blue transition placeholder-text-secondary text-white"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase opacity-70">Lub wklej surowy tekst planu / sylabusu (Opcjonalnie)</label>
                          <textarea
                            rows={1}
                            placeholder="Wklej rozdziały, tematy lekcji lub skopiowaną treść..."
                            value={adminImportRawText}
                            onChange={(e) => setAdminImportRawText(e.target.value)}
                            className="w-full bg-brand-bg border border-brand-border px-4 py-3 rounded-xl text-xs outline-none focus:border-accent-blue transition placeholder-text-secondary resize-none text-white"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={adminImportLoading}
                        className="w-full bg-accent-blue text-white py-3.5 rounded-xl text-xs font-bold font-mono uppercase tracking-wider hover:bg-opacity-90 transition disabled:opacity-50 flex items-center justify-center space-x-2"
                      >
                        {adminImportLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Przetwarzanie i Parsowanie AI...</span>
                          </>
                        ) : (
                          <>
                            <Search size={14} />
                            <span>Analizuj i Generuj Strukturę Kursu</span>
                          </>
                        )}
                      </button>
                    </form>

                    {/* Pre-flight Draft Confirmation Panel */}
                    {adminImportPreview && (
                      <div className="p-6 bg-brand-bg border border-accent-blue/30 rounded-2xl space-y-6 animate-fadeIn text-white">
                        <div className="flex justify-between items-center pb-3 border-b border-brand-border">
                          <div className="flex items-center space-x-2">
                            <Sparkles className="text-amber-500 animate-pulse" size={16} />
                            <h4 className="font-bold text-sm text-[13px]">Przygotowana Wersja Robocza (Zweryfikuj parametry przed zapisem)</h4>
                          </div>
                          <button
                            type="button"
                            onClick={() => setAdminImportPreview(null)}
                            className="text-text-secondary hover:text-white text-xs font-semibold"
                          >
                            Odrzuć wersję roboczą
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="space-y-1">
                            <label className="font-semibold text-text-secondary">Zmapowany Tytuł Kursu</label>
                            <input
                              type="text"
                              value={draftTitle}
                              onChange={(e) => setDraftTitle(e.target.value)}
                              className="w-full bg-brand-card border border-brand-border rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-accent-blue text-white"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-semibold text-text-secondary">Sugerowana Cena Rynkowa ($ USD)</label>
                            <input
                              type="number"
                              value={draftPrice}
                              onChange={(e) => setDraftPrice(Number(e.target.value))}
                              className="w-full bg-brand-card border border-brand-border rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-accent-blue text-white"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-semibold text-text-secondary">Uprawnienia dostępu / Paywall</label>
                            <select
                              value={draftAccessType}
                              onChange={(e: any) => setDraftAccessType(e.target.value)}
                              className="w-full bg-brand-card border border-brand-border rounded-lg px-3 py-2 text-xs font-bold outline-none text-white bg-brand-bg"
                            >
                              <option value="free">Bezpłatny (Freebie)</option>
                              <option value="premium">Płatny Jednorazowo (Premium)</option>
                              <option value="subscription">All-Access Subscription</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="font-semibold text-text-secondary">Widoczność w systemie</label>
                            <select
                              value={draftVisibility}
                              onChange={(e: any) => setDraftVisibility(e.target.value)}
                              className="w-full bg-brand-card border border-brand-border rounded-lg px-3 py-2 text-xs font-bold outline-none text-white bg-brand-bg"
                            >
                              <option value="public">Publiczny w katalogu ogólnym</option>
                              <option value="private">Prywatny (Tylko zaproszeni studenci)</option>
                            </select>
                          </div>

                          <div className="space-y-1 md:col-span-2">
                            <label className="font-semibold text-text-secondary">Wyodrębniony Sylabus / Opis</label>
                            <textarea
                              rows={3}
                              value={draftDesc}
                              onChange={(e) => setDraftDesc(e.target.value)}
                              className="w-full bg-brand-card border border-brand-border rounded-lg px-3 py-2 text-xs outline-none focus:border-accent-blue resize-none text-white"
                            />
                          </div>
                        </div>

                        {/* Lessons List in draft */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <p className="text-[10px] uppercase font-mono tracking-wider text-text-secondary">Wyodrębniony harmonogram lekcji i adresy URL filmów/plików ({adminImportPreview.lessons?.length || 0}):</p>
                            <span className="text-[9px] font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">Można edytować adresy URL dla innych domen</span>
                          </div>
                          <div className="max-h-80 overflow-y-auto border border-brand-border rounded-xl divide-y divide-brand-border scrollbar-thin bg-brand-card">
                            {(adminImportPreview.lessons || []).map((les: any, idx: number) => (
                              <div key={idx} className="p-4 flex flex-col gap-3 hover:bg-white/5 transition-colors">
                                <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
                                  <div className="flex-1 space-y-1">
                                    <span className="text-[9px] font-mono text-accent-blue uppercase font-bold">Lekcja #{idx + 1}</span>
                                    <input
                                      type="text"
                                      value={les.title || ""}
                                      onChange={(e) => updateDraftLesson(idx, { title: e.target.value })}
                                      className="w-full bg-brand-bg border border-brand-border rounded-lg px-2.5 py-1.5 text-xs font-bold text-white outline-none focus:border-accent-blue"
                                      placeholder="Tytuł lekcji"
                                    />
                                  </div>
                                  <div className="w-full md:w-28 space-y-1">
                                    <span className="text-[9px] font-mono text-text-secondary uppercase">Czas (min)</span>
                                    <input
                                      type="number"
                                      value={les.duration_minutes || 10}
                                      onChange={(e) => updateDraftLesson(idx, { duration_minutes: Number(e.target.value) })}
                                      className="w-full bg-brand-bg border border-brand-border rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-accent-blue font-mono"
                                      placeholder="Czas"
                                    />
                                  </div>
                                  <div className="w-full md:w-36 space-y-1">
                                    <span className="text-[9px] font-mono text-text-secondary uppercase">Typ zasobu</span>
                                    <select
                                      value={les.source_type || "video"}
                                      onChange={(e) => updateDraftLesson(idx, { source_type: e.target.value })}
                                      className="w-full bg-brand-bg border border-brand-border rounded-lg px-2 py-1.5 text-xs text-white outline-none bg-brand-card"
                                    >
                                      <option value="video">Wideo (MP4 / Vimeo)</option>
                                      <option value="pdf">Dokument PDF</option>
                                      <option value="iframe">Ramka iFrame / Laby</option>
                                      <option value="download">Pliki do pobrania</option>
                                    </select>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[9px] font-mono text-text-secondary uppercase">Docelowy adres URL lekcji (z innej domeny / hostingu, np. Azure, BunnyCDN, S3)</span>
                                  <input
                                    type="text"
                                    value={les.source_url || ""}
                                    onChange={(e) => updateDraftLesson(idx, { source_url: e.target.value })}
                                    className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-1.5 text-xs text-indigo-300 outline-none focus:border-accent-blue font-mono text-[11px]"
                                    placeholder="Wprowadź link np. https://twoja-domena.com/assets/video.mp4"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-2">
                          <button
                            type="button"
                            onClick={() => setAdminImportPreview(null)}
                            className="bg-brand-card border border-brand-border text-white text-xs font-semibold px-4 py-2 rounded-xl"
                          >
                            Anuluj
                          </button>
                          <button
                            type="button"
                            onClick={handleConfirmImport}
                            className="bg-gradient-to-r from-accent-blue to-accent-purple text-white text-xs font-bold px-5 py-2.5 rounded-xl flex items-center space-x-1 shadow-md hover:opacity-90 active:scale-95 transition"
                          >
                            <CheckCircle2 size={14} />
                            <span>Zintegruj w bazie i opublikuj</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Two Forms Bento: Create Course, Add Lesson */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Add Course */}
                    <div className="bg-brand-card p-5 md:p-6 rounded-2xl border border-brand-border space-y-5">
                      <div className="flex items-center space-x-2 pb-2 border-b border-brand-border">
                        <Plus className="text-emerald-600" size={18} />
                        <h3 className="font-semibold tracking-tight text-xl">Nowy Kurs w Rejestrze</h3>
                      </div>
                      
                      <form onSubmit={handleCreateCourse} className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase opacity-50">Tytuł Kursu</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="np. Azure Solutions Architect Masterclass"
                            value={newCourseTitle}
                            onChange={(e) => setNewCourseTitle(e.target.value)}
                            className="w-full bg-brand-bg border border-brand-border px-4 py-2.5 rounded-xl text-xs font-bold outline-none focus:border-brand-border transition"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-mono uppercase opacity-50">Typ Dostępności paywalla</label>
                            <select 
                              value={newCourseType}
                              onChange={(e: any) => setNewCourseType(e.target.value)}
                              className="w-full bg-brand-bg border border-brand-border px-4 py-3 rounded-xl text-xs font-bold outline-none"
                            >
                              <option value="free">Darmowy (Free)</option>
                              <option value="premium">Płatny Jednorazowo (Premium)</option>
                              <option value="subscription">Subskrypcyjny (PMPro Subscription)</option>
                            </select>
                          </div>
                          
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-mono uppercase opacity-50">Sugerowana kwota ($ USD)</label>
                            <input 
                              type="number" 
                              required 
                              min="0"
                              value={newCoursePrice}
                              onChange={(e) => setNewCoursePrice(parseInt(e.target.value, 10))}
                              className="w-full bg-brand-bg border border-brand-border px-4 py-2.5 rounded-xl text-xs font-bold outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase opacity-50">Zewnętrzny URL Kursu (Pełny program)</label>
                          <input 
                            type="url" 
                            required 
                            placeholder="https://platformaeksternistyczna.pl/kurs/az-305"
                            value={newCourseExternalUrl}
                            onChange={(e) => setNewCourseExternalUrl(e.target.value)}
                            className="w-full bg-brand-bg border border-brand-border px-4 py-2.5 rounded-xl text-xs font-bold outline-none focus:border-brand-border transition"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase opacity-50">Opis Kursu</label>
                          <textarea 
                            rows={3} 
                            placeholder="Zarys programu merytorycznego..."
                            value={newCourseDescription}
                            onChange={(e) => setNewCourseDescription(e.target.value)}
                            className="w-full bg-brand-bg border border-brand-border px-4 py-3 rounded-xl text-xs outline-none resize-none"
                          />
                        </div>

                        <button 
                          type="submit" 
                          className="w-full bg-accent-purple text-white py-3 rounded-xl text-xs font-bold hover:bg-neutral-800 transition"
                        >
                          Zatwierdź Kurs w Baza Danych (published)
                        </button>
                      </form>
                    </div>

                    {/* Add Lesson to Course */}
                    <div className="bg-brand-card p-5 md:p-6 rounded-2xl border border-brand-border space-y-5">
                      <div className="flex items-center space-x-2 pb-2 border-b border-brand-border">
                        <Plus className="text-emerald-600" size={18} />
                        <h3 className="font-semibold tracking-tight text-xl">Uzupełnij Lekcje i Drip-feed</h3>
                      </div>
                      
                      <form onSubmit={handleCreateLesson} className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase opacity-50">Wskaj Kurs Partnerski</label>
                          <select 
                            required
                            value={newLessonCourseId}
                            onChange={(e) => setNewLessonCourseId(parseInt(e.target.value, 10))}
                            className="w-full bg-brand-bg border border-brand-border px-4 py-3 rounded-xl text-xs font-bold outline-none"
                          >
                            <option value="">Wybierz kurs z rejestru...</option>
                            {adminCoursesList.map(c => (
                              <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase opacity-50">Tytuł Lekcji</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="np. Skanowanie podatności za pomocą Nmap"
                            value={newLessonTitle}
                            onChange={(e) => setNewLessonTitle(e.target.value)}
                            className="w-full bg-brand-bg border border-brand-border px-4 py-2.5 rounded-xl text-xs font-bold outline-none focus:border-brand-border transition"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-mono uppercase opacity-50">Typ Treści źródłowej</label>
                            <select 
                              value={newLessonType}
                              onChange={(e: any) => setNewLessonType(e.target.value)}
                              className="w-full bg-brand-bg border border-brand-border px-4 py-3 rounded-xl text-xs font-bold outline-none"
                            >
                              <option value="video">Wideo (Bunny Stream / Vimeo)</option>
                              <option value="pdf">Plik PDF (Podręcznik)</option>
                              <option value="iframe">Gra / Laboratorium Iframe Sandbox</option>
                              <option value="download">Standardowy Pobieralnik</option>
                            </select>
                          </div>
                          
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-mono uppercase opacity-50">Czas trwania (minuty)</label>
                            <input 
                              type="number" 
                              required 
                              min="1"
                              value={newLessonMinutes}
                              onChange={(e) => setNewLessonMinutes(parseInt(e.target.value, 10))}
                              className="w-full bg-brand-bg border border-brand-border px-4 py-2.5 rounded-xl text-xs font-bold outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase opacity-50">Bezpieczny link źródłowy chroniony paywallem</label>
                          <input 
                            type="text" 
                            required 
                            value={newLessonSrc}
                            onChange={(e) => setNewLessonSrc(e.target.value)}
                            className="w-full bg-brand-bg border border-brand-border px-4 py-2.5 rounded-xl text-xs font-mono outline-none"
                          />
                        </div>

                        <button 
                          type="submit" 
                          className="w-full bg-accent-blue text-white py-3 rounded-xl text-xs font-bold hover:bg-accent-purple transition"
                        >
                          Zintegruj Lekcję pod modułem
                        </button>
                      </form>
                    </div>

                  </div>

                  {/* Course Admin Catalog Table */}
                  <div className="space-y-4">
                    <h3 className="font-semibold tracking-tight text-xl">Katalog Programów w Bazie</h3>
                    
                    <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-brand-bg border-b border-brand-border text-xs">
                            <th className="p-4 text-[10px] font-mono uppercase text-text-secondary">ID</th>
                            <th className="p-4 text-[10px] font-mono uppercase text-text-secondary">Nazwa Programu</th>
                            <th className="p-4 text-[10px] font-mono uppercase text-text-secondary">Metoda Dostępności</th>
                            <th className="p-4 text-[10px] font-mono uppercase text-text-secondary">Cena Katalogowa</th>
                            <th className="p-4 text-[10px] font-mono uppercase text-text-secondary">Liczba Lekcji</th>
                            <th className="p-4 text-[10px] font-mono uppercase text-text-secondary text-right">Zarządzaj</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminCoursesList.map(course => {
                            const isEditing = editingCourseId === course.id;
                            const isSelectedForEnrollments = selectedCourseForEnrollments?.id === course.id;
                            return (
                              <React.Fragment key={course.id}>
                                <tr className={`border-b border-brand-border text-xs ${isSelectedForEnrollments ? 'bg-accent-blue/5' : ''}`}>
                                  <td className="p-4 font-mono font-bold">#{course.id}</td>
                                  <td className="p-4">
                                    <p className="font-bold text-white">{course.title}</p>
                                    <p className="text-[10px] opacity-60 font-mono text-indigo-300 mt-0.5">Slug: {course.slug}</p>
                                    <div className="flex gap-2 mt-1.5 flex-wrap">
                                      <span className={`text-[9px] font-mono font-semibold uppercase px-2 py-0.5 rounded-md ${course.access_type === 'free' ? 'bg-[#22c55e]/10 text-[#22c55e]' : course.access_type === 'premium' ? 'bg-[#3b82f6]/10 text-[#3b82f6]' : 'bg-[#a855f7]/10 text-[#a855f7]'}`}>
                                        {course.access_type}
                                      </span>
                                      <span className={`text-[9px] font-mono font-semibold uppercase px-2 py-0.5 rounded-md ${course.visibility === 'private' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                                        {course.visibility || 'public'}
                                      </span>
                                      <span className="text-[9px] font-mono text-white/50 bg-white/5 px-2 py-0.5 rounded-md">
                                        Status: {course.status || 'published'}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="p-4">
                                    <div className="font-mono font-bold text-white text-[13px]">${course.price} USD</div>
                                  </td>
                                  <td className="p-4 font-mono text-center text-white/80">{course.lessons_count || 0} tematów</td>
                                  <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        onClick={() => {
                                          if (isSelectedForEnrollments) {
                                            setSelectedCourseForEnrollments(null);
                                          } else {
                                            selectCourseForEnrollmentsManager(course);
                                          }
                                        }}
                                        className={`p-2 rounded-xl border transition flex items-center space-x-1 ${isSelectedForEnrollments ? 'bg-accent-blue text-white border-accent-blue' : 'bg-brand-bg/50 border-brand-border text-text-secondary hover:text-white hover:border-brand-border-hover'}`}
                                        title="Kontrola Dostępu Studenckiego i Rejestracja"
                                      >
                                        <Users size={14} />
                                        <span className="text-[10px] font-bold hidden md:inline">Uczestnicy</span>
                                      </button>
                                      
                                      <button
                                        onClick={() => {
                                          if (isEditing) {
                                            setEditingCourseId(null);
                                          } else {
                                            startEditingCourse(course);
                                          }
                                        }}
                                        className={`p-2 rounded-xl border transition flex items-center space-x-1 ${isEditing ? 'bg-accent-purple text-white border-accent-purple' : 'bg-brand-bg/50 border-brand-border text-text-secondary hover:text-white hover:border-brand-border-hover'}`}
                                        title="Konfiguruj Uprawnienia i Ceny"
                                      >
                                        <Sliders size={14} />
                                        <span className="text-[10px] font-bold hidden md:inline">Uprawnienia</span>
                                      </button>

                                      <button 
                                        onClick={() => setCourseToDelete(course)}
                                        className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-xl transition"
                                        title="Usuń kurs z bazy"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>

                                {/* INLINE EDIT MODE: EDIT ACCESS CONTROL PROPERTIES */}
                                {isEditing && (
                                  <tr className="bg-brand-bg border-b border-brand-border animate-fadeIn">
                                    <td colSpan={5} className="p-5 md:p-6 text-white space-y-4">
                                      <div className="bg-brand-card p-5 border border-accent-purple/30 rounded-2xl space-y-4">
                                        <div className="flex justify-between items-center pb-2 border-b border-brand-border">
                                          <div className="flex items-center space-x-1.5 text-accent-purple font-bold text-xs uppercase">
                                            <Sliders size={14} />
                                            <span>Konfiguracja Własności i Dostępów kursu #{course.id}</span>
                                          </div>
                                          <button 
                                            type="button" 
                                            onClick={() => setEditingCourseId(null)}
                                            className="text-white/40 hover:text-white text-xs"
                                          >
                                            Zamknij
                                          </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                                          <div className="space-y-1 md:col-span-2">
                                            <label className="text-white/50 text-[10px] font-mono uppercase">Zmień Nazwę</label>
                                            <input
                                              type="text"
                                              value={editCourseTitle}
                                              onChange={(e) => setEditCourseTitle(e.target.value)}
                                              className="w-full bg-brand-bg border border-brand-border px-3 py-2 rounded-lg text-xs outline-none focus:border-accent-purple text-white font-bold"
                                            />
                                          </div>

                                          <div className="space-y-1">
                                            <label className="text-white/50 text-[10px] font-mono uppercase">Cena katalogowa ($ USD)</label>
                                            <input
                                              type="number"
                                              value={editCoursePrice}
                                              onChange={(e) => setEditCoursePrice(Number(e.target.value))}
                                              className="w-full bg-brand-bg border border-brand-border px-3 py-2 rounded-lg text-xs outline-none focus:border-accent-purple text-white font-bold"
                                            />
                                          </div>

                                          <div className="space-y-1">
                                            <label className="text-white/50 text-[10px] font-mono uppercase">Typ paywalla</label>
                                            <select
                                              value={editCourseAccessType}
                                              onChange={(e: any) => setEditCourseAccessType(e.target.value)}
                                              className="w-full bg-brand-bg border border-brand-border px-3 py-2 rounded-lg text-xs outline-none text-white bg-brand-card"
                                            >
                                              <option value="free">Bezpłatny (Freebie)</option>
                                              <option value="premium">Płatny Jednorazowo (Premium)</option>
                                              <option value="subscription">Dla Subskrybentów (All-Access)</option>
                                            </select>
                                          </div>

                                          <div className="space-y-1 md:col-span-2">
                                            <label className="text-white/50 text-[10px] font-mono uppercase">Widoczność w systemie</label>
                                            <select
                                              value={editCourseVisibility}
                                              onChange={(e: any) => setEditCourseVisibility(e.target.value)}
                                              className="w-full bg-brand-bg border border-brand-border px-3 py-2 rounded-lg text-xs outline-none text-white bg-brand-card"
                                            >
                                              <option value="public">Publiczny w katalogu ogólnym</option>
                                              <option value="private">Prywatny (Tylko zaproszeni studenci)</option>
                                            </select>
                                          </div>

                                          <div className="space-y-1 md:col-span-2">
                                            <label className="text-white/50 text-[10px] font-mono uppercase">Opis sylabusu</label>
                                            <textarea
                                              rows={2}
                                              value={editCourseDesc}
                                              onChange={(e) => setEditCourseDesc(e.target.value)}
                                              className="w-full bg-brand-bg border border-brand-border px-3 py-2 rounded-lg text-xs outline-none focus:border-accent-purple text-white resize-none"
                                            />
                                          </div>
                                        </div>

                                        <div className="flex gap-2 justify-end pt-2 border-t border-brand-border">
                                          <button
                                            type="button"
                                            onClick={() => setEditingCourseId(null)}
                                            className="bg-brand-bg border border-brand-border text-white px-4 py-2 rounded-xl text-xs"
                                          >
                                            Anuluj
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleSaveCourseAccessControl(course.id)}
                                            className="bg-accent-purple text-white px-5 py-2 rounded-xl text-xs font-bold transition hover:opacity-90"
                                          >
                                            Zapisz Zmiany
                                          </button>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}

                                {/* DETAILED STUDENT ENROLLMENTS & ACCESS GRANTS MANAGER */}
                                {isSelectedForEnrollments && (
                                  <tr className="bg-brand-bg border-b border-brand-border animate-fadeIn">
                                    <td colSpan={5} className="p-5 md:p-6 text-white space-y-4">
                                      <div className="bg-brand-card p-5 border border-accent-blue/30 rounded-2xl space-y-5">
                                        
                                        {/* Grant access form */}
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                          
                                          <div className="space-y-3 lg:col-span-1 border-r border-white/5 pr-4">
                                            <h4 className="font-bold text-xs text-accent-blue uppercase tracking-wider flex items-center space-x-1">
                                              <Lock size={12} />
                                              <span>Przyznaj Dostęp Manualnie</span>
                                            </h4>
                                            <p className="text-[11px] text-text-secondary leading-relaxed font-sans">
                                              Zarejestruj studenta lub przekaż mu uprawnienia bez transakcji w Stripe / paywallu. Student musi posiadać aktywne konto w HRLacademy.
                                            </p>

                                            <form onSubmit={handleGrantManualAccess} className="space-y-3 pt-2">
                                              <div className="space-y-1">
                                                <label className="text-[9px] font-mono text-white/50 uppercase">Adres Email Studenta</label>
                                                <input
                                                  type="email"
                                                  required
                                                  placeholder="kursant@przyklad.pl"
                                                  value={manualEnrollEmail}
                                                  onChange={(e) => setManualEnrollEmail(e.target.value)}
                                                  className="w-full bg-brand-bg border border-brand-border px-3 py-2 rounded-lg text-xs outline-none focus:border-accent-blue text-white"
                                                />
                                              </div>

                                              <div className="space-y-1">
                                                <label className="text-[9px] font-mono text-white/50 uppercase">Typ Licencji</label>
                                                <select
                                                  value={manualEnrollAccessType}
                                                  onChange={(e) => setManualEnrollAccessType(e.target.value)}
                                                  className="w-full bg-brand-bg border border-brand-border px-3 py-2 rounded-lg text-xs outline-none text-white bg-brand-card"
                                                >
                                                  <option value="free">Free Access</option>
                                                  <option value="premium">Full Premium Pack</option>
                                                  <option value="subscription">Subscription Tier</option>
                                                </select>
                                              </div>

                                              <button
                                                type="submit"
                                                className="w-full bg-accent-blue text-white py-2 rounded-lg text-xs font-bold transition hover:bg-opacity-95 text-center cursor-pointer"
                                              >
                                                Zatwierdź Uczestnika
                                              </button>
                                            </form>
                                          </div>

                                          {/* Enrolled Students List */}
                                          <div className="lg:col-span-2 space-y-3">
                                            <h4 className="font-bold text-xs text-white uppercase tracking-wider flex items-center justify-between">
                                              <span className="flex items-center space-x-1 font-mono">
                                                <Users size={12} />
                                                <span>Uczestnicy szkolenia ({courseEnrollmentsList.length})</span>
                                              </span>
                                              {enrollmentsLoading && (
                                                <span className="animate-spin h-3.5 w-3.5 border-2 border-accent-blue rounded-full border-t-transparent"></span>
                                              )}
                                            </h4>

                                            <div className="border border-white/5 rounded-xl bg-brand-bg overflow-hidden">
                                              <div className="max-h-60 overflow-y-auto scrollbar-thin divide-y divide-white/5">
                                                {courseEnrollmentsList.length > 0 ? (
                                                  courseEnrollmentsList.map((enroll: any) => (
                                                    <div key={enroll.id} className="p-3 text-xs flex justify-between items-center hover:bg-white/5 transition-colors">
                                                      <div className="space-y-0.5">
                                                        <p className="font-bold text-white">{enroll.first_name} {enroll.last_name}</p>
                                                        <p className="text-[10px] text-text-secondary font-mono">{enroll.email}</p>
                                                        <p className="text-[9px] text-[#3b82f6] font-mono uppercase mt-0.5">Licencja: {enroll.access_type} | Zapis: {new Date(enroll.created_at).toLocaleDateString()}</p>
                                                      </div>

                                                      <button
                                                        type="button"
                                                        onClick={() => handleRevokeManualAccess(enroll.user_id)}
                                                        className="text-red-400 hover:text-red-600 hover:bg-red-500/10 px-2.5 py-1.5 rounded-lg border border-red-500/10 transition text-[10px] font-bold"
                                                        title="Cofnij Uprawnienia"
                                                      >
                                                        Odbierz Dostęp
                                                      </button>
                                                    </div>
                                                  ))
                                                ) : (
                                                  <div className="p-8 text-center text-text-secondary text-xs font-sans">
                                                    Brak zarejestrowanych studentów. Nadaj dostęp manualny za pomocą formularza obok.
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </div>

                                        </div>

                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* ADMIN TAB: USERS LIST */}
              {adminTab === 'users' && (
                <div className="bg-brand-card p-6 md:p-7 rounded-2xl border border-brand-border space-y-5">
                  <h2 className="text-2xl font-semibold tracking-tight">Zarządzanie Studentami (Audyt WP & PMPro)</h2>
                  <p className="text-xs opacity-60">Lista użytkowników zintegrowanych z platformą e-learningową zintegrowaną w chmurze.</p>

                  <div className="border border-brand-border rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-brand-bg border-b border-brand-border text-xs">
                          <th className="p-4 text-[10px] font-mono uppercase text-text-secondary">Imię i Nazwisko</th>
                          <th className="p-4 text-[10px] font-mono uppercase text-text-secondary">Email</th>
                          <th className="p-4 text-[10px] font-mono uppercase text-text-secondary">Rola Systemowa</th>
                          <th className="p-4 text-[10px] font-mono uppercase text-text-secondary">Aktywne Kursy</th>
                          <th className="p-4 text-[10px] font-mono uppercase text-text-secondary">Wykonane lekcje</th>
                          <th className="p-4 text-[10px] font-mono uppercase text-text-secondary">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminUsersList.map(user => (
                          <tr key={user.id} className="border-b border-brand-border last:border-0 text-xs select-none">
                            <td className="p-4 font-bold">{user.first_name} {user.last_name}</td>
                            <td className="p-4 font-mono opacity-80">{user.email}</td>
                            <td className="p-4">
                              <span className={`text-[9px] font-mono uppercase px-2.5 py-0.5 rounded ${user.role === 'admin' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="p-4 font-mono font-bold">{user.enrollments_count || 0} programów</td>
                            <td className="p-4 font-mono">{user.completed_lessons_count || 0} ukończonych</td>
                            <td className="p-4 text-emerald-600 font-bold flex items-center space-x-1">
                              <CheckCircle2 size={13} />
                              <span className="text-[10px] font-mono uppercase">{user.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ADMIN TAB: CERTIFICATES */}
              {adminTab === 'certificates' && (
                <div className="bg-brand-card p-6 md:p-7 rounded-2xl border border-brand-border space-y-5">
                  <h2 className="text-2xl font-semibold tracking-tight">Wydane Certyfikaty (Ewidencja Centralna)</h2>
                  <p className="text-xs opacity-60">Lista wygenerowanych certyfikatów przez kursantów oraz opcja ich reedycji wizerunkowej.</p>

                  <div className="border border-brand-border rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-brand-bg border-b border-brand-border text-xs">
                          <th className="p-4 text-[10px] font-mono uppercase text-text-secondary">ID Systemowe</th>
                          <th className="p-4 text-[10px] font-mono uppercase text-text-secondary">Dane Studenta</th>
                          <th className="p-4 text-[10px] font-mono uppercase text-text-secondary">Moduł Akademicki (Kurs)</th>
                          <th className="p-4 text-[10px] font-mono uppercase text-text-secondary">Kod Rejestru (ID)</th>
                          <th className="p-4 text-[10px] font-mono uppercase text-text-secondary">Styl Generatywny</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminCertificatesList.map(cert => (
                          <tr key={cert.id} className="border-b border-brand-border last:border-0 text-xs">
                            <td className="p-4 font-mono font-bold text-text-secondary">CERT-OJD-{cert.id}</td>
                            <td className="p-4 font-bold">{cert.first_name} {cert.last_name} <span className="font-normal font-mono opacity-60 block text-[10px] mt-0.5">{cert.email}</span></td>
                            <td className="p-4 font-semibold tracking-tight text-text-primary">{cert.course_title}</td>
                            <td className="p-4 font-mono font-bold text-accent-blue">{cert.certificate_code}</td>
                            <td className="p-4">
                              <select
                                className="bg-brand-bg border border-brand-border text-xs py-1.5 px-2 rounded-lg outline-none cursor-pointer hover:bg-brand-card transition-colors w-full"
                                value={cert.template_style || 'classical'}
                                onChange={(e) => {
                                  const reqBody = { templateStyle: e.target.value };
                                  fetch(`/api/admin/certificates/${cert.id}/style`, {
                                    method: 'POST',
                                    headers: {
                                      'x-user-id': currentUser?.id.toString() || '',
                                      'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify(reqBody)
                                  })
                                  .then(res => res.json())
                                  .then(data => {
                                    if(data.success) {
                                      setAdminCertificatesList(prev => prev.map(c => c.id === cert.id ? { ...c, template_style: e.target.value } : c));
                                      fetchDashboardData();
                                    }
                                  });
                                }}
                              >
                                <option value="classical">Klasyczny (Golden)</option>
                                <option value="modern">Modern (Emerald)</option>
                                <option value="minimalist">Minimalistyczny (Ink)</option>
                                <option value="tech_dark">Cyberpunk (Neon)</option>
                                <option value="luxury_gold">Królewski (Majestic)</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                        {adminCertificatesList.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-xs opacity-60 font-mono">
                              [ BRAK POZYCJI W REJESTRZE GENERATYWNYM CERTYFIKATÓW ]
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ADMIN TAB: PAYMENTS REVENUE */}
              {adminTab === 'payments' && (
                <div className="bg-brand-card p-6 md:p-7 rounded-2xl border border-brand-border space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Globalny Rejestr Finansów (Gate Stack)</h2>
                    <p className="text-xs opacity-60 mt-1">Ewidencja przychodów i płatności pochodzących z bramek Stripe & LemonSqueezy.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 rounded-2xl bg-brand-bg border border-brand-border flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold leading-none">Ostatni Przychód (Stripe)</p>
                        <p className="text-[10px] opacity-50 font-mono mt-1">Autoryzowane bramki</p>
                      </div>
                      <span className="font-mono text-xl font-bold text-emerald-600">
                        ${adminStats?.totalRevenue || 0} USD
                      </span>
                    </div>

                    <div className="p-5 rounded-2xl bg-brand-bg border border-brand-border flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold leading-none">Status bramki LemonSqueezy</p>
                        <p className="text-[10px] opacity-50 font-mono mt-1">Webhooki i callbacki</p>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 flex items-center space-x-1 font-mono">
                        <CheckCircle2 size={14} /> <span>OPERACJONALNA</span>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ADMIN TAB: SECURITY */}
              {adminTab === 'security' && (
                <div className="bg-brand-card p-6 md:p-7 rounded-2xl border border-brand-border space-y-5">
                  <h2 className="text-2xl font-semibold tracking-tight">Parametry Ochrony Danych i Anti-Leech</h2>
                  <p className="text-xs opacity-60">Statystyki zabezpieczeń platformy przed niepowołanym pobieraniem filmów.</p>
                  
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-start space-x-3 text-orange-900">
                    <ShieldCheck className="text-orange-600 mt-1 flex-shrink-0" size={20} />
                    <div className="text-xs">
                      <p className="font-bold text-sm">Audyt Zabezpieczeń i podpisywanych URL</p>
                      <p className="opacity-80 mt-1">Wszystkie żądania do chronionego wideo są szyfrowane kluczem symetrycznym HSM, generując jednorazowe, wygasające adresy URL dla użytkowników o prawidłowych poziomach uprawnień.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ADMIN TAB: SETTINGS */}
              {adminTab === 'settings' && (
                <div className="bg-brand-card p-6 md:p-7 rounded-2xl border border-brand-border space-y-5">
                  <h2 className="text-2xl font-semibold tracking-tight">Ustawienia Platformy</h2>
                  <p className="text-xs opacity-60">Globalne ustawienia aplikacji i profilu organizacji.</p>
                  
                  <div className="space-y-4">
                    <div className="bg-brand-bg p-4 rounded-xl border border-brand-border flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-text-primary">Nazwa Serwisu</p>
                        <p className="text-[10px] text-text-secondary mt-0.5">Wpływa na nagłówki mailowe i stronę główną</p>
                      </div>
                      <input type="text" defaultValue="Platforma E-learningowa" className="bg-brand-card border border-brand-border rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-blue" />
                    </div>

                    <div className="bg-brand-bg p-4 rounded-xl border border-brand-border flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-text-primary">Wymuszaj HTTPS (HSTS)</p>
                        <p className="text-[10px] text-text-secondary mt-0.5">Automatyczne przekierowania ruchu HTTP na HTTPS</p>
                      </div>
                      <button className="w-10 h-5 bg-emerald-500 rounded-full relative transition-colors focus:outline-none flex items-center px-0.5 cursor-pointer">
                        <span className="w-4 h-4 bg-white rounded-full translate-x-5 transition-transform" />
                      </button>
                    </div>

                    <div className="bg-brand-bg p-4 rounded-xl border border-brand-border flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-text-primary">Umożliwiaj Mieszanie Treści</p>
                        <p className="text-[10px] text-text-secondary mt-0.5">Pozwala osadzać niezabezpieczone iframes (odradzane)</p>
                      </div>
                      <button className="w-10 h-5 bg-brand-card border-brand-border rounded-full relative transition-colors focus:outline-none border flex items-center px-0.5 cursor-pointer">
                        <span className="w-4 h-4 bg-brand-bg rounded-full translate-x-0 transition-transform shadow-sm border border-brand-border" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </main>

      </div>

      {/* MOCK CHECKOUT MODAL WINDOW (STRIPE / LEMONSQUEEZY INTEGRATION POPUP) */}
      <AnimatePresence>
        {isCheckoutOpen && checkoutCourse && (
          <div className="fixed inset-0 bg-accent-purple/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-brand-card rounded-2xl max-w-sm w-full border border-brand-border shadow-xl overflow-hidden"
            >
              <div className="bg-brand-bg border-b border-brand-border p-5 flex justify-between items-center">
                <span className="text-[10px] font-mono uppercase tracking-widest text-text-secondary font-semibold">Stripe Checkout</span>
                <button onClick={() => { setIsCheckoutOpen(false); setCheckoutCourse(null); }} className="text-text-secondary hover:text-text-primary transition">
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 md:p-8 space-y-6">
                <div className="space-y-2 text-center">
                  <span className="text-[10px] font-mono uppercase px-2 py-1 bg-green-50 text-green-700 rounded border border-green-200 font-semibold tracking-wider">
                    Szyfrowane połączenie
                  </span>
                  <h3 className="text-xl font-semibold mt-3 text-text-primary">{checkoutCourse.title}</h3>
                  <p className="text-3xl font-extrabold tracking-tight mt-2 text-text-primary">${checkoutCourse.price || 199} <span className="text-lg text-text-secondary font-medium">USD</span></p>
                </div>

                <div className="p-4 bg-brand-bg rounded-lg border border-brand-border font-mono text-[10px] text-text-secondary shadow-sm">
                  <p>Inicjator: <span className="font-semibold text-text-primary">{currentUser?.first_name} {currentUser?.last_name}</span></p>
                  <p>Email: <span className="font-semibold text-text-primary">{currentUser?.email}</span></p>
                  <p className="mt-2 flex items-center text-accent-blue font-semibold border-t border-brand-border/60 pt-2"><Lock size={10} className="mr-1" /> <span>PMPro Webhook Integration</span></p>
                </div>

                <div className="space-y-3 pt-2">
                  <button 
                    onClick={() => handleCompleteCheckout('Stripe')}
                    disabled={paying}
                    className="w-full bg-accent-purple text-white py-3 rounded-lg text-sm font-semibold hover:bg-neutral-800 transition flex items-center justify-center space-x-2"
                  >
                    <CreditCard size={16} />
                    <span>Zapłać testowo (Stripe)</span>
                  </button>

                  <button 
                    onClick={() => handleCompleteCheckout('LemonSqueezy')}
                    disabled={paying}
                    className="w-full bg-brand-card border border-brand-border text-text-primary py-3 rounded-lg text-sm font-semibold hover:bg-brand-bg transition flex items-center justify-center space-x-2"
                  >
                    <ExternalLink size={16} />
                    <span>Zapłać testowo (LemonSqueezy)</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {selectedCertificateForPreview && (
          <div className="fixed inset-0 bg-accent-purple/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto w-full">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-brand-card rounded-2xl max-w-5xl w-full border border-brand-border shadow-2xl overflow-hidden flex flex-col md:flex-row"
            >
              {/* Left Style Control Panel */}
              <div className="w-full md:w-80 bg-brand-bg text-text-primary p-6 md:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-brand-border shrink-0">
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 block">Generator PDF</span>
                      <button onClick={() => setSelectedCertificateForPreview(null)} className="md:hidden text-text-secondary hover:text-text-primary">
                        <X size={16} />
                      </button>
                    </div>
                    <h3 className="text-xl font-semibold tracking-tight mt-2 text-text-primary">Personalizacja</h3>
                    <p className="text-[11px] text-text-secondary font-medium mt-2">Dopasuj unikalny styl graficzny certyfikatu. Zmiana powoduje odświeżenie wpisu w bazie danych.</p>
                  </div>

                  <div className="space-y-3">
                    {[
                      { id: 'classical', label: 'Klasyczna Elegancja', desc: 'Złota obwódka i tradycyjna czcionka szeryfowa', activeColor: 'bg-accent-blue/10 border-accent-blue/30', activeText: 'text-accent-purple' },
                      { id: 'modern', label: 'Szybki Modernizm', desc: 'Czysty minimalizm z energetycznymi akcentami szmaragdu', activeColor: 'bg-accent-blue/10 border-accent-blue/30', activeText: 'text-accent-purple' },
                      { id: 'minimalist', label: 'Czysty Minimalizm', desc: 'Szwajcarski design - czarny tusz na białym tle', activeColor: 'bg-accent-blue/10 border-accent-blue/30', activeText: 'text-accent-purple' },
                      { id: 'tech_dark', label: 'Kosmiczny Cyberpunk', desc: 'Stylizowany ciemny motyw z neonową poświatą', activeColor: 'bg-accent-blue/10 border-accent-blue/30', activeText: 'text-accent-purple' },
                      { id: 'luxury_gold', label: 'Królewski Złoty', desc: 'Luksusowa ciemna tekstura z bogatym złotym tłem', activeColor: 'bg-accent-blue/10 border-accent-blue/30', activeText: 'text-accent-purple' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setPreviewSelectedStyle(st.id as any)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col ${
                          previewSelectedStyle === st.id 
                            ? `${st.activeColor} shadow-sm ring-1 ring-indigo-500`
                            : 'bg-brand-card border-brand-border text-text-primary hover:bg-brand-bg hover:border-brand-border shadow-sm'
                        }`}
                      >
                        <span className={`text-sm font-semibold tracking-tight ${previewSelectedStyle === st.id ? st.activeText : 'text-text-primary'}`}>{st.label}</span>
                        <span className={`text-[10px] mt-1 leading-tight ${previewSelectedStyle === st.id ? 'text-accent-blue/70' : 'text-text-secondary'}`}>
                          {st.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-6 space-y-3 border-t border-brand-border mt-6 md:mt-0">
                  <button
                    type="button"
                    onClick={() => handleSaveCertificateStyle(selectedCertificateForPreview.id, previewSelectedStyle)}
                    disabled={isSavingStyle}
                    className="w-full bg-accent-blue hover:bg-accent-purple text-white py-3 rounded-lg text-sm font-semibold transition flex items-center justify-center space-x-2 border-none cursor-pointer shadow-sm"
                  >
                    <CheckCircle2 size={16} />
                    <span>{isSavingStyle ? 'Zapisywanie...' : 'Zastosuj Szablon'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadCertificate(selectedCertificateForPreview.id)}
                    className="w-full bg-brand-card hover:bg-brand-bg text-text-primary border border-brand-border py-3 rounded-lg text-sm font-medium transition flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
                  >
                    <Download size={16} />
                    <span>Pobierz certyfikat (PDF)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedCertificateForPreview(null)}
                    className="w-full bg-brand-bg md:bg-transparent hover:bg-brand-card border md:border-none border-brand-border text-text-primary md:text-text-secondary py-3 md:py-2 rounded-lg text-sm font-semibold transition text-center cursor-pointer block mt-2 shadow-sm md:shadow-none"
                  >
                    Zamknij edytor
                  </button>
                </div>
              </div>

              {/* Right Certificate Live Preview Render Stage */}
              <div className="flex-1 p-6 md:p-10 flex flex-col justify-center items-center bg-neutral-200 min-h-[400px] md:min-h-0">
                <div className="w-full max-w-xl transition-all duration-300">
                  {/* Classical Template Render */}
                  {previewSelectedStyle === 'classical' && (
                    <div className="bg-[#FAF9F5] text-text-primary p-8 md:p-12 rounded-2xl border-[16px] border-amber-800/10 relative shadow-lg flex flex-col justify-between min-h-[420px] before:absolute before:inset-1 before:border-2 before:border-amber-800/30 before:pointer-events-none">
                      <div className="text-center space-y-3">
                        <Award className="mx-auto text-amber-700 animate-pulse" size={48} />
                        <h4 className="font-semibold tracking-tight text-2xl font-bold tracking-tight text-text-primary">Certyfikat Ukończenia Kursu</h4>
                        <div className="h-0.5 w-24 bg-amber-700/40 mx-auto my-3"></div>
                        <p className="text-[11px] uppercase tracking-widest font-mono text-text-secondary">Niniejszym zaświadcza się, że</p>
                        <p className="text-2xl font-semibold tracking-tight font-bold text-text-primary underline decoration-amber-600/30 decoration-offset-4">
                          {selectedCertificateForPreview.first_name || currentUser?.first_name} {selectedCertificateForPreview.last_name || currentUser?.last_name}
                        </p>
                        <p className="text-xs text-text-secondary italic max-w-sm mx-auto">
                          z sukcesem i pełnym zaangażowaniem ukończył oficjalny, certyfikowany kurs edukacyjny platformy HRL Academy:
                        </p>
                        <p className="text-base font-semibold tracking-tight font-bold text-text-primary mt-2">
                          {selectedCertificateForPreview.course_title || "Zarządzanie Chmurą Obliczeniową"}
                        </p>
                      </div>

                      <div className="flex justify-between items-end border-t border-brand-border pt-6 mt-8 font-mono text-[9px] text-text-secondary">
                        <div>
                          <p className="font-bold uppercase tracking-wider">Kod Weryfikacyjny API</p>
                          <p className="text-accent-blue mt-0.5">{selectedCertificateForPreview.certificate_code}</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold uppercase tracking-wider">HRL Academy Core Registry</p>
                          <p className="text-text-secondary mt-0.5">Zatwierdzono: 2026.05.20</p>
                        </div>
                        <div className="text-right">
                          <p className="opacity-75 italic font-serif text-xs text-text-primary font-bold">Jan Kowalski</p>
                          <p className="font-bold uppercase tracking-wider text-[8px] border-t border-brand-border pt-0.5 mt-0.5">Dyrektor Programowy</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Modern Template Render */}
                  {previewSelectedStyle === 'modern' && (
                    <div className="bg-brand-card text-text-primary p-8 md:p-12 rounded-2xl border-l-[12px] border-emerald-500 shadow-lg flex flex-col justify-between min-h-[420px] relative">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-mono font-bold border border-emerald-200 uppercase">
                            ✓ Oficjalny Certyfikat REST API
                          </div>
                          <span className="text-[9px] font-mono text-text-secondary">STATUS: ZWERIFIKOWANY</span>
                        </div>
                        
                        <div className="space-y-1 pt-4">
                          <p className="text-[10px] uppercase tracking-wider font-mono text-text-secondary font-bold">HRL ACADEMY COMPLETION DEED</p>
                          <h4 className="text-3xl font-sans font-extrabold tracking-tight text-text-primary leading-none">
                            {selectedCertificateForPreview.first_name || currentUser?.first_name} {selectedCertificateForPreview.last_name || currentUser?.last_name}
                          </h4>
                          <div className="h-1 w-16 bg-emerald-500 mt-2"></div>
                        </div>

                        <p className="text-text-secondary text-xs leading-relaxed max-w-md pt-2">
                          Za wybitne osiągnięcia w nauce, nabyte kompetencje inżynieryjne oraz ukończenie w 100% programu szkoleniowego dla modułu:
                        </p>
                        <p className="text-lg font-bold text-text-primary font-sans tracking-tight">
                          {selectedCertificateForPreview.course_title || "Zarządzanie Chmurą Obliczeniową"}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 border-t border-brand-border pt-6 mt-8 font-mono text-[9px] text-text-secondary">
                        <div>
                          <p className="font-bold text-text-secondary uppercase">UNIKALNY TOKEN SKLEPOWY</p>
                          <p className="text-emerald-600 font-bold font-mono mt-0.5">{selectedCertificateForPreview.certificate_code}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-text-secondary uppercase">CYFROWY STAMPEL BHP</p>
                          <p className="text-text-secondary font-bold mt-0.5">ACADEMY-ID-{selectedCertificateForPreview.id}-OK</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Minimalist Template Render */}
                  {previewSelectedStyle === 'minimalist' && (
                    <div className="bg-brand-card text-text-primary p-8 md:p-12 rounded-2xl border border-brand-border shadow-lg flex flex-col justify-between min-h-[420px]">
                      <div className="space-y-6">
                        <span className="text-[9px] font-mono uppercase tracking-widest text-[rgb(250,250,250)]/40">CERTIFICATION REPORT — NO. {selectedCertificateForPreview.id}</span>
                        
                        <div className="space-y-2">
                          <h4 className="text-2xl font-mono tracking-tight font-light uppercase">
                            {selectedCertificateForPreview.first_name || currentUser?.first_name} {selectedCertificateForPreview.last_name || currentUser?.last_name}
                          </h4>
                          <p className="text-xs text-text-secondary leading-relaxed font-mono">
                            The bearer has completed all academic requirements, tests, and homework modules for:
                          </p>
                          <p className="text-lg font-mono font-bold uppercase tracking-tight py-2 border-y border-brand-border">
                            {selectedCertificateForPreview.course_title || "Zarządzanie Chmurą Obliczeniową"}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-end pt-6 font-mono text-[9px] text-text-secondary">
                        <div>
                          <p className="text-text-secondary">VERIFICATION ENGINE</p>
                          <p className="font-bold text-text-primary mt-0.5">{selectedCertificateForPreview.certificate_code}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-text-secondary">TIMESTAMP RECORD</p>
                          <p className="font-bold text-text-primary mt-0.5">2026-05-20 UTC</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tech Dark Template Render */}
                  {previewSelectedStyle === 'tech_dark' && (
                    <div className="bg-[#1a1a1b] text-white p-8 md:p-12 rounded-2xl border-4 border-indigo-500/30 shadow-indigo-500/10 shadow-lg flex flex-col justify-between min-h-[420px] relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-accent-blue/100/10 rounded-full blur-2xl"></div>
                      <div className="space-y-6 z-10">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-mono text-indigo-400 tracking-wider font-extrabold uppercase">🚀 CRYPTOGRAPHIC PROOF CERTIFICATE</span>
                          <span className="text-[9px] font-mono bg-accent-blue/100/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/40">SHA-256</span>
                        </div>

                        <div className="space-y-2">
                          <p className="text-[10px] text-text-secondary font-mono">RECIPIENT IDENTITY:</p>
                          <h4 className="text-2xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-[rgb(250,250,250)] to-indigo-300">
                            {selectedCertificateForPreview.first_name || currentUser?.first_name} {selectedCertificateForPreview.last_name || currentUser?.last_name}
                          </h4>
                          <p className="text-xs text-text-secondary font-mono pt-3 leading-relaxed">
                            Validated blocks parsed successfully. The node completed educational path for cloud architect curriculum:
                          </p>
                          <p className="text-base font-mono font-bold text-indigo-300 border border-slate-700/60 p-3 rounded-lg bg-black/30 mt-2">
                            {selectedCertificateForPreview.course_title || "Zarządzanie Chmurą Obliczeniową"}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-end border-t border-brand-border/80 pt-6 mt-8 font-mono text-[9px] text-text-secondary z-10">
                        <div>
                          <p className="text-text-secondary">DIGITAL HASH</p>
                          <p className="text-indigo-400 font-bold font-mono mt-0.5">{selectedCertificateForPreview.certificate_code}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-text-secondary">AUTHORITY SIGNATURE</p>
                          <p className="text-[rgb(250,250,250)] font-bold mt-0.5">HRL_PLATFORM_CORE_NODE_SIGNED</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Luxury Gold Template Render */}
                  {previewSelectedStyle === 'luxury_gold' && (
                    <div className="bg-gradient-to-b from-[#111111] to-[#1c1c1c] text-white p-8 md:p-12 rounded-2xl border-[12px] border-[#d4af37]/30 shadow-2xl flex flex-col justify-between min-h-[420px] relative select-none">
                      <div className="absolute inset-2 border border-[#d4af37]/10 pointer-events-none"></div>
                      <div className="text-center space-y-4 z-10">
                        <div className="w-10 h-10 border-2 border-[#d4af37] bg-accent-purple rounded-full mx-auto flex items-center justify-center">
                          <Award size={20} className="text-[#d4af37] animate-pulse" />
                        </div>
                        <h4 className="font-semibold tracking-tight text-2xl text-[#d4af37] tracking-wider font-extrabold">Certyfikat Wybitności</h4>
                        <p className="text-[10px] uppercase font-mono text-text-secondary tracking-widest leading-none pt-1">Oto oficjalne potwierdzenie zdobycia mistrzostwa</p>
                        <p className="text-2xl font-serif text-white italic underline decoration-[#d4af37]/30 decoration-offset-4">
                          {selectedCertificateForPreview.first_name || currentUser?.first_name} {selectedCertificateForPreview.last_name || currentUser?.last_name}
                        </p>
                        <p className="text-xs text-text-secondary leading-relaxed max-w-sm mx-auto">
                          za nienaganne ukończenie programu szkoleniowego z najwyższym rezultatem:
                        </p>
                        <p className="text-[#d4af37] text-base font-semibold tracking-tight tracking-wide font-extrabold">
                          {selectedCertificateForPreview.course_title || "Zarządzanie Chmurą Obliczeniową"}
                        </p>
                      </div>

                      <div className="flex justify-between items-end pt-6 border-t border-[#d4af37]/10 mt-6 font-mono text-[9px] text-[#d4af37] z-10">
                        <div>
                          <p className="text-text-secondary uppercase text-[8px]">GOLD DEED REGISTRATION CODE</p>
                          <p className="text-white mt-0.5 font-bold">{selectedCertificateForPreview.certificate_code}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-text-secondary uppercase text-[8px]">ACADEMY BOARD SEAL</p>
                          <p className="text-white mt-0.5 font-bold">REGISTRY_AUTHENTIC_GOLD_{selectedCertificateForPreview.id}</p>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </motion.div>
          </div>
        )}

        {courseToDelete && (
          <div className="fixed inset-0 bg-accent-purple/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-brand-card rounded-2xl max-w-sm w-full border border-brand-border shadow-xl overflow-hidden"
            >
              <div className="bg-red-50 border-b border-red-100 p-5 flex justify-between items-center">
                <span className="text-[10px] font-mono uppercase tracking-widest text-red-600 font-semibold flex items-center gap-2">
                  <Trash2 size={14} /> Potwierdzenie Usunięcia
                </span>
                <button onClick={() => setCourseToDelete(null)} className="text-red-400 hover:text-red-700 transition">
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 md:p-8 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mt-1 text-text-primary">Usuwanie Kursu</h3>
                  <p className="text-sm font-medium mt-2 text-text-secondary">
                    Czy na pewno chcesz trwale usunąć ten kurs wraz z powiązanymi lekcjami?
                  </p>
                </div>
                
                <div className="p-3 bg-brand-bg rounded-lg border border-brand-border text-xs font-mono text-text-secondary">
                  <span className="font-semibold text-text-primary break-words">{courseToDelete.title}</span>
                </div>

                <div className="space-y-3 pt-2">
                  <button 
                    onClick={() => handleDeleteCourse(courseToDelete.id)}
                    className="w-full bg-red-600 text-white py-3 rounded-lg text-sm font-semibold hover:bg-red-700 transition"
                  >
                    Tak, usuń bezpowrotnie
                  </button>

                  <button 
                    onClick={() => setCourseToDelete(null)}
                    className="w-full bg-brand-card border border-brand-border text-text-primary py-3 rounded-lg text-sm font-semibold hover:bg-brand-bg transition"
                  >
                    Anuluj
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {isAccessReportOpen && adminStats?.enrollmentStats && (
          <div className="fixed inset-0 bg-accent-purple/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-brand-card rounded-2xl max-w-lg w-full border border-brand-border shadow-xl overflow-hidden"
            >
              <div className="bg-brand-bg border-b border-brand-border p-5 flex justify-between items-center">
                <span className="text-[10px] font-mono uppercase tracking-widest text-text-secondary font-semibold flex items-center gap-2">
                  <ShieldCheck size={14} /> Szczegółowy Raport Dostępowy
                </span>
                <button onClick={() => setIsAccessReportOpen(false)} className="text-text-secondary hover:text-text-primary transition">
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 md:p-8 space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mt-1 text-text-primary">Analiza Uprawnień Kursantów</h3>
                  <p className="text-sm font-medium mt-2 text-text-secondary">
                    Poniżej znajduje się szczegółowe podsumowanie Twoich aktywnych licencji edukacyjnych i zakupionych kursów.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <span className="text-sm font-semibold text-emerald-800">Licencje Darmowe (Free)</span>
                    <span className="text-xl font-bold font-mono text-emerald-600">{adminStats.enrollmentStats.free}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-100 rounded-xl">
                    <span className="text-sm font-semibold text-amber-800">Licencje Płatne (One-time Paid)</span>
                    <span className="text-xl font-bold font-mono text-amber-600">{adminStats.enrollmentStats.paid}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-accent-blue/10 border border-accent-blue/20 rounded-xl">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-indigo-800">Subskrypcje (Recurring)</span>
                      <span className="text-[10px] font-mono text-indigo-500 uppercase mt-0.5">W tym aktywne PRO: {adminStats.activeSubscriptions}</span>
                    </div>
                    <span className="text-xl font-bold font-mono text-accent-blue">{adminStats.enrollmentStats.subscription}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-brand-border">
                  <button 
                    onClick={() => setIsAccessReportOpen(false)}
                    className="w-full bg-accent-purple text-white py-3 rounded-lg text-sm font-semibold hover:bg-neutral-800 transition"
                  >
                    Zamknij Raport
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Styled Footer */}
      <footer className="bg-brand-bg text-text-secondary p-5 text-center border-t border-brand-border font-mono text-[10px] shrink-0">
        <p className="font-semibold text-text-primary">© 2026 HRL Academy Core.</p>
        <p className="opacity-50 mt-1">Platform ID: {currentUser ? `USR-${currentUser.id}` : 'GUEST-0'} • System akredytowany: ISO27001</p>
        <div className="mt-4 flex flex-col md:flex-row justify-center items-center gap-4 text-text-primary">
          <span>Wsparcie: <a href="mailto:contact@hardbanrecordslab.online" className="text-accent-blue hover:underline">contact@hardbanrecordslab.online</a></span>
          <span className="hidden md:inline text-text-secondary">•</span>
          <span>Informacje prawne (Legal): <a href="mailto:info@hardbanrecordslab.online" className="text-accent-blue hover:underline">info@hardbanrecordslab.online</a></span>
          <span className="hidden md:inline text-text-secondary">•</span>
          <span>System: <a href="mailto:no-reply@hardbanrecordslab.online" className="text-accent-blue hover:underline">no-reply@hardbanrecordslab.online</a></span>
        </div>
      </footer>

      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`p-4 rounded-xl shadow-xl border pointer-events-auto flex items-center space-x-3 w-80 
                ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 
                  toast.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' : 
                  'bg-brand-card border-brand-border text-text-primary'}`}
            >
              <div className={`p-2 rounded-lg 
                ${toast.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 
                  toast.type === 'warning' ? 'bg-amber-100 text-amber-600' : 
                  'bg-brand-bg text-accent-blue'}`}
              >
                {toast.type === 'success' ? <CheckCircle2 size={20} /> :
                 toast.type === 'warning' ? <AlertCircle size={20} /> :
                 <Info size={20} />}
              </div>
              <p className="text-sm font-medium leading-snug">{toast.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}
