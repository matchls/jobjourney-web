"use client";

import { useApplications } from "@/hooks/use-applications";
import {
  TrendingUp,
  BookOpen,
  Clock,
  Star,
  Lightbulb,
  Flame,
  CheckCircle2,
  PlayCircle,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

type JournalItem = {
  label: string;
  status: string;
  progress?: number;
  date: string;
};

const THEMES = [
  { label: "React", score: 90 },
  { label: "TypeScript", score: 75 },
  { label: "Node.js", score: 60 },
  { label: "SQL", score: 50 },
  { label: "Docker", score: 30 },
  { label: "Cloud", score: 15 },
];

const LEVIERS = [
  {
    label: "System Design",
    sublabel: "Concepts d'architecture distribués",
    badge: "PRIORITÉ HAUTE",
    badgeClass: "bg-red-50 text-red-600 border-red-200",
  },
  {
    label: "Behavioral STAR",
    sublabel: "Structure des réponses comportementales",
    badge: "À CONSOLIDER",
    badgeClass: "bg-amber-50 text-amber-600 border-amber-200",
  },
  {
    label: "React Patterns",
    sublabel: "Hooks avancés et optimisation",
    badge: "ATOUT STRATÉGIQUE",
    badgeClass: "bg-primary/10 text-primary border-primary/20",
  },
];

const REFLEXION = [
  { label: "Confiance en Live Coding", score: 6.5 },
  { label: "Clarté Narrative STAR", score: 8.0 },
  { label: "Maîtrise des concepts clés", score: 7.2 },
];

const JOURNAL: JournalItem[] = [
  { label: "Architecture Cloud", status: "done", date: "12 juin" },
  {
    label: "Design Patterns",
    status: "inprogress",
    progress: 60,
    date: "En cours",
  },
  { label: "Techniques de Négociation", status: "planned", date: "Prévu" },
];

const PERF_POINTS = [20, 30, 40, 55, 50, 65, 70, 75, 82];
const PERF_MONTHS = [
  "Oct",
  "Nov",
  "Déc",
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Jun",
];

export default function ProgressionPage() {
  const { data: applications = [], isLoading } = useApplications();

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement...</p>;
  }

  const total = applications.length;
  const offers = applications.filter((a) => a.status === "OFFER").length;
  const rate = total > 0 ? Math.round((offers / total) * 100) : 0;

  const stats = [
    {
      icon: TrendingUp,
      label: "Taux de succès",
      value: `${rate}%`,
      sub: `sur ${total} candidatures`,
      color: "text-primary",
    },
    {
      icon: BookOpen,
      label: "Skills validés",
      value: "12/15",
      sub: "objectif atteint à 80%",
      color: "text-blue-500",
    },
    {
      icon: Clock,
      label: "Temps de révision",
      value: "42.5h",
      sub: "ce mois",
      color: "text-amber-500",
    },
    {
      icon: Star,
      label: "Confiance moyenne",
      value: "8.2/10",
      sub: "+0.5 vs mois dernier",
      color: "text-purple-500",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {"Votre Coach d'Apprentissage"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Suivez votre progression et optimisez votre préparation
        </p>
      </div>

      {/* 4 stats */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map(({ icon: Icon, label, value, sub, color }) => (
          <div
            key={label}
            className="bg-card border border-border rounded-xl p-4 flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <Icon size={15} className={color} />
              <span className="text-xs font-medium text-muted-foreground">
                {label}
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      {/* Conseil banner */}
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 rounded-full p-2 shrink-0">
            <Lightbulb size={16} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Conseil de préparation
            </p>
            <p className="text-sm text-muted-foreground">
              {"Votre prochain entretien est chez "}
              <span className="font-medium text-foreground">Datadog</span>
              {" — focus sur les systèmes distribués et l'observabilité."}
            </p>
          </div>
        </div>
        <button className="text-xs font-semibold text-primary border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/10 transition-colors whitespace-nowrap ml-4 shrink-0">
          Voir les fiches
        </button>
      </div>

      {/* Thèmes + Leviers */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              {"Thèmes d'entretien les plus fréquents"}
            </h2>
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
              Derniers 30 jours
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {THEMES.map(({ label, score }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-20 shrink-0">
                  {label}
                </span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${score}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-foreground w-8 text-right">
                  {score}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-foreground">
            Vos leviers de progression
          </h2>
          <div className="flex flex-col gap-2 flex-1">
            {LEVIERS.map(({ label, sublabel, badge, badgeClass }) => (
              <div
                key={label}
                className="flex items-start justify-between p-3 bg-muted/40 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {sublabel}
                  </p>
                </div>
                <span
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ml-3 shrink-0",
                    badgeClass,
                  )}
                >
                  {badge}
                </span>
              </div>
            ))}
          </div>
          <button className="w-full text-xs font-semibold text-primary border border-primary/30 rounded-lg px-3 py-2 hover:bg-primary/10 transition-colors">
            {"Planifier ma session d'apprentissage"}
          </button>
        </div>
      </div>

      {/* Insight + Réflexion */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-primary rounded-xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Flame size={14} className="text-primary-foreground/60" />
            <span className="text-[10px] font-bold tracking-widest text-primary-foreground/60 uppercase">
              Insight de Progression
            </span>
          </div>
          <p className="text-primary-foreground text-sm leading-relaxed flex-1">
            {
              '"Votre régularité en préparation est votre plus grand atout. Vous progressez de façon constante — continuez sur cette lancée et le prochain entretien sera le bon."'
            }
          </p>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-xs font-semibold text-primary-foreground">
              Levier de confiance
            </p>
            <p className="text-xs text-primary-foreground/70 mt-0.5">
              {"Révisez 2 fiches React avancées avant vendredi"}
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-foreground">
            {"Réflexion & Progression"}
          </h2>
          <div className="flex flex-col gap-5 flex-1 justify-center">
            {REFLEXION.map(({ label, score }) => (
              <div key={label} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-bold text-foreground">
                    {score}/10
                  </p>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${score * 10}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Journal + Performance */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-foreground">
            {"Journal d'apprentissage"}
          </h2>
          <div className="flex flex-col gap-2">
            {JOURNAL.map(({ label, status, progress, date }) => (
              <div
                key={label}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/40"
              >
                {status === "done" && (
                  <CheckCircle2 size={18} className="text-primary shrink-0" />
                )}
                {status === "inprogress" && (
                  <PlayCircle size={18} className="text-amber-500 shrink-0" />
                )}
                {status === "planned" && (
                  <Calendar
                    size={18}
                    className="text-muted-foreground shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      status === "done"
                        ? "line-through text-muted-foreground"
                        : "text-foreground",
                    )}
                  >
                    {label}
                  </p>
                  {status === "inprogress" && progress !== undefined && (
                    <div className="h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {date}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-foreground">
            Performance historique
          </h2>
          <svg viewBox="0 0 300 120" className="w-full">
            {[20, 45, 70, 95].map((y) => (
              <line
                key={y}
                x1="28"
                y1={y}
                x2="296"
                y2={y}
                stroke="var(--border)"
                strokeWidth="0.5"
              />
            ))}
            <polyline
              points={PERF_POINTS.map(
                (v, i) => `${30 + i * 33},${100 - v * 0.9}`,
              ).join(" ")}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {PERF_POINTS.map((v, i) => (
              <circle
                key={i}
                cx={30 + i * 33}
                cy={100 - v * 0.9}
                r="3"
                fill="var(--primary)"
              />
            ))}
            {PERF_MONTHS.map((m, i) => (
              <text
                key={m}
                x={30 + i * 33}
                y="115"
                textAnchor="middle"
                fontSize="7"
                fill="currentColor"
                className="text-muted-foreground"
              >
                {m}
              </text>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}
