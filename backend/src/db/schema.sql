SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE EXTENSION IF NOT EXISTS "pgsodium";
CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";

ALTER SCHEMA "public" OWNER TO "postgres";

COMMENT ON SCHEMA "public" IS 'standard public schema';

CREATE OR REPLACE FUNCTION "public"."check_rls_status"() RETURNS TABLE("table_name" "text", "rls_enabled" boolean)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT tablename::text, rowsecurity
  FROM pg_tables
  WHERE schemaname = 'public';
END;
$$;

ALTER FUNCTION "public"."check_rls_status"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_auth_role"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN current_setting('request.jwt.claim.role', true);
END;
$$;

ALTER FUNCTION "public"."get_auth_role"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Insert the new user's ID and email into the public users table
  -- Use ON CONFLICT DO NOTHING to safely handle potential duplicate calls or race conditions.
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."is_service_role"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN current_setting('request.jwt.claim.role', true) = 'service_role';
END;
$$;

ALTER FUNCTION "public"."is_service_role"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."service_role_bypass_rls"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- If the role is service_role, bypass RLS
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN true;
  END IF;

  -- Otherwise, return false (let other policies handle access)
  RETURN false;
END;
$$;

ALTER FUNCTION "public"."service_role_bypass_rls"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW(); -- Set updated_at to the current time
  RETURN NEW;             -- Return the modified row
END;
$$;

ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';
SET default_table_access_method = "heap";

CREATE TABLE IF NOT EXISTS "public"."grants" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "opportunity_id" "text" NOT NULL,
    "opportunity_number" "text",
    "title" "text" NOT NULL,
    "description_short" "text",
    "description_full" "text",
    "keywords" "text"[],
    "category" "text",
    "agency_name" "text",
    "agency_subdivision" "text",
    "agency_code" "text",
    "source_url" "text",
    "data_source" "text",
    "status" "text",
    "post_date" timestamp with time zone,
    "close_date" timestamp with time zone,
    "loi_due_date" timestamp with time zone,
    "expiration_date" timestamp with time zone,
    "earliest_start_date" timestamp with time zone,
    "total_funding" bigint,
    "award_ceiling" bigint,
    "award_floor" bigint,
    "expected_award_count" integer,
    "project_period_max_years" integer,
    "cost_sharing" boolean DEFAULT false,
    "eligible_applicants" "text"[],
    "eligibility_pi" "text",
    "grant_type" "text",
    "activity_code" "text",
    "activity_category" "text"[],
    "announcement_type" "text",
    "clinical_trial_allowed" boolean,
    "grantor_contact_name" "text",
    "grantor_contact_role" "text",
    "grantor_contact_email" "text",
    "grantor_contact_phone" "text",
    "grantor_contact_affiliation" "text",
    "additional_notes" "text",
    "embeddings" "public"."vector"(768),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."grants" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."pipeline_runs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "status" "text" NOT NULL,
    "details" "jsonb",
    "timestamp" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "pipeline_runs_status_check" CHECK (("status" = ANY (ARRAY['started'::"text", 'completed'::"text", 'failed'::"text"])))
);

ALTER TABLE "public"."pipeline_runs" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."user_interactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "grant_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "notes" "text",
    "timestamp" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_interactions_action_check" CHECK (("action" = ANY (ARRAY['saved'::"text", 'applied'::"text", 'ignored'::"text"])))
);

ALTER TABLE ONLY "public"."user_interactions" FORCE ROW LEVEL SECURITY;

