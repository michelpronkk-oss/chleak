export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      access_requests: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          full_name: string
          email: string
          company_name: string | null
          store_url: string | null
          platform: string
          revenue_band: string | null
          pain_prompt: string | null
          status: string
          source: string
          notes: string | null
          approved_at: string | null
          approved_by: string | null
          approval_email_sent_at: string | null
          request_received_email_sent_at: string | null
          rejected_at: string | null
          rejection_email_sent_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          full_name: string
          email: string
          company_name?: string | null
          store_url?: string | null
          platform: string
          revenue_band?: string | null
          pain_prompt?: string | null
          status?: string
          source?: string
          notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          approval_email_sent_at?: string | null
          request_received_email_sent_at?: string | null
          rejected_at?: string | null
          rejection_email_sent_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          full_name?: string
          email?: string
          company_name?: string | null
          store_url?: string | null
          platform?: string
          revenue_band?: string | null
          pain_prompt?: string | null
          status?: string
          source?: string
          notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          approval_email_sent_at?: string | null
          request_received_email_sent_at?: string | null
          rejected_at?: string | null
          rejection_email_sent_at?: string | null
        }
        Relationships: []
      }
      issue_events: {
        Row: {
          created_at: string
          event_summary: string
          event_type: string
          id: string
          issue_id: string
        }
        Insert: {
          created_at?: string
          event_summary: string
          event_type: string
          id?: string
          issue_id: string
        }
        Update: {
          created_at?: string
          event_summary?: string
          event_type?: string
          id?: string
          issue_id?: string
        }
        Relationships: []
      }
      integration_webhook_events: {
        Row: {
          id: string
          organization_id: string | null
          payload: Json
          processed_at: string | null
          provider: string
          received_at: string
          source_domain: string | null
          topic: string
        }
        Insert: {
          id?: string
          organization_id?: string | null
          payload?: Json
          processed_at?: string | null
          provider: string
          received_at?: string
          source_domain?: string | null
          topic: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          payload?: Json
          processed_at?: string | null
          provider?: string
          received_at?: string
          source_domain?: string | null
          topic?: string
        }
        Relationships: []
      }
      issues: {
        Row: {
          created_at: string
          detected_at: string
          estimated_monthly_revenue_impact: number
          id: string
          organization_id: string
          recommended_action: string
          scan_id: string
          severity: string
          source: string
          status: string
          store_id: string
          summary: string
          title: string
          type: string
          why_it_matters: string
        }
        Insert: {
          created_at?: string
          detected_at?: string
          estimated_monthly_revenue_impact?: number
          id?: string
          organization_id: string
          recommended_action: string
          scan_id: string
          severity: string
          source: string
          status?: string
          store_id: string
          summary: string
          title: string
          type: string
          why_it_matters: string
        }
        Update: {
          created_at?: string
          detected_at?: string
          estimated_monthly_revenue_impact?: number
          id?: string
          organization_id?: string
          recommended_action?: string
          scan_id?: string
          severity?: string
          source?: string
          status?: string
          store_id?: string
          summary?: string
          title?: string
          type?: string
          why_it_matters?: string
        }
        Relationships: []
      }
      operator_profiles: {
        Row: {
          id: string
          user_id: string
          display_name: string | null
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          display_name?: string | null
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          display_name?: string | null
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      org_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          estimated_leakage: number
          estimated_recovered_revenue: number
          generated_at: string
          id: string
          issue_count: number
          organization_id: string
          period_end: string
          period_start: string
          store_id: string
        }
        Insert: {
          created_at?: string
          estimated_leakage?: number
          estimated_recovered_revenue?: number
          generated_at?: string
          id?: string
          issue_count?: number
          organization_id: string
          period_end: string
          period_start: string
          store_id: string
        }
        Update: {
          created_at?: string
          estimated_leakage?: number
          estimated_recovered_revenue?: number
          generated_at?: string
          id?: string
          issue_count?: number
          organization_id?: string
          period_end?: string
          period_start?: string
          store_id?: string
        }
        Relationships: []
      }
      scans: {
        Row: {
          completed_at: string | null
          created_at: string
          detected_issues_count: number
          estimated_monthly_leakage: number
          id: string
          organization_id: string
          scanned_at: string
          status: string
          store_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          detected_issues_count?: number
          estimated_monthly_leakage?: number
          id?: string
          organization_id: string
          scanned_at?: string
          status?: string
          store_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          detected_issues_count?: number
          estimated_monthly_leakage?: number
          id?: string
          organization_id?: string
          scanned_at?: string
          status?: string
          store_id?: string
        }
        Relationships: []
      }
      store_integrations: {
        Row: {
          account_identifier: string | null
          access_token_ref: string | null
          connection_health: string | null
          created_at: string
          id: string
          installed_at: string | null
          last_synced_at: string | null
          metadata: Json
          organization_id: string
          provider: string
          scopes: string[] | null
          shop_domain: string | null
          status: string
          store_id: string
          sync_status: string | null
        }
        Insert: {
          account_identifier?: string | null
          access_token_ref?: string | null
          connection_health?: string | null
          created_at?: string
          id?: string
          installed_at?: string | null
          last_synced_at?: string | null
          metadata?: Json
          organization_id: string
          provider: string
          scopes?: string[] | null
          shop_domain?: string | null
          status?: string
          store_id: string
          sync_status?: string | null
        }
        Update: {
          account_identifier?: string | null
          access_token_ref?: string | null
          connection_health?: string | null
          created_at?: string
          id?: string
          installed_at?: string | null
          last_synced_at?: string | null
          metadata?: Json
          organization_id?: string
          provider?: string
          scopes?: string[] | null
          shop_domain?: string | null
          status?: string
          store_id?: string
          sync_status?: string | null
        }
        Relationships: []
      }
      stores: {
        Row: {
          active: boolean
          created_at: string
          currency: string
          domain: string | null
          id: string
          name: string
          organization_id: string
          platform: string
          timezone: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          currency?: string
          domain?: string | null
          id?: string
          name: string
          organization_id: string
          platform: string
          timezone?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          currency?: string
          domain?: string | null
          id?: string
          name?: string
          organization_id?: string
          platform?: string
          timezone?: string
        }
        Relationships: []
      }
      workspace_settings: {
        Row: {
          id: string
          org_id: string
          issue_alerts: string
          weekly_digest_day: string
          billing_alerts_enabled: boolean
          digest_enabled: boolean
          updated_by: string
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          issue_alerts?: string
          weekly_digest_day?: string
          billing_alerts_enabled?: boolean
          digest_enabled?: boolean
          updated_by: string
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          issue_alerts?: string
          weekly_digest_day?: string
          billing_alerts_enabled?: boolean
          digest_enabled?: boolean
          updated_by?: string
          updated_at?: string
          created_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string
          current_period_start: string
          dodo_customer_id: string | null
          dodo_subscription_id: string | null
          id: string
          organization_id: string
          plan: string
          seats: number
          status: string
        }
        Insert: {
          created_at?: string
          current_period_end: string
          current_period_start: string
          dodo_customer_id?: string | null
          dodo_subscription_id?: string | null
          id?: string
          organization_id: string
          plan: string
          seats?: number
          status?: string
        }
        Update: {
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          dodo_customer_id?: string | null
          dodo_subscription_id?: string | null
          id?: string
          organization_id?: string
          plan?: string
          seats?: number
          status?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
