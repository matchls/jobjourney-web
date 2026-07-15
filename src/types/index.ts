export type ApplicationStatus =
  | "TARGETED"
  | "APPLIED"
  | "INTERVIEWING"
  | "OFFER"
  | "REJECTED";

export type InterviewStepStatus = "PLANNED" | "COMPLETED" | "CANCELLED";

export type InterviewStepType = "HR" | "TECHNICAL" | "FINAL" | "CUSTOM";

export type User = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  defaultInterviewSteps: string[];
  createdAt: string;
  updatedAt: string;
};

export type Skill = {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

export type InterviewStep = {
  id: string;
  title: string;
  type: InterviewStepType;
  status: InterviewStepStatus;
  order: number;
  scheduledAt: string | null;
  completedAt: string | null;
  questionsAsked: string | null;
  blockers: string | null;
  toReview: string | null;
  notes: string | null;
  applicationId: string;
  createdAt: string;
  updatedAt: string;
  skills: Skill[];
};

export type PreparationTask = {
  id: string;
  title: string;
  description: string | null;
  link: string | null;
  isCompleted: boolean;
  order: number;
  applicationId: string;
  skillId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApplicationStatusHistory = {
  id: string;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  changedAt: string;
  createdAt: string;
  applicationId: string;
};

export type Application = {
  id: string;
  company: string;
  position: string;
  source: string | null;
  offerUrl: string | null;
  status: ApplicationStatus;
  appliedAt: string | null;
  statusChangedAt: string | null;
  notes: string | null;
  resumeText: string | null;
  coverLetterText: string | null;
  location: string | null;
  salary: string | null;
  jobDescription: string | null;
  contactName: string | null;
  contactRole: string | null;
  contactEmail: string | null;
  referralNote: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  interviewSteps: InterviewStep[];
  preparationTasks: PreparationTask[];
  statusHistory?: ApplicationStatusHistory[];
};
export type DashboardData = {
  stats: {
    total: number;
    byStatus: {
      TARGETED: number;
      APPLIED: number;
      INTERVIEWING: number;
      OFFER: number;
      REJECTED: number;
    };
  };
  upcomingInterviews: {
    id: string;
    title: string;
    scheduledAt: string;
    application: {
      id: string;
      company: string;
      position: string;
    };
  }[];
  completedInterviews: {
    total: number;
    byCompany: Record<string, number>;
  };
};
