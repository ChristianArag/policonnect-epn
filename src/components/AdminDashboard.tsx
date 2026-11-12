"use client";

import React, { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BellRing,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronDown,
  FileText,
  GraduationCap,
  Loader2,
  Plus,
  Search,
  UserX,
  Users,
} from "lucide-react";
import { AdminStats, ApplicationStatus, JobApplication, JobOffer, TagItem, UserProfile } from "@/types/policonnect";
import {
  APPLICATION_STATUSES,
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  IconTile,
  MatchBadge,
  RoleBadge,
  SelectInput,
  STATUS_META,
  Tone,
  cn,
  formatDate,
  inputClass,
} from "@/components/ui";
import UserProfileModal from "@/components/UserProfileModal";

type AdminTab = "tracking" | "jobs" | "stats";

interface AdminDashboardProps {
  users?: UserProfile[];
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  jobs: JobOffer[];
  applications: JobApplication[];
  availableTags: TagItem[];
  stats: AdminStats | null;
  onUpdateApplicationStatus: (applicationId: number, newStatus: ApplicationStatus) => Promise<void>;
  onCreateJob: (jobPayload: {
    title: string;
    company: string;
    location: string;
    modality: string;
    vacancies: number;
    salary_range: string;
    description: string;
    tags: string[];
  }) => Promise<void>;
}

const PAGE_COPY: Record<AdminTab, { title: string; description: string }> = {
  tracking: {
    title: "Seguimiento de postulantes",
    description: "Actualiza el estado de cada proceso; el postulante recibe una notificación al instante.",
  },
  jobs: {
    title: "Gestión de ofertas",
    description: "Publica trabajos y pasantías con tags para activar el match automático.",
  },
  stats: {
    title: "Estadísticas",
    description: "Participación por carrera, origen de los postulantes y áreas más demandadas.",
  },
};

const CHART_TOOLTIP = {
  borderRadius: 12,
  border: "1px solid #F3F4F6",
  boxShadow: "0 10px 25px -5px rgba(17, 24, 39, 0.08)",
  fontSize: 12,
};
const AXIS_TICK = { fontSize: 12, fill: "#6B7280" };
const PIE_COLORS = ["#4F46E5", "#C4B5FD"];

/* -------------------------------------------------------------------------- */
/* Subcomponentes                                                              */
/* -------------------------------------------------------------------------- */

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  tone: Tone;
}) {
  return (
    <Card interactive className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">{value}</p>
        </div>
        <IconTile icon={icon} tone={tone} />
      </div>
    </Card>
  );
}

function StatusSelect({
  value,
  loading,
  onChange,
}: {
  value: ApplicationStatus;
  loading: boolean;
  onChange: (status: ApplicationStatus) => void;
}) {
  return (
    <div className="inline-flex flex-col items-end gap-1.5">
      <div className="relative inline-flex items-center">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin text-indigo-600" />}
        <div className="relative">
          <select
            value={value}
            disabled={loading}
            onChange={(e) => onChange(e.target.value as ApplicationStatus)}
            className={cn(
              "cursor-pointer appearance-none rounded-xl border py-2 pl-3.5 pr-9 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-60",
              STATUS_META[value].select
            )}
          >
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s} className="bg-white text-gray-900">
                {s}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" />
        </div>
      </div>
      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
        <BellRing className="h-3 w-3" />
        Notifica al cambiar
      </span>
    </div>
  );
}

