export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      meeting_delegation_members: {
        Row: {
          created_at: string;
          id: string;
          meeting_id: string;
          org_id: string;
          role: Database["public"]["Enums"]["delegation_role"];
          team_id: string | null;
          team_name_snapshot: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          meeting_id: string;
          org_id: string;
          role: Database["public"]["Enums"]["delegation_role"];
          team_id?: string | null;
          team_name_snapshot?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          meeting_id?: string;
          org_id?: string;
          role?: Database["public"]["Enums"]["delegation_role"];
          team_id?: string | null;
          team_name_snapshot?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "meeting_delegation_members_meeting_id_fkey";
            columns: ["meeting_id"];
            isOneToOne: false;
            referencedRelation: "meetings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "meeting_delegation_members_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "meeting_delegation_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      meeting_tag_assignments: {
        Row: {
          created_at: string;
          meeting_id: string;
          org_id: string;
          tag_id: string;
        };
        Insert: {
          created_at?: string;
          meeting_id: string;
          org_id: string;
          tag_id: string;
        };
        Update: {
          created_at?: string;
          meeting_id?: string;
          org_id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "meeting_tag_assignments_meeting_id_fkey";
            columns: ["meeting_id"];
            isOneToOne: false;
            referencedRelation: "meetings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "meeting_tag_assignments_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "meeting_tags";
            referencedColumns: ["id"];
          },
        ];
      };
      meeting_tags: {
        Row: {
          color: string;
          created_at: string;
          display_name: string;
          icon_name: string | null;
          id: string;
          org_id: string;
          updated_at: string;
        };
        Insert: {
          color: string;
          created_at?: string;
          display_name: string;
          icon_name?: string | null;
          id?: string;
          org_id: string;
          updated_at?: string;
        };
        Update: {
          color?: string;
          created_at?: string;
          display_name?: string;
          icon_name?: string | null;
          id?: string;
          org_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      meetings: {
        Row: {
          champion_score: number | null;
          congressional_contact_id: string | null;
          created_at: string;
          created_by: string;
          follow_up_completed: boolean;
          follow_up_date: string | null;
          id: string;
          links: Json;
          location: string | null;
          meeting_date: string;
          meeting_time: string | null;
          notes: string | null;
          org_id: string;
          primary_team_id: string | null;
          representative_id: string;
          updated_at: string;
        };
        Insert: {
          champion_score?: number | null;
          congressional_contact_id?: string | null;
          created_at?: string;
          created_by: string;
          follow_up_completed?: boolean;
          follow_up_date?: string | null;
          id?: string;
          links?: Json;
          location?: string | null;
          meeting_date: string;
          meeting_time?: string | null;
          notes?: string | null;
          org_id: string;
          primary_team_id?: string | null;
          representative_id: string;
          updated_at?: string;
        };
        Update: {
          champion_score?: number | null;
          congressional_contact_id?: string | null;
          created_at?: string;
          created_by?: string;
          follow_up_completed?: boolean;
          follow_up_date?: string | null;
          id?: string;
          links?: Json;
          location?: string | null;
          meeting_date?: string;
          meeting_time?: string | null;
          notes?: string | null;
          org_id?: string;
          primary_team_id?: string | null;
          representative_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "meetings_congressional_contact_id_fkey";
            columns: ["congressional_contact_id"];
            isOneToOne: false;
            referencedRelation: "staffers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "meetings_primary_team_id_fkey";
            columns: ["primary_team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "meetings_representative_id_fkey";
            columns: ["representative_id"];
            isOneToOne: false;
            referencedRelation: "representatives";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          congressional_district: string | null;
          created_at: string;
          email: string;
          first_name: string | null;
          is_placeholder: boolean;
          last_name: string | null;
          org_id: string;
          pronouns: string | null;
          state: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          congressional_district?: string | null;
          created_at?: string;
          email: string;
          first_name?: string | null;
          is_placeholder?: boolean;
          last_name?: string | null;
          org_id: string;
          pronouns?: string | null;
          state?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          congressional_district?: string | null;
          created_at?: string;
          email?: string;
          first_name?: string | null;
          is_placeholder?: boolean;
          last_name?: string | null;
          org_id?: string;
          pronouns?: string | null;
          state?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      representative_org_info: {
        Row: {
          created_at: string;
          links: Json;
          org_id: string;
          representative_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          links?: Json;
          org_id: string;
          representative_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          links?: Json;
          org_id?: string;
          representative_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "representative_org_info_representative_id_fkey";
            columns: ["representative_id"];
            isOneToOne: false;
            referencedRelation: "representatives";
            referencedColumns: ["id"];
          },
        ];
      };
      representatives: {
        Row: {
          bioguide_id: string;
          birthday: string | null;
          chamber: string;
          created_at: string;
          district: number | null;
          email: string | null;
          first_name: string;
          general_links: Json;
          id: string;
          in_office: boolean;
          last_name: string;
          official_full_name: string | null;
          party: string;
          pronouns: string | null;
          state: string;
          state_rank: string | null;
          updated_at: string;
        };
        Insert: {
          bioguide_id: string;
          birthday?: string | null;
          chamber: string;
          created_at?: string;
          district?: number | null;
          email?: string | null;
          first_name: string;
          general_links?: Json;
          id?: string;
          in_office?: boolean;
          last_name: string;
          official_full_name?: string | null;
          party: string;
          pronouns?: string | null;
          state: string;
          state_rank?: string | null;
          updated_at?: string;
        };
        Update: {
          bioguide_id?: string;
          birthday?: string | null;
          chamber?: string;
          created_at?: string;
          district?: number | null;
          email?: string | null;
          first_name?: string;
          general_links?: Json;
          id?: string;
          in_office?: boolean;
          last_name?: string;
          official_full_name?: string | null;
          party?: string;
          pronouns?: string | null;
          state?: string;
          state_rank?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      staffers: {
        Row: {
          created_at: string;
          email: string | null;
          first_name: string;
          id: string;
          last_name: string;
          location: string | null;
          notes: string | null;
          org_id: string;
          phone: string | null;
          pronouns: string | null;
          representative_id: string;
          title: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          first_name: string;
          id?: string;
          last_name: string;
          location?: string | null;
          notes?: string | null;
          org_id: string;
          phone?: string | null;
          pronouns?: string | null;
          representative_id: string;
          title?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          first_name?: string;
          id?: string;
          last_name?: string;
          location?: string | null;
          notes?: string | null;
          org_id?: string;
          phone?: string | null;
          pronouns?: string | null;
          representative_id?: string;
          title?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "staffers_representative_id_fkey";
            columns: ["representative_id"];
            isOneToOne: false;
            referencedRelation: "representatives";
            referencedColumns: ["id"];
          },
        ];
      };
      team_memberships: {
        Row: {
          created_at: string;
          org_id: string;
          role: string;
          team_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          org_id: string;
          role: string;
          team_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          org_id?: string;
          role?: string;
          team_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_memberships_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_memberships_user_id_profiles_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      teams: {
        Row: {
          congressional_districts: string[];
          created_at: string;
          description: string | null;
          founded_date: string | null;
          id: string;
          name: string;
          org_id: string;
          slug: string;
          state: string | null;
          type: string;
          updated_at: string;
        };
        Insert: {
          congressional_districts?: string[];
          created_at?: string;
          description?: string | null;
          founded_date?: string | null;
          id?: string;
          name: string;
          org_id: string;
          slug: string;
          state?: string | null;
          type: string;
          updated_at?: string;
        };
        Update: {
          congressional_districts?: string[];
          created_at?: string;
          description?: string | null;
          founded_date?: string | null;
          id?: string;
          name?: string;
          org_id?: string;
          slug?: string;
          state?: string | null;
          type?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_role: {
        Row: {
          org_id: string | null;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          org_id?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          org_id?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      change_member_role: {
        Args: {
          p_new_role: string;
          p_old_role: string;
          p_team_id: string;
          p_user_id: string;
        };
        Returns: undefined;
      };
      change_user_role: {
        Args: {
          p_new_role: Database["public"]["Enums"]["app_role"];
          p_user_id: string;
        };
        Returns: undefined;
      };
      delete_own_account: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      is_in_org: { Args: { target_org_id: string }; Returns: boolean };
      is_org_admin_for: { Args: { target_org_id: string }; Returns: boolean };
      is_super_admin: { Args: never; Returns: boolean };
    };
    Enums: {
      app_role: "member" | "org_admin" | "super_admin" | "facilitator";
      delegation_role:
        | "meeting_facilitator"
        | "note_taker"
        | "storyteller"
        | "photographer"
        | "scheduling_lead"
        | "expert"
        | "attendee";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["member", "org_admin", "super_admin", "facilitator"],
      delegation_role: [
        "meeting_facilitator",
        "note_taker",
        "storyteller",
        "photographer",
        "scheduling_lead",
        "expert",
        "attendee",
      ],
    },
  },
} as const;