ALTER TABLE "public"."user_interactions" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."user_preferences" (
    "user_id" "uuid" NOT NULL,
    "topics" "text"[],
    "funding_min" integer,
    "funding_max" integer,
    "deadline_range" "text" DEFAULT '0'::"text",
    "eligible_applicant_types" "text"[],
    "agencies" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE ONLY "public"."user_preferences" FORCE ROW LEVEL SECURITY;

ALTER TABLE "public"."user_preferences" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE ONLY "public"."users" FORCE ROW LEVEL SECURITY;

ALTER TABLE "public"."users" OWNER TO "postgres";

ALTER TABLE ONLY "public"."grants"
    ADD CONSTRAINT "grants_opportunity_id_key" UNIQUE ("opportunity_id");

ALTER TABLE ONLY "public"."grants"
    ADD CONSTRAINT "grants_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."pipeline_runs"
    ADD CONSTRAINT "pipeline_runs_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."user_interactions"
    ADD CONSTRAINT "user_interactions_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."user_interactions"
    ADD CONSTRAINT "user_interactions_user_id_grant_id_key" UNIQUE ("user_id", "grant_id");

ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("user_id");

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_unique_constraint" UNIQUE ("email");

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

CREATE INDEX "grants_activity_category_idx" ON "public"."grants" USING "gin" ("activity_category");
CREATE INDEX "grants_agency_name_idx" ON "public"."grants" USING "btree" ("agency_name");
CREATE INDEX "grants_agency_subdivision_idx" ON "public"."grants" USING "btree" ("agency_subdivision");
CREATE INDEX "grants_category_idx" ON "public"."grants" USING "btree" ("category");
CREATE INDEX "grants_close_date_idx" ON "public"."grants" USING "btree" ("close_date");
CREATE INDEX "grants_eligible_applicants_idx" ON "public"."grants" USING "gin" ("eligible_applicants");
CREATE INDEX "grants_embeddings_idx" ON "public"."grants" USING "ivfflat" ("embeddings" "public"."vector_cosine_ops") WITH ("lists"='100');
CREATE INDEX "grants_grant_type_idx" ON "public"."grants" USING "btree" ("grant_type");
CREATE INDEX "grants_keywords_idx" ON "public"."grants" USING "gin" ("keywords");
CREATE INDEX "grants_opportunity_id_idx" ON "public"."grants" USING "btree" ("opportunity_id");
CREATE INDEX "grants_post_date_idx" ON "public"."grants" USING "btree" ("post_date");
CREATE INDEX "grants_status_idx" ON "public"."grants" USING "btree" ("status");
CREATE INDEX "user_interactions_action_idx" ON "public"."user_interactions" USING "btree" ("action");
CREATE INDEX "user_interactions_grant_id_idx" ON "public"."user_interactions" USING "btree" ("grant_id");
CREATE INDEX "user_interactions_user_id_idx" ON "public"."user_interactions" USING "btree" ("user_id");

CREATE OR REPLACE TRIGGER "update_grants_updated_at" BEFORE UPDATE ON "public"."grants" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
CREATE OR REPLACE TRIGGER "update_user_preferences_updated_at" BEFORE UPDATE ON "public"."user_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

ALTER TABLE ONLY "public"."user_interactions"
    ADD CONSTRAINT "user_interactions_grant_id_fkey" FOREIGN KEY ("grant_id") REFERENCES "public"."grants"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."user_interactions"
    ADD CONSTRAINT "user_interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");

CREATE POLICY "Allow public users to create their own interactions" ON "public"."user_interactions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));
CREATE POLICY "Allow public users to delete their own interactions" ON "public"."user_interactions" FOR DELETE USING (("auth"."uid"() = "user_id"));
CREATE POLICY "Allow public users to read their own interactions" ON "public"."user_interactions" FOR SELECT USING (("auth"."uid"() = "user_id"));
CREATE POLICY "Allow public users to update their own interactions" ON "public"."user_interactions" FOR UPDATE USING (("auth"."uid"() = "user_id"));

ALTER TABLE "public"."grants" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "grants_select_policy" ON "public"."grants" FOR SELECT USING (true);
CREATE POLICY "grants_service_role_bypass" ON "public"."grants" TO "service_role" USING ("public"."service_role_bypass_rls"()) WITH CHECK ("public"."service_role_bypass_rls"());

ALTER TABLE "public"."pipeline_runs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pipeline_runs_admin_only" ON "public"."pipeline_runs" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));
CREATE POLICY "pipeline_runs_service_role_bypass" ON "public"."pipeline_runs" USING ("public"."service_role_bypass_rls"()) WITH CHECK ("public"."service_role_bypass_rls"());

ALTER TABLE "public"."user_interactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_preferences" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_preferences_delete_self" ON "public"."user_preferences" FOR DELETE USING (("auth"."uid"() = "user_id"));
CREATE POLICY "user_preferences_insert_self" ON "public"."user_preferences" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));
CREATE POLICY "user_preferences_select_self" ON "public"."user_preferences" FOR SELECT USING (("auth"."uid"() = "user_id"));
CREATE POLICY "user_preferences_service_role_bypass" ON "public"."user_preferences" USING ("public"."service_role_bypass_rls"()) WITH CHECK ("public"."service_role_bypass_rls"());
CREATE POLICY "user_preferences_update_self" ON "public"."user_preferences" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));

ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_allow_trigger_insert" ON "public"."users" FOR INSERT WITH CHECK (true);
CREATE POLICY "users_select_self" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));
CREATE POLICY "users_service_role_bypass" ON "public"."users" USING ("public"."service_role_bypass_rls"()) WITH CHECK ("public"."service_role_bypass_rls"());
CREATE POLICY "users_update_self" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));

ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";

REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT ALL ON SCHEMA "public" TO PUBLIC;
GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT ALL ON FUNCTION "public"."check_rls_status"() TO "service_role";
GRANT ALL ON FUNCTION "public"."get_auth_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_auth_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_auth_role"() TO "service_role";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";
GRANT ALL ON FUNCTION "public"."is_service_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_service_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_service_role"() TO "service_role";
GRANT ALL ON FUNCTION "public"."service_role_bypass_rls"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."service_role_bypass_rls"() TO "anon";
GRANT ALL ON FUNCTION "public"."service_role_bypass_rls"() TO "service_role";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";

GRANT ALL ON TABLE "public"."grants" TO "service_role";
GRANT ALL ON TABLE "public"."pipeline_runs" TO "service_role";
GRANT ALL ON TABLE "public"."user_interactions" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."user_interactions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_preferences" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."user_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";

RESET ALL;