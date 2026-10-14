-- ============================================================================
-- CRICPLUSE TOURNAMENT MANAGEMENT PLATFORM - COMPREHENSIVE SCHEMA MIGRATION
-- Organization: TEOCO | Flagship Tournaments: DDPL & Game of RUN
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. USER PROFILES & ROLES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    employee_id TEXT,
    phone TEXT,
    batting_style TEXT DEFAULT 'Right-hand bat' CHECK (batting_style IN ('Right-hand bat', 'Left-hand bat')),
    bowling_style TEXT DEFAULT 'Right-arm medium' CHECK (bowling_style IN (
        'Right-arm fast', 'Right-arm medium', 'Right-arm off-spin', 'Right-arm leg-spin',
        'Left-arm fast', 'Left-arm medium', 'Left-arm orthodox', 'Left-arm chinaman', 'None'
    )),
    primary_role TEXT DEFAULT 'All-rounder' CHECK (primary_role IN ('Batter', 'Bowler', 'All-rounder', 'Wicket-keeper')),
    system_role TEXT DEFAULT 'user' CHECK (system_role IN ('super_admin', 'organizer', 'scorer', 'user')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to automatically create profile on Supabase auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, system_role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE(NEW.raw_user_meta_data->>'system_role', 'user')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 2. ORGANIZATIONS & TOURNAMENT HIERARCHY
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert TEOCO Organization
INSERT INTO public.organizations (name, slug, description)
VALUES ('TEOCO Corporation', 'teoco', 'Global telecommunications software and network services leader.')
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    banner_url TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed DDPL & Game of RUN tournaments
DO $$
DECLARE
    org_id UUID;
BEGIN
    SELECT id INTO org_id FROM public.organizations WHERE slug = 'teoco' LIMIT 1;
    IF org_id IS NOT NULL THEN
        INSERT INTO public.tournaments (organization_id, name, slug, description)
        VALUES 
            (org_id, 'DDPL', 'ddpl', 'Dynamic Premier Cricket League for TEOCO sports enthusiasts.'),
            (org_id, 'Game of RUN', 'game-of-run', 'Official Annual TEOCO Corporate Cricket Championship.')
        ON CONFLICT (slug) DO NOTHING;
    END IF;
END $$;

-- Tournament Organizer Permissions
CREATE TABLE IF NOT EXISTS public.tournament_organizers (
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (tournament_id, user_id)
);

-- ----------------------------------------------------------------------------
-- 3. TOURNAMENT SEASONS (EDITIONS)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tournament_seasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    season_year INT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'registration_open', 'auction_scheduled', 'auction_live', 'in_progress', 'completed', 'archived'
    )),
    start_date DATE,
    end_date DATE,
    overs_per_innings INT NOT NULL DEFAULT 10,
    min_squad_size INT NOT NULL DEFAULT 7,
    max_squad_size INT NOT NULL DEFAULT 11,
    points_for_win INT NOT NULL DEFAULT 2,
    points_for_tie INT NOT NULL DEFAULT 1,
    points_for_no_result INT NOT NULL DEFAULT 1,
    points_for_loss INT NOT NULL DEFAULT 0,
    settings JSONB NOT NULL DEFAULT '{
        "wide_runs": 1,
        "no_ball_runs": 1,
        "free_hit": true,
        "max_overs_per_bowler": 2,
        "balls_per_over": 6,
        "allow_super_over": true,
        "pitch_type": "standard",
        "ball_type": "tennis"
    }'::jsonb,
    champion_team_id UUID,
    runner_up_team_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tournament_id, season_year)
);

-- ----------------------------------------------------------------------------
-- 4. TEAMS & SQUADS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#1E3A8A',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team registrations per season (Allows teams to exist across seasons with new squads & budgets)
CREATE TABLE IF NOT EXISTS public.team_season_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id UUID NOT NULL REFERENCES public.tournament_seasons(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    owner_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    captain_player_id UUID,
    vice_captain_player_id UUID,
    allocated_budget NUMERIC(12, 2) NOT NULL DEFAULT 10000.00,
    spent_budget NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(season_id, team_id)
);

