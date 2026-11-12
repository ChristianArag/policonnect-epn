"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  Bell,
  Briefcase,
  Check,
  ChevronDown,
  FileText,
  LogOut,
  Sparkles,
  Users,
} from "lucide-react";
import { NotificationItem, UserProfile } from "@/types/policonnect";
import {
  Avatar,
  Button,
  Logo,
  SegmentedTabs,
  StatusBadge,
  TabItem,
  cn,
  formatDate,
  isApplicationStatus,
} from "@/components/ui";

type CandidateTab = "feed" | "applications" | "community";
type AdminTab = "tracking" | "jobs" | "stats";

interface NavbarProps {
  users: UserProfile[];
  activeUser: UserProfile;
  onSelectUser: (user: UserProfile) => void;
  onLogout: () => void;
  candidateTab: CandidateTab;
  setCandidateTab: (tab: CandidateTab) => void;
  adminTab: AdminTab;
  setAdminTab: (tab: AdminTab) => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onOpenOnboarding: () => void;
}

const CANDIDATE_TABS: TabItem<CandidateTab>[] = [
  { id: "feed", label: "Ofertas de Empleo", icon: Briefcase },
  { id: "applications", label: "Mis Postulaciones", icon: FileText },
  { id: "community", label: "Comunidad", icon: Users },
];

const ADMIN_TABS: TabItem<AdminTab>[] = [
  { id: "tracking", label: "Seguimiento Postulantes", icon: Users },
  { id: "jobs", label: "Gestión de Ofertas", icon: Briefcase },
  { id: "stats", label: "Estadísticas", icon: BarChart3 },
];

const DROPDOWN =
  "animate-slide-up absolute right-0 z-50 mt-2 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl shadow-gray-900/5";

function roleLabel(user: UserProfile): string {
  if (user.role === "ADMIN") return "Administrador";
  if (user.role === "EPN_STUDENT") return `Estudiante · ${user.career ?? "FIS"}`;
  return "Postulante Externo";
}

export default function Navbar({
  users,
  activeUser,
  onSelectUser,
  onLogout,
  candidateTab,
  setCandidateTab,
  adminTab,
  setAdminTab,
  notifications,
  onMarkAllRead,
  onOpenOnboarding,
}: NavbarProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isAdmin = activeUser.role === "ADMIN";
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const tabs = (fullWidth: boolean) =>
    isAdmin ? (
      <SegmentedTabs
        items={ADMIN_TABS}
        value={adminTab}
        onChange={setAdminTab}
        fullWidth={fullWidth}
        variant="dark"
      />
    ) : (
      <SegmentedTabs
        items={CANDIDATE_TABS}
        value={candidateTab}
        onChange={setCandidateTab}
        fullWidth={fullWidth}
        variant="dark"
      />
    );

  return (
    <header className="sticky top-0 z-40 border-b border-[#002855] bg-[#003876] text-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo subtitle={false} theme="dark" />

        <nav className="hidden md:block">{tabs(false)}</nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {!isAdmin && (
            <Button
              variant="secondary"
              size="sm"
              className="hidden lg:inline-flex border-white/20 bg-white/10 text-white hover:bg-white/20"
              icon={<Sparkles className="h-4 w-4 text-[#FCD34D]" />}
              onClick={onOpenOnboarding}
            >
              Actualizar CV
            </Button>
          )}

          {!isAdmin && (
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifOpen((p) => !p)}
                aria-label="Notificaciones"
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-200",
                  notifOpen
                    ? "bg-white/20 text-white"
                    : "text-blue-100 hover:bg-white/10 hover:text-white"
                )}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white ring-2 ring-[#003876]">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className={cn(DROPDOWN, "w-[22rem]")}>
                  <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Notificaciones</p>
                      <p className="text-xs text-gray-500">
                        {unreadCount > 0 ? `${unreadCount} sin leer` : "Estás al día"}
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={onMarkAllRead}
                        className="text-xs font-medium text-[#003876] hover:underline"
                      >
                        Marcar como leídas
                      </button>
                    )}
                  </div>
                  <div className="max-h-96 divide-y divide-gray-50 overflow-y-auto text-gray-900">
                    {notifications.length === 0 ? (
                      <p className="px-5 py-10 text-center text-sm text-gray-500">
                        Aún no tienes notificaciones.
                      </p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={cn(
                            "flex gap-3 px-5 py-4 transition-colors duration-200 hover:bg-gray-50",
                            !n.is_read && "bg-blue-50/40"
                          )}
                        >
                          <span
                            className={cn(
                              "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                              n.is_read ? "bg-transparent" : "bg-[#003876]"
                            )}
                          />
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <p className="text-sm font-medium text-gray-900">{n.title}</p>
                            <p className="text-sm leading-relaxed text-gray-500">{n.message}</p>
                            <div className="flex items-center gap-2">
                              {isApplicationStatus(n.status_badge) && <StatusBadge status={n.status_badge} />}
                              <span className="text-xs text-gray-400">{formatDate(n.created_at, true)}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen((p) => !p)}
              className={cn(
                "flex items-center gap-3 rounded-xl p-1 pr-2 transition-colors duration-200 sm:pr-3",
                userMenuOpen ? "bg-white/20" : "hover:bg-white/10"
              )}
            >
              <Avatar name={activeUser.name} src={activeUser.avatar_url} size="sm" />
              <div className="hidden text-left sm:block">
                <p className="max-w-[160px] truncate text-sm font-semibold text-white">{activeUser.name}</p>
                <p className="max-w-[160px] truncate text-xs text-blue-200 font-medium">{roleLabel(activeUser)}</p>
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-blue-200 transition-transform duration-200",
                  userMenuOpen && "rotate-180"
                )}
              />
            </button>

            {userMenuOpen && (
              <div className={cn(DROPDOWN, "w-80 text-gray-900")}>
                <div className="border-b border-gray-100 px-5 py-4">
                  <p className="text-sm font-semibold text-gray-900">Cambiar de cuenta</p>
                  <p className="text-xs text-gray-500">Alterna entre perfiles de prueba</p>
                </div>
                <div className="max-h-80 space-y-1 overflow-y-auto p-2">
                  {users.map((u) => {
                    const selected = u.id === activeUser.id;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          onSelectUser(u);
                          setUserMenuOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors duration-200",
                          selected ? "bg-blue-50 text-[#003876]" : "hover:bg-gray-50"
                        )}
                      >
                        <Avatar name={u.name} src={u.avatar_url} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900">{u.name}</p>
                          <p className="truncate text-xs text-gray-500">
                            {roleLabel(u)}
                            {u.role !== "ADMIN" && !u.onboarding_completed && " · CV pendiente"}
                          </p>
                        </div>
                        {selected && <Check className="h-4 w-4 shrink-0 text-[#003876]" />}
                      </button>
                    );
                  })}
                </div>
                <div className="border-t border-gray-100 p-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      onLogout();
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-colors duration-200 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-[#002855] bg-[#002d5f] px-4 py-2 md:hidden">{tabs(true)}</div>
    </header>
  );
}
