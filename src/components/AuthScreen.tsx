"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  Camera,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  Globe,
  GraduationCap,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
  Zap,
} from "lucide-react";
import { FISCareer, UserProfile, UserRole } from "@/types/policonnect";
import { Avatar, cn } from "@/components/ui";
import { resizeImageFile } from "@/lib/image";
import ImageAdjustModal from "@/components/ImageAdjustModal";

interface AuthScreenProps {
  onAuthenticated: (user: UserProfile, isNewRegistration?: boolean) => void;
}

type AuthMode = "login" | "register";

const DEMO_ACCOUNTS = [
  {
    email: "mateo.andrade@epn.edu.ec",
    role: "Estudiante EPN",
    name: "Mateo Andrade",
    career: "FIS · Software",
    detail: "Feed con match y postulaciones activas",
    tag: "EPN",
  },
  {
    email: "valeria.proano@epn.edu.ec",
    role: "Nuevo Estudiante",
    name: "Valeria Proaño",
    career: "FIS · Datos",
    detail: "Onboarding obligatorio con CV e IA",
    tag: "Nuevo",
  },
  {
    email: "diego.paredes@usfq.edu.ec",
    role: "Externo",
    name: "Diego Paredes",
    career: "Graduado USFQ",
    detail: "Postulante de otra universidad",
    tag: "Externo",
  },
  {
    email: "admin@epn.edu.ec",
    role: "Administrador",
    name: "Administrador",
    career: "Personal Universitario",
    detail: "Tracking de estados y estadísticas",
    tag: "Admin",
  },
];

const CAREERS: { value: FISCareer; label: string }[] = [
  { value: "Software", label: "Ingeniería de Software" },
  { value: "Sistemas de Información", label: "Sistemas de Información" },
  { value: "Computación", label: "Ciencias de la Computación" },
  { value: "Ciencias de Datos", label: "Ciencias de Datos" },
];

