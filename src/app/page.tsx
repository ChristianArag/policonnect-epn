"use client";

import React, { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import CandidatePortal from "@/components/CandidatePortal";
import AdminDashboard from "@/components/AdminDashboard";
import OnboardingCVModal from "@/components/OnboardingCVModal";
import AuthScreen from "@/components/AuthScreen";
import {
  AdminStats,
  ApplicationStatus,
  JobApplication,
  JobOffer,
  NotificationItem,
  TagItem,
  UserProfile,
} from "@/types/policonnect";
import { Loader2 } from "lucide-react";
import { Toast } from "@/components/ui";

export default function PoliConnectApp() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [availableTags, setAvailableTags] = useState<TagItem[]>([]);
  const [activeUserId, setActiveUserId] = useState<number>(2);
  const [jobs, setJobs] = useState<JobOffer[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);

  const [candidateTab, setCandidateTab] = useState<
    "feed" | "applications" | "community"
  >("feed");
  const [adminTab, setAdminTab] = useState<"tracking" | "jobs" | "stats">(
    "tracking"
  );

  const [onboardingModalOpen, setOnboardingModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  const activeUser =
    users.find((u) => u.id === activeUserId) || users[0] || null;

  const fetchAllData = useCallback(
    async (currentUserId: number, currentRole?: string) => {
      setIsLoading(true);
      try {
        const [usersRes, jobsRes] = await Promise.all([
          fetch("/api/users"),
          fetch(`/api/jobs?userId=${currentUserId}`),
        ]);

        const usersData = await usersRes.json();
        const jobsData = await jobsRes.json();

        const loadedUsers: UserProfile[] = usersData.users || [];
        setUsers(loadedUsers);
        setAvailableTags(usersData.tags || []);
        setJobs(jobsData.jobs || []);

        const targetUser =
          loadedUsers.find((u) => u.id === currentUserId) || loadedUsers[0];
        const roleToUse = currentRole || targetUser?.role || "EPN_STUDENT";

        if (roleToUse === "ADMIN") {
          const [appsRes, statsRes] = await Promise.all([
            fetch("/api/applications"),
            fetch("/api/stats"),
          ]);
          const appsData = await appsRes.json();
          const statsData = await statsRes.json();
          setApplications(appsData.applications || []);
          setAdminStats(statsData);
        } else {
          const [appsRes, notifsRes] = await Promise.all([
            fetch(`/api/applications?userId=${currentUserId}`),
            fetch(`/api/notifications?userId=${currentUserId}`),
          ]);
          const appsData = await appsRes.json();
          const notifsData = await notifsRes.json();
          setApplications(appsData.applications || []);
          setNotifications(notifsData.notifications || []);
        }
      } catch (err) {
        console.error("Error cargando datos de PoliConnect:", err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData(activeUserId);
    }
  }, [isAuthenticated, activeUserId, fetchAllData]);

  useEffect(() => {
    if (
      isAuthenticated &&
      activeUser &&
      activeUser.role !== "ADMIN" &&
      !activeUser.onboarding_completed
    ) {
      setOnboardingModalOpen(true);
    }
  }, [isAuthenticated, activeUser]);

  const handleAuthenticated = async (
    loggedUser: UserProfile,
    isNewRegistration?: boolean
  ) => {
    setActiveUserId(loggedUser.id);
    setIsAuthenticated(true);
    await fetchAllData(loggedUser.id, loggedUser.role);

    if (loggedUser.role !== "ADMIN" && !loggedUser.onboarding_completed) {
      setOnboardingModalOpen(true);
      showToast(
        isNewRegistration
          ? `¡Cuenta creada! Sube tu CV en PDF para autocompletar tu perfil con DeepSeek IA.`
          : `Bienvenido/a ${loggedUser.name}. Completa tu Onboarding de CV con IA para activar tu perfil.`
      );
    } else {
      showToast(`Sesión iniciada como: ${loggedUser.name}`);
    }
  };

  const handleSelectUser = (user: UserProfile) => {
    setActiveUserId(user.id);
    if (user.role !== "ADMIN" && !user.onboarding_completed) {
      setOnboardingModalOpen(true);
    } else {
      setOnboardingModalOpen(false);
    }
    showToast(
      `Sesión cambiada a: ${user.name} (${
        user.role === "ADMIN"
          ? "Administrador"
          : user.role === "EPN_STUDENT"
          ? `Estudiante EPN - ${user.career}`
          : "Postulante Externo"
      })`
    );
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setOnboardingModalOpen(false);
    showToast("Has cerrado sesión correctamente.");
  };

  const handleUploadAvatar = async (avatarDataUrl: string) => {
    if (!activeUser) return;
    const res = await fetch("/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: activeUser.id,
        avatar_url: avatarDataUrl,
      }),
    });
    if (res.ok) {
      showToast("Foto de perfil actualizada.");
      await fetchAllData(activeUser.id, activeUser.role);
    } else {
      throw new Error("No se pudo guardar la foto de perfil.");
    }
  };

  const handleQuickApply = async (job: JobOffer) => {
    if (!activeUser) return;
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: job.id,
        userId: activeUser.id,
        matchScore: job.match_score || 88,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      showToast(
        `¡Postulación rápida enviada a ${job.company}! Puedes ver el seguimiento en "Mis Postulaciones".`
      );
      await fetchAllData(activeUser.id, activeUser.role);
    } else {
      showToast(data.error || "No se pudo completar la postulación.");
    }
  };

  const handleMarkNotificationsRead = async () => {
    if (!activeUser) return;
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: activeUser.id }),
    });
    await fetchAllData(activeUser.id, activeUser.role);
  };

  const handleAdminUpdateStatus = async (
    applicationId: number,
    newStatus: ApplicationStatus
  ) => {
    const res = await fetch("/api/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId, status: newStatus }),
    });
    const data = await res.json();
    if (res.ok) {
      showToast(
        data.message ||
          `Estado actualizado a "${newStatus}" y notificación enviada al postulante.`
      );
      await fetchAllData(activeUserId, "ADMIN");
    }
  };

  const handleAdminCreateJob = async (jobPayload: {
    title: string;
    company: string;
    location: string;
    modality: string;
    vacancies: number;
    salary_range: string;
    description: string;
    tags: string[];
  }) => {
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...jobPayload,
        created_by: activeUser?.id || 1,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      showToast(
        `Oferta "${jobPayload.title}" publicada en PoliConnect con éxito.`
      );
      await fetchAllData(activeUserId, "ADMIN");
    } else {
      showToast(data.error || "Error al publicar la oferta.");
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        {toastMessage && <Toast message={toastMessage} />}
        <AuthScreen onAuthenticated={handleAuthenticated} />
      </>
    );
  }

  if (isLoading && !activeUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm text-gray-500">Cargando tu espacio en PoliConnect…</p>
      </div>
    );
  }

  if (!activeUser) return null;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar
        users={users}
        activeUser={activeUser}
        onSelectUser={handleSelectUser}
        onLogout={handleLogout}
        candidateTab={candidateTab}
        setCandidateTab={setCandidateTab}
        adminTab={adminTab}
        setAdminTab={setAdminTab}
        notifications={notifications}
        onMarkAllRead={handleMarkNotificationsRead}
        onOpenOnboarding={() => setOnboardingModalOpen(true)}
      />

      {toastMessage && <Toast message={toastMessage} />}

      <div className="flex-1">
        {activeUser.role === "ADMIN" ? (
          <AdminDashboard
            users={users}
            activeTab={adminTab}
            setActiveTab={setAdminTab}
            jobs={jobs}
            applications={applications}
            availableTags={availableTags}
            stats={adminStats}
            onUpdateApplicationStatus={handleAdminUpdateStatus}
            onCreateJob={handleAdminCreateJob}
          />
        ) : (
          <CandidatePortal
            user={activeUser}
            allUsers={users}
            jobs={jobs}
            applications={applications}
            notifications={notifications}
            activeTab={candidateTab}
            setActiveTab={setCandidateTab}
            onQuickApply={handleQuickApply}
            onOpenOnboarding={() => setOnboardingModalOpen(true)}
            onUploadAvatar={handleUploadAvatar}
          />
        )}
      </div>

      {onboardingModalOpen && activeUser.role !== "ADMIN" && (
        <OnboardingCVModal
          user={activeUser}
          availableTags={availableTags}
          isMandatory={!activeUser.onboarding_completed}
          onClose={() => setOnboardingModalOpen(false)}
          onProfileSaved={async () => {
            setOnboardingModalOpen(false);
            showToast(
              "¡Perfil autocompletado con DeepSeek IA y guardado en SQLite!"
            );
            await fetchAllData(activeUser.id, activeUser.role);
          }}
        />
      )}
    </div>
  );
}
