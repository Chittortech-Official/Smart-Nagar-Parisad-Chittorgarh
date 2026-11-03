export type UserRole = 
  | 'PORTAL_MANAGER' 
  | 'CHAIRMAN';

export type TicketStatus = 
  | 'PENDING_REVIEW'
  | 'REGISTERED' 
  | 'IN_PROGRESS' 
  | 'RESOLVED_AWAITING_CITIZEN' 
  | 'CLOSED' 
  | 'REOPENED'
  | 'REJECTED';

export type ForwardingOption = 
  | 'COUNCILLOR_AND_OFFICER' 
  | 'COUNCILLOR_ONLY' 
  | 'OFFICER_ONLY';

export interface Ward {
  ward_number: number;
  ward_name: string;
  councillor_name: string;
  councillor_phone: string;
  zone: string;
  key_landmarks: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  default_sla_hours: number;
  head_officer_name: string;
  head_officer_phone: string;
}

export interface ComplaintCategory {
  id: string;
  department_id: string;
  name: string;
  default_sla_hours: number;
  description: string;
}

export interface IntakeComplaint {
  id: string;
  intake_channel: 'HELPLINE_CALL' | 'WHATSAPP';
  citizen_name: string;
  citizen_phone: string;
  ward_number: number;
  address: string;
  landmark: string;
  category_name: string;
  department_name: string;
  problem_description: string;
  status: 'PENDING_REVIEW' | 'ACCEPTED' | 'REJECTED';
  rejection_reason?: string;
  is_after_hours: boolean;
  sla_hours?: number;
  received_at: string;
}

export interface Ticket {
  id: string;
  ticket_number: string; // e.g. CGR-0001
  citizen_name: string;
  citizen_phone: string;
  ward_number: number;
  address: string;
  landmark: string;
  category_name: string;
  department_name: string;
  problem_description: string;
  status: TicketStatus;
  forwarding_option: ForwardingOption;
  sla_hours: number;
  sla_deadline: string;
  sla_deadline_iso?: string;
  is_overdue: boolean;
  is_escalated: boolean;
  escalation_notes?: string;
  assigned_officer_name: string;
  assigned_officer_phone: string;
  registration_time: string;
  resolution_time?: string;
  closed_at?: string;
  authority_confirmed: boolean;
  authority_notes?: string;
  citizen_satisfied?: boolean;
  citizen_feedback?: string;
  reopen_count?: number;
  is_reopened?: boolean;
}

export interface NotificationLog {
  id: string;
  ticket_number: string;
  recipient_type: 'CITIZEN' | 'COUNCILLOR' | 'OFFICER' | 'CHAIRMAN';
  recipient_name: string;
  recipient_phone: string;
  channel: 'WHATSAPP' | 'SMS';
  template_name: string;
  message_content: string;
  status: 'DELIVERED' | 'SENT' | 'QUEUED' | 'FAILED';
  sent_at: string;
}
