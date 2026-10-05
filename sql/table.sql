-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.types (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text,
  icon text,
  afficher_icon boolean NOT NULL DEFAULT true,
  priority smallint,
  CONSTRAINT types_pkey PRIMARY KEY (id)
);
CREATE TABLE public.locations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type_id uuid NOT NULL,
  x smallint NOT NULL,
  y smallint NOT NULL,
  description text NOT NULL,
  images jsonb,
  visible boolean NOT NULL DEFAULT true,
  CONSTRAINT locations_pkey PRIMARY KEY (id),
  CONSTRAINT locations_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.types(id)
);
CREATE TABLE public.zones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  color text NOT NULL,
  points jsonb NOT NULL,
  visible boolean NOT NULL DEFAULT true,
  type_id uuid NOT NULL,
  CONSTRAINT zones_pkey PRIMARY KEY (id),
  CONSTRAINT zones_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.types(id)
);
CREATE TABLE public.agents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nom text,
  prenom text,
  matricule integer,
  actif boolean NOT NULL DEFAULT true,
  grade uuid,
  date_arrivee date,
  fti uuid,
  CONSTRAINT agents_pkey PRIMARY KEY (id),
  CONSTRAINT agents_grade_fkey FOREIGN KEY (grade) REFERENCES public.grades(id),
  CONSTRAINT agents_fti_fkey FOREIGN KEY (fti) REFERENCES public.agents(id)
);
CREATE TABLE public.grades (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nom text,
  priority smallint,
  CONSTRAINT grades_pkey PRIMARY KEY (id)
);
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nom text,
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.peines (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  categorie uuid NOT NULL,
  article text,
  infraction text,
  description text,
  nominal numeric,
  maximal numeric,
  unite boolean DEFAULT false,
  peine text,
  delit uuid,
  CONSTRAINT peines_pkey PRIMARY KEY (id),
  CONSTRAINT peines_delit_fkey FOREIGN KEY (delit) REFERENCES public.delits(id),
  CONSTRAINT peines_categorie_fkey FOREIGN KEY (categorie) REFERENCES public.categories(id),
);
CREATE TABLE public.delits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nom text,
  priority numeric,
  couleur text,
  CONSTRAINT delits_pkey PRIMARY KEY (id)
);
CREATE TABLE public.admin_users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pseudo character varying NOT NULL,
  auth_user_id uuid DEFAULT gen_random_uuid(),
  email text,
  CONSTRAINT admin_users_pkey PRIMARY KEY (id),
  CONSTRAINT admin_users_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id)
);




-- =========================================================
-- GRADES
-- =========================================================

CREATE TABLE public.grades (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    nom text NOT NULL,
    priority smallint,

    CONSTRAINT grades_pkey
        PRIMARY KEY (id)
);


-- =========================================================
-- DIVISIONS
-- =========================================================

CREATE TABLE public.divisions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    nom text NOT NULL,

    CONSTRAINT divisions_pkey
        PRIMARY KEY (id)
);


-- =========================================================
-- FORMATIONS
-- =========================================================

CREATE TABLE public.formations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    nom text NOT NULL,
    acronyme text NOT NULL,

    CONSTRAINT formations_pkey
        PRIMARY KEY (id)
);


-- =========================================================
-- AGENTS
-- =========================================================

CREATE TABLE public.agents (
    id uuid NOT NULL DEFAULT gen_random_uuid(),

    nom text NOT NULL,
    prenom text NOT NULL,
    matricule integer NOT NULL,

    grade uuid,
    fti uuid,

    actif boolean NOT NULL DEFAULT true,

    statut text NOT NULL DEFAULT 'En service',

    agent_formateur boolean NOT NULL DEFAULT false,

    ppa_1 boolean NOT NULL DEFAULT false,
    ppa_2 boolean NOT NULL DEFAULT false,
    ppa_3 boolean NOT NULL DEFAULT false,

    blame smallint,

    date_arrivee date,
    telephone text,
    last_promotion date,

    notes_internes text,
    iban text,

    CONSTRAINT agents_pkey
        PRIMARY KEY (id),

    CONSTRAINT agents_grade_fkey
        FOREIGN KEY (grade)
        REFERENCES public.grades(id),

    CONSTRAINT agents_fti_fkey
        FOREIGN KEY (fti)
        REFERENCES public.agents(id),

    CONSTRAINT agents_statut_check
        CHECK (
            statut IN (
                'En service',
                'En congé',
                'Suspendu',
                'Licencié',
                'Retraité',
                'Démission',
                'Archivé'
            )
        ),

    CONSTRAINT agents_blame_check
        CHECK (
            blame IS NULL
            OR blame IN (1, 2, 3)
        )
);


-- =========================================================
-- AGENT / DIVISIONS
-- =========================================================

CREATE TABLE public.agent_divisions (
    agent_id uuid NOT NULL,
    division_id uuid NOT NULL,

    CONSTRAINT agent_divisions_pkey
        PRIMARY KEY (agent_id, division_id),

    CONSTRAINT agent_divisions_agent_fkey
        FOREIGN KEY (agent_id)
        REFERENCES public.agents(id)
        ON DELETE CASCADE,

    CONSTRAINT agent_divisions_division_fkey
        FOREIGN KEY (division_id)
        REFERENCES public.divisions(id)
        ON DELETE CASCADE
);


-- =========================================================
-- AGENT / FORMATIONS
-- =========================================================

CREATE TABLE public.agent_formations (
    agent_id uuid NOT NULL,
    formation_id uuid NOT NULL,

    CONSTRAINT agent_formations_pkey
        PRIMARY KEY (agent_id, formation_id),

    CONSTRAINT agent_formations_agent_fkey
        FOREIGN KEY (agent_id)
        REFERENCES public.agents(id)
        ON DELETE CASCADE,

    CONSTRAINT agent_formations_formation_fkey
        FOREIGN KEY (formation_id)
        REFERENCES public.formations(id)
        ON DELETE CASCADE
);


-- =========================================================
-- ARMEMENTS
-- =========================================================

CREATE TABLE public.armements (
    id uuid NOT NULL DEFAULT gen_random_uuid(),

    agent_id uuid NOT NULL,

    nom text NOT NULL,
    numero_serie text NOT NULL,

    CONSTRAINT armements_pkey
        PRIMARY KEY (id),

    CONSTRAINT armements_agent_fkey
        FOREIGN KEY (agent_id)
        REFERENCES public.agents(id)
        ON DELETE CASCADE
);


-- =========================================================
-- POINTEUSE
-- =========================================================

CREATE TABLE public.pointages (
    id uuid NOT NULL DEFAULT gen_random_uuid(),

    agent_id uuid NOT NULL,

    debut timestamptz NOT NULL DEFAULT now(),
    fin timestamptz,

    CONSTRAINT pointages_pkey
        PRIMARY KEY (id),

    CONSTRAINT pointages_agent_fkey
        FOREIGN KEY (agent_id)
        REFERENCES public.agents(id)
        ON DELETE CASCADE,

    CONSTRAINT pointages_dates_check
        CHECK (
            fin IS NULL
            OR fin >= debut
        )
);