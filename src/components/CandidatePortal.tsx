"use client";

import React, { useMemo, useState } from "react";
import {
  Award,
  Briefcase,
  Building2,
  CalendarClock,
  Camera,
  FileCheck2,
  GraduationCap,
  Inbox,
  Loader2,
  MapPin,
  Search,
  SearchX,
  Send,
  Sparkles,
  UserCheck,
  UserX,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import {
  ApplicationStatus,
  JobApplication,
  JobOffer,
  NotificationItem,
  UserProfile,
} from "@/types/policonnect";
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  IconTile,
  MatchBadge,
  RoleBadge,
  SegmentedTabs,
  StatusBadge,
  cn,
  formatDate,
  initials,
  inputClass,
} from "@/components/ui";
import { resizeImageFile } from "@/lib/image";
import ImageAdjustModal from "@/components/ImageAdjustModal";
import UserProfileModal from "@/components/UserProfileModal";

interface CandidatePortalProps {
  user: UserProfile;
  allUsers?: UserProfile[];
  jobs: JobOffer[];
  applications: JobApplication[];
  notifications: NotificationItem[];
  activeTab: "feed" | "applications" | "community";
  setActiveTab: (tab: "feed" | "applications" | "community") => void;
  onQuickApply: (job: JobOffer) => Promise<void>;
  onOpenOnboarding: () => void;
  onUploadAvatar: (avatarDataUrl: string) => Promise<void>;
}

const PROCESS_STEPS: ApplicationStatus[] = ["En revisión", "Entrevistado", "Seleccionado"];

/* -------------------------------------------------------------------------- */
/* Recordatorio mensual                                                        */
/* -------------------------------------------------------------------------- */

