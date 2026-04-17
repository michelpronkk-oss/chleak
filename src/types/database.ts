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
