




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


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."credit_event_type" AS ENUM (
    'purchase',
    'usage',
    'adjustment'
);


-- ALTER TYPE "public"."credit_event_type" OWNER TO "postgres";


CREATE TYPE "public"."session_event_type" AS ENUM (
    'session_start',
    'session_end',
    'session_auto_end',
    'credit_add',
    'credit_use',
    'client_update'
);


-- ALTER TYPE "public"."session_event_type" OWNER TO "postgres";


CREATE TYPE "public"."session_status" AS ENUM (
    'active',
    'ended',
    'auto_ended'
);


-- ALTER TYPE "public"."session_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'clinic_admin',
    'clinic_staff',
    'client'
);


-- ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auth_uid"() RETURNS "uuid"
    LANGUAGE "sql" STABLE
    AS $$
  select auth.uid();
$$;


-- ALTER FUNCTION "public"."auth_uid"() OWNER TO "supabase_admin";


CREATE OR REPLACE FUNCTION "public"."current_clinic_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE
    AS $$
  select clinic_id
  from profiles
  where id = auth.uid();
$$;


-- ALTER FUNCTION "public"."current_clinic_id"() OWNER TO "supabase_admin";


CREATE OR REPLACE FUNCTION "public"."handle_new_clinic_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  new_clinic_id uuid;
  clinic_name text;
begin
  clinic_name := coalesce(
    new.raw_user_meta_data->>'clinic_name',
    'Clinic ' || left(new.id::text, 8)
  );

  -- create clinic
  insert into clinics (id, name)
  values (gen_random_uuid(), clinic_name)
  returning id into new_clinic_id;

  -- create profile
  insert into profiles (id, role, clinic_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'clinic_admin'),
    new_clinic_id
  );

  return new;
exception
  when others then
    raise exception 'Signup trigger failed: %', sqlerrm;
end;
$$;


-- ALTER FUNCTION "public"."handle_new_clinic_user"() OWNER TO "supabase_admin";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.profiles (id, role, clinic_id)
  values (new.id, 'clinic_admin'::user_role, null)
  on conflict (id) do nothing;

  return new;
end;
$$;


-- ALTER FUNCTION "public"."handle_new_user"() OWNER TO "supabase_admin";


CREATE OR REPLACE FUNCTION "public"."increment_client_credits"("client_id_input" "uuid", "amount_input" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE client_credits
  SET
    remaining_sessions = GREATEST(0, remaining_sessions + amount_input),
    total_sessions =
      CASE
        WHEN amount_input > 0
          THEN total_sessions + amount_input
        ELSE total_sessions
      END
  WHERE client_id = client_id_input;
END;
$$;


-- ALTER FUNCTION "public"."increment_client_credits"("client_id_input" "uuid", "amount_input" integer) OWNER TO "supabase_admin";


CREATE OR REPLACE FUNCTION "public"."is_client"() RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select role = 'client'
  from profiles
  where id = auth.uid();
$$;


-- ALTER FUNCTION "public"."is_client"() OWNER TO "supabase_admin";


CREATE OR REPLACE FUNCTION "public"."is_clinic_user"() RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select role in ('clinic_admin', 'clinic_staff')
  from profiles
  where id = auth.uid();
$$;


-- ALTER FUNCTION "public"."is_clinic_user"() OWNER TO "supabase_admin";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."chairs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid",
    "name" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "shelly_url" "text",
    "shelly_relay" integer DEFAULT 0,
    "mqtt_topic" "text",
    "device_id" "text",
    "auto_power_off_seconds" integer DEFAULT 1680,
    "topic_prefix" "text"
);


-- ALTER TABLE "public"."chairs" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "public"."client_credits" (
    "client_id" "uuid" NOT NULL,
    "remaining_sessions" integer DEFAULT 0 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "total_sessions" integer DEFAULT 0 NOT NULL
);


-- ALTER TABLE "public"."client_credits" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "public"."client_locations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "label" "text",
    "address" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


-- ALTER TABLE "public"."client_locations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "auth_user_id" "uuid",
    "username" "text",
    "location" "text",
    "qr_token" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


-- ALTER TABLE "public"."clients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clinics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


-- ALTER TABLE "public"."clinics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credit_ledger" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "delta" integer NOT NULL,
    "event_type" "public"."credit_event_type" NOT NULL,
    "note" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


-- ALTER TABLE "public"."credit_ledger" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "clinic_id" "uuid",
    "role" "public"."user_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


-- ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."qr_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "token_hash" "text" NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "rotated_at" timestamp with time zone
);


-- ALTER TABLE "public"."qr_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."session_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid",
    "client_id" "uuid" NOT NULL,
    "event_type" "public"."session_event_type" NOT NULL,
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


-- ALTER TABLE "public"."session_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "started_at" timestamp with time zone NOT NULL,
    "auto_end_at" timestamp with time zone NOT NULL,
    "ended_at" timestamp with time zone,
    "status" "public"."session_status" NOT NULL,
    "ended_reason" "text",
    "chair_id" "uuid"
);


-- ALTER TABLE "public"."sessions" OWNER TO "postgres";


ALTER TABLE ONLY "public"."chairs"
    ADD CONSTRAINT "chairs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_credits"
    ADD CONSTRAINT "client_credits_pkey" PRIMARY KEY ("client_id");



