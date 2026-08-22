--
-- PostgreSQL database dump
--

\restrict oUpz4BYvtTBhJArZ7i7ak9wyOFXJc3YtrssXFgOf8UXaKVPKlMfzYH77LlBaqub

-- Dumped from database version 17.9 (Homebrew)
-- Dumped by pg_dump version 17.9 (Homebrew)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ratings; Type: TABLE; Schema: public; Owner: tusharpal
--

CREATE TABLE public.ratings (
    id integer NOT NULL,
    user_id integer NOT NULL,
    store_id integer NOT NULL,
    rating integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ratings_value_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.ratings OWNER TO tusharpal;

--
-- Name: ratings_id_seq; Type: SEQUENCE; Schema: public; Owner: tusharpal
--

CREATE SEQUENCE public.ratings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ratings_id_seq OWNER TO tusharpal;

--
-- Name: ratings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: tusharpal
--

ALTER SEQUENCE public.ratings_id_seq OWNED BY public.ratings.id;


--
-- Name: stores; Type: TABLE; Schema: public; Owner: tusharpal
--

CREATE TABLE public.stores (
    id integer NOT NULL,
    name character varying(60) NOT NULL,
    email character varying(255) NOT NULL,
    address character varying(400),
    owner_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.stores OWNER TO tusharpal;

--
-- Name: stores_id_seq; Type: SEQUENCE; Schema: public; Owner: tusharpal
--

CREATE SEQUENCE public.stores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stores_id_seq OWNER TO tusharpal;

--
-- Name: stores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: tusharpal
--

ALTER SEQUENCE public.stores_id_seq OWNED BY public.stores.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: tusharpal
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(60) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    address character varying(400),
    role character varying(20) DEFAULT 'USER'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['ADMIN'::character varying, 'USER'::character varying, 'STORE_OWNER'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO tusharpal;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: tusharpal
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO tusharpal;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: tusharpal
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: ratings id; Type: DEFAULT; Schema: public; Owner: tusharpal
--

ALTER TABLE ONLY public.ratings ALTER COLUMN id SET DEFAULT nextval('public.ratings_id_seq'::regclass);


--
-- Name: stores id; Type: DEFAULT; Schema: public; Owner: tusharpal
--

ALTER TABLE ONLY public.stores ALTER COLUMN id SET DEFAULT nextval('public.stores_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: tusharpal
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: ratings ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: tusharpal
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_pkey PRIMARY KEY (id);


--
-- Name: ratings ratings_user_store_unique; Type: CONSTRAINT; Schema: public; Owner: tusharpal
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_user_store_unique UNIQUE (user_id, store_id);


--
-- Name: stores stores_pkey; Type: CONSTRAINT; Schema: public; Owner: tusharpal
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: tusharpal
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: tusharpal
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ratings ratings_store_fk; Type: FK CONSTRAINT; Schema: public; Owner: tusharpal
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_store_fk FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: ratings ratings_user_fk; Type: FK CONSTRAINT; Schema: public; Owner: tusharpal
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_user_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: stores stores_owner_fk; Type: FK CONSTRAINT; Schema: public; Owner: tusharpal
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_owner_fk FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict oUpz4BYvtTBhJArZ7i7ak9wyOFXJc3YtrssXFgOf8UXaKVPKlMfzYH77LlBaqub

