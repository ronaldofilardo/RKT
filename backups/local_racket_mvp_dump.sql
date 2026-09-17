--
-- PostgreSQL database dump
--

\restrict 7zywTuHJKQaCzPu0M9Y6uULfhwq3xfUxobvlQ1Cr31oYswVsT3Wc2YPdiLqEJfO

-- Dumped from database version 17.11
-- Dumped by pg_dump version 17.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: AnnotationSessionStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AnnotationSessionStatus" AS ENUM (
    'IN_PROGRESS',
    'COMPLETED',
    'ABANDONED'
);


--
-- Name: MatchFinishReason; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MatchFinishReason" AS ENUM (
    'COMPLETED',
    'ABANDONED',
    'WALKOVER',
    'INJURY',
    'OUTRO'
);


--
-- Name: MatchFormat; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MatchFormat" AS ENUM (
    'BEST_OF_3',
    'BEST_OF_3_MATCH_TB',
    'BEST_OF_5',
    'BEST_OF_3_NO_AD',
    'SHORT_SET_2V2_NO_AD',
    'MATCH_TB_10',
    'PRO_SET_8'
);


--
-- Name: MatchState; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MatchState" AS ENUM (
    'SCHEDULED',
    'IN_PROGRESS',
    'FINISHED',
    'CANCELLED'
);


--
-- Name: PointType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PointType" AS ENUM (
    'ACE',
    'WINNER',
    'FORCED_ERROR',
    'UNFORCED_ERROR',
    'DOUBLE_FAULT',
    'FAULT_FIRST',
    'FAULT_SECOND'
);


--
-- Name: Role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Role" AS ENUM (
    'ADMIN',
    'ANNOTATOR'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Match; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Match" (
    id text NOT NULL,
    format public."MatchFormat" NOT NULL,
    state public."MatchState" DEFAULT 'SCHEDULED'::public."MatchState" NOT NULL,
    "player1Id" text NOT NULL,
    "player2Id" text NOT NULL,
    "scoreState" jsonb,
    "initialServerId" text,
    "scheduledAt" timestamp(3) without time zone,
    "startedAt" timestamp(3) without time zone,
    "finishedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "sportType" text DEFAULT 'TENNIS'::text NOT NULL,
    "courtType" text,
    nickname text,
    visibility text DEFAULT 'PUBLIC'::text NOT NULL,
    "isResuming" boolean DEFAULT false NOT NULL,
    "openForAnnotation" boolean DEFAULT false NOT NULL,
    "tournamentName" text,
    round text,
    "bracketType" text,
    temperature double precision,
    humidity double precision,
    version integer DEFAULT 0 NOT NULL,
    category text,
    "winnerId" text,
    "deletedAt" timestamp(3) without time zone,
    "deletedBy" text,
    "finishNote" text,
    "finishReason" public."MatchFinishReason",
    "createdByUserId" text
);


--
-- Name: Player; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Player" (
    id text NOT NULL,
    name text NOT NULL,
    email text,
    club text,
    age integer,
    backhand text,
    dominance text,
    gender text,
    ranking integer,
    rankings jsonb,
    "birthDate" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdByUserId" text
);


--
-- Name: PointLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PointLog" (
    id text NOT NULL,
    "matchId" text NOT NULL,
    "winnerId" text NOT NULL,
    type public."PointType" NOT NULL,
    "serverId" text NOT NULL,
    annotations jsonb,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "audioNote" bytea,
    "audioNoteMime" text,
    "audioNoteDuration" integer,
    "sequenceNumber" integer,
    "clientEventId" text,
    "voidedAt" timestamp(3) without time zone
);


