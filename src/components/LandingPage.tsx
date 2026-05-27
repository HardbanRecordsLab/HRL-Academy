import React from 'react';
import { motion } from 'motion/react';
import { PlayCircle, ArrowRight, Layers, Award, Users, Rocket, Smartphone, Share2, Check, X, Target, Play, Star, ChevronDown, Globe, ShieldCheck } from 'lucide-react';
// @ts-ignore
import logoUrl from '../assets/images/hrl_academy_logo_1779373295965.png';

export function LandingPage({ onEnter }: { onEnter: () => void }) {
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#070709] text-slate-300 font-sans selection:bg-[#534AB7]/30 overflow-x-hidden relative">
      {/* Background cinematic effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik00MCAwaC0xdjM5aC0zOXYxSDQwVjB6IiBmaWxsPSJoc2xhKDIxMCwgMTAwJSwgMTAwJSwgMC4wMykiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPgo8L3N2Zz4=')] opacity-50 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_80%)]" />
        <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-[#534AB7]/15 rounded-full blur-[150px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-[#3C3489]/15 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute inset-0 opacity-[0.02]" style={{background: 'radial-gradient(circle at 30% 50%, rgba(200,169,110,0.3) 0%, transparent 70%)'}} />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-5 md:px-12 max-w-[90rem] mx-auto border-b border-white/5">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-black border border-white/10 shadow-2xl relative group cursor-pointer transition-transform hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-[#534AB7]/20 to-[#3C3489]/20 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <img src={logoUrl} alt="HRL Academy Logo" className="w-full h-full object-cover relative z-10" />
          </div>
          <span className="font-bold tracking-tight text-white/90 text-xl font-[Syne]">HRL<span className="text-white/40 ml-1 font-normal">Core</span></span>
        </div>
        <div className="flex items-center space-x-8">
          <div className="hidden md:flex items-center space-x-6">
            <button onClick={onEnter} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Wszystkie Kursy</button>
          </div>
          <button 
            onClick={onEnter}
            className="group flex items-center space-x-2 bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-2.5 rounded-full text-sm font-medium text-white transition-all backdrop-blur-md hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.1)]"
          >
            <span>Platforma</span>
            <ArrowRight size={14} className="opacity-70 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 lg:px-12 pt-20 pb-20">
        {/* Badges & Hero Title */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left mb-16 pt-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center space-x-2 bg-[#EEEDFE]/10 border border-[#AFA9EC]/30 rounded-full px-4 py-1.5 mb-8 overflow-hidden relative shadow-sm"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[200%] animate-[shimmer_3s_infinite] pointer-events-none" />
            <span className="text-[14px] text-[#7F77DD] leading-none mb-[2px] font-bold">●</span>
            <span className="text-[11px] font-bold text-[#EEEDFE] uppercase tracking-[0.08em] relative z-10">Otwarta rekrutacja · 100+ specjalizacji</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-[clamp(36px,6vw,68px)] font-[Syne] font-[800] leading-[1.05] tracking-[-0.02em] text-white mb-6"
          >
            Twoja kariera zasługuje<br className="hidden md:block"/> na <span className="text-[#a59ffd]">ekspertów, nie algorytmy.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg md:text-[19px] text-[#A6A3B9] font-[Figtree] max-w-2xl font-light leading-[1.7] mb-10"
          >
            HRL Core to jedyna platforma w Polsce, gdzie uczysz się od prawdziwych liderów z dziesiątków branż. Wybierz specjalizację, opłacasz tylko wybrany kurs i zyskujesz do niego dostęp na zawsze. Udostępniamy również pokaźną bazę w pełni darmowych materiałów na start.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto mb-16"
          >
            <button 
              onClick={onEnter}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-[#534AB7] text-white px-7 py-4 rounded-xl font-[Figtree] font-bold hover:bg-[#433A9B] transition-colors shadow-lg"
            >
              <Rocket size={18} />
              <span>Sprawdź darmowe kursy</span>
            </button>
            <button 
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-transparent border border-white/15 text-white px-7 py-4 rounded-xl font-[Figtree] font-medium hover:bg-white/5 transition-colors"
            >
              <PlayCircle size={18} />
              <span>Obejrzyj demo (2 min)</span>
            </button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center md:items-start gap-4 md:gap-5"
          >
            <div className="flex">
              <div className="w-10 h-10 rounded-full border-2 border-[#070709] bg-[#CECBF6] text-[#3C3489] flex items-center justify-center text-xs font-bold -ml-[12px] first:ml-0 shadow-sm z-10 relative">MK</div>
              <div className="w-10 h-10 rounded-full border-2 border-[#070709] bg-[#9FE1CB] text-[#085041] flex items-center justify-center text-xs font-bold -ml-[12px] shadow-sm z-20 relative">AW</div>
              <div className="w-10 h-10 rounded-full border-2 border-[#070709] bg-[#F5C4B3] text-[#712B13] flex items-center justify-center text-xs font-bold -ml-[12px] shadow-sm z-30 relative">PZ</div>
              <div className="w-10 h-10 rounded-full border-2 border-[#070709] bg-[#B5D4F4] text-[#0C447C] flex items-center justify-center text-xs font-bold -ml-[12px] shadow-sm z-40 relative">JN</div>
            </div>
            <div className="text-sm text-[#A6A3B9] font-[Figtree] text-center md:text-left leading-relaxed">
              <div className="flex items-center justify-center md:justify-start gap-1 text-amber-500 mb-0.5">
                <Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" />
              </div>
              <strong className="text-white font-semibold">Ponad 14 000 profesjonalistów</strong> już uczy się z HRL Core.<br/>Średnia ocena kursów: <strong className="text-white font-semibold">4.9/5.0</strong>
            </div>
          </motion.div>
        </div>

        <div className="border-t border-white/10 w-full mb-16 pt-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-[2px] bg-white/10 rounded-2xl overflow-hidden shadow-lg border border-white/5">
            <div className="bg-[#12121A] p-6 md:p-8 text-center flex flex-col items-center justify-center">
              <div className="font-[Syne] text-3xl md:text-[34px] font-[800] text-[#a59ffd] mb-1">300+</div>
              <div className="text-[12px] font-bold text-[#A6A3B9] uppercase tracking-[0.06em]">kursów w 40+ branżach</div>
            </div>
            <div className="bg-[#12121A] p-6 md:p-8 text-center flex flex-col items-center justify-center">
              <div className="font-[Syne] text-3xl md:text-[34px] font-[800] text-[#a59ffd] mb-1">50+</div>
              <div className="text-[12px] font-bold text-[#A6A3B9] uppercase tracking-[0.06em]">godzin VOD 4K</div>
            </div>
            <div className="bg-[#12121A] p-6 md:p-8 text-center flex flex-col items-center justify-center">
              <div className="font-[Syne] text-3xl md:text-[34px] font-[800] text-[#a59ffd] mb-1">96%</div>
              <div className="text-[12px] font-bold text-[#A6A3B9] uppercase tracking-[0.06em]">awansów w 6 mies.</div>
            </div>
            <div className="bg-[#12121A] p-6 md:p-8 text-center flex flex-col items-center justify-center">
              <div className="font-[Syne] text-3xl md:text-[34px] font-[800] text-[#a59ffd] mb-1">14k+</div>
              <div className="text-[12px] font-bold text-[#A6A3B9] uppercase tracking-[0.06em]">uczestników platformy</div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-24">
          <h2 className="font-[Syne] text-3xl md:text-[36px] font-[800] text-white mb-2 tracking-tight">Co zyskujesz od pierwszego dnia</h2>
          <p className="font-[Figtree] text-[17px] text-[#A6A3B9] mb-10">Nie platforma do nauki — potężne narzędzie do zmiany życia zawodowego na każdej płaszczyźnie.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-[#12121A] border border-white/5 rounded-[18px] p-6 hover:border-[#534AB7]/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#EEEDFE] text-[#534AB7] flex items-center justify-center mb-5"><Globe size={22} strokeWidth={2}/></div>
              <h3 className="font-bold text-white text-[16px] mb-2 font-[Figtree]">Wiedza bez granic</h3>
              <p className="text-[15px] font-[Figtree] text-[#A6A3B9] leading-relaxed">Setki specjalistycznych modułów — od biznesu, zarządzania zasobami i prawa, po IT, UI/UX design oraz marketing nowej generacji.</p>
            </div>
            <div className="bg-[#12121A] border border-white/5 rounded-[18px] p-6 hover:border-[#0F6E56]/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#E1F5EE] text-[#0F6E56] flex items-center justify-center mb-5"><Award size={22} strokeWidth={2}/></div>
              <h3 className="font-bold text-white text-[16px] mb-2 font-[Figtree]">Certyfikat, który robi wrażenie</h3>
              <p className="text-[15px] font-[Figtree] text-[#A6A3B9] leading-relaxed">Akredytowane potwierdzenie kompetencji z logo HRL. Wstaw do CV i na profil LinkedIn — rekruterzy natychmiast to zauważą.</p>
            </div>
            <div className="bg-[#12121A] border border-white/5 rounded-[18px] p-6 hover:border-[#854F0B]/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#FAEEDA] text-[#854F0B] flex items-center justify-center mb-5"><Layers size={22} strokeWidth={2}/></div>
              <h3 className="font-bold text-white text-[16px] mb-2 font-[Figtree]">Projekty oparte na faktach</h3>
              <p className="text-[15px] font-[Figtree] text-[#A6A3B9] leading-relaxed">Każdy moduł opieramy o autentyczne rynkowe Case Studies. Przeanalizujesz realne środowiska ukierunkowane na natychmiastowe rozwiązanie Twoich problemów w firmie.</p>
            </div>
            <div className="bg-[#12121A] border border-white/5 rounded-[18px] p-6 hover:border-[#185FA5]/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#E6F1FB] text-[#185FA5] flex items-center justify-center mb-5"><Users size={22} strokeWidth={2}/></div>
              <h3 className="font-bold text-white text-[16px] mb-2 font-[Figtree]">Prawdziwi eksperci rynkowi</h3>
              <p className="text-[15px] font-[Figtree] text-[#A6A3B9] leading-relaxed">Uczysz się od CEO, dyrektorów kreacji artystycznej i menadżerów z wieloletnim stażem — u nas zero teorii bez poparcia.</p>
            </div>
            <div className="bg-[#12121A] border border-white/5 rounded-[18px] p-6 hover:border-[#3B6D11]/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#EAF3DE] text-[#3B6D11] flex items-center justify-center mb-5"><Smartphone size={22} strokeWidth={2}/></div>
              <h3 className="font-bold text-white text-[16px] mb-2 font-[Figtree]">Nauka 24/7 na wskroś platform</h3>
              <p className="text-[15px] font-[Figtree] text-[#A6A3B9] leading-relaxed">Platforma zaprojektowana na komputery, tablety i telefony komórkowe. W delegacji, w biurze i w podróży — Twój rytm.</p>
            </div>
            <div className="bg-[#12121A] border border-white/5 rounded-[18px] p-6 hover:border-[#993556]/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#FBEAF0] text-[#993556] flex items-center justify-center mb-5"><Share2 size={22} strokeWidth={2}/></div>
              <h3 className="font-bold text-white text-[16px] mb-2 font-[Figtree]">Bezpośredni i szczery Feedback</h3>
              <p className="text-[15px] font-[Figtree] text-[#A6A3B9] leading-relaxed">Nie zostajesz z samą wiedzą po kursie. Akcentujemy weryfikację prac, analizę i dyskusje z prowadzącymi by wyeliminować błędy u ich podstaw.</p>
            </div>
          </div>
        </div>

        {/* Value List */}
        <div className="bg-[#12121A] border border-white/5 rounded-[20px] p-8 md:p-10 mb-24">
          <h3 className="font-[Syne] font-[800] text-[20px] text-white mb-6">Dlaczego zajęcia w Hardban Records Lab, a nie kursy na giełdach wideo?</h3>
          <div className="flex flex-col gap-5">
            <div className="flex items-start gap-4">
              <Check className="text-emerald-500 mt-0.5 shrink-0" size={20}/>
              <div className="font-[Figtree] text-[15px] text-[#A6A3B9] leading-relaxed"><strong className="text-white font-semibold">Tylko sprawdzona baza ekspercka</strong> — każdy prowadzący przechodzi u nas selekcję z weryfikacją portfolio życiowego. Od programistów po adwokatów.</div>
            </div>
            <div className="flex items-start gap-4">
              <Check className="text-emerald-500 mt-0.5 shrink-0" size={20}/>
              <div className="font-[Figtree] text-[15px] text-[#A6A3B9] leading-relaxed"><strong className="text-white font-semibold">Rozwiązywanie prawdziwych Business Case'ów</strong> — edukujemy na autentycznych problemach rynkowych a nie abstrakcyjnych wywodach slajdowych.</div>
            </div>
            <div className="flex items-start gap-4">
              <Check className="text-emerald-500 mt-0.5 shrink-0" size={20}/>
              <div className="font-[Figtree] text-[15px] text-[#A6A3B9] leading-relaxed"><strong className="text-white font-semibold">Certyfikaty traktowane priorytetowo</strong> — nie wystawiamy tylko dyplomów ukończenia obejrzenia plików wideo, stawiamy na zdawalność twardych egzaminów.</div>
            </div>
            <div className="flex items-start gap-4">
              <Check className="text-emerald-500 mt-0.5 shrink-0" size={20}/>
              <div className="font-[Figtree] text-[15px] text-[#A6A3B9] leading-relaxed"><strong className="text-white font-semibold">Poziom interdyscyplinarny</strong> — łącz dziedziny takie jak zarządzanie zespołami Agile, marketing behawioralny i UX w spójny stack.</div>
            </div>
          </div>
        </div>

        {/* Comparison section */}
        <div className="mb-24">
          <h2 className="font-[Syne] text-3xl md:text-[36px] font-[800] text-white mb-2 tracking-tight">HRL Core kontra nauka "na własną rękę"</h2>
          <p className="font-[Figtree] text-[17px] text-[#A6A3B9] mb-10">Realistyczna selekcja.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-[#12121A] border border-white/5 rounded-[20px] p-8">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-[12px] uppercase tracking-[0.08em] mb-6">
                <X size={16} strokeWidth={3}/> Otchłań Internetu
              </div>
              <ul className="space-y-4 font-[Figtree] text-[15px] text-[#A6A3B9]">
                <li className="flex items-start gap-3 pb-4 border-b border-white/5"><X className="text-rose-500/70 mt-0.5 shrink-0" size={18}/><span>Godziny poszukiwań sprawdzonych źródeł z nową wiedzą</span></li>
                <li className="flex items-start gap-3 pb-4 border-b border-white/5"><X className="text-rose-500/70 mt-0.5 shrink-0" size={18}/><span>Całkowity brak zweryfikowania kompetencji dla pracodawcy</span></li>
                <li className="flex items-start gap-3 pb-4 border-b border-white/5"><X className="text-rose-500/70 mt-0.5 shrink-0" size={18}/><span>Przypadkowe, sprzeczne tezy autorów materiałów</span></li>
                <li className="flex items-start gap-3 pb-4 border-b border-white/5"><X className="text-rose-500/70 mt-0.5 shrink-0" size={18}/><span>Uczysz się samodzielnie, bez zaufanego community ekspertów</span></li>
                <li className="flex items-start gap-3"><X className="text-rose-500/70 mt-0.5 shrink-0" size={18}/><span>Wpadasz w pułapki ukrytych abonamentów i subskrypcji</span></li>
              </ul>
            </div>
            
            <div className="bg-[#1b1c2b] border border-[#534AB7]/40 rounded-[20px] p-8 shadow-[0_0_30px_-10px_rgba(83,74,183,0.3)]">
              <div className="flex items-center gap-2 text-[#a59ffd] font-bold text-[12px] uppercase tracking-[0.08em] mb-6">
                <Check size={16} strokeWidth={3}/> Platforma HRL Core
              </div>
              <ul className="space-y-4 font-[Figtree] text-[15px] text-white">
                <li className="flex items-start gap-3 pb-4 border-b border-white/5"><Check className="text-emerald-400 mt-0.5 shrink-0" size={18}/><span>Ścieżki rozwojowe od wdrożenia po zaawansowane działy</span></li>
                <li className="flex items-start gap-3 pb-4 border-b border-white/5"><Check className="text-emerald-400 mt-0.5 shrink-0" size={18}/><span>Poważany dyplom cyfrowy idealny do CV i rekrutacji</span></li>
                <li className="flex items-start gap-3 pb-4 border-b border-white/5"><Check className="text-emerald-400 mt-0.5 shrink-0" size={18}/><span>Katalog dedykowany Twoim precyzyjnym celom branżowym</span></li>
                <li className="flex items-start gap-3 pb-4 border-b border-white/5"><Check className="text-emerald-400 mt-0.5 shrink-0" size={18}/><span>Prywatna przestrzeń dla 14 000 ambitnych kursantów</span></li>
                <li className="flex items-start gap-3"><Check className="text-emerald-400 mt-0.5 shrink-0" size={18}/><span>Płacisz raz za to, czego potrzebujesz lub uczysz się za darmo</span></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-24">
          <h2 className="font-[Syne] text-3xl md:text-[36px] font-[800] text-white mb-2 tracking-tight">Historie naszych uczestników</h2>
          <p className="font-[Figtree] text-[17px] text-[#A6A3B9] mb-10">Prawdziwi specjaliści o obiektywnych wdrożeniach.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-[#1b1c2b] border border-[#534AB7]/40 rounded-[20px] p-8 flex flex-col justify-between">
              <p className="font-[Figtree] text-[16px] text-white italic leading-relaxed mb-8">"Z poziomu asystenckiego przeszłam niezwykle płynnie na Project Managera w dużej spółce. Akademia zarządzania w HRL ugruntowała moje procedury, a techniki negocjacji i budowania estymatu diametralnie podwyższyły moją pewność na rekrutacji."</p>
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#534AB7] text-white flex items-center justify-center font-bold text-sm shrink-0">MK</div>
                  <div>
                    <div className="text-white font-bold text-[14px]">Marta Kowalczyk</div>
                    <div className="text-[#a59ffd] text-[12px]">Project Manager · Ścieżka Zarządzania i IT</div>
                  </div>
                </div>
                <div className="inline-block bg-[#CEC9F5]/10 text-[#a59ffd] text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider border border-[#534AB7]/30">
                  +60% wynagrodzenia w 4 miesiące
                </div>
              </div>
            </div>

            <div className="bg-[#12121A] border border-white/5 rounded-[20px] p-8 flex flex-col justify-between hover:border-white/10 transition-colors">
              <p className="font-[Figtree] text-[16px] text-[#A6A3B9] italic leading-relaxed mb-8">"Szukałem stabilności w prowadzeniu firmy, operowałem na ogromnej intuicyjności. Moduły księgowe, prawne i obrót cyklami projektów nakierowały moją e-Commerce na zupełnie nową rentowność, tnąc zbędne procesy operacyjne z palcem w nosie."</p>
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#1D9E75] text-white flex items-center justify-center font-bold text-sm shrink-0">TW</div>
                  <div>
                    <div className="text-white font-bold text-[14px]">Tomasz Wiśniewski</div>
                    <div className="text-[#A6A3B9] text-[12px]">CEO, E-Commerce Owner · Dział Biznes & Finanse</div>
                  </div>
                </div>
                <div className="inline-block bg-[#E1F5EE]/10 text-emerald-400 text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider border border-emerald-500/20">
                  ×2 przychody w optymalizacji
                </div>
              </div>
            </div>

            <div className="bg-[#12121A] border border-white/5 rounded-[20px] p-8 flex flex-col justify-between hover:border-white/10 transition-colors">
              <p className="font-[Figtree] text-[16px] text-[#A6A3B9] italic leading-relaxed mb-8">"Jako UX i UI freelancer zatrzymywałem mnóstwo barier komunikacyjnych z klientami. Zgłębiłem Personal Branding z HRL Core i strategie dekompozycyjne dla portfela, z czasem zrozumiałem swoją unikalną sprzedaż. Już sam filtruję kadrę klientów."</p>
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#D85A30] text-white flex items-center justify-center font-bold text-sm shrink-0">PZ</div>
                  <div>
                    <div className="text-white font-bold text-[14px]">Paweł Zalewicz</div>
                    <div className="text-[#A6A3B9] text-[12px]">Senior Brand Designer · Akademia Marketingu & Designu</div>
                  </div>
                </div>
                <div className="inline-block bg-amber-500/10 text-amber-500 text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider border border-amber-500/20">
                  Własna, bezpieczna agencja
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="mb-24">
          <h2 className="font-[Syne] text-3xl md:text-[36px] font-[800] text-white mb-2 tracking-tight">3 proste kroki do startu</h2>
          <p className="font-[Figtree] text-[17px] text-[#A6A3B9] mb-10">Płynny i intuicyjny onboard.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-[#12121A] border border-white/5 rounded-[20px] p-8 relative overflow-hidden">
              <div className="absolute top-2 right-4 text-[#1b1c2b] font-[Syne] text-[80px] font-[800] leading-none select-none z-0">01</div>
              <div className="relative z-10">
                <Target className="text-[#534AB7] mb-6" size={32}/>
                <h3 className="text-white font-bold text-[18px] mb-3">Zdefiniuj swój cel</h3>
                <p className="text-[#A6A3B9] text-[15px] leading-relaxed">Awans w korporacji, przebranżowienie do IT czy start własnego brandu? Obierz odpowiednie narzędzia z biblioteki i zbuduj z nami dedykowaną ścieżkę.</p>
              </div>
            </div>
            <div className="bg-[#12121A] border border-white/5 rounded-[20px] p-8 relative overflow-hidden">
              <div className="absolute top-2 right-4 text-[#1b1c2b] font-[Syne] text-[80px] font-[800] leading-none select-none z-0">02</div>
              <div className="relative z-10">
                <Play className="text-[#534AB7] mb-6" size={32}/>
                <h3 className="text-white font-bold text-[18px] mb-3">Ucz się z klasą na platformie</h3>
                <p className="text-[#A6A3B9] text-[15px] leading-relaxed">Ekstremalna jakość wideo z materiałami pobocznymi do druku lub uzupełnień chmurowych pod rygorystyczny tryb pracy z systemem zarządzania tożsamością w naszym portalu.</p>
              </div>
            </div>
            <div className="bg-[#12121A] border border-white/5 rounded-[20px] p-8 relative overflow-hidden">
              <div className="absolute top-2 right-4 text-[#1b1c2b] font-[Syne] text-[80px] font-[800] leading-none select-none z-0">03</div>
              <div className="relative z-10">
                <Award className="text-[#534AB7] mb-6" size={32}/>
                <h3 className="text-white font-bold text-[18px] mb-3">Zwieńcz wysiłek certyfikatem</h3>
                <p className="text-[#A6A3B9] text-[15px] leading-relaxed">Na zakończenie Twoje postępy mierzone są weryfikatorem końcowym upoważniającym do wykreowania profesjonalnego dyplomu akceptowanego na rynkach.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Guarantee */}
        <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-[20px] p-8 flex flex-col md:flex-row items-center md:items-start gap-6 mb-24 max-w-4xl mx-auto shadow-[0_0_40px_-10px_rgba(16,185,129,0.1)]">
          <ShieldCheck className="text-emerald-500 shrink-0 mt-1" size={48} strokeWidth={1.5} />
          <div>
            <h3 className="text-emerald-400 font-[Figtree] text-[20px] font-bold mb-2 text-center md:text-left">Gwarancja 30 dni — z nami bez ryzyka</h3>
            <p className="text-[#A6A3B9] text-[16px] leading-relaxed text-center md:text-left">Dajemy bezstresowy 30-dniowy okres. Jeżeli nie wpadniesz w naszą rewelacyjną metodykę przekazywania wiedzy - uzyskasz u nas pełen refund pieniędzy. Rozwój naszych elit to dla nas nadrzędna misja.</p>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-24 max-w-3xl mx-auto">
          <h2 className="font-[Syne] text-3xl md:text-[36px] font-[800] text-white mb-2 tracking-tight text-center">Obszerna baza pytań</h2>

          <div className="space-y-4">
            {[
              { q: 'Czy dostęp do platformy wymaga opłacania miesięcznej subskrypcji?', a: 'Nie! HRL Core działa w przejrzystym modelu Pay-Per-Course. Płacisz jednorazowo tylko za wybrany kurs i zyskujesz do niego dożywotni dostęp. Dodatkowo oferujemy wiele darmowych kursów na dobry start.' },
              { q: 'Czy uzyskiwane referencje Certyfikaty mają prawdziwą moc oddziaływania?', a: 'Także tu odpowiadamy niezwykle klarownie - Nasze plomby HRL są zintegrowane jako pełnoprawne upoważnienie referencyjne na szczeblu rynków branżowych w Polsce w sferach kompetencyjnych.' },
              { q: 'Czy po godzinach pracy zdołam odbywać efektywny postęp na szkoleniach?', a: 'Dzięki adaptacji mechaniki e-learningu modułowego wystarcza ok 25 minut rzetelnie poświęcanego pasma edukacyjnego aby ukończyć wymagające pule materiałowe bez presji i obaw o terminy uwiązane.' }
            ].map((faq, i) => (
              <div key={i} className="bg-[#12121A] border border-white/5 rounded-[16px] overflow-hidden">
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left selection:bg-transparent"
                >
                  <span className="font-bold text-white text-[16px]">{faq.q}</span>
                  <ChevronDown className={`text-[#A6A3B9] transition-transform ${openFaq === i ? 'rotate-180' : ''}`} size={20} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6 text-[#A6A3B9] text-[15px] leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Logos */}
        <div className="mb-24 text-center">
          <p className="text-[12px] font-bold text-[#A6A3B9] uppercase tracking-[0.08em] mb-6">Nasi Eksperci HRL Core działają prężnie na osi struktur</p>
          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            {['Google', 'McKinsey', 'KPMG', 'Allegro', 'OLX Group', 'CD Projekt', 'Bank Pekao', 'Deloitte', 'PwC', 'Ringier Axel Springer'].map(company => (
              <div key={company} className="bg-[#12121A] border border-white/5 rounded-xl px-5 py-2.5 text-[14px] font-bold text-[#A6A3B9]">
                {company}
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="bg-[#1b1c2b] border border-[#534AB7]/40 rounded-[30px] p-10 md:p-16 text-center shadow-[0_0_60px_-15px_rgba(83,74,183,0.4)] relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.05]" style={{background: 'radial-gradient(circle at 70% 50%, rgba(56,189,248,0.2) 0%, transparent 70%)'}} />
          <div className="relative z-10">
            <h2 className="font-[Syne] text-[32px] md:text-[46px] font-[800] text-white leading-tight mb-6">
              Zacznij dziś.<br/>Wyprzedź rynek.
            </h2>
            <p className="text-[#a59ffd] text-[18px] md:text-[20px] font-[Figtree] leading-relaxed mb-10 max-w-2xl mx-auto">
              Zanurz się w ponad dziedzinowej siatce wiedzy na platformie.<br className="hidden md:block"/>
              Twoja przyszłość zawodowa rezonuje z decyzjami, które podejmujesz tu i teraz.
            </p>
            <button 
              onClick={onEnter}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-[#534AB7] text-white px-8 py-5 rounded-xl font-[Figtree] font-bold text-[18px] hover:bg-[#433A9B] transition-colors shadow-lg mx-auto mb-6"
            >
              <Rocket size={20} />
              <span>Wejdź do HRL Academy Core</span>
            </button>
            <p className="text-[#a59ffd]/70 text-[13px] font-medium font-[Figtree]">
              Płatność jednorazowa za kurs · Darmowe moduły · Brak abonamentu
            </p>
          </div>
        </div>
      </main>
      
      {/* Footer minimal */}
      <footer className="border-t border-white/5 py-8 text-center text-sm text-[#A6A3B9] font-[Figtree] relative z-10">
        © {new Date().getFullYear()} Hardban Records Lab. Wszelkie prawa zastrzeżone w pełnej krasie infrastruktury deweloperskiej.
      </footer>
    </div>
  );
}