function ReminderBanner({
  lastUpdate,
  onUpdate,
  onDismiss,
}: {
  lastUpdate: string | null;
  onUpdate: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="animate-slide-up flex flex-col gap-4 rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-4">
        <IconTile icon={CalendarClock} />
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">Recordatorio mensual</p>
          <h2 className="mt-1 font-semibold text-gray-900">
            Actualiza tu CV para tener más oportunidades en PoliConnect
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {lastUpdate
              ? `Última actualización: ${formatDate(lastUpdate)}. Un CV reciente mejora tu porcentaje de match.`
              : "Aún no has subido tu CV. Hazlo para recibir ofertas personalizadas."}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:shrink-0">
        <Button icon={<Sparkles className="h-4 w-4" />} onClick={onUpdate}>
          Actualizar CV
        </Button>
        <Button variant="ghost" size="icon" aria-label="Cerrar recordatorio" onClick={onDismiss}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Tarjeta de perfil                                                           */
/* -------------------------------------------------------------------------- */

function ProfileCard({
  user,
  uploading = false,
  photoError = null,
  onEdit,
  onStartAdjust,
  onViewPublicProfile,
}: {
  user: UserProfile;
  uploading?: boolean;
  photoError?: string | null;
  onEdit: () => void;
  onStartAdjust: (dataUrl: string) => void;
  onViewPublicProfile?: () => void;
}) {
  const [localError, setLocalError] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setLocalError(null);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onStartAdjust(reader.result);
      }
    };
    reader.onerror = () => {
      setLocalError("No se pudo leer el archivo de imagen.");
    };
    reader.readAsDataURL(file);
  };

  const displayedError = photoError || localError;

  return (
    <Card className="overflow-hidden">
      <div className="h-20 bg-gradient-to-r from-blue-900 via-[#003876] to-cyan-800" />
      <div className="px-6 pb-6">
        <div className="-mt-12 flex items-end justify-between">
          <label className="group relative cursor-pointer" title="Cambiar foto de perfil">
            <Avatar name={user.name} src={user.avatar_url} size="xl" className="shadow-md ring-4 ring-white" />
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-2xl bg-gray-900/60 text-xs font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 backdrop-blur-xs">
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
              {!uploading && "Ajustar"}
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
          </label>
          <RoleBadge role={user.role} />
        </div>

        <h2 className="mt-4 text-lg font-semibold text-gray-900">{user.name}</h2>
        <p className="mt-1 text-sm leading-relaxed text-gray-500">
          {user.headline || "Postulante en PoliConnect"}
        </p>

        <div className="mt-3 flex items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-[#003876] transition-colors hover:text-[#002855]">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            {user.avatar_url ? "Ajustar nueva foto" : "Subir y ajustar foto"}
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
          </label>
          {onViewPublicProfile && (
            <button
              type="button"
              onClick={onViewPublicProfile}
              className="text-xs font-medium text-gray-500 hover:text-gray-900 transition hover:underline"
            >
              · Ver mi perfil público
            </button>
          )}
        </div>
        {displayedError && <p className="mt-2 text-xs text-red-600">{displayedError}</p>}

          <dl className="mt-6 space-y-3 border-t border-gray-100 pt-6 text-sm">
            <div className="flex items-start gap-3">
              <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              <dd className="text-gray-600">{user.institution}</dd>
            </div>
            {user.career && (
              <div className="flex items-start gap-3">
                <Award className="mt-0.5 h-4 w-4 shrink-0 text-[#003876]" />
                <dd className="text-gray-700 font-medium">Ing. en {user.career}</dd>
              </div>
            )}
            {user.cv_filename && (
              <div className="flex items-start gap-3">
                <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <dd className="min-w-0 truncate text-gray-600">{user.cv_filename}</dd>
              </div>
            )}
          </dl>

          <div className="mt-6 border-t border-gray-100 pt-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Intereses</h3>
              <button type="button" onClick={onEdit} className="text-sm font-medium text-[#003876] hover:text-[#002855]">
                Editar
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {user.tags.length === 0 ? (
                <p className="text-sm text-gray-500">Sin intereses definidos.</p>
              ) : (
                user.tags.map((t) => (
                  <Badge key={t} tone="indigo">
                    {t}
                  </Badge>
                ))
              )}
            </div>
          </div>

          {user.skills.length > 0 && (
            <div className="mt-6 border-t border-gray-100 pt-6">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">Habilidades</h3>
              <div className="flex flex-wrap gap-2">
                {user.skills.map((s) => (
                  <Badge key={s}>{s}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Tarjeta de oferta                                                           */
/* -------------------------------------------------------------------------- */

function JobCard({
  job,
  applying,
  onApply,
}: {
  job: JobOffer;
  applying: boolean;
  onApply: () => void;
}) {
  const matching = job.matching_tags || [];

  return (
    <Card interactive className="p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-gray-50 text-sm font-semibold text-gray-700">
          {initials(job.company)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900">{job.title}</h3>
              <p className="mt-0.5 text-sm text-gray-500">{job.company}</p>
            </div>
            <MatchBadge score={job.match_score ?? 80} />
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-gray-400" />
              {job.location}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Briefcase className="h-4 w-4 text-gray-400" />
              {job.modality}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Wallet className="h-4 w-4 text-gray-400" />
              {job.salary_range}
            </span>
          </div>
        </div>
      </div>

      <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-gray-600">{job.description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {job.tags.map((t) => (
          <Badge key={t} tone={matching.includes(t) ? "indigo" : "gray"}>
            {t}
          </Badge>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="inline-flex items-center gap-1.5 text-sm text-gray-500">
          <Users className="h-4 w-4 text-gray-400" />
          {job.vacancies} {job.vacancies === 1 ? "vacante" : "vacantes"} · {job.applicant_count} postulantes
        </p>
        {job.has_applied ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            Ya postulaste
            <StatusBadge status={job.my_application_status || "En revisión"} />
          </div>
        ) : (
          <Button loading={applying} icon={<Zap className="h-4 w-4" />} onClick={onApply}>
            {applying ? "Enviando…" : "Postulación rápida"}
          </Button>
        )}
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Bandeja de postulaciones                                                    */
/* -------------------------------------------------------------------------- */

function ApplicationItem({ app }: { app: JobApplication }) {
  const currentIdx = PROCESS_STEPS.indexOf(app.status);
  const selected = app.status === "Seleccionado";

  return (
    <div className="p-6 transition-colors duration-200 hover:bg-gray-50/60">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h4 className="font-semibold text-gray-900">{app.job_title}</h4>
          <p className="mt-0.5 text-sm text-gray-500">
            {app.company} · {app.modality}
          </p>
        </div>
        <StatusBadge status={app.status} />
      </div>

      {app.status === "Rechazado" ? (
        <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          El proceso finalizó para esta convocatoria. Sigue postulando a ofertas con alto match.
        </div>
      ) : (
        <ol className="mt-5 grid grid-cols-3 gap-3">
          {PROCESS_STEPS.map((step, idx) => {
            const reached = idx <= currentIdx;
            return (
              <li key={step} className="space-y-2">
                <div
                  className={cn(
                    "h-1.5 rounded-full transition-colors duration-500",
                    reached ? (selected ? "bg-emerald-500" : "bg-indigo-600") : "bg-gray-100"
                  )}
                />
                <p className={cn("text-xs font-medium", reached ? "text-gray-900" : "text-gray-400")}>{step}</p>
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-4 flex flex-wrap justify-between gap-2 text-xs text-gray-400">
        <span>Postulado el {formatDate(app.applied_at)}</span>
        <span>Actualizado el {formatDate(app.updated_at)}</span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Portal principal                                                            */
/* -------------------------------------------------------------------------- */

export default function CandidatePortal({
  user,
  allUsers = [],
  jobs,
  applications,
  notifications,
  activeTab,
  setActiveTab,
  onQuickApply,
  onOpenOnboarding,
  onUploadAvatar,
}: CandidatePortalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<string>("MATCH");
  const [applyingJobId, setApplyingJobId] = useState<number | null>(null);
  const [showBanner, setShowBanner] = useState(true);
  const [inspectedUser, setInspectedUser] = useState<UserProfile | null>(null);

  // Ajuste de foto de perfil (Modal a nivel raíz para evitar problemas de apilamiento/z-index)
  const [adjustSrc, setAdjustSrc] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const handleConfirmAdjust = async (adjustedDataUrl: string) => {
    setAdjustSrc(null);
    setUploadingAvatar(true);
    setPhotoError(null);
    try {
      await onUploadAvatar(adjustedDataUrl);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "No se pudo guardar la foto.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Filtros de Comunidad FIS
  const [communitySearch, setCommunitySearch] = useState("");
  const [communityCareerFilter, setCommunityCareerFilter] = useState<string>("ALL");

  const filteredCommunity = useMemo(() => {
    const q = communitySearch.toLowerCase().trim();
    const list = allUsers.filter((u) => u.role !== "ADMIN");
    return list.filter((cand) => {
      if (communityCareerFilter === "EXTERNAL") {
        if (cand.role !== "EXTERNAL") return false;
      } else if (communityCareerFilter !== "ALL") {
        if (cand.career !== communityCareerFilter) return false;
      }
      if (!q) return true;
      return (
        cand.name.toLowerCase().includes(q) ||
        (cand.career && cand.career.toLowerCase().includes(q)) ||
        (cand.headline && cand.headline.toLowerCase().includes(q)) ||
        (cand.institution && cand.institution.toLowerCase().includes(q)) ||
        cand.skills.some((s) => s.toLowerCase().includes(q)) ||
        cand.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [allUsers, communitySearch, communityCareerFilter]);

  const filteredJobs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return jobs
      .filter((job) => {
        const matchesQuery =
          !q ||
          job.title.toLowerCase().includes(q) ||
          job.company.toLowerCase().includes(q) ||
          job.description.toLowerCase().includes(q) ||
          job.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesQuery) return false;
        if (tagFilter === "ALL") return true;
        if (tagFilter === "MATCH") return (job.matching_tags?.length || 0) > 0 || user.tags.length === 0;
        return job.tags.includes(tagFilter);
      })
      .sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
  }, [jobs, searchQuery, tagFilter, user.tags]);

  const handleApply = async (job: JobOffer) => {
    setApplyingJobId(job.id);
    try {
      await onQuickApply(job);
    } finally {
      setApplyingJobId(null);
    }
  };

  const filterChips = [
    { id: "MATCH", label: "Recomendadas" },
    { id: "ALL", label: "Todas" },
    ...user.tags.map((t) => ({ id: t, label: t })),
  ];

  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      {adjustSrc && (
        <ImageAdjustModal
          imageSrc={adjustSrc}
          onConfirm={handleConfirmAdjust}
          onCancel={() => setAdjustSrc(null)}
        />
      )}

      {inspectedUser && (
        <UserProfileModal user={inspectedUser} onClose={() => setInspectedUser(null)} />
      )}

      {showBanner && (
        <ReminderBanner
          lastUpdate={user.cv_updated_at}
          onUpdate={onOpenOnboarding}
          onDismiss={() => setShowBanner(false)}
        />
      )}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <aside className="lg:sticky lg:top-24 lg:col-span-3">
          <ProfileCard
            user={user}
            uploading={uploadingAvatar}
            photoError={photoError}
            onEdit={onOpenOnboarding}
            onStartAdjust={(src) => setAdjustSrc(src)}
            onViewPublicProfile={() => setInspectedUser(user)}
          />
        </aside>

        <main className="space-y-6 lg:col-span-6">
          {activeTab === "feed" ? (
            <>
              <Card className="space-y-4 p-4 sm:p-6">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por cargo, empresa o tecnología"
                    className={cn(inputClass, "pl-11")}
                  />
                </div>
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                  {filterChips.map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => setTagFilter(chip.id)}
                      className={cn(
                        "shrink-0 rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-200",
                        tagFilter === chip.id
                          ? "bg-[#003876] text-white shadow-sm"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </Card>

              <p className="text-sm text-gray-500">
                {filteredJobs.length} {filteredJobs.length === 1 ? "oferta encontrada" : "ofertas encontradas"}
              </p>

              {filteredJobs.length === 0 ? (
                <Card>
                  <EmptyState
                    icon={SearchX}
                    title="No encontramos ofertas"
                    description="Prueba con otra búsqueda o revisa todas las ofertas disponibles."
                    action={
                      <Button variant="secondary" onClick={() => setTagFilter("ALL")}>
                        Ver todas
                      </Button>
                    }
                  />
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      applying={applyingJobId === job.id}
                      onApply={() => handleApply(job)}
                    />
                  ))}
                </div>
              )}
            </>
          ) : activeTab === "applications" ? (
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between gap-4 border-b border-gray-100 p-6">
                <div>
                  <h2 className="font-semibold text-gray-900">Mis postulaciones</h2>
                  <p className="mt-1 text-sm text-gray-500">Sigue el estado de cada proceso en tiempo real.</p>
                </div>
                <Badge tone="indigo">{applications.length} activas</Badge>
              </div>
              {applications.length === 0 ? (
                <EmptyState
                  icon={Inbox}
                  title="Aún no tienes postulaciones"
                  description="Usa la postulación rápida en las ofertas que coincidan con tu perfil."
                  action={<Button onClick={() => setActiveTab("feed")}>Explorar ofertas</Button>}
                />
              ) : (
                <div className="divide-y divide-gray-100">
                  {applications.map((app) => (
                    <ApplicationItem key={app.id} app={app} />
                  ))}
                </div>
              )}
            </Card>
          ) : (
            /* Tab: Comunidad (Revisión de perfiles entre usuarios) */
            <div className="space-y-4">
              <Card className="p-4 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h2 className="font-bold text-gray-900 flex items-center gap-2">
                      <Users className="h-5 w-5 text-[#003876]" />
                      Directorio de la Comunidad
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Revisa los perfiles, habilidades y proyectos de otros politécnicos y postulantes.
                    </p>
                  </div>
                  <Badge tone="indigo">{filteredCommunity.length} miembros</Badge>
                </div>

                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={communitySearch}
                    onChange={(e) => setCommunitySearch(e.target.value)}
                    placeholder="Buscar por nombre, carrera o habilidad (ej. Python, Datos, React)..."
                    className={cn(inputClass, "pl-11")}
                  />
                </div>

                {/* Filtros de Carrera */}
                <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 text-xs">
                  {[
                    { id: "ALL", label: "Todos los perfiles" },
                    { id: "Software", label: "Ing. Software" },
                    { id: "Sistemas de Información", label: "Sistemas de Inf." },
                    { id: "Computación", label: "Ciencias Computación" },
                    { id: "Ciencias de Datos", label: "Ciencias de Datos" },
                    { id: "EXTERNAL", label: "Externos" },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setCommunityCareerFilter(filter.id)}
                      className={cn(
                        "shrink-0 rounded-xl px-3 py-1.5 font-medium transition-all",
                        communityCareerFilter === filter.id
                          ? "bg-[#003876] text-white shadow-xs"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </Card>

              {filteredCommunity.length === 0 ? (
                <Card>
                  <EmptyState
                    icon={UserX}
                    title="No encontramos perfiles"
                    description="No hay estudiantes o postulantes que coincidan con la búsqueda."
                    action={
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setCommunitySearch("");
                          setCommunityCareerFilter("ALL");
                        }}
                      >
                        Limpiar filtros
                      </Button>
                    }
                  />
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {filteredCommunity.map((candidate) => {
                    const isSelf = candidate.id === user.id;
                    const isEPN = candidate.role === "EPN_STUDENT";

                    return (
                      <Card
                        key={candidate.id}
                        interactive
                        onClick={() => setInspectedUser(candidate)}
                        className="p-5 flex flex-col justify-between transition-all duration-200 hover:border-[#003876]/40 hover:shadow-md cursor-pointer group"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <Avatar
                                name={candidate.name}
                                src={candidate.avatar_url}
                                size="lg"
                                className="ring-2 ring-gray-100 group-hover:ring-[#003876]/30 transition"
                              />
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <h3 className="font-bold text-gray-900 group-hover:text-[#003876] transition text-sm">
                                    {candidate.name}
                                  </h3>
                                  {isSelf && (
                                    <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
                                      Tú
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-gray-500 font-medium">
                                  {isEPN
                                    ? `FIS · ${candidate.career || "Ingeniería"}`
                                    : candidate.institution || "Externo"}
                                </p>
                              </div>
                            </div>

                            <span
                              className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                                isEPN
                                  ? "bg-blue-50 text-[#003876] border-blue-200"
                                  : "bg-slate-50 text-slate-600 border-slate-200"
                              )}
                            >
                              {isEPN ? "EPN" : "Externo"}
                            </span>
                          </div>

                          <p className="mt-3 text-xs text-gray-600 line-clamp-2 leading-relaxed">
                            {candidate.headline ||
                              (isEPN
                                ? `Estudiante politécnico de ${candidate.career}`
                                : "Postulante registrado")}
                          </p>

                          {/* Habilidades destacadas */}
                          <div className="mt-3 flex flex-wrap gap-1">
                            {candidate.skills.slice(0, 3).map((skill) => (
                              <span
                                key={skill}
                                className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600"
                              >
                                {skill}
                              </span>
                            ))}
                            {candidate.skills.length > 3 && (
                              <span className="rounded-md bg-gray-50 px-1.5 py-0.5 text-[10px] text-gray-400">
                                +{candidate.skills.length - 3}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Botón de inspeccionar */}
                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                          <span className="text-[11px] text-gray-400">
                            {candidate.cv_filename ? "CV adjunto" : "Perfil activo"}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#003876] group-hover:underline">
                            <UserCheck className="h-3.5 w-3.5" />
                            Ver perfil
                          </span>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:col-span-3">
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Actividad reciente</h3>
              {unread > 0 && <Badge tone="indigo">{unread} nuevas</Badge>}
            </div>
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-500">
                Te avisaremos aquí cuando el administrador actualice tus postulaciones.
              </p>
            ) : (
              <ul className="space-y-3">
                {notifications.slice(0, 4).map((n) => (
                  <li
                    key={n.id}
                    className={cn(
                      "rounded-xl p-4 transition-colors duration-200",
                      n.is_read ? "bg-gray-50" : "bg-indigo-50/60"
                    )}
                  >
                    <p className="text-sm font-medium text-gray-900">{n.title}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-500">{n.message}</p>
                    <p className="mt-2 text-xs text-gray-400">{formatDate(n.created_at, true)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-6">
            <IconTile icon={GraduationCap} tone="violet" />
            <h3 className="mt-4 font-semibold text-gray-900">Convenios FIS</h3>
            <p className="mt-1 text-sm leading-relaxed text-gray-500">
              Las ofertas con el tag <span className="font-medium text-gray-700">Pasantía</span> son válidas para
              prácticas preprofesionales en las cuatro carreras de la facultad.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
