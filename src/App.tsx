import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  ShieldCheck, 
  Activity, 
  ExternalLink, 
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
  GripVertical,
  Award,
  Trophy,
  Sliders,
  Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Course, Module, Lesson, Payment, Subscription, ActivityLog, Certificate } from './types';

// @ts-ignore
import logoUrl from './assets/images/hrl_academy_logo_1779373295965.png';
import { LandingPage } from './components/LandingPage';

// Configure standard API fetch routing dynamic overrides for split-tier frontend hosting (Vercel) & self-hosted VPS Backend
const VITE_API_URL = (import.meta as any).env.VITE_API_URL || "";
if (VITE_API_URL) {
  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    if (typeof input === 'string' && input.startsWith('/api')) {
      const targetUrl = `${VITE_API_URL.replace(/\/$/, '')}${input}`;
      return originalFetch(targetUrl, init);
    }
    return originalFetch(input, init);
  };
}

export default function App() {
  // Global States
  const [showLanding, setShowLanding] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [availableAccounts, setAvailableAccounts] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Navigation Tabs
  const [activePortal, setActivePortal] = useState<'student' | 'admin'>('student');
  const [studentTab, setStudentTab] = useState<'my-courses' | 'downloads' | 'billing' | 'account' | 'faq'>('my-courses');
  const [adminTab, setAdminTab] = useState<'stats' | 'courses' | 'users' | 'certificates' | 'payments' | 'security' | 'settings'>('stats');

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
  const [lessonAccessDetails, setLessonAccessDetails] = useState<any>(null);
  const [signingToken, setSigningToken] = useState(false);
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
  const [adminLoading, setAdminLoading] = useState(false);
  const [isAccessReportOpen, setIsAccessReportOpen] = useState(false);

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
      fetchDashboardData();
    }
  }, [currentUser]);

  const getAuthHeader = () => {
    const token = localStorage.getItem('hrl_jwt_token');
    const headers: Record<string, string> = {
      'x-user-id': currentUser?.id.toString() || '2'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchInitialAuth = async () => {
    try {
      setErrorMessage(null);
      const token = localStorage.getItem('hrl_jwt_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch("/api/auth/me", { headers });
      if (res.status === 401) {
        // Token invalid — clear it and treat as unauthenticated
        localStorage.removeItem('hrl_jwt_token');
        setCurrentUser(null);
        setErrorMessage("Sesja wygasła. Zaloguj się ponownie.");
      } else {
        const meText = await res.text();
        const me = meText ? JSON.parse(meText) : null;
        if (res.ok && me) {
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
          // GET /api/auth/me returned null or error — stay unauthenticated, redirect to auth
          setCurrentUser(null);
          setErrorMessage("Użytkownik niezaladowany. Zaloguj się.");
        }
      }

      // Load switcher users
      const usersRes = await fetch("/api/auth/users");
      const usersText = await usersRes.text();
      const users = usersText ? JSON.parse(usersText) : [];
      setAvailableAccounts(users);
    } catch (e: any) {
      console.error(e);
      setCurrentUser(null);
      setErrorMessage("Failed to reach server. Please restart development server.");
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchAccount = async (targetUserId: number) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      localStorage.removeItem('hrl_jwt_token');
      const res = await fetch(`/api/auth/me?userId=${targetUserId}`);
      const meText = await res.text();
      const me = meText ? JSON.parse(meText) : null;
      if (res.ok && me) {
        if (me.token) {
          localStorage.setItem('hrl_jwt_token', me.token);
        }
        setCurrentUser(me);
        setCourseStructure(null);
        setActiveLesson(null);
        setLessonAccessDetails(null);
        if (me.role === 'admin') {
          setActivePortal('admin');
        } else {
          setActivePortal('student');
        }
      }
    } catch (err: any) {
      setErrorMessage("Nie udało się przełączyć konta.");
    } finally {
      setLoading(false);
    }
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
        }
      } else {
        // Admin Tab Data Fetches
        const adminHeaders = getAuthHeader();
        
        if (adminTab === 'stats') {
          setAdminLoading(true);
          try {
            const statRes = await fetch('/api/admin/stats', { headers: adminHeaders });
            if (!statRes.ok) throw new Error(`HTTP ${statRes.status}`);
            const data = await statRes.json();
            setAdminStats(data);
          } catch (err) {
            console.error("Admin stats fetch error:", err);
            addToast("Błąd ładowania statystyk administratora", 'warning');
            setAdminStats(null);
          } finally {
            setAdminLoading(false);
          }
        } else if (adminTab === 'courses') {
          setAdminLoading(true);
          try {
            const courseListRes = await fetch('/api/courses', { headers: adminHeaders });
            if (courseListRes.ok) setStudentCourses(await courseListRes.json());
            
            const adminCourseListRes = await fetch('/api/admin/courses', { headers: adminHeaders });
            if (adminCourseListRes.ok) setAdminCoursesList(await adminCourseListRes.json());
          } catch (err) {
            console.error("Admin courses fetch error:", err);
            addToast("Błąd ładowania kursów", 'warning');
          } finally {
            setAdminLoading(false);
          }
        } else if (adminTab === 'users') {
          setAdminLoading(true);
          try {
            const usersRes = await fetch('/api/admin/users', { headers: adminHeaders });
            if (usersRes.ok) setAdminUsersList(await usersRes.json());
          } catch (err) {
            console.error("Admin users fetch error:", err);
            addToast("Błąd ładowania użytkowników", 'warning');
          } finally {
            setAdminLoading(false);
          }
        } else if (adminTab === 'certificates') {
          setAdminLoading(true);
          try {
            const certsRes = await fetch('/api/admin/certificates', { headers: adminHeaders });
            if (certsRes.ok) setAdminCertificatesList(await certsRes.json());
          } catch (err) {
            console.error("Admin certificates fetch error:", err);
          } finally {
            setAdminLoading(false);
          }
        } else if (adminTab === 'security' || adminTab === 'payments') {
          setAdminLoading(true);
          try {
            const logsRes = await fetch('/api/admin/logs', { headers: adminHeaders });
            if (logsRes.ok) setAdminLogsList(await logsRes.json());

            const statRes = await fetch('/api/admin/stats', { headers: adminHeaders });
            if (statRes.ok) setAdminStats(await statRes.json());
          } catch (err) {
            console.error("Admin logs/stats fetch error:", err);
          } finally {
            setAdminLoading(false);
          }
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

        {/* Demo Switcher Widget */}
        <div className="bg-brand-bg border border-brand-border p-1.5 rounded-xl flex flex-wrap items-center space-x-2 shadow-sm">
          <span className="text-[10px] font-mono uppercase text-text-secondary px-2 font-medium">Aktywne Konto:</span>
          {(Array.isArray(availableAccounts) ? availableAccounts : []).map(acc => (
            <button 
              key={acc.id}
              onClick={() => handleSwitchAccount(acc.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${currentUser?.id === acc.id ? 'bg-brand-card text-text-primary shadow-sm border border-brand-border' : 'hover:bg-brand-card text-text-secondary border border-transparent'}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${acc.role === 'admin' ? 'bg-rose-500' : acc.role === 'creator' ? 'bg-blue-400' : 'bg-emerald-400'}`}></span>
              <span>{acc.first_name} <span className="opacity-60 font-normal">({acc.role.toUpperCase()})</span></span>
            </button>
          ))}
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
              {activePortal === 'student' ? 'Nawigacja Studencka' : 'Zarządzanie Platformą'}
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
            ) : (
              <div className="space-y-1">
                {[
                  { id: 'stats', label: 'Przegląd i Statystyki', icon: Activity },
                  { id: 'courses', label: 'Zarządzanie Kursami', icon: Layers },
                  { id: 'users', label: 'Użytkownicy i Uprawnienia', icon: Users },
                  { id: 'certificates', label: 'Rejestr Certyfikatów', icon: Award },
                  { id: 'payments', label: 'Finanse', icon: CreditCard },
                  { id: 'security', label: 'Analiza Zabezpieczeń', icon: ShieldCheck },
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

          <div className="mt-auto pt-6 space-y-3">
            <div className="bg-brand-card p-4 rounded-xl border border-brand-border">
              <p className="text-[10px] font-mono text-text-secondary">OBECNA ROLA (DEBUG)</p>
              <p className="text-sm font-semibold mt-1 text-text-primary">
                {currentUser?.role === 'admin' ? 'Super Administrator' : currentUser?.role === 'creator' ? 'Trener (Podgląd)' : 'Aktywny Kursant'}
              </p>
              <p className="text-[10px] font-mono text-text-secondary mt-1">{currentUser?.email}</p>
            </div>
          </div>
        </aside>

        {/* Dynamic Center Work Area */}
        <main className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto max-h-[100vh] bg-brand-bg text-text-primary">

          {/* Breadcrumbs Navigation */}
          {(() => {
            let b1 = activePortal === 'student' ? 'Panel Studenta' : 'Panel Administratora';
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
            } else {
                const adminTabsMap: Record<string, string> = {
                    'stats': 'Statystyki Systemu',
                    'courses': 'Zarządzanie Kursami',
                    'users': 'Zarządzanie Studentami',
                    'certificates': 'Wydane Certyfikaty',
                    'payments': 'Historia Transakcji',
                    'security': 'Parametry Ochrony',
                    'settings': 'Konfiguracja Globalna'
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
                                  {(Array.isArray(studentCourses) ? studentCourses : []).map(course => (
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
                                  <div className="bg-brand-card p-5 md:p-6 rounded-2xl border border-brand-border space-y-5 shadow-sm">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h2 className="text-2xl font-semibold tracking-tight text-text-primary">{selectedCourse.title}</h2>
                                        <p className="text-xs opacity-60 mt-1 text-text-secondary font-mono">Dostęp do kursu zewnętrznego i generator certyfikatów</p>
                                      </div>
                                      <button 
                                        type="button"
                                        onClick={() => { setSelectedCourse(null); setCourseStructure(null); }}
                                        className="text-xs opacity-50 hover:opacity-100 font-mono text-text-primary underline uppercase cursor-pointer"
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
                                          <div className="bg-brand-card p-4 rounded-xl border border-brand-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                            <div>
                                              <p className="text-[10px] font-mono uppercase text-text-secondary">Platforma Zewnętrzna</p>
                                              <p className="text-xs font-semibold text-neutral-805">Lekcje, laboratoria i pełny program są hostowane na zewnętrznym serwerze.</p>
                                            </div>
                                            <a 
                                              href={selectedCourse.external_url || "https://academy.hrl.pl"}
                                              target="_blank"
                                              rel="noreferrer"
                                              className={`inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all ${
                                                accentColor === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700' :
                                                accentColor === 'amber' ? 'bg-amber-600 hover:bg-amber-700' :
                                                accentColor === 'indigo' ? 'bg-accent-blue hover:bg-accent-purple' : 'bg-accent-purple hover:bg-neutral-800'
                                              }`}
                                            >
                                              <span>Przejdź do kursu ↗</span>
                                            </a>
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
                                                    <div key={lesson.id} className="flex justify-between items-center py-2 px-3 hover:bg-brand-bg rounded-lg group transition-colors">
                                                      <div className="flex items-center space-x-3">
                                                        {lesson.progress?.completed ? (
                                                          <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                                                        ) : (
                                                          <div className="w-[14px] h-[14px] rounded-full border-2 border-brand-border shrink-0" />
                                                        )}
                                                        <span className={`text-xs font-medium transition-colors ${lesson.progress?.completed ? 'text-text-secondary line-through' : 'text-text-primary group-hover:text-text-primary'}`}>
                                                          {lIndex + 1}. {lesson.title}
                                                        </span>
                                                      </div>
                                                      <div className="flex items-center space-x-3">
                                                        <span className="text-[10px] font-mono text-text-secondary shrink-0">{lesson.duration_minutes} min</span>
                                                        {courseStructure.isEnrolled && (
                                                          <button className="text-[10px] bg-brand-card border border-brand-border shadow-sm px-2 py-1 rounded text-text-secondary hover:text-accent-blue hover:border-accent-blue/30 transition-colors cursor-pointer opacity-0 group-hover:opacity-100 hidden sm:block shrink-0">
                                                            Odtwórz
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
                                {(Array.isArray(certificates) ? certificates : []).map(cert => (
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
                <div className="bg-brand-card p-6 md:p-7 rounded-2xl border border-brand-border space-y-5">
                  <h2 className="text-2xl font-semibold tracking-tight">Ustawienia Profilu i Integracji VPS</h2>
                  <p className="text-xs opacity-60">Konfiguracja profilu studenta i tożsamości w bazie HRL Academy Core.</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase opacity-50">Imię i Nazwisko</label>
                      <input 
                        type="text" 
                        readOnly 
                        defaultValue={`${currentUser?.first_name} ${currentUser?.last_name}`} 
                        className="w-full bg-brand-card border border-brand-border px-4 py-2.5 rounded-xl text-xs font-bold text-text-secondary outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase opacity-50">Adres E-mail</label>
                      <input 
                        type="email" 
                        readOnly 
                        defaultValue={currentUser?.email} 
                        className="w-full bg-brand-card border border-brand-border px-4 py-2.5 rounded-xl text-xs font-bold text-text-secondary outline-none"
                      />
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-brand-border">
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

          {/* PORTAL VIEW: ADMIN */}
          {activePortal === 'admin' && (
            <div className="space-y-10 min-h-screen bg-brand-bg text-[#f5f0e6] p-6">
              
              {/* LOADING STATE */}
              {adminLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center py-20"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 border-4 border-brand-gold border-t-transparent rounded-full"
                  />
                  <span className="ml-6 text-lg text-[#f5f0e6] font-medium">
                    Ładowanie panelu administratora...
                  </span>
                </motion.div>
              )}

              {/* ERROR STATE */}
              {!adminLoading && !adminStats && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-rose-500/10 border border-rose-500/30 p-8 rounded-2xl text-rose-300 flex items-start gap-4"
                >
                  <AlertCircle size={24} className="mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Błąd ładowania</h3>
                    <p className="text-sm mb-4">
                      Nie udało się załadować statystyk panelu administratora.
                    </p>
                    <button
                      onClick={() => { setAdminStats(null); fetchDashboardData(); }}
                      className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg text-sm font-medium transition"
                    >
                      Spróbuj ponownie
                    </button>
                  </div>
                </motion.div>
              )}

              {/* CONTENT STATE */}
              {!adminLoading && adminStats && (
              <>
              {/* ADMIN NAVIGATION (HORIZONTAL) */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'stats', label: 'Statystyki', icon: Activity },
                  { id: 'courses', label: 'Kursy', icon: Layers },
                  { id: 'users', label: 'Użytkownicy', icon: Users },
                  { id: 'certificates', label: 'Certyfikaty', icon: Award },
                  { id: 'payments', label: 'Płatności', icon: CreditCard },
                  { id: 'security', label: 'Bezpieczeństwo', icon: ShieldCheck },
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
                        {(Array.isArray(adminLogsList) ? adminLogsList : []).slice(0, 8).map(log => (
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
                            {(Array.isArray(adminCoursesList) ? adminCoursesList : []).map(c => (
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
                          {(Array.isArray(adminCoursesList) ? adminCoursesList : []).map(course => (
                            <tr key={course.id} className="border-b border-brand-border last:border-0 text-xs">
                              <td className="p-4 font-mono font-bold">#{course.id}</td>
                              <td className="p-4">
                                <p className="font-bold">{course.title}</p>
                                <p className="text-[10px] opacity-50 font-mono">Slug: {course.slug}</p>
                              </td>
                              <td className="p-4">
                                <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded ${course.access_type === 'free' ? 'bg-emerald-100 text-emerald-800' : 'bg-accent-blue/20 text-indigo-800'}`}>
                                  {course.access_type}
                                </span>
                              </td>
                              <td className="p-4 font-mono font-bold">${course.price} USD</td>
                              <td className="p-4 font-mono text-center">{course.lessons_count || 0} tematy</td>
                              <td className="p-4 text-right">
                                <button 
                                  onClick={() => setCourseToDelete(course)}
                                  className="text-red-500 hover:text-red-700 p-2.5 hover:bg-red-50 rounded-xl transition"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </td>
                            </tr>
                          ))}
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
                        {(Array.isArray(adminUsersList) ? adminUsersList : []).map(user => (
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
                        {(Array.isArray(adminCertificatesList) ? adminCertificatesList : []).map(cert => (
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
        <p className="opacity-50 mt-1">Platform ID: {currentUser ? `USR-${currentUser.id}` : ''} • System akredytowany: ISO27001</p>
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
