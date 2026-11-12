"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Award,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  FileText,
  GraduationCap,
  Mail,
  MapPin,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { UserProfile } from "@/types/policonnect";
import { Avatar, Badge, formatDate } from "@/components/ui";

interface UserProfileModalProps {
  user: UserProfile;
  onClose: () => void;
}

export default function UserProfileModal({ user, onClose }: UserProfileModalProps) {
  const [mounted, setMounted] = useState(false);
  const isEPN = user.role === "EPN_STUDENT";
  const isAdmin = user.role === "ADMIN";

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-gray-900/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden flex flex-col my-8 animate-slide-up">
        {/* Banner de cabecera con el azul institucional de la Poli */}
        <div className="relative h-28 bg-gradient-to-r from-[#001D40] via-[#003876] to-[#0A4E9B] p-6 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white border border-white/20">
              {isAdmin ? "Perfil de Administrador EPN" : isEPN ? "Talento Politécnico FIS" : "Postulante Externo"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/40 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Información Principal del Usuario */}
        <div className="px-6 sm:px-8 pb-8 pt-0">
          {/* Avatar sobrepuesto al banner */}
          <div className="relative -mt-14 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 mb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
              <Avatar
                name={user.name}
                src={user.avatar_url}
                size="xl"
                className="h-24 w-24 ring-4 ring-white shadow-lg"
              />
              <div className="pb-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                  {isEPN && (
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-[#003876] border border-blue-200">
                      EPN · FIS
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-0.5">
                  {user.headline || (isEPN ? `Estudiante de ${user.career}` : "Postulante profesional")}
                </p>
              </div>
            </div>

            {/* Enlace de contacto rápido */}
            <a
              href={`mailto:${user.email}`}
              className="inline-flex items-center gap-2 rounded-xl bg-[#003876] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#002855] transition"
            >
              <Mail className="h-3.5 w-3.5 text-[#FCD34D]" />
              Contactar
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-gray-100 pt-6">
            {/* Columna Izquierda: Datos Académicos y de Contacto */}
            <div className="space-y-4 md:col-span-1">
              <div className="rounded-xl bg-gray-50 p-4 border border-gray-100 space-y-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Institución
                  </span>
                  <p className="text-xs font-semibold text-gray-800 mt-0.5 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-[#003876]" />
                    {user.institution || "Escuela Politécnica Nacional"}
                  </p>
                </div>

                {user.career && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Carrera FIS
                    </span>
                    <p className="text-xs font-semibold text-gray-800 mt-0.5 flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5 text-[#003876]" />
                      {user.career}
                    </p>
                  </div>
                )}

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Nivel de Formación
                  </span>
                  <p className="text-xs text-gray-700 mt-0.5 flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-gray-500" />
                    {user.education_level || "Pregrado Politécnico"}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Correo Electrónico
                  </span>
                  <p className="text-xs text-gray-700 mt-0.5 truncate flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-gray-500" />
                    {user.email}
                  </p>
                </div>

                {user.cv_filename && (
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Curriculum Vitae
                    </span>
                    <p className="text-xs font-medium text-[#003876] mt-0.5 flex items-center gap-1.5 truncate">
                      <FileText className="h-3.5 w-3.5" />
                      {user.cv_filename}
                    </p>
                    {user.cv_updated_at && (
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Actualizado: {formatDate(user.cv_updated_at)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Columna Derecha: Bio, Experiencia y Habilidades */}
            <div className="space-y-5 md:col-span-2">
              {/* Resumen Profesional */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-[#003876]" />
                  Resumen de Experiencia Profesional
                </h4>
                <p className="mt-2 text-xs leading-relaxed text-gray-700 bg-gray-50/70 p-3.5 rounded-xl border border-gray-100">
                  {user.experience_summary ||
                    "Estudiante de la Facultad de Ingeniería de Sistemas con sólida formación técnica en algoritmos, desarrollo de software y análisis de datos."}
                </p>
              </div>

              {/* Habilidades Técnicas y Competencias */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#003876]" />
                  Habilidades & Competencias Técnicas
                </h4>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {user.skills && user.skills.length > 0 ? (
                    user.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-[#003876] border border-blue-100"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">Sin habilidades registradas</span>
                  )}
                </div>
              </div>

              {/* Tags de Interés y Especialidad */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-[#003876]" />
                  Áreas de Especialidad / Tags
                </h4>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {user.tags && user.tags.length > 0 ? (
                    user.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700"
                      >
                        #{tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">Sin tags asignados</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pie del modal */}
        <div className="border-t border-gray-100 bg-gray-50 px-6 py-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 bg-white px-5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition"
          >
            Cerrar perfil
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