ALTER TABLE ONLY "public"."client_locations"
    ADD CONSTRAINT "client_locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_auth_user_id_key" UNIQUE ("auth_user_id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clinics"
    ADD CONSTRAINT "clinics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_ledger"
    ADD CONSTRAINT "credit_ledger_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."qr_tokens"
    ADD CONSTRAINT "qr_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."session_events"
    ADD CONSTRAINT "session_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "clients_qr_token_key" ON "public"."clients" USING "btree" ("qr_token");



CREATE INDEX "idx_sessions_auto_end" ON "public"."sessions" USING "btree" ("auto_end_at") WHERE ("ended_at" IS NULL);



ALTER TABLE ONLY "public"."chairs"
    ADD CONSTRAINT "chairs_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_credits"
    ADD CONSTRAINT "client_credits_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_locations"
    ADD CONSTRAINT "client_locations_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_ledger"
    ADD CONSTRAINT "credit_ledger_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_ledger"
    ADD CONSTRAINT "credit_ledger_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."qr_tokens"
    ADD CONSTRAINT "qr_tokens_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session_events"
    ADD CONSTRAINT "session_events_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session_events"
    ADD CONSTRAINT "session_events_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_chair_id_fkey" FOREIGN KEY ("chair_id") REFERENCES "public"."chairs"("id");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



CREATE POLICY "Users can read their own profile" ON "public"."profiles" FOR SELECT USING (("id" = "auth"."uid"()));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("id" = "auth"."uid"()));



ALTER TABLE "public"."client_locations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "client_read_credits" ON "public"."credit_ledger" FOR SELECT USING (("client_id" IN ( SELECT "clients"."id"
   FROM "public"."clients"
  WHERE ("clients"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "client_read_self" ON "public"."clients" FOR SELECT USING ((("auth_user_id" = "auth"."uid"()) AND "public"."is_client"()));



CREATE POLICY "client_read_sessions" ON "public"."sessions" FOR SELECT USING (("client_id" IN ( SELECT "clients"."id"
   FROM "public"."clients"
  WHERE ("clients"."auth_user_id" = "auth"."uid"()))));



ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "clinic_manage_clients" ON "public"."clients" USING ((("clinic_id" = "public"."current_clinic_id"()) AND "public"."is_clinic_user"())) WITH CHECK (("clinic_id" = "public"."current_clinic_id"()));



CREATE POLICY "clinic_read_own" ON "public"."clinics" FOR SELECT USING (("id" = "public"."current_clinic_id"()));



ALTER TABLE "public"."clinics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_ledger" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profile_read_clinic" ON "public"."profiles" FOR SELECT USING ((("clinic_id" = "public"."current_clinic_id"()) AND "public"."is_clinic_user"()));



CREATE POLICY "profile_read_self" ON "public"."profiles" FOR SELECT USING (("id" = "public"."auth_uid"()));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."qr_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."session_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sessions" ENABLE ROW LEVEL SECURITY;




-- ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";































































































































































GRANT ALL ON FUNCTION "public"."auth_uid"() TO "postgres";
GRANT ALL ON FUNCTION "public"."auth_uid"() TO "anon";
GRANT ALL ON FUNCTION "public"."auth_uid"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auth_uid"() TO "service_role";



GRANT ALL ON FUNCTION "public"."current_clinic_id"() TO "postgres";
GRANT ALL ON FUNCTION "public"."current_clinic_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_clinic_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_clinic_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_clinic_user"() TO "postgres";
GRANT ALL ON FUNCTION "public"."handle_new_clinic_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_clinic_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_clinic_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "postgres";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_client_credits"("client_id_input" "uuid", "amount_input" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."increment_client_credits"("client_id_input" "uuid", "amount_input" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."increment_client_credits"("client_id_input" "uuid", "amount_input" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_client_credits"("client_id_input" "uuid", "amount_input" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."is_client"() TO "postgres";
GRANT ALL ON FUNCTION "public"."is_client"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_client"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_client"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_clinic_user"() TO "postgres";
GRANT ALL ON FUNCTION "public"."is_clinic_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_clinic_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_clinic_user"() TO "service_role";


















GRANT ALL ON TABLE "public"."chairs" TO "postgres";
GRANT ALL ON TABLE "public"."chairs" TO "anon";
GRANT ALL ON TABLE "public"."chairs" TO "authenticated";
GRANT ALL ON TABLE "public"."chairs" TO "service_role";



GRANT ALL ON TABLE "public"."client_credits" TO "postgres";
GRANT ALL ON TABLE "public"."client_credits" TO "anon";
GRANT ALL ON TABLE "public"."client_credits" TO "authenticated";
GRANT ALL ON TABLE "public"."client_credits" TO "service_role";



GRANT ALL ON TABLE "public"."client_locations" TO "anon";
GRANT ALL ON TABLE "public"."client_locations" TO "authenticated";
GRANT ALL ON TABLE "public"."client_locations" TO "service_role";



GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";



GRANT ALL ON TABLE "public"."clinics" TO "anon";
GRANT ALL ON TABLE "public"."clinics" TO "authenticated";
GRANT ALL ON TABLE "public"."clinics" TO "service_role";



GRANT ALL ON TABLE "public"."credit_ledger" TO "anon";
GRANT ALL ON TABLE "public"."credit_ledger" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_ledger" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."qr_tokens" TO "anon";
GRANT ALL ON TABLE "public"."qr_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."qr_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."session_events" TO "anon";
GRANT ALL ON TABLE "public"."session_events" TO "authenticated";
GRANT ALL ON TABLE "public"."session_events" TO "service_role";



GRANT ALL ON TABLE "public"."sessions" TO "anon";
GRANT ALL ON TABLE "public"."sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."sessions" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";




























































