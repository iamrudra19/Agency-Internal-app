import { getDaysInMonth, isSameMonth, parseISO } from "date-fns";
import { daysRemainingInMonth } from "@/lib/utils";
import type { AppSettings, Contact, DailyActivity, DealWithContact, OutreachSequence, RevenueTarget } from "@/types/database";

export type PaceStatus = "on_track" | "behind" | "critical";

export interface BridgeNode {
  key: string;
  label: string;
  current: number;
  required: number;
  status: PaceStatus;
}

export interface BridgeResult {
  nodes: BridgeNode[];
  achieved: number;
  target: number;
  pctComplete: number;
  daysRemaining: number;
  emailsPerDayNeeded: number;
  emailsNeededTotal: number;
  emailsSentThisMonth: number;
  paceStatus: PaceStatus;
  paceMessage: string;
  dealsNeeded: number;
  proposalsNeeded: number;
  meetingsNeeded: number;
  positiveRepliesNeeded: number;
}

function nodeStatus(current: number, required: number): PaceStatus {
  if (required <= 0 || current >= required) return "on_track";
  if (current >= required * 0.8) return "behind";
  return "critical";
}

export function computeRevenueBridge({
  settings,
  target,
  contacts,
  deals,
  sequences,
  activity,
  now = new Date(),
}: {
  settings: AppSettings;
  target: RevenueTarget | null;
  contacts: Contact[];
  deals: DealWithContact[];
  sequences: OutreachSequence[];
  activity: DailyActivity[];
  now?: Date;
}): BridgeResult {
  const targetAmount = Number(target?.target_amount ?? settings.monthly_target);

  const wonThisMonth = deals.filter(
    (d) => d.stage === "won" && isSameMonth(parseISO(d.stage_changed_at), now),
  );
  const wonValue = wonThisMonth.reduce((s, d) => s + Number(d.deal_value ?? 0), 0);
  const achieved = Math.max(Number(target?.achieved_amount ?? 0), wonValue);

  const monthActivity = activity.filter((a) => isSameMonth(parseISO(a.log_date), now));
  const emailsSentThisMonth = monthActivity.reduce((s, a) => s + a.emails_sent, 0);
  const positiveRepliesThisMonth = monthActivity.reduce((s, a) => s + a.positive_replies, 0);
  const meetingsThisMonth = monthActivity.reduce((s, a) => s + a.meetings_booked, 0);
  const proposalsThisMonth = monthActivity.reduce((s, a) => s + a.proposals_sent, 0);

  const prospectsLoaded = contacts.filter((c) =>
    ["prospect", "lead"].includes(c.contact_type),
  ).length;
  const activeSequences = sequences.filter((s) =>
    ["email_1_sent", "email_2_sent", "email_3_sent", "email_4_sent"].includes(s.sequence_status),
  ).length;

  const daysRemaining = daysRemainingInMonth(now);
  const daysInMonth = getDaysInMonth(now);
  const dayOfMonth = now.getDate();

  const revenueRemaining = Math.max(0, targetAmount - achieved);
  const dealsNeeded = Math.ceil(revenueRemaining / Math.max(1, Number(settings.avg_deal_size)));
  const proposalsNeeded = Math.ceil(dealsNeeded / Number(settings.close_rate));
  const meetingsNeeded = Math.ceil(proposalsNeeded / Number(settings.proposal_rate));
  const positiveRepliesNeeded = Math.ceil(meetingsNeeded / Math.max(0.001, Number(settings.meeting_rate)));
  const emailsNeededTotal = Math.ceil(positiveRepliesNeeded / Math.max(0.001, Number(settings.positive_reply_rate)));
  const emailsPerDayNeeded = Math.ceil(emailsNeededTotal / daysRemaining);

  // Pace: compare revenue progress against month elapsed
  const pctComplete = targetAmount > 0 ? achieved / targetAmount : 0;
  const monthElapsedPct = dayOfMonth / daysInMonth;
  const ratio = monthElapsedPct > 0 ? pctComplete / monthElapsedPct : 1;

  let paceStatus: PaceStatus;
  if (pctComplete >= 1 || ratio >= 0.95) paceStatus = "on_track";
  else if (ratio >= 0.8) paceStatus = "behind";
  else paceStatus = "critical";

  // Emails-behind math: how many emails should have gone out by now this month
  const monthStartEmailsNeeded = emailsNeededTotal + emailsSentThisMonth; // approximation of full-month requirement
  const expectedByNow = Math.round(monthStartEmailsNeeded * monthElapsedPct);
  const emailsBehind = expectedByNow - emailsSentThisMonth;

  let paceMessage: string;
  if (pctComplete >= 1) {
    paceMessage = "Target hit. Everything from here is upside.";
  } else if (paceStatus !== "on_track" && emailsBehind > 5) {
    paceMessage = `You're ~${emailsBehind} emails behind pace. Send ${emailsPerDayNeeded}/day for the rest of the month to catch up.`;
  } else if (ratio >= 1.1) {
    paceMessage = `You're ahead of pace. Send ${emailsPerDayNeeded} emails today to keep going.`;
  } else {
    paceMessage = `Send ${emailsPerDayNeeded} emails today to stay on track.`;
  }

  const nodes: BridgeNode[] = [
    {
      key: "prospects",
      label: "Prospects Loaded",
      current: prospectsLoaded,
      required: emailsNeededTotal,
      status: nodeStatus(prospectsLoaded, emailsNeededTotal),
    },
    {
      key: "sequences",
      label: "Sequences Active",
      current: activeSequences,
      required: Math.ceil(emailsNeededTotal / 4),
      status: nodeStatus(activeSequences, Math.ceil(emailsNeededTotal / 4)),
    },
    {
      key: "replies",
      label: "Replies",
      current: positiveRepliesThisMonth,
      required: positiveRepliesNeeded,
      status: nodeStatus(positiveRepliesThisMonth, positiveRepliesNeeded),
    },
    {
      key: "meetings",
      label: "Meetings",
      current: meetingsThisMonth,
      required: meetingsNeeded,
      status: nodeStatus(meetingsThisMonth, meetingsNeeded),
    },
    {
      key: "proposals",
      label: "Proposals",
      current: proposalsThisMonth,
      required: proposalsNeeded,
      status: nodeStatus(proposalsThisMonth, proposalsNeeded),
    },
    {
      key: "won",
      label: "Won",
      current: wonThisMonth.length,
      required: dealsNeeded,
      status: nodeStatus(wonThisMonth.length, dealsNeeded),
    },
  ];

  return {
    nodes,
    achieved,
    target: targetAmount,
    pctComplete,
    daysRemaining,
    emailsPerDayNeeded,
    emailsNeededTotal,
    emailsSentThisMonth,
    paceStatus,
    paceMessage,
    dealsNeeded,
    proposalsNeeded,
    meetingsNeeded,
    positiveRepliesNeeded,
  };
}