--
-- Name: annotation_endorsements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.annotation_endorsements (
    id text NOT NULL,
    "sessionId" text NOT NULL,
    "endorsedByUserId" text NOT NULL,
    "endorsedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: match_annotation_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.match_annotation_sessions (
    id text NOT NULL,
    "matchId" text NOT NULL,
    "annotatorUserId" text NOT NULL,
    "startedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "endedAt" timestamp(3) without time zone,
    "matchStateSnapshot" text,
    "finalStateSnapshot" text,
    "isActive" boolean DEFAULT true NOT NULL,
    status public."AnnotationSessionStatus" DEFAULT 'IN_PROGRESS'::public."AnnotationSessionStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: match_score_edits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.match_score_edits (
    id text NOT NULL,
    "matchId" text NOT NULL,
    "editedByUserId" text,
    "editedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "previousScoreState" jsonb NOT NULL,
    "newScoreState" jsonb NOT NULL,
    note text
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    cpf text NOT NULL,
    "passwordHash" text NOT NULL,
    role public."Role" DEFAULT 'ANNOTATOR'::public."Role" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    club text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Data for Name: Match; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Match" (id, format, state, "player1Id", "player2Id", "scoreState", "initialServerId", "scheduledAt", "startedAt", "finishedAt", "createdAt", "updatedAt", "sportType", "courtType", nickname, visibility, "isResuming", "openForAnnotation", "tournamentName", round, "bracketType", temperature, humidity, version, category, "winnerId", "deletedAt", "deletedBy", "finishNote", "finishReason", "createdByUserId") FROM stdin;
cmtyiva2i000210t43n1z2i7l	BEST_OF_3	IN_PROGRESS	seed_player_alcaraz	seed_player_sinner	{"state": {"sets": [{"player1": 0, "player2": 0, "isTiebreak": false, "tiebreakScore": null}], "server": "player1", "winner": null, "setsWon": {"player1": 0, "player2": 0}, "startedAt": 1789226527692, "isFinished": false, "currentGame": {"isDeuce": false, "player1": 2, "player2": 2, "advantage": null, "secondServe": false}, "secondServe": false}, "history": [{"point": {"type": "WINNER", "isLet": false, "serverId": "seed_player_alcaraz", "winnerId": "seed_player_sinner", "timestamp": 1789226582924, "rallyLength": 2, "isFirstServe": true, "rallyDetails": {"tipo": "winner", "golpe": "fh", "efeito": "topspin", "direcao": "cruzada", "situacao": "devolucao", "vencedor": "devolvedor", "golpe_esp": "lob", "previewBalls": 2}, "isSecondServe": false, "firstFaultDetail": null}, "stateBefore": {"sets": [{"player1": 0, "player2": 0, "isTiebreak": false, "tiebreakScore": null}], "server": "player1", "winner": null, "setsWon": {"player1": 0, "player2": 0}, "startedAt": 1789226527692, "isFinished": false, "currentGame": {"isDeuce": false, "player1": 2, "player2": 1, "advantage": null, "secondServe": false}, "secondServe": false}}]}	seed_player_alcaraz	2026-09-12 15:00:00	2026-09-12 15:22:09.058	\N	2026-09-12 15:10:40.314	2026-09-12 15:23:03.069	TENNIS	CLAY	\N	PUBLIC	f	f	Open	1a rodada	\N	25	55	5	1a rodada	\N	\N	\N	\N	\N	cmtyhqoex0001zzmoyr4zesst
\.


--
-- Data for Name: Player; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Player" (id, name, email, club, age, backhand, dominance, gender, ranking, rankings, "birthDate", "createdAt", "updatedAt", "createdByUserId") FROM stdin;
seed_player_alcaraz	Carlos Alcaraz	\N	Espanha	\N	TWO_HANDED	RIGHT_HANDED	MALE	1	\N	\N	2026-09-12 14:39:06.012	2026-09-12 14:39:06.012	\N
seed_player_sinner	Jannik Sinner	\N	Itália	\N	TWO_HANDED	RIGHT_HANDED	MALE	2	\N	\N	2026-09-12 14:39:06.019	2026-09-12 14:39:06.019	\N
cmtyjckam000h10t4zoj152v6	Ronaldo	\N	\N	52	ONE_HANDED	RIGHT	MALE	\N	{"ITF": {"category": "50-54", "position": 159}, "ESTADUAL": {"class": "5ªMC", "category": "50-54", "position": 11}}	1974-10-24 00:00:00	2026-09-12 15:24:06.715	2026-09-12 15:24:06.715	cmtyhqoex0001zzmoyr4zesst
\.


--
-- Data for Name: PointLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PointLog" (id, "matchId", "winnerId", type, "serverId", annotations, "timestamp", "audioNote", "audioNoteMime", "audioNoteDuration", "sequenceNumber", "clientEventId", "voidedAt") FROM stdin;
cmtyjabl2000910t4gmelsxxu	cmtyiva2i000210t43n1z2i7l	seed_player_sinner	DOUBLE_FAULT	seed_player_alcaraz	{"rallyLength": 1, "isFirstServe": false, "rallyDetails": {"tipo": "dupla_falta", "golpe": "saque", "direcao": "fechado", "situacao": "saque", "subtipo2": "out", "vencedor": "devolvedor", "previewBalls": 1}, "isSecondServe": true, "firstFaultDetail": {"errorType": "out"}}	2026-09-12 15:22:22.118	\N	\N	\N	1	9264596e-9404-4f61-9aa2-f43dd5534289	\N
cmtyjaqks000c10t4q6uz3doh	cmtyiva2i000210t43n1z2i7l	seed_player_alcaraz	FORCED_ERROR	seed_player_alcaraz	{"note": "hhd bfhdfhdfhfdfhd", "rallyLength": 1, "isFirstServe": true, "rallyDetails": {"note": "hhd bfhdfhdfhfdfhd", "tipo": "erro_forcado", "golpe": "bh", "efeito": "slice", "direcao": "paralela", "duracao": "opcao_2", "situacao": "fundo", "vencedor": "sacador", "golpe_esp": "drop_shot", "previewBalls": 1}, "isSecondServe": false}	2026-09-12 15:22:41.548	\N	\N	\N	2	de58eea8-76a5-4b5e-aee3-8da6103586e4	\N
cmtyjb76v000f10t4bftac2xa	cmtyiva2i000210t43n1z2i7l	seed_player_sinner	WINNER	seed_player_alcaraz	{"rallyLength": 2, "isFirstServe": true, "rallyDetails": {"tipo": "winner", "golpe": "fh", "efeito": "topspin", "direcao": "cruzada", "situacao": "devolucao", "vencedor": "devolvedor", "golpe_esp": "lob", "previewBalls": 2}, "isSecondServe": false}	2026-09-12 15:23:03.079	\N	\N	\N	3	c9b1c5c6-3869-426a-8b7b-ec24f88adebe	\N
\.


--
-- Data for Name: annotation_endorsements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.annotation_endorsements (id, "sessionId", "endorsedByUserId", "endorsedAt") FROM stdin;
\.


--
-- Data for Name: match_annotation_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.match_annotation_sessions (id, "matchId", "annotatorUserId", "startedAt", "endedAt", "matchStateSnapshot", "finalStateSnapshot", "isActive", status, "createdAt") FROM stdin;
\.


--
-- Data for Name: match_score_edits; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.match_score_edits (id, "matchId", "editedByUserId", "editedAt", "previousScoreState", "newScoreState", note) FROM stdin;
cmtyja1h3000610t4jeujm1ky	cmtyiva2i000210t43n1z2i7l	cmtyhqoex0001zzmoyr4zesst	2026-09-12 15:22:09.011	null	{"state": {"sets": [{"player1": 0, "player2": 0, "isTiebreak": false, "tiebreakScore": null}], "server": "player1", "winner": null, "setsWon": {"player1": 0, "player2": 0}, "startedAt": 1789226527692, "isFinished": false, "currentGame": {"isDeuce": false, "player1": 1, "player2": 0, "advantage": null, "secondServe": false}, "secondServe": false}, "history": []}	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, cpf, "passwordHash", role, "isActive", club, "createdAt", "updatedAt") FROM stdin;
cmtyhqodo0000zzmozwvc03qs	Administrador do Sistema	admin@rkt.com	87545772920	$2a$10$8ZAx4gK9tZ1c.vEb7/0ojO.H5YZlV9CBE7nwasobK0FZESI5nkeI2	ADMIN	t	Administração Geral	2026-09-12 14:39:05.964	2026-09-12 15:04:48.738
cmtyhqoex0001zzmoyr4zesst	Anotador Oficial	anotador@rkt.com	04703084945	$2a$10$8ZAx4gK9tZ1c.vEb7/0ojO.H5YZlV9CBE7nwasobK0FZESI5nkeI2	ANNOTATOR	t	Clube Central	2026-09-12 14:39:06.009	2026-09-12 15:04:48.785
\.


