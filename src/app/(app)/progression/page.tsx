"use client";

import { useProgression } from "@/hooks/use-progression";
import {
  TrendingUp,
  FileText,
  CheckCircle2,
  BookOpen,
  Lightbulb,
  Flame,
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

const MONTHS_FR = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Jun",
  "Jul",
  "Aoû",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

function formatMonthLabel(month: string) {
  const monthIndex = Number(month.split("-")[1]) - 1;
  return MONTHS_FR[monthIndex] ?? month;
}

function DemoBadge() {
  return (
    <span className="text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 whitespace-nowrap">
      Données de démonstration
    </span>
  );
}

const CHART_LEFT = 30;
const CHART_RIGHT = 296;
const CHART_TOP = 10;
const CHART_BOTTOM = 100;

export default function ProgressionPage() {
  const { data, isLoading, isError, error, refetch } = useProgression();

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement...</p>;
  }

  if (isError) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-foreground font-medium">
          Impossible de charger votre progression.
        </p>
        <p className="text-xs text-muted-foreground">
          {error instanceof Error ? error.message : "Erreur inconnue"}
        </p>
        <button
          onClick={() => refetch()}
          className="text-xs font-semibold text-primary border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/10 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { stats, activityByMonth, skills } = data;
  const offerRate = Number.isFinite(stats.offerRate)
    ? Math.round(stats.offerRate)
    : 0;

  const usedSkills = skills
    .filter((skill) => skill.usageCount > 0)
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 6);
  const maxUsageCount = Math.max(1, ...usedSkills.map((s) => s.usageCount));

  const maxActivity = Math.max(
    1,
    ...activityByMonth.flatMap((m) => [
      m.applicationsCreated,
      m.interviewsCompleted,
    ]),
  );
  const pointCount = activityByMonth.length;
  const xForIndex = (i: number) =>
    pointCount <= 1
      ? (CHART_LEFT + CHART_RIGHT) / 2
      : CHART_LEFT + (i * (CHART_RIGHT - CHART_LEFT)) / (pointCount - 1);
  const yForValue = (v: number) =>
    CHART_BOTTOM - (v / maxActivity) * (CHART_BOTTOM - CHART_TOP);

  const statCards = [
    {
      icon: TrendingUp,
      label: "Taux de succès",
      value: `${offerRate}%`,
      sub: `sur ${stats.submittedApplications} candidatures soumises`,
      color: "text-primary",
    },
    {
      icon: FileText,
      label: "Candidatures",
      value: `${stats.totalApplications}`,
      sub: `${stats.submittedApplications} soumises`,
      color: "text-blue-500",
    },
    {
      icon: CheckCircle2,
      label: "Entretiens terminés",
      value: `${stats.completedInterviews}`,
      sub: "entretiens réalisés",
      color: "text-amber-500",
    },
    {
      icon: BookOpen,
      label: "Compétences utilisées",
      value: `${usedSkills.length}`,
      sub: `sur ${skills.length} compétences`,
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
        <p className="text-xs text-muted-foreground mt-1">
          Certains blocs ci-dessous restent simulés en attendant les
          prochaines itérations des analytics.
        </p>
      </div>

      {/* 4 stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(({ icon: Icon, label, value, sub, color }) => (
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
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 rounded-full p-2 shrink-0">
            <Lightbulb size={16} className="text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-foreground">
                Conseil de préparation
              </p>
              <DemoBadge />
            </div>
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

      {/* Compétences + Leviers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Compétences les plus travaillées
            </h2>
          </div>
          {usedSkills.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune compétence utilisée pour le moment.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {usedSkills.map(({ id, name, usageCount }) => (
                <div key={id} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-24 shrink-0 truncate">
                    {name}
                  </span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{
                        width: `${(usageCount / maxUsageCount) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium text-foreground w-8 text-right">
                    {usageCount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-semibold text-foreground">
              Vos leviers de progression
            </h2>
            <DemoBadge />
          </div>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-primary rounded-xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Flame size={14} className="text-primary-foreground/60" />
            <span className="text-[10px] font-bold tracking-widest text-primary-foreground/60 uppercase">
              Insight de Progression
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/15 text-primary-foreground/80 whitespace-nowrap">
              Données de démonstration
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
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-semibold text-foreground">
              {"Réflexion & Progression"}
            </h2>
            <DemoBadge />
          </div>
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

      {/* Journal + Historique */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-semibold text-foreground">
              {"Journal d'apprentissage"}
            </h2>
            <DemoBadge />
          </div>
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
            Historique d&apos;activité
          </h2>
          <svg viewBox="0 0 300 120" className="w-full">
            {[20, 45, 70, 95].map((y) => (
              <line
                key={y}
                x1={CHART_LEFT - 2}
                y1={y}
                x2={CHART_RIGHT}
                y2={y}
                stroke="var(--border)"
                strokeWidth="0.5"
              />
            ))}
            {pointCount === 0 ? (
              <text
                x="163"
                y="60"
                textAnchor="middle"
                fontSize="8"
                className="fill-muted-foreground"
              >
                Aucune activité enregistrée
              </text>
            ) : (
              <>
                <polyline
                  points={activityByMonth
                    .map(
                      (m, i) =>
                        `${xForIndex(i)},${yForValue(m.applicationsCreated)}`,
                    )
                    .join(" ")}
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                <polyline
                  points={activityByMonth
                    .map(
                      (m, i) =>
                        `${xForIndex(i)},${yForValue(m.interviewsCompleted)}`,
                    )
                    .join(" ")}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {activityByMonth.map((m, i) => (
                  <circle
                    key={`applications-${m.month}`}
                    cx={xForIndex(i)}
                    cy={yForValue(m.applicationsCreated)}
                    r="3"
                    fill="var(--primary)"
                  />
                ))}
                {activityByMonth.map((m, i) => (
                  <circle
                    key={`interviews-${m.month}`}
                    cx={xForIndex(i)}
                    cy={yForValue(m.interviewsCompleted)}
                    r="3"
                    fill="#f59e0b"
                  />
                ))}
                {activityByMonth.map((m, i) => (
                  <text
                    key={m.month}
                    x={xForIndex(i)}
                    y="115"
                    textAnchor="middle"
                    fontSize="7"
                    fill="currentColor"
                    className="text-muted-foreground"
                  >
                    {formatMonthLabel(m.month)}
                  </text>
                ))}
              </>
            )}
          </svg>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary inline-block" />
              Candidatures créées
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: "#f59e0b" }}
              />
              Entretiens terminés
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
