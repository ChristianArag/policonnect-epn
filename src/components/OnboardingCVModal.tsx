"use client";

import React, { useState } from "react";
import {
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  Cpu,
  FileText,
  KeyRound,
  Loader2,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import { FISCareer, ParsedCVResult, TagItem, UserProfile } from "@/types/policonnect";
import {
  Avatar,
  Badge,
  Button,
  Field,
  IconTile,
  SelectInput,
  buttonClass,
  cn,
  inputClass,
} from "@/components/ui";
import { resizeImageFile } from "@/lib/image";
import ImageAdjustModal from "@/components/ImageAdjustModal";

interface OnboardingCVModalProps {
  user: UserProfile;
  availableTags: TagItem[];
  isMandatory: boolean;
  onClose: () => void;
  onProfileSaved: () => void;
}

const CAREERS: { value: FISCareer; label: string }[] = [
  { value: "Software", label: "Ingeniería de Software" },
  { value: "Sistemas de Información", label: "Sistemas de Información" },
  { value: "Computación", label: "Ciencias de la Computación" },
  { value: "Ciencias de Datos", label: "Ciencias de Datos" },
];

const GOALS = [
  "Prácticas preprofesionales / Pasantía en convenio EPN",
  "Primer empleo junior (tiempo completo o híbrido)",
  "Proyectos de investigación e innovación",
];

const ENVIRONMENTS = [
  "Equipos ágiles de software, datos o IA",
  "Banca digital, fintech y arquitectura empresarial",
  "Infraestructura cloud, DevSecOps y ciberseguridad",
];

/**
 * Construye un PDF mínimo válido en memoria para probar pdf-parse + DeepSeek
 * sin necesidad de tener un CV a mano.
 */
function buildSampleEPNPdfFile(user: UserProfile): File {
  const career = user.career || "Ciencias de Datos";
  const textLines = [
    `${user.name}`,
    `Escuela Politecnica Nacional - Facultad de Ingenieria de Sistemas (FIS)`,
    `Carrera: Ingenieria en ${career} (8vo Semestre)`,
    `Experiencia Profesional: Pasante de Investigacion e Ingenieria en Laboratorio de IA y Sistemas Distribuidos EPN.`,
    `Desarrollo de microservicios Backend con Python, Node.js, TypeScript, SQL y modelos de Machine Learning.`,
    `Habilidades Principales: Python, TypeScript, SQL, React, Next.js, Docker, Machine Learning, Power BI, Git.`,
    `Modalidad buscada: Pasantia o Tiempo Completo en Backend, Datos y Machine Learning.`,
  ];

  const streamContent = `BT /F1 12 Tf 50 750 Td (${textLines.join(") Tj T* (")}) Tj ET`;

  const pdfRaw = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length ${streamContent.length} >>
stream
${streamContent}
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000241 00000 n 
0000000400 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
470
%%EOF`;

  const blob = new Blob([pdfRaw], { type: "application/pdf" });
  return new File([blob], `CV_${user.name.replace(/\s+/g, "_")}_EPN_2026.pdf`, {
    type: "application/pdf",
  });
}

/* -------------------------------------------------------------------------- */
/* Subcomponentes                                                              */
/* -------------------------------------------------------------------------- */

function Stepper({ step }: { step: 1 | 2 }) {
  const steps = ["Subir CV", "Revisar perfil e intereses"];
  return (
    <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/60 px-6 py-4 sm:px-8">
      {steps.map((label, i) => {
        const n = i + 1;
        const done = step > n;
        const active = step === n;
        return (
          <React.Fragment key={label}>
            {i > 0 && (
              <div className={cn("h-px flex-1 transition-colors", step > 1 ? "bg-indigo-200" : "bg-gray-200")} />
            )}
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-300",
                  done ? "bg-emerald-500 text-white" : active ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-500"
                )}
              >
                {done ? <Check className="h-4 w-4" /> : n}
              </span>
              <span className={cn("hidden text-sm font-medium sm:inline", active ? "text-gray-900" : "text-gray-500")}>
                {label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

function PhotoPicker({
  name,
  src,
  error,
  onChange,
}: {
  name: string;
  src: string | null;
  error: string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
      <label className="group relative cursor-pointer">
        <Avatar name={name} src={src} size="lg" />
        <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-indigo-600 text-white shadow-sm transition-transform duration-200 group-hover:scale-110">
          <Camera className="h-3.5 w-3.5" />
        </span>
        <input type="file" accept="image/*" className="hidden" onChange={onChange} />
      </label>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900">Foto de perfil</p>
        <p className="text-sm text-gray-500">JPG, PNG o WEBP. Se recorta automáticamente.</p>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
      <label className={buttonClass("secondary", "sm", "cursor-pointer")}>
        {src ? "Cambiar" : "Subir"}
        <input type="file" accept="image/*" className="hidden" onChange={onChange} />
      </label>
    </div>
  );
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <p className="mt-0.5 text-sm text-gray-500">{description}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Modal                                                                       */
/* -------------------------------------------------------------------------- */

export default function OnboardingCVModal({
  user,
  availableTags,
  isMandatory,
  onClose,
  onProfileSaved,
}: OnboardingCVModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customApiKey, setCustomApiKey] = useState("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [engineUsed, setEngineUsed] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [adjustPhotoSrc, setAdjustPhotoSrc] = useState<string | null>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatar_url);
  const [nombre, setNombre] = useState(user.name);
  const [titular, setTitular] = useState(user.headline || "");
  const [experiencia, setExperiencia] = useState(user.experience_summary || "");
  const [nivelEstudios, setNivelEstudios] = useState(user.education_level || "");
  const [carrera, setCarrera] = useState<FISCareer>(user.career || "Ciencias de Datos");
  const [esEPN, setEsEPN] = useState<boolean>(user.role !== "EXTERNAL");
  const [skillsText, setSkillsText] = useState(user.skills.join(", "));
  const [selectedTags, setSelectedTags] = useState<string[]>(
    user.tags.length > 0 ? user.tags : ["Backend", "Datos", "Pasantía"]
  );
  const [workGoal, setWorkGoal] = useState(GOALS[0]);
  const [preferredEnvironment, setPreferredEnvironment] = useState(ENVIRONMENTS[0]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAdjustPhotoSrc(reader.result);
      }
    };
    reader.onerror = () => {
      setPhotoError("No se pudo leer el archivo de foto.");
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = async (file: File) => {
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setErrorMsg("Solo se aceptan archivos en formato PDF.");
      return;
    }

    setSelectedFile(file);
    setErrorMsg(null);
    setIsParsing(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (customApiKey.trim()) formData.append("apiKey", customApiKey.trim());

      const res = await fetch("/api/cv/parse", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al procesar el PDF");

      const profile: ParsedCVResult = data.profile;
      setEngineUsed(data.engine);
      setNombre(profile.nombre || user.name);
      setTitular(profile.titularProfesional || `Estudiante de ${profile.carreraDetectada || "Sistemas"} - EPN`);
      setExperiencia(profile.experiencia || "");
      setNivelEstudios(profile.nivelEstudios || "");
      if (profile.carreraDetectada) setCarrera(profile.carreraDetectada);
      setEsEPN(profile.esEstudianteEPN ?? true);
      if (profile.habilidadesPrincipales?.length) setSkillsText(profile.habilidadesPrincipales.join(", "));
      if (profile.tagsSugeridos?.length) setSelectedTags(profile.tagsSugeridos);

      setStep(2);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "No se pudo analizar el PDF.");
    } finally {
      setIsParsing(false);
    }
  };

  const toggleTag = (tagName: string) => {
    setSelectedTags((prev) => (prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);

    try {
      const skills = skillsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const finalTags = [...selectedTags];
      if (workGoal.toLowerCase().includes("pasantía") && !finalTags.includes("Pasantía")) {
        finalTags.push("Pasantía");
      }

      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          name: nombre,
          role: esEPN ? "EPN_STUDENT" : "EXTERNAL",
          career: esEPN ? carrera : null,
          institution: esEPN ? "Escuela Politécnica Nacional" : user.institution || "Universidad Externa / Graduado",
          headline: titular,
          experience_summary: experiencia,
          education_level: nivelEstudios,
          skills,
          tags: Array.from(new Set(finalTags)),
          avatar_url: avatarUrl,
          cv_filename: selectedFile?.name || user.cv_filename || "CV_EPN.pdf",
          onboarding_completed: true,
        }),
      });

      if (!res.ok) throw new Error("No se pudo guardar el perfil.");
      onProfileSaved();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error al guardar el perfil.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {adjustPhotoSrc && (
        <ImageAdjustModal
          imageSrc={adjustPhotoSrc}
          onConfirm={(cropped) => {
            setAvatarUrl(cropped);
            setAdjustPhotoSrc(null);
          }}
          onCancel={() => setAdjustPhotoSrc(null)}
        />
      )}

      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-gray-900/40 p-4 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="animate-slide-up my-8 w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl shadow-gray-900/10">
        {/* Encabezado */}
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-6 sm:px-8">
          <div className="flex items-start gap-4">
            <IconTile icon={Sparkles} />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">Configura tu perfil profesional</h2>
                {isMandatory && <Badge tone="amber">Paso requerido</Badge>}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Extraemos el texto de tu CV con pdf-parse y DeepSeek completa tu perfil automáticamente.
              </p>
            </div>
          </div>
          {!isMandatory && (
            <Button variant="ghost" size="icon" aria-label="Cerrar" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        <Stepper step={step} />

        <div className="max-h-[70vh] overflow-y-auto p-6 sm:p-8">
          {errorMsg && (
            <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{errorMsg}</div>
          )}

          {step === 1 ? (
            <div className="space-y-6">
              <PhotoPicker name={nombre} src={avatarUrl} error={photoError} onChange={handlePhotoSelect} />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file && !isParsing) handleFileUpload(file);
                }}
                className={cn(
                  "rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 sm:p-10",
                  isDragging
                    ? "border-indigo-400 bg-indigo-50/60"
                    : "border-gray-200 bg-gray-50/40 hover:border-indigo-300 hover:bg-indigo-50/30"
                )}
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm">
                  {isParsing ? <Loader2 className="h-6 w-6 animate-spin" /> : <UploadCloud className="h-6 w-6" />}
                </div>
                <h3 className="mt-4 font-semibold text-gray-900">
                  {isParsing ? "Analizando tu CV…" : "Arrastra tu CV aquí"}
                </h3>
                <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
                  {isParsing
                    ? "Extrayendo texto con pdf-parse y estructurando los datos con DeepSeek."
                    : "o selecciónalo desde tu equipo. Solo archivos PDF."}
                </p>
                <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                  <label
                    className={buttonClass(
                      "primary",
                      "md",
                      cn("cursor-pointer", isParsing && "pointer-events-none opacity-50")
                    )}
                  >
                    <FileText className="h-4 w-4" />
                    Seleccionar PDF
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      className="hidden"
                      disabled={isParsing}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (file) handleFileUpload(file);
                      }}
                    />
                  </label>
                  <Button
                    variant="secondary"
                    disabled={isParsing}
                    icon={<Sparkles className="h-4 w-4 text-amber-500" />}
                    onClick={() => handleFileUpload(buildSampleEPNPdfFile(user))}
                  >
                    Usar CV de ejemplo
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowApiKeyInput((p) => !p)}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left"
                >
                  <span className="flex items-center gap-3">
                    <KeyRound className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">
                      API Key de DeepSeek <span className="font-normal text-gray-400">(opcional)</span>
                    </span>
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-gray-400 transition-transform duration-200",
                      showApiKeyInput && "rotate-180"
                    )}
                  />
                </button>
                {showApiKeyInput && (
                  <div className="border-t border-gray-100 p-4">
                    <input
                      type="password"
                      value={customApiKey}
                      onChange={(e) => setCustomApiKey(e.target.value)}
                      placeholder="sk-..."
                      className={inputClass}
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Si la dejas vacía se usará la variable DEEPSEEK_API_KEY del servidor.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-8">
              <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-emerald-900">Tu CV fue procesado correctamente</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-emerald-700">
                    <Cpu className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{engineUsed}</span>
                  </p>
                </div>
              </div>

              <PhotoPicker name={nombre} src={avatarUrl} error={photoError} onChange={handlePhotoSelect} />

              <section>
                <SectionTitle title="Datos extraídos" description="Revisa y ajusta lo que detectó la IA." />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Nombre completo">
                    <input required value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="Nivel de estudios">
                    <input
                      required
                      value={nivelEstudios}
                      onChange={(e) => setNivelEstudios(e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Vínculo institucional">
                    <SelectInput value={esEPN ? "EPN" : "EXTERNAL"} onChange={(e) => setEsEPN(e.target.value === "EPN")}>
                      <option value="EPN">Estudiante EPN (FIS)</option>
                      <option value="EXTERNAL">Externo / Graduado</option>
                    </SelectInput>
                  </Field>
                  {esEPN && (
                    <Field label="Carrera">
                      <SelectInput value={carrera} onChange={(e) => setCarrera(e.target.value as FISCareer)}>
                        {CAREERS.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </SelectInput>
                    </Field>
                  )}
                  <Field label="Titular profesional" className="sm:col-span-2">
                    <input required value={titular} onChange={(e) => setTitular(e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="Experiencia y proyectos" className="sm:col-span-2">
                    <textarea
                      rows={3}
                      required
                      value={experiencia}
                      onChange={(e) => setExperiencia(e.target.value)}
                      className={cn(inputClass, "resize-none")}
                    />
                  </Field>
                  <Field label="Habilidades" hint="Separadas por coma" className="sm:col-span-2">
                    <input value={skillsText} onChange={(e) => setSkillsText(e.target.value)} className={inputClass} />
                  </Field>
                </div>
              </section>

              <section className="border-t border-gray-100 pt-8">
                <SectionTitle
                  title="Intereses y preferencias"
                  description="Definen el porcentaje de match de las ofertas en tu feed."
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Objetivo este semestre">
                    <SelectInput value={workGoal} onChange={(e) => setWorkGoal(e.target.value)}>
                      {GOALS.map((g) => (
                        <option key={g}>{g}</option>
                      ))}
                    </SelectInput>
                  </Field>
                  <Field label="Entorno preferido">
                    <SelectInput value={preferredEnvironment} onChange={(e) => setPreferredEnvironment(e.target.value)}>
                      {ENVIRONMENTS.map((env) => (
                        <option key={env}>{env}</option>
                      ))}
                    </SelectInput>
                  </Field>
                </div>

                <p className="mb-3 mt-6 text-sm font-medium text-gray-700">Tags de interés</p>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((t) => {
                    const active = selectedTags.includes(t.name);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleTag(t.name)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all duration-200",
                          active
                            ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                        )}
                      >
                        {active && <Check className="h-3.5 w-3.5" />}
                        {t.name}
                      </button>
                    );
                  })}
                </div>
              </section>

              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-end">
                {!isMandatory && (
                  <Button variant="ghost" onClick={onClose}>
                    Cancelar
                  </Button>
                )}
                <Button variant="secondary" onClick={() => setStep(1)}>
                  Cambiar PDF
                </Button>
                <Button type="submit" loading={isSaving}>
                  Guardar y continuar
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