export default function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  // Animación automática de entrada: el login se despliega solo sin necesidad de activadores
  const [isRevealed, setIsRevealed] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("123456");

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("123456");
  const [regRole, setRegRole] = useState<UserRole>("EPN_STUDENT");
  const [regCareer, setRegCareer] = useState<FISCareer>("Software");
  const [regInstitution, setRegInstitution] = useState("Escuela Politécnica Nacional");
  const [regAvatarUrl, setRegAvatarUrl] = useState<string | null>(null);
  const [adjustPhotoSrc, setAdjustPhotoSrc] = useState<string | null>(null);

  // Se activa automáticamente al cargar la página para ejecutar el desplazamiento suave
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsRevealed(true);
    }, 250);
    return () => clearTimeout(timer);
  }, []);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAdjustPhotoSrc(reader.result);
      }
    };
    reader.onerror = () => {
      setErrorMsg("No se pudo leer el archivo de foto.");
    };
    reader.readAsDataURL(file);
  };

  const performLogin = async (email: string, password: string) => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo iniciar sesión");
      onAuthenticated(data.user, false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error al autenticar");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLogin(loginEmail, loginPassword);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          name: regName,
          email: regEmail,
          password: regPassword,
          role: regRole,
          career: regRole === "EPN_STUDENT" ? regCareer : null,
          institution: regRole === "EPN_STUDENT" ? "Escuela Politécnica Nacional" : regInstitution,
          avatar_url: regAvatarUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear la cuenta");
      onAuthenticated(data.user, true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error en el registro");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#020617] text-slate-100 flex flex-col lg:flex-row font-sans selection:bg-cyan-500 selection:text-black">
      {adjustPhotoSrc && (
        <ImageAdjustModal
          imageSrc={adjustPhotoSrc}
          onConfirm={(cropped) => {
            setRegAvatarUrl(cropped);
            setAdjustPhotoSrc(null);
          }}
          onCancel={() => setAdjustPhotoSrc(null)}
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* LADO DE BRANDING INSTITUCIONAL (Animación automática a 50%)       */}
      {/* ------------------------------------------------------------------ */}
      <section
        className={cn(
          "relative z-10 min-h-screen flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden bg-[#000B1A] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isRevealed ? "w-full lg:w-1/2" : "w-full lg:w-full"
        )}
      >
        {/* Patrón dinámico de nodos y redes digitales (Azul neón y cian) */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="netGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#000B1A" stopOpacity="0" />
              </radialGradient>
              <pattern id="circuitGrid" width="60" height="60" patternUnits="userSpaceOnUse">
                <circle cx="30" cy="30" r="1.5" fill="#00F0FF" opacity="0.4" />
                <path d="M 0 30 L 60 30 M 30 0 L 30 60" stroke="#003876" strokeWidth="0.5" opacity="0.3" />
                <path d="M 30 30 L 45 45 M 30 30 L 15 15" stroke="#06B6D4" strokeWidth="0.8" opacity="0.35" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#circuitGrid)" />
            <circle cx="30%" cy="40%" r="220" fill="url(#netGlow)" />
            <circle cx="80%" cy="70%" r="280" fill="url(#netGlow)" />
          </svg>
        </div>

        {/* Resplandor ambiental de fondo */}
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-cyan-600/20 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-blue-600/20 blur-[130px] pointer-events-none" />

        {/* Encabezado del Branding: Insignia EPN + FIS */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#003876] to-[#001D40] border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
                EPN · Facultad de Sistemas
              </span>
              <p className="text-[11px] text-slate-400">Bolsa de Empleo & Pasantías</p>
            </div>
          </div>
        </div>

        {/* Centro del Branding: Logotipo PoliConnect + Frase manuscrita destacada */}
        <div className="relative z-10 my-auto py-10 max-w-xl">
          {/* Logotipo principal grande */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white">
            Poli<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-[#f39c12]">Connect</span>
          </h1>

          {/* Texto en cursiva manuscrita solicitada: "La Poli del mañana hoy" */}
          <div className="mt-4 flex items-baseline gap-2">
            <span
              className="font-serif italic font-bold text-3xl sm:text-4xl text-[#f39c12] drop-shadow-[0_2px_10px_rgba(243,156,18,0.4)]"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              &quot;La Poli
            </span>
            <span
              className="font-serif italic font-medium text-3xl sm:text-4xl text-white tracking-wide drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)]"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              del mañana hoy&quot;
            </span>
          </div>

          <p className="mt-5 text-sm sm:text-base leading-relaxed text-slate-300 max-w-lg">
            La plataforma inteligente de vinculación laboral y pasantías preprofesionales para
            estudiantes y graduados de la Escuela Politécnica Nacional.
          </p>
        </div>

        {/* Parte inferior: Escudo oficial integrado de manera elegante */}
        <div className="relative z-10 pt-6 border-t border-slate-800/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Escudo estilizado EPN */}
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#002855] to-[#00142E] border border-cyan-500/30 flex items-center justify-center p-2 shadow-inner">
              <svg viewBox="0 0 40 40" className="h-full w-full" fill="none">
                <circle cx="20" cy="20" r="18" stroke="#f39c12" strokeWidth="1.5" />
                <path d="M 20 6 L 32 14 L 32 26 L 20 34 L 8 26 L 8 14 Z" stroke="#00F0FF" strokeWidth="1.2" fill="#001D40" />
                <path d="M 20 10 L 26 15 L 26 25 L 20 29 L 14 25 L 14 15 Z" fill="#f39c12" opacity="0.8" />
                <circle cx="20" cy="20" r="3" fill="#FFFFFF" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white">
                Escuela Politécnica Nacional
              </p>
              <p className="text-[10px] text-cyan-400/90 font-mono">
                E SCIENTIA HOMINIS SALUS · 1869
              </p>
            </div>
          </div>

          <div className="text-right text-[11px] text-slate-400 hidden sm:block">
            <span className="text-slate-300 font-semibold">Campus J. Rubén Orellana R.</span>
            <p>Quito, Ecuador</p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* LADO DEL FORMULARIO (Desplazamiento horizontal automático / Slide) */}
      {/* ------------------------------------------------------------------ */}
      <section
        className={cn(
          "transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col justify-center bg-[#090D16] border-l border-cyan-500/20 overflow-y-auto",
          isRevealed
            ? "w-full lg:w-1/2 min-h-screen p-6 sm:p-10 lg:p-14 opacity-100 translate-x-0 relative pointer-events-auto"
            : "w-full lg:w-1/2 min-h-screen p-0 opacity-0 lg:translate-x-full absolute right-0 top-0 pointer-events-none"
        )}
      >
        <div className="mx-auto w-full max-w-md my-auto">
          {/* Cabecera del formulario: Logo & Escudo */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#003876] border border-cyan-500/40 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white">
                  Poli<span className="text-cyan-400">Connect</span>
                </h2>
                <p className="text-xs text-slate-400">Portal de Acceso Institucional</p>
              </div>
            </div>

            {/* Selector Login / Registro */}
            <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMsg(null);
                }}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200",
                  mode === "login"
                    ? "bg-cyan-500 text-black font-bold shadow-sm"
                    : "text-slate-400 hover:text-white"
                )}
              >
                Ingresar
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setErrorMsg(null);
                }}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200",
                  mode === "register"
                    ? "bg-cyan-500 text-black font-bold shadow-sm"
                    : "text-slate-400 hover:text-white"
                )}
              >
                Registrarse
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-xs font-medium text-red-300">
              {errorMsg}
            </div>
          )}

          {mode === "login" ? (
            <div className="space-y-6">
              {/* Formulario de Correo & Contraseña */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Email institucional o personal
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="nombre.apellido@epn.edu.ec"
                      className="w-full rounded-xl border border-slate-800 bg-[#0F172A]/80 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all duration-200 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 focus:shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-800 bg-[#0F172A]/80 py-3 pl-10 pr-10 text-sm text-white placeholder-slate-500 outline-none transition-all duration-200 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 focus:shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Checkbox Recordar usuario y enlace Olvidaste contraseña */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-300">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500/30"
                    />
                    Recordar usuario
                  </label>

                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      alert("Por favor comunícate con la DSTIC de la EPN o tu administrador para restablecer tu clave.");
                    }}
                    className="text-cyan-400 hover:text-cyan-300 transition hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>

                {/* Botón principal "Ingresar" con degradado azul neón a cian y glow */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 px-6 py-3.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      Verificando credenciales…
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 text-[#f39c12]" />
                      Ingresar a la Plataforma
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* Modo Registro */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Foto de perfil */}
              <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                <Avatar name={regName || "Nuevo"} src={regAvatarUrl} size="lg" />
                <div>
                  <p className="text-xs font-semibold text-white">Foto de perfil profesional</p>
                  <p className="text-[11px] text-slate-400">Se optimiza automáticamente para tu CV.</p>
                  <label className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-slate-700 transition">
                    <Camera className="h-3.5 w-3.5" />
                    Seleccionar foto
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre completo</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ej. Sofía Camila Andrade"
                    className="w-full rounded-xl border border-slate-800 bg-[#0F172A]/80 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de postulante</label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as UserRole)}
                    className="w-full rounded-xl border border-slate-800 bg-[#0F172A]/80 py-2.5 px-3 text-xs text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                  >
                    <option value="EPN_STUDENT">Estudiante EPN (FIS)</option>
                    <option value="EXTERNAL">Postulante Externo</option>
                  </select>
                </div>

                {regRole === "EPN_STUDENT" ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Carrera FIS</label>
                    <select
                      value={regCareer}
                      onChange={(e) => setRegCareer(e.target.value as FISCareer)}
                      className="w-full rounded-xl border border-slate-800 bg-[#0F172A]/80 py-2.5 px-3 text-xs text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                    >
                      {CAREERS.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Institución</label>
                    <input
                      type="text"
                      required
                      value={regInstitution}
                      onChange={(e) => setRegInstitution(e.target.value)}
                      placeholder="Ej. USFQ, PUCE..."
                      className="w-full rounded-xl border border-slate-800 bg-[#0F172A]/80 py-2.5 px-3 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Correo electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder={regRole === "EPN_STUDENT" ? "sofia.andrade@epn.edu.ec" : "sofia@gmail.com"}
                    className="w-full rounded-xl border border-slate-800 bg-[#0F172A]/80 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-800 bg-[#0F172A]/80 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 px-6 py-3 text-xs font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    Creando cuenta institucional…
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4 text-[#f39c12]" />
                    Crear Cuenta y Pasar al Onboarding
                  </>
                )}
              </button>
            </form>
          )}

          {/* Accesos rápidos de prueba (Demo) */}
          <div className="mt-8 border-t border-slate-800/80 pt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Accesos de Demostración (1 Clic)
              </span>
              <span className="text-[10px] text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded-full font-mono">
                Demo
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => performLogin(acc.email, "123456")}
                  className="group flex flex-col p-2.5 text-left rounded-xl border border-slate-800/80 bg-slate-900/40 hover:bg-slate-800/60 hover:border-cyan-500/40 transition-all"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-400 truncate">
                      {acc.name}
                    </span>
                    <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-slate-400">
                      {acc.tag}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 truncate mt-0.5">{acc.career}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