-- ----------------------------------------------------------------------------
-- 5. PLAYERS & SQUAD ALLOCATIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tournament_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id UUID NOT NULL REFERENCES public.tournament_seasons(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    registered_name TEXT NOT NULL,
    photo_url TEXT,
    role TEXT NOT NULL DEFAULT 'All-rounder' CHECK (role IN ('Batter', 'Bowler', 'All-rounder', 'Wicket-keeper')),
    batting_style TEXT DEFAULT 'Right-hand bat',
    bowling_style TEXT DEFAULT 'Right-arm medium',
    base_price NUMERIC(12, 2) NOT NULL DEFAULT 100.00,
    max_bid_limit NUMERIC(12, 2),
    registration_status TEXT NOT NULL DEFAULT 'approved' CHECK (registration_status IN ('pending', 'approved', 'rejected')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.squad_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_season_id UUID NOT NULL REFERENCES public.team_season_registrations(id) ON DELETE CASCADE,
    tournament_player_id UUID NOT NULL REFERENCES public.tournament_players(id) ON DELETE CASCADE,
    purchase_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    acquisition_type TEXT NOT NULL DEFAULT 'auction' CHECK (acquisition_type IN ('auction', 'retained', 'direct', 'replacement')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_season_id, tournament_player_id)
);

-- Add foreign key constraints for captain and vice captain on team_season_registrations
ALTER TABLE public.team_season_registrations
    DROP CONSTRAINT IF EXISTS fk_team_captain,
    DROP CONSTRAINT IF EXISTS fk_team_vice_captain;

ALTER TABLE public.team_season_registrations
    ADD CONSTRAINT fk_team_captain FOREIGN KEY (captain_player_id) REFERENCES public.tournament_players(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_team_vice_captain FOREIGN KEY (vice_captain_player_id) REFERENCES public.tournament_players(id) ON DELETE SET NULL;

-- ----------------------------------------------------------------------------
-- 6. PLAYER AUCTION ENGINE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.auctions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id UUID NOT NULL REFERENCES public.tournament_seasons(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    budget_per_team NUMERIC(12, 2) NOT NULL DEFAULT 10000.00,
    default_base_price NUMERIC(12, 2) NOT NULL DEFAULT 100.00,
    bid_increment NUMERIC(12, 2) NOT NULL DEFAULT 100.00,
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'paused', 'completed')),
    current_state JSONB DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.auction_bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_id UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
    tournament_player_id UUID NOT NULL REFERENCES public.tournament_players(id) ON DELETE CASCADE,
    team_season_id UUID NOT NULL REFERENCES public.team_season_registrations(id) ON DELETE CASCADE,
    bid_amount NUMERIC(12, 2) NOT NULL,
    bid_step NUMERIC(12, 2) NOT NULL DEFAULT 100.00,
    placed_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    placed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.auction_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_id UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
    tournament_player_id UUID NOT NULL REFERENCES public.tournament_players(id) ON DELETE CASCADE,
    winning_team_season_id UUID REFERENCES public.team_season_registrations(id) ON DELETE SET NULL,
    final_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'sold' CHECK (status IN ('sold', 'unsold')),
    is_reversed BOOLEAN NOT NULL DEFAULT FALSE,
    reversal_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Concurrency-Safe Bidding RPC
CREATE OR REPLACE FUNCTION public.place_auction_bid(
    p_auction_id UUID,
    p_team_season_id UUID,
    p_bid_amount NUMERIC,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_auction RECORD;
    v_team RECORD;
    v_player_id UUID;
    v_curr_bid NUMERIC;
    v_squad_count INT;
    v_max_squad INT;
    v_min_bid NUMERIC;
BEGIN
    -- 1. Lock auction row for update to prevent concurrent race conditions
    SELECT * INTO v_auction FROM public.auctions WHERE id = p_auction_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Auction not found');
    END IF;

    IF v_auction.status <> 'live' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Auction is not live');
    END IF;

    IF v_auction.current_state IS NULL OR (v_auction.current_state->>'player_id') IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No player currently on the auction block');
    END IF;

    v_player_id := (v_auction.current_state->>'player_id')::UUID;
    v_curr_bid := COALESCE((v_auction.current_state->>'current_bid')::NUMERIC, v_auction.default_base_price);

    -- 2. Validate team and budget
    SELECT ts.*, s.max_squad_size INTO v_team 
    FROM public.team_season_registrations ts
    JOIN public.tournament_seasons s ON s.id = ts.season_id
    WHERE ts.id = p_team_season_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Team registration not found');
    END IF;

    IF (v_team.allocated_budget - v_team.spent_budget) < p_bid_amount THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient remaining budget');
    END IF;

    -- 3. Validate squad capacity limit
    SELECT COUNT(*) INTO v_squad_count FROM public.squad_members WHERE team_season_id = p_team_season_id;
    IF v_squad_count >= v_team.max_squad_size THEN
        RETURN jsonb_build_object('success', false, 'error', 'Team has reached maximum squad capacity');
    END IF;

    -- 4. Validate bid amount
    IF (v_auction.current_state->>'highest_team_season_id') IS NOT NULL THEN
        v_min_bid := v_curr_bid + v_auction.bid_increment;
        IF p_bid_amount < v_min_bid THEN
            RETURN jsonb_build_object('success', false, 'error', 'Bid must be at least ' || v_min_bid);
        END IF;
    ELSE
        IF p_bid_amount < v_curr_bid THEN
            RETURN jsonb_build_object('success', false, 'error', 'Bid must be at least base price ' || v_curr_bid);
        END IF;
    END IF;

    -- 5. Record the bid in audit log
    INSERT INTO public.auction_bids (auction_id, tournament_player_id, team_season_id, bid_amount, placed_by_user_id)
    VALUES (p_auction_id, v_player_id, p_team_season_id, p_bid_amount, p_user_id);

    -- 6. Update current auction state
    UPDATE public.auctions
    SET current_state = jsonb_set(
        jsonb_set(
            jsonb_set(current_state, '{current_bid}', to_jsonb(p_bid_amount)),
            '{highest_team_season_id}', to_jsonb(p_team_season_id::text)
        ),
        '{last_bid_at}', to_jsonb(NOW())
    )
    WHERE id = p_auction_id;

    RETURN jsonb_build_object(
        'success', true,
        'bid_amount', p_bid_amount,
        'team_season_id', p_team_season_id
    );
END;
$$;

-- Conclude Auction Lot (Sold / Unsold) Transaction
CREATE OR REPLACE FUNCTION public.conclude_auction_lot(
    p_auction_id UUID,
    p_status TEXT -- 'sold' or 'unsold'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_auction RECORD;
    v_player_id UUID;
    v_team_season_id UUID;
    v_final_price NUMERIC;
BEGIN
    SELECT * INTO v_auction FROM public.auctions WHERE id = p_auction_id FOR UPDATE;
    IF NOT FOUND OR v_auction.current_state IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No active auction lot');
    END IF;

    v_player_id := (v_auction.current_state->>'player_id')::UUID;
    v_team_season_id := (v_auction.current_state->>'highest_team_season_id')::UUID;
    v_final_price := COALESCE((v_auction.current_state->>'current_bid')::NUMERIC, 0);

    IF p_status = 'sold' AND v_team_season_id IS NOT NULL THEN
        -- 1. Insert transaction
        INSERT INTO public.auction_transactions (auction_id, tournament_player_id, winning_team_season_id, final_price, status)
        VALUES (p_auction_id, v_player_id, v_team_season_id, v_final_price, 'sold');

        -- 2. Add player to squad
        INSERT INTO public.squad_members (team_season_id, tournament_player_id, purchase_price, acquisition_type)
        VALUES (v_team_season_id, v_player_id, v_final_price, 'auction')
        ON CONFLICT (team_season_id, tournament_player_id) DO UPDATE SET purchase_price = v_final_price;

        -- 3. Deduct team purse
        UPDATE public.team_season_registrations
        SET spent_budget = spent_budget + v_final_price
        WHERE id = v_team_season_id;
    ELSE
        -- Insert unsold transaction
        INSERT INTO public.auction_transactions (auction_id, tournament_player_id, winning_team_season_id, final_price, status)
        VALUES (p_auction_id, v_player_id, NULL, 0, 'unsold');
    END IF;

    -- Clear current lot on auction
    UPDATE public.auctions SET current_state = NULL WHERE id = p_auction_id;

    RETURN jsonb_build_object('success', true, 'status', p_status, 'player_id', v_player_id);
END;
$$;

-- ----------------------------------------------------------------------------
-- 7. MATCH FIXTURES & CRICKET SCORING ENGINE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id UUID NOT NULL REFERENCES public.tournament_seasons(id) ON DELETE CASCADE,
    match_number INT NOT NULL,
    match_title TEXT,
    round_type TEXT NOT NULL DEFAULT 'league' CHECK (round_type IN ('league', 'group', 'quarterfinal', 'semifinal', 'final', 'third_place')),
    team_a_season_id UUID NOT NULL REFERENCES public.team_season_registrations(id) ON DELETE RESTRICT,
    team_b_season_id UUID NOT NULL REFERENCES public.team_season_registrations(id) ON DELETE RESTRICT,
    match_date TIMESTAMPTZ,
    venue TEXT DEFAULT 'TEOCO Sports Ground',
    overs_limit INT NOT NULL DEFAULT 10,
    toss_winner_team_id UUID REFERENCES public.team_season_registrations(id),
    toss_decision TEXT CHECK (toss_decision IN ('bat', 'bowl')),
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed', 'abandoned', 'postponed')),
    winner_team_id UUID REFERENCES public.team_season_registrations(id),
    win_margin_type TEXT CHECK (win_margin_type IN ('runs', 'wickets', 'tie', 'no_result')),
    win_margin_value INT,
    result_summary TEXT,
    player_of_the_match_id UUID REFERENCES public.tournament_players(id),
    scorer_user_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.match_innings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    innings_number INT NOT NULL CHECK (innings_number IN (1, 2)),
    batting_team_season_id UUID NOT NULL REFERENCES public.team_season_registrations(id),
    bowling_team_season_id UUID NOT NULL REFERENCES public.team_season_registrations(id),
    total_runs INT NOT NULL DEFAULT 0,
    total_wickets INT NOT NULL DEFAULT 0,
    total_legal_balls INT NOT NULL DEFAULT 0,
    extras_wides INT NOT NULL DEFAULT 0,
    extras_no_balls INT NOT NULL DEFAULT 0,
    extras_byes INT NOT NULL DEFAULT 0,
    extras_leg_byes INT NOT NULL DEFAULT 0,
    extras_penalties INT NOT NULL DEFAULT 0,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    is_all_out BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(match_id, innings_number)
);

CREATE TABLE IF NOT EXISTS public.match_deliveries (
    id BIGSERIAL PRIMARY KEY,
    innings_id UUID NOT NULL REFERENCES public.match_innings(id) ON DELETE CASCADE,
    over_number INT NOT NULL,
    ball_in_over INT NOT NULL,
    striker_id UUID NOT NULL REFERENCES public.tournament_players(id),
    non_striker_id UUID NOT NULL REFERENCES public.tournament_players(id),
    bowler_id UUID NOT NULL REFERENCES public.tournament_players(id),
    runs_batter INT NOT NULL DEFAULT 0,
    runs_extras INT NOT NULL DEFAULT 0,
    extra_type TEXT NOT NULL DEFAULT 'none' CHECK (extra_type IN ('none', 'wide', 'no_ball', 'bye', 'leg_bye', 'penalty')),
    is_legal_ball BOOLEAN NOT NULL DEFAULT TRUE,
    is_wicket BOOLEAN NOT NULL DEFAULT FALSE,
    wicket_type TEXT NOT NULL DEFAULT 'none' CHECK (wicket_type IN (
        'none', 'bowled', 'caught', 'run_out', 'stumped', 'lbw', 'hit_wicket', 'retired_hurt', 'timed_out', 'handled_ball'
    )),
    dismissed_player_id UUID REFERENCES public.tournament_players(id),
    fielder_id UUID REFERENCES public.tournament_players(id),
    commentary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for speedy match deliveries retrieval
CREATE INDEX IF NOT EXISTS idx_match_deliveries_innings ON public.match_deliveries(innings_id, id);

-- ----------------------------------------------------------------------------
-- 8. TOURNAMENT AWARDS & ALL-TIME HALL OF FAME
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tournament_awards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id UUID NOT NULL REFERENCES public.tournament_seasons(id) ON DELETE CASCADE,
    award_title TEXT NOT NULL,
    award_category TEXT NOT NULL CHECK (award_category IN ('champion', 'runner_up', 'orange_cap', 'purple_cap', 'mvp', 'best_all_rounder', 'custom')),
    player_id UUID REFERENCES public.tournament_players(id),
    team_season_id UUID REFERENCES public.team_season_registrations(id),
    award_value TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 9. AUDIT LOGS FOR ORGANIZER ACTIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    entity_name TEXT NOT NULL,
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_season_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_innings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Read policies: Tournaments, fixtures, statistics, standings are publicly viewable
CREATE POLICY "Public can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public can view organizations" ON public.organizations FOR SELECT USING (true);
CREATE POLICY "Public can view tournaments" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Public can view seasons" ON public.tournament_seasons FOR SELECT USING (true);
CREATE POLICY "Public can view teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Public can view team registrations" ON public.team_season_registrations FOR SELECT USING (true);
CREATE POLICY "Public can view players" ON public.tournament_players FOR SELECT USING (true);
CREATE POLICY "Public can view squad members" ON public.squad_members FOR SELECT USING (true);
CREATE POLICY "Public can view auctions" ON public.auctions FOR SELECT USING (true);
CREATE POLICY "Public can view auction bids" ON public.auction_bids FOR SELECT USING (true);
CREATE POLICY "Public can view auction results" ON public.auction_transactions FOR SELECT USING (true);
CREATE POLICY "Public can view matches" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Public can view match innings" ON public.match_innings FOR SELECT USING (true);
CREATE POLICY "Public can view match deliveries" ON public.match_deliveries FOR SELECT USING (true);
CREATE POLICY "Public can view tournament awards" ON public.tournament_awards FOR SELECT USING (true);

-- Admin / Organizer Write Policies Helper
CREATE OR REPLACE FUNCTION public.is_organizer(p_tournament_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND system_role = 'super_admin'
    ) OR EXISTS (
        SELECT 1 FROM public.tournament_organizers WHERE tournament_id = p_tournament_id AND user_id = auth.uid()
    );
$$;

-- Allow authenticated admins/organizers to manage tournament data
CREATE POLICY "Organizers can insert seasons" ON public.tournament_seasons FOR INSERT TO authenticated
    WITH CHECK (public.is_organizer(tournament_id));
CREATE POLICY "Organizers can update seasons" ON public.tournament_seasons FOR UPDATE TO authenticated
    USING (public.is_organizer(tournament_id));

CREATE POLICY "Organizers can manage teams" ON public.teams FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "Organizers can manage team registrations" ON public.team_season_registrations FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "Organizers can manage tournament players" ON public.tournament_players FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "Organizers can manage squads" ON public.squad_members FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "Organizers can manage auctions" ON public.auctions FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "Organizers can manage matches" ON public.matches FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "Scorers and Admins can update innings" ON public.match_innings FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "Scorers and Admins can log deliveries" ON public.match_deliveries FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 11. SUPABASE REALTIME CONFIGURATION
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.auctions;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.auction_bids;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.auction_transactions;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.match_innings;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.match_deliveries;
EXCEPTION WHEN OTHERS THEN
    -- Ignore if already added to publication
    NULL;
END $$;
