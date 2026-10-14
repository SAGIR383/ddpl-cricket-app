-- ============================================================================
-- CRICPLUSE SEED DATA - REALISTIC DEMO TOURNAMENTS (DDPL & GAME OF RUN)
-- ============================================================================

DO $$
DECLARE
    v_org_id UUID;
    v_ddpl_id UUID;
    v_gor_id UUID;
    v_ddpl_2025_id UUID;
    v_ddpl_2026_id UUID;
    v_gor_2026_id UUID;
    v_team1_id UUID;
    v_team2_id UUID;
    v_team3_id UUID;
    v_team4_id UUID;
    v_team1_reg_id UUID;
    v_team2_reg_id UUID;
    v_p1_id UUID;
    v_p2_id UUID;
    v_p3_id UUID;
    v_p4_id UUID;
    v_p5_id UUID;
    v_p6_id UUID;
    v_match1_id UUID;
    v_inn1_id UUID;
    v_inn2_id UUID;
BEGIN
    SELECT id INTO v_org_id FROM public.organizations WHERE slug = 'teoco' LIMIT 1;
    SELECT id INTO v_ddpl_id FROM public.tournaments WHERE slug = 'ddpl' LIMIT 1;
    SELECT id INTO v_gor_id FROM public.tournaments WHERE slug = 'game-of-run' LIMIT 1;

    -- 1. Create Teams
    INSERT INTO public.teams (name, short_name, primary_color)
    VALUES ('Dynamic Daredevils', 'DDD', '#3B82F6')
    RETURNING id INTO v_team1_id;

    INSERT INTO public.teams (name, short_name, primary_color)
    VALUES ('Power Hitters XI', 'PHX', '#EF4444')
    RETURNING id INTO v_team2_id;

    INSERT INTO public.teams (name, short_name, primary_color)
    VALUES ('TEOCO Titans', 'TTN', '#10B981')
    RETURNING id INTO v_team3_id;

    INSERT INTO public.teams (name, short_name, primary_color)
    VALUES ('Run Machine XI', 'RMX', '#F59E0B')
    RETURNING id INTO v_team4_id;

    -- 2. Create Seasons (Historical DDPL 2025 and Active DDPL 2026)
    INSERT INTO public.tournament_seasons (
        tournament_id, season_year, name, status, start_date, end_date, overs_per_innings, min_squad_size, max_squad_size
    ) VALUES (
        v_ddpl_id, 2025, 'DDPL Season 2025', 'archived', '2025-02-01', '2025-02-28', 10, 8, 11
    ) RETURNING id INTO v_ddpl_2025_id;

    INSERT INTO public.tournament_seasons (
        tournament_id, season_year, name, status, start_date, end_date, overs_per_innings, min_squad_size, max_squad_size
    ) VALUES (
        v_ddpl_id, 2026, 'DDPL Season 2026', 'in_progress', '2026-03-01', '2026-03-31', 10, 8, 11
    ) RETURNING id INTO v_ddpl_2026_id;

    -- Game of RUN Season 2026
    INSERT INTO public.tournament_seasons (
        tournament_id, season_year, name, status, start_date, end_date, overs_per_innings, min_squad_size, max_squad_size
    ) VALUES (
        v_gor_id, 2026, 'Game of RUN 2026', 'registration_open', '2026-11-01', '2026-11-30', 12, 9, 12
    ) RETURNING id INTO v_gor_2026_id;

    -- 3. Register Teams for DDPL 2026
    INSERT INTO public.team_season_registrations (season_id, team_id, allocated_budget, spent_budget)
    VALUES (v_ddpl_2026_id, v_team1_id, 10000, 2400)
    RETURNING id INTO v_team1_reg_id;

    INSERT INTO public.team_season_registrations (season_id, team_id, allocated_budget, spent_budget)
    VALUES (v_ddpl_2026_id, v_team2_id, 10000, 3100)
    RETURNING id INTO v_team2_reg_id;

    -- 4. Register Tournament Players for DDPL 2026
    INSERT INTO public.tournament_players (season_id, registered_name, role, batting_style, bowling_style, base_price)
    VALUES (v_ddpl_2026_id, 'Shakib Rahman', 'All-rounder', 'Left-hand bat', 'Left-arm orthodox', 200)
    RETURNING id INTO v_p1_id;

    INSERT INTO public.tournament_players (season_id, registered_name, role, batting_style, bowling_style, base_price)
    VALUES (v_ddpl_2026_id, 'Amit Sharma', 'Batter', 'Right-hand bat', 'None', 150)
    RETURNING id INTO v_p2_id;

    INSERT INTO public.tournament_players (season_id, registered_name, role, batting_style, bowling_style, base_price)
    VALUES (v_ddpl_2026_id, 'Karthik Rao', 'Bowler', 'Right-hand bat', 'Right-arm fast', 150)
    RETURNING id INTO v_p3_id;

    INSERT INTO public.tournament_players (season_id, registered_name, role, batting_style, bowling_style, base_price)
    VALUES (v_ddpl_2026_id, 'Tariq Hassan', 'Wicket-keeper', 'Right-hand bat', 'None', 100)
    RETURNING id INTO v_p4_id;

    INSERT INTO public.tournament_players (season_id, registered_name, role, batting_style, bowling_style, base_price)
    VALUES (v_ddpl_2026_id, 'David Miller', 'Batter', 'Left-hand bat', 'None', 200)
    RETURNING id INTO v_p5_id;

    INSERT INTO public.tournament_players (season_id, registered_name, role, batting_style, bowling_style, base_price)
    VALUES (v_ddpl_2026_id, 'Zubair Ahmed', 'Bowler', 'Right-hand bat', 'Right-arm off-spin', 100)
    RETURNING id INTO v_p6_id;

    -- Assign to Squads
    INSERT INTO public.squad_members (team_season_id, tournament_player_id, purchase_price, acquisition_type)
    VALUES 
        (v_team1_reg_id, v_p1_id, 1400, 'auction'),
        (v_team1_reg_id, v_p2_id, 1000, 'auction'),
        (v_team2_reg_id, v_p3_id, 1200, 'auction'),
        (v_team2_reg_id, v_p4_id, 900, 'auction'),
        (v_team2_reg_id, v_p5_id, 1000, 'auction');

    -- Set Captains
    UPDATE public.team_season_registrations SET captain_player_id = v_p1_id WHERE id = v_team1_reg_id;
    UPDATE public.team_season_registrations SET captain_player_id = v_p3_id WHERE id = v_team2_reg_id;

    -- 5. Create a Live Match
    INSERT INTO public.matches (
        season_id, match_number, match_title, round_type, team_a_season_id, team_b_season_id, overs_limit,
        toss_winner_team_id, toss_decision, status, venue
    ) VALUES (
        v_ddpl_2026_id, 1, 'DDPL Match 1: Daredevils vs Power Hitters', 'league',
        v_team1_reg_id, v_team2_reg_id, 10, v_team1_reg_id, 'bat', 'live', 'TEOCO Arena'
    ) RETURNING id INTO v_match1_id;

    -- Create 1st Innings
    INSERT INTO public.match_innings (
        match_id, innings_number, batting_team_season_id, bowling_team_season_id,
        total_runs, total_wickets, total_legal_balls, extras_wides, extras_no_balls
    ) VALUES (
        v_match1_id, 1, v_team1_reg_id, v_team2_reg_id, 68, 2, 42, 3, 1
    ) RETURNING id INTO v_inn1_id;

END $$;