--
-- Name: Match Match_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Match"
    ADD CONSTRAINT "Match_pkey" PRIMARY KEY (id);


--
-- Name: Player Player_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Player"
    ADD CONSTRAINT "Player_pkey" PRIMARY KEY (id);


--
-- Name: PointLog PointLog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PointLog"
    ADD CONSTRAINT "PointLog_pkey" PRIMARY KEY (id);


--
-- Name: annotation_endorsements annotation_endorsements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.annotation_endorsements
    ADD CONSTRAINT annotation_endorsements_pkey PRIMARY KEY (id);


--
-- Name: match_annotation_sessions match_annotation_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_annotation_sessions
    ADD CONSTRAINT match_annotation_sessions_pkey PRIMARY KEY (id);


--
-- Name: match_score_edits match_score_edits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_score_edits
    ADD CONSTRAINT match_score_edits_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: Match_deletedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Match_deletedAt_idx" ON public."Match" USING btree ("deletedAt");


--
-- Name: Match_state_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Match_state_idx" ON public."Match" USING btree (state);


--
-- Name: PointLog_matchId_clientEventId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "PointLog_matchId_clientEventId_key" ON public."PointLog" USING btree ("matchId", "clientEventId");


--
-- Name: PointLog_matchId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PointLog_matchId_idx" ON public."PointLog" USING btree ("matchId");


