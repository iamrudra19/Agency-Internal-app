import { Badge, type BadgeColor } from "@/components/ui/badge";
import { titleCase } from "@/lib/utils";
import type { ContactType, DealStage, SequenceStatus, TaskPriority, ProjectStatus } from "@/types/database";
import { STAGE_LABELS, SEQUENCE_STATUS_LABELS } from "@/lib/constants";

const CONTACT_TYPE_COLORS: Record<ContactType, BadgeColor> = {
  prospect: "blue",
  lead: "amber",
  client: "green",
  lost: "red",
  disqualified: "grey",
};

const STAGE_COLORS: Record<DealStage, BadgeColor> = {
  identified: "grey",
  outreach_active: "blue",
  replied: "cyan",
  meeting_booked: "indigo",
  proposal_sent: "amber",
  negotiation: "amber",
  won: "green",
  lost: "red",
  stalled: "grey",
};

const SEQUENCE_COLORS: Record<SequenceStatus, BadgeColor> = {
  not_started: "grey",
  email_1_sent: "blue",
  email_2_sent: "blue",
  email_3_sent: "blue",
  email_4_sent: "blue",
  replied_positive: "green",
  replied_negative: "red",
  replied_ooo: "amber",
  bounced: "grey",
  unsubscribed: "grey",
  completed: "indigo",
};

const PRIORITY_COLORS: Record<TaskPriority, BadgeColor> = {
  urgent: "red",
  high: "amber",
  medium: "blue",
  low: "grey",
};

const PROJECT_STATUS_COLORS: Record<ProjectStatus, BadgeColor> = {
  not_started: "grey",
  discovery: "blue",
  building: "indigo",
  testing: "amber",
  deployed: "green",
  maintenance: "cyan",
};

export function ContactTypeBadge({ type }: { type: ContactType }) {
  return <Badge color={CONTACT_TYPE_COLORS[type]}>{titleCase(type)}</Badge>;
}

export function StageBadge({ stage }: { stage: DealStage }) {
  return <Badge color={STAGE_COLORS[stage]}>{STAGE_LABELS[stage]}</Badge>;
}

export function SequenceStatusBadge({ status }: { status: SequenceStatus }) {
  return (
    <Badge color={SEQUENCE_COLORS[status]} pulse={status.startsWith("email_")}>
      {SEQUENCE_STATUS_LABELS[status]}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return <Badge color={PRIORITY_COLORS[priority]}>{titleCase(priority)}</Badge>;
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return <Badge color={PROJECT_STATUS_COLORS[status]}>{titleCase(status)}</Badge>;
}
