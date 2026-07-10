export type ContactType = "prospect" | "lead" | "client" | "lost" | "disqualified";
export type Source = "cold_email" | "linkedin" | "referral" | "indiamart" | "expo" | "inbound" | "other";
export type Geography =
  | "surat" | "ahmedabad" | "rajkot" | "vadodara"
  | "gujarat_other" | "india_other" | "uae" | "international";
export type PitchType = "rfq_handler" | "ai_sdr" | "dual" | "custom";

export interface Contact {
  id: string;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string | null;
  gender: "male" | "female" | "unknown";
  title: string | null;
  company_name: string;
  company_website: string | null;
  indiamart_listing: boolean;
  export_markets: string[] | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  whatsapp: string | null;
  contact_type: ContactType;
  source: Source;
  geography: Geography;
  industry: string | null;
  products: string[] | null;
  icp_score: number | null;
  employee_count: string | null;
  estimated_revenue: string | null;
  pitch_type: PitchType;
  notes: string | null;
  tags: string[] | null;
}

export type DealStage =
  | "identified" | "outreach_active" | "replied" | "meeting_booked"
  | "proposal_sent" | "negotiation" | "won" | "lost" | "stalled";

export type ProjectStatus =
  | "not_started" | "discovery" | "building" | "testing" | "deployed" | "maintenance";

export type PaymentStatus = "unpaid" | "partial" | "paid" | "overdue";

export interface Deal {
  id: string;
  created_at: string;
  updated_at: string;
  contact_id: string | null;
  deal_name: string;
  deal_value: number | null;
  currency: string;
  stage: DealStage;
  stage_changed_at: string;
  expected_close_date: string | null;
  lost_reason: string | null;
  project_status: ProjectStatus | null;
  project_start_date: string | null;
  project_end_date: string | null;
  deliverables: string | null;
  amount_paid: number;
  payment_status: PaymentStatus;
  notes: string | null;
}

export interface DealWithContact extends Deal {
  contacts: Contact | null;
}

export type CampaignStatus = "draft" | "active" | "paused" | "completed";

export interface Campaign {
  id: string;
  created_at: string;
  name: string;
  status: CampaignStatus;
  target_geography: string | null;
  target_industry: string | null;
  total_prospects: number;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
}

export type SequenceStatus =
  | "not_started" | "email_1_sent" | "email_2_sent" | "email_3_sent" | "email_4_sent"
  | "replied_positive" | "replied_negative" | "replied_ooo" | "bounced" | "unsubscribed" | "completed";

export type ReplyType =
  | "positive" | "negative" | "ooo" | "bounce" | "unsubscribe" | "neutral" | "referral";

export interface OutreachSequence {
  id: string;
  created_at: string;
  contact_id: string | null;
  campaign_id: string | null;
  sequence_status: SequenceStatus;
  email_1_sent_at: string | null;
  email_2_sent_at: string | null;
  email_3_sent_at: string | null;
  email_4_sent_at: string | null;
  replied_at: string | null;
  reply_type: ReplyType | null;
  reply_notes: string | null;
  next_action: string | null;
  next_action_date: string | null;
  notes: string | null;
}

export interface OutreachSequenceWithContact extends OutreachSequence {
  contacts: Contact | null;
  campaigns: Campaign | null;
}

export interface DailyActivity {
  id: string;
  log_date: string;
  emails_sent: number;
  email_1_sent: number;
  email_2_sent: number;
  email_3_sent: number;
  email_4_sent: number;
  replies_received: number;
  positive_replies: number;
  bounces: number;
  meetings_booked: number;
  proposals_sent: number;
  deals_won: number;
  revenue_closed: number;
  notes: string | null;
}

export type TaskPriority = "urgent" | "high" | "medium" | "low";
export type TaskStatus = "pending" | "in_progress" | "done" | "cancelled";
export type TaskType =
  | "follow_up" | "send_email" | "call" | "meeting" | "proposal" | "research" | "prototype" | "other";

export interface Task {
  id: string;
  created_at: string;
  contact_id: string | null;
  deal_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  task_type: TaskType;
  completed_at: string | null;
}

export interface RevenueTarget {
  id: string;
  month: string;
  target_amount: number;
  achieved_amount: number;
  deals_target: number;
  deals_closed: number;
  notes: string | null;
}

export interface AppSettings {
  id: number;
  agency_name: string;
  contact_info: string | null;
  signature: string | null;
  monthly_target: number;
  avg_deal_size: number;
  close_rate: number;
  proposal_rate: number;
  meeting_rate: number;
  positive_reply_rate: number;
  email_gaps: number[];
  geographies: string[];
  industries: string[];
  updated_at: string;
}