--
-- Name: PointLog_matchId_sequenceNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "PointLog_matchId_sequenceNumber_key" ON public."PointLog" USING btree ("matchId", "sequenceNumber");


--
-- Name: PointLog_matchId_voidedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PointLog_matchId_voidedAt_idx" ON public."PointLog" USING btree ("matchId", "voidedAt");


--
-- Name: annotation_endorsements_sessionId_endorsedByUserId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "annotation_endorsements_sessionId_endorsedByUserId_key" ON public.annotation_endorsements USING btree ("sessionId", "endorsedByUserId");


--
-- Name: match_annotation_sessions_annotatorUserId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "match_annotation_sessions_annotatorUserId_idx" ON public.match_annotation_sessions USING btree ("annotatorUserId");


--
-- Name: match_annotation_sessions_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "match_annotation_sessions_isActive_idx" ON public.match_annotation_sessions USING btree ("isActive");


--
-- Name: match_annotation_sessions_matchId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "match_annotation_sessions_matchId_idx" ON public.match_annotation_sessions USING btree ("matchId");


--
-- Name: match_score_edits_matchId_editedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "match_score_edits_matchId_editedAt_idx" ON public.match_score_edits USING btree ("matchId", "editedAt");


--
-- Name: match_score_edits_matchId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "match_score_edits_matchId_idx" ON public.match_score_edits USING btree ("matchId");


--
-- Name: users_cpf_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_cpf_key ON public.users USING btree (cpf);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: Match Match_createdByUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Match"
    ADD CONSTRAINT "Match_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Match Match_player1Id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Match"
    ADD CONSTRAINT "Match_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Match Match_player2Id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Match"
    ADD CONSTRAINT "Match_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Player Player_createdByUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Player"
    ADD CONSTRAINT "Player_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PointLog PointLog_matchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PointLog"
    ADD CONSTRAINT "PointLog_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES public."Match"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: annotation_endorsements annotation_endorsements_endorsedByUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.annotation_endorsements
    ADD CONSTRAINT "annotation_endorsements_endorsedByUserId_fkey" FOREIGN KEY ("endorsedByUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: annotation_endorsements annotation_endorsements_sessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.annotation_endorsements
    ADD CONSTRAINT "annotation_endorsements_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public.match_annotation_sessions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: match_annotation_sessions match_annotation_sessions_annotatorUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_annotation_sessions
    ADD CONSTRAINT "match_annotation_sessions_annotatorUserId_fkey" FOREIGN KEY ("annotatorUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: match_annotation_sessions match_annotation_sessions_matchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_annotation_sessions
    ADD CONSTRAINT "match_annotation_sessions_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES public."Match"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: match_score_edits match_score_edits_editedByUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_score_edits
    ADD CONSTRAINT "match_score_edits_editedByUserId_fkey" FOREIGN KEY ("editedByUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: match_score_edits match_score_edits_matchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_score_edits
    ADD CONSTRAINT "match_score_edits_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES public."Match"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 7zywTuHJKQaCzPu0M9Y6uULfhwq3xfUxobvlQ1Cr31oYswVsT3Wc2YPdiLqEJfO