function ChartCard({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn("p-6", className)}>
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      <div className="mt-6">{children}</div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                   */
/* -------------------------------------------------------------------------- */

export default function AdminDashboard({
  users = [],
  activeTab,
  setActiveTab,
  jobs,
  applications,
  availableTags,
  stats,
  onUpdateApplicationStatus,
  onCreateJob,
}: AdminDashboardProps) {
  const [inspectedCandidate, setInspectedCandidate] = useState<UserProfile | null>(null);

  // Filtros de seguimiento
  const [jobFilter, setJobFilter] = useState("ALL");
  const [originFilter, setOriginFilter] = useState<"ALL" | "EPN_STUDENT" | "EXTERNAL">("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [updatingAppId, setUpdatingAppId] = useState<number | null>(null);

  // Formulario de nueva oferta
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("Quito, Ecuador (Híbrido)");
  const [modality, setModality] = useState("Tiempo Completo");
  const [vacancies, setVacancies] = useState(2);
  const [salaryRange, setSalaryRange] = useState("$1,100 - $1,400 / mes");
  const [description, setDescription] = useState("");
  const [jobTags, setJobTags] = useState<string[]>(["Backend", "TypeScript"]);
  const [customTag, setCustomTag] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const filteredApplications = useMemo(() => {
    const q = search.toLowerCase().trim();
    return applications.filter((app) => {
      if (jobFilter !== "ALL" && app.job_id !== Number(jobFilter)) return false;
      if (originFilter !== "ALL" && app.candidate_role !== originFilter) return false;
      if (statusFilter !== "ALL" && app.status !== statusFilter) return false;
      if (!q) return true;
      return [app.candidate_name, app.job_title, app.candidate_career, app.company].some((v) =>
        v?.toLowerCase().includes(q)
      );
    });
  }, [applications, jobFilter, originFilter, statusFilter, search]);

  const handleStatusChange = async (applicationId: number, status: ApplicationStatus) => {
    setUpdatingAppId(applicationId);
    try {
      await onUpdateApplicationStatus(applicationId, status);
    } finally {
      setUpdatingAppId(null);
    }
  };

  const toggleJobTag = (name: string) =>
    setJobTags((prev) => (prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]));

  const addCustomTag = () => {
    const clean = customTag.trim();
    if (clean && !jobTags.includes(clean)) setJobTags((prev) => [...prev, clean]);
    setCustomTag("");
  };

  const handleJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await onCreateJob({
        title,
        company,
        location,
        modality,
        vacancies,
        salary_range: salaryRange,
        description,
        tags: jobTags,
      });
      setTitle("");
      setCompany("");
      setDescription("");
      setActiveTab("tracking");
    } finally {
      setIsCreating(false);
    }
  };

  const tagOptions = Array.from(new Set([...availableTags.map((t) => t.name), ...jobTags]));
  const pieTotal = stats?.epnVsExternal.reduce((acc, item) => acc + item.value, 0) ?? 0;
  const copy = PAGE_COPY[activeTab];

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-600">Panel de administración</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">{copy.title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">{copy.description}</p>
        </div>
        {activeTab !== "jobs" && (
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setActiveTab("jobs")}>
            Nueva oferta
          </Button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Ofertas activas" value={stats?.kpis.totalJobs ?? "—"} icon={Briefcase} tone="indigo" />
        <StatCard
          label="Postulaciones"
          value={stats?.kpis.totalApplications ?? "—"}
          icon={FileText}
          tone="violet"
        />
        <StatCard
          label="Estudiantes EPN"
          value={stats?.kpis.epnStudentsCount ?? "—"}
          icon={GraduationCap}
          tone="amber"
        />
        <StatCard label="Seleccionados" value={stats?.kpis.selectedCount ?? "—"} icon={CheckCircle2} tone="green" />
      </div>

      {/* Seguimiento */}
      {activeTab === "tracking" && (
        <Card className="overflow-hidden">
          <div className="grid grid-cols-1 gap-4 border-b border-gray-100 p-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar postulante o empresa"
                className={cn(inputClass, "pl-11")}
              />
            </div>
            <SelectInput value={jobFilter} onChange={(e) => setJobFilter(e.target.value)}>
              <option value="ALL">Todas las ofertas</option>
              {jobs.map((j) => (
                <option key={j.id} value={String(j.id)}>
                  {j.title}
                </option>
              ))}
            </SelectInput>
            <SelectInput
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value as "ALL" | "EPN_STUDENT" | "EXTERNAL")}
            >
              <option value="ALL">Todos los orígenes</option>
              <option value="EPN_STUDENT">Estudiantes EPN</option>
              <option value="EXTERNAL">Externos</option>
            </SelectInput>
            <SelectInput value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">Todos los estados</option>
              {APPLICATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </SelectInput>
          </div>

          {filteredApplications.length === 0 ? (
            <EmptyState
              icon={UserX}
              title="Sin resultados"
              description="Ningún postulante coincide con los filtros seleccionados."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="bg-gray-50/80 text-xs font-medium uppercase tracking-wide text-gray-500">
                    <th className="px-6 py-3">Postulante</th>
                    <th className="px-6 py-3">Origen</th>
                    <th className="px-6 py-3">Oferta</th>
                    <th className="px-6 py-3">Match</th>
                    <th className="px-6 py-3 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredApplications.map((app) => (
                    <tr key={app.id} className="align-top transition-colors duration-200 hover:bg-gray-50/60">
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => {
                            const found = users.find(
                              (u) => u.id === app.user_id || (app.candidate_email && u.email === app.candidate_email)
                            );
                            if (found) {
                              setInspectedCandidate(found);
                            } else {
                              setInspectedCandidate({
                                id: app.user_id,
                                name: app.candidate_name || "Postulante",
                                email: app.candidate_email || "",
                                role: app.candidate_role || "EPN_STUDENT",
                                career: app.candidate_career || null,
                                institution: app.candidate_institution || "Escuela Politécnica Nacional",
                                headline: app.candidate_headline || null,
                                experience_summary: null,
                                education_level: app.candidate_education || null,
                                skills: app.candidate_skills || [],
                                tags: app.candidate_tags || [],
                                avatar_url: app.candidate_avatar || null,
                                cv_filename: app.candidate_cv || null,
                                cv_updated_at: app.applied_at,
                                onboarding_completed: true,
                                created_at: app.applied_at,
                              });
                            }
                          }}
                          className="group flex items-center gap-3 text-left transition hover:opacity-90"
                          title="Clic para ver el perfil institucional completo"
                        >
                          <Avatar name={app.candidate_name || "?"} src={app.candidate_avatar} />
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 group-hover:text-[#003876] group-hover:underline flex items-center gap-1.5">
                              {app.candidate_name}
                            </p>
                            <p className="truncate text-gray-500 text-xs">{app.candidate_email}</p>
                          </div>
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          {app.candidate_role && <RoleBadge role={app.candidate_role} />}
                          <p className="text-xs text-gray-500">
                            {app.candidate_role === "EPN_STUDENT"
                              ? `Ing. en ${app.candidate_career}`
                              : app.candidate_institution}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{app.job_title}</p>
                        <p className="text-gray-500">{app.company}</p>
                        <p className="mt-1 text-xs text-gray-400">Postuló el {formatDate(app.applied_at)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <MatchBadge score={app.match_score} />
                        <div className="mt-2 flex max-w-[220px] flex-wrap gap-1">
                          {(app.candidate_skills || []).slice(0, 3).map((s) => (
                            <span key={s} className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <StatusSelect
                          value={app.status}
                          loading={updatingAppId === app.id}
                          onChange={(status) => handleStatusChange(app.id, status)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t border-gray-100 px-6 py-4 text-sm text-gray-500">
            Mostrando {filteredApplications.length} de {applications.length} postulaciones
          </div>
        </Card>
      )}

      {/* Gestión de ofertas */}
      {activeTab === "jobs" && (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <Card className="p-6 sm:p-8 lg:col-span-7">
            <form onSubmit={handleJobSubmit} className="space-y-6">
              <div>
                <h2 className="font-semibold text-gray-900">Nueva oferta</h2>
                <p className="mt-1 text-sm text-gray-500">Completa los datos del puesto o pasantía.</p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Título del puesto" className="sm:col-span-2">
                  <input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Desarrollador Backend Jr."
                    className={inputClass}
                  />
                </Field>
                <Field label="Empresa">
                  <input
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Banco del Pacífico"
                    className={inputClass}
                  />
                </Field>
                <Field label="Vacantes">
                  <input
                    type="number"
                    min={1}
                    max={50}
                    required
                    value={vacancies}
                    onChange={(e) => setVacancies(Number(e.target.value))}
                    className={inputClass}
                  />
                </Field>
                <Field label="Modalidad">
                  <SelectInput value={modality} onChange={(e) => setModality(e.target.value)}>
                    <option>Tiempo Completo</option>
                    <option>Pasantía (6 horas - Convenio EPN)</option>
                    <option>Medio Tiempo</option>
                    <option>Proyecto de Titulación / Investigación</option>
                  </SelectInput>
                </Field>
                <Field label="Remuneración">
                  <input value={salaryRange} onChange={(e) => setSalaryRange(e.target.value)} className={inputClass} />
                </Field>
                <Field label="Ubicación" className="sm:col-span-2">
                  <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} />
                </Field>
                <Field label="Descripción" className="sm:col-span-2">
                  <textarea
                    rows={4}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Responsabilidades, tecnologías y perfil buscado"
                    className={cn(inputClass, "resize-none")}
                  />
                </Field>
              </div>

              <div>
                <p className="mb-3 text-sm font-medium text-gray-700">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {tagOptions.map((name) => {
                    const active = jobTags.includes(name);
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => toggleJobTag(name)}
                        className={cn(
                          "rounded-xl border px-3.5 py-2 text-sm font-medium transition-all duration-200",
                          active
                            ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                        )}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 flex gap-2">
                  <input
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomTag();
                      }
                    }}
                    placeholder="Agregar tag personalizado"
                    className={inputClass}
                  />
                  <Button variant="secondary" onClick={addCustomTag}>
                    Añadir
                  </Button>
                </div>
              </div>

              <div className="flex justify-end border-t border-gray-100 pt-6">
                <Button type="submit" size="lg" loading={isCreating} icon={<Plus className="h-4 w-4" />}>
                  Publicar oferta
                </Button>
              </div>
            </form>
          </Card>

          <Card className="p-6 lg:col-span-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Ofertas vigentes</h2>
              <Badge tone="indigo">{jobs.length}</Badge>
            </div>
            <div className="max-h-[640px] space-y-3 overflow-y-auto pr-1">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-xl border border-gray-100 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-100 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">{job.title}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-500">
                        <Building2 className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{job.company}</span>
                      </p>
                    </div>
                    <Badge tone="green" icon={Users}>
                      {job.applicant_count}
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {job.tags.map((t) => (
                      <span key={t} className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Estadísticas */}
      {activeTab === "stats" && stats && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <ChartCard
            className="lg:col-span-8"
            title="Postulantes por carrera"
            description="Estudiantes registrados y postulaciones enviadas en las carreras de la FIS."
          >
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byCareer} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="career" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={CHART_TOOLTIP} cursor={{ fill: "#F9FAFB" }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
                  <Bar dataKey="postulantes" name="Estudiantes" fill="#C7D2FE" radius={[6, 6, 0, 0]} maxBarSize={36} />
                  <Bar
                    dataKey="aplicaciones"
                    name="Postulaciones"
                    fill="#4F46E5"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={36}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard
            className="lg:col-span-4"
            title="EPN vs externos"
            description="Origen de los postulantes registrados."
          >
            <div className="relative h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.epnVsExternal}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={88}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {stats.epnVsExternal.map((entry, i) => (
                      <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={CHART_TOOLTIP} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-semibold text-gray-900">{pieTotal}</span>
                <span className="text-xs text-gray-500">postulantes</span>
              </div>
            </div>
            <ul className="mt-6 space-y-3">
              {stats.epnVsExternal.map((entry, i) => (
                <li key={entry.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-gray-600">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {entry.name}
                  </span>
                  <span className="font-medium text-gray-900">
                    {entry.value}{" "}
                    <span className="font-normal text-gray-400">
                      ({pieTotal ? Math.round((entry.value / pieTotal) * 100) : 0}%)
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </ChartCard>

          <ChartCard
            className="lg:col-span-12"
            title="Tags más demandados"
            description="Comparación entre lo que piden las ofertas y los intereses de los postulantes."
          >
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topTags} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid horizontal={false} stroke="#F3F4F6" />
                  <XAxis type="number" allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="tag"
                    width={150}
                    tick={AXIS_TICK}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip contentStyle={CHART_TOOLTIP} cursor={{ fill: "#F9FAFB" }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
                  <Bar dataKey="interesados" name="Postulantes interesados" fill="#4F46E5" radius={[0, 6, 6, 0]} barSize={12} />
                  <Bar dataKey="ofertas" name="Ofertas que lo piden" fill="#C4B5FD" radius={[0, 6, 6, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      )}

      {inspectedCandidate && (
        <UserProfileModal
          user={inspectedCandidate}
          onClose={() => setInspectedCandidate(null)}
        />
      )}
    </div>
  );
}
