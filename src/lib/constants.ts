import type { DealStage, Geography, SequenceStatus } from "@/types/database";

export const STAGE_LABELS: Record<DealStage, string> = {
  identified: "Identified",
  outreach_active: "Outreach Active",
  replied: "Replied",
  meeting_booked: "Meeting Booked",
  proposal_sent: "Proposal Sent",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
  stalled: "Stalled",
};

export const PIPELINE_STAGES: DealStage[] = [
  "identified",
  "outreach_active",
  "replied",
  "meeting_booked",
  "proposal_sent",
  "negotiation",
  "won",
  "lost",
];

/** Weighted pipeline probabilities per stage */
export const STAGE_PROBABILITY: Record<DealStage, number> = {
  identified: 0.05,
  outreach_active: 0.1,
  replied: 0.2,
  meeting_booked: 0.4,
  proposal_sent: 0.6,
  negotiation: 0.8,
  won: 1,
  lost: 0,
  stalled: 0.05,
};

export const GEOGRAPHY_LABELS: Record<Geography, string> = {
  surat: "Surat",
  ahmedabad: "Ahmedabad",
  rajkot: "Rajkot",
  vadodara: "Vadodara",
  gujarat_other: "Gujarat (Other)",
  india_other: "India (Other)",
  uae: "UAE",
  international: "International",
};

export const SEQUENCE_STATUS_LABELS: Record<SequenceStatus, string> = {
  not_started: "Not Started",
  email_1_sent: "Email 1 Sent",
  email_2_sent: "Email 2 Sent",
  email_3_sent: "Email 3 Sent",
  email_4_sent: "Email 4 Sent",
  replied_positive: "Replied +",
  replied_negative: "Replied −",
  replied_ooo: "OOO",
  bounced: "Bounced",
  unsubscribed: "Unsubscribed",
  completed: "Completed",
};

export const EMAIL_FRAMEWORKS = ["PAS", "BAB", "AIDA", "QVC"] as const;

export const LOST_REASONS = [
  "price",
  "timing",
  "competitor",
  "no_budget",
  "went_silent",
  "not_a_fit",
] as const;

export const CONTACT_TYPES = ["prospect", "lead", "client", "lost", "disqualified"] as const;
export const SOURCES = ["cold_email", "linkedin", "referral", "indiamart", "expo", "inbound", "other"] as const;
export const GEOGRAPHIES = Object.keys(GEOGRAPHY_LABELS) as Geography[];
export const PITCH_TYPES = ["rfq_handler", "ai_sdr", "dual", "custom"] as const;
