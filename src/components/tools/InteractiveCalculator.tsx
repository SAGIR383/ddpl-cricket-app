'use client';

import { useState } from 'react';
import { parseCricketOversToDecimal } from '@/lib/cricketTools';
import { Calculator, ArrowRight, RotateCcw, Sparkles, CheckCircle2 } from 'lucide-react';

interface Props {
  slug: string;
}

export function InteractiveCalculator({ slug }: Props) {
  // 1. Net Run Rate
  const [nrrRunsScored, setNrrRunsScored] = useState<number>(180);
  const [nrrOversFaced, setNrrOversFaced] = useState<number>(20);
  const [nrrRunsConceded, setNrrRunsConceded] = useState<number>(150);
  const [nrrOversBowled, setNrrOversBowled] = useState<number>(20);
  const [nrrIsAllOutScored, setNrrIsAllOutScored] = useState(false);
  const [nrrIsAllOutConceded, setNrrIsAllOutConceded] = useState(false);
  const [matchQuotaOvers, setMatchQuotaOvers] = useState<number>(20);

  // 2. Batting Average
  const [batRuns, setBatRuns] = useState<number>(450);
  const [batInnings, setBatInnings] = useState<number>(12);
  const [batNotOuts, setBatNotOuts] = useState<number>(3);

  // 3. Bowling Average
  const [bowlRuns, setBowlRuns] = useState<number>(240);
  const [bowlWickets, setBowlWickets] = useState<number>(12);

  // 4. Bowling Economy
  const [econRuns, setEconRuns] = useState<number>(26);
  const [econOvers, setEconOvers] = useState<number>(3.4);

  // 5. Strike Rate
  const [srRuns, setSrRuns] = useState<number>(64);
  const [srBalls, setSrBalls] = useState<number>(38);

  // 6. Required Run Rate
  const [rrrTarget, setRrrTarget] = useState<number>(185);
  const [rrrCurrentRuns, setRrrCurrentRuns] = useState<number>(137);
  const [rrrOversLeft, setRrrOversLeft] = useState<number>(4.2);

  // 7. Points Table
  const [ptWins, setPtWins] = useState<number>(5);
  const [ptLosses, setPtLosses] = useState<number>(2);
  const [ptTies, setPtTies] = useState<number>(1);
  const [ptPointsPerWin, setPtPointsPerWin] = useState<number>(2);

  // 8. Auction Budget
  const [aucPurse, setAucPurse] = useState<number>(10000);
  const [aucSlotsLeft, setAucSlotsLeft] = useState<number>(4);
  const [aucBasePrice, setAucBasePrice] = useState<number>(500);

  // Calculation Logic
  if (slug === 'net-run-rate-calculator') {
    const effectiveOversFaced = nrrIsAllOutScored
      ? matchQuotaOvers
      : parseCricketOversToDecimal(nrrOversFaced);
    const effectiveOversBowled = nrrIsAllOutConceded
      ? matchQuotaOvers
      : parseCricketOversToDecimal(nrrOversBowled);

    const forRate = effectiveOversFaced > 0 ? nrrRunsScored / effectiveOversFaced : 0;
    const againstRate = effectiveOversBowled > 0 ? nrrRunsConceded / effectiveOversBowled : 0;
    const nrr = forRate - againstRate;

    return (
      <div className="p-6 sm:p-8 rounded-3xl bg-[#08111F] border border-[#D8AD55]/30 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#D8AD55]" />
            <h3 className="font-display font-bold text-lg text-white">Live NRR Computation</h3>
          </div>
          <span className="text-xs text-[#D8AD55] font-bold">ICC &amp; IPL Standards</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Batting Inning */}
          <div className="space-y-4 p-4 rounded-2xl bg-[#0D1B2A] border border-white/5">
            <span className="font-bold text-white text-xs uppercase tracking-wider text-[#D8AD55]">
              1. Your Team Batting
            </span>
            <div className="space-y-1">
              <label className="text-[11px] text-gray-400">Total Runs Scored</label>
              <input
                type="number"
                value={nrrRunsScored}
                onChange={(e) => setNrrRunsScored(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[#08111F] border border-white/10 text-white font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-gray-400">Overs Faced (e.g. 19.4 or 20.0)</label>
              <input
                type="number"
                step="0.1"
                value={nrrOversFaced}
                onChange={(e) => setNrrOversFaced(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[#08111F] border border-white/10 text-white font-bold"
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="allOutScored"
                checked={nrrIsAllOutScored}
                onChange={(e) => setNrrIsAllOutScored(e.target.checked)}
                className="w-4 h-4 rounded text-[#D8AD55]"
              />
              <label htmlFor="allOutScored" className="text-xs text-gray-300">
                Team was Bowled Out (All Out)
              </label>
            </div>
          </div>

          {/* Bowling Inning */}
          <div className="space-y-4 p-4 rounded-2xl bg-[#0D1B2A] border border-white/5">
            <span className="font-bold text-white text-xs uppercase tracking-wider text-[#F2D69A]">
              2. Opponent Batting (Conceded)
            </span>
            <div className="space-y-1">
              <label className="text-[11px] text-gray-400">Total Runs Conceded</label>
              <input
                type="number"
                value={nrrRunsConceded}
                onChange={(e) => setNrrRunsConceded(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[#08111F] border border-white/10 text-white font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-gray-400">Overs Bowled (e.g. 18.2 or 20.0)</label>
              <input
                type="number"
                step="0.1"
                value={nrrOversBowled}
                onChange={(e) => setNrrOversBowled(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[#08111F] border border-white/10 text-white font-bold"
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="allOutConceded"
                checked={nrrIsAllOutConceded}
                onChange={(e) => setNrrIsAllOutConceded(e.target.checked)}
                className="w-4 h-4 rounded text-[#D8AD55]"
              />
              <label htmlFor="allOutConceded" className="text-xs text-gray-300">
                Opponent was Bowled Out
              </label>
            </div>
          </div>
        </div>

        {/* Result Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0D1B2A] to-[#111D2D] border border-[#D8AD55]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase text-[#D8AD55] tracking-wider">Calculated Net Run Rate</span>
            <div className="font-display font-black text-4xl sm:text-5xl text-white">
              {nrr >= 0 ? `+${nrr.toFixed(3)}` : nrr.toFixed(3)}
            </div>
          </div>
          <div className="text-xs text-gray-300 space-y-1 sm:text-right border-t sm:border-t-0 sm:border-l border-white/10 sm:pl-6 pt-3 sm:pt-0">
            <div>Runs For Rate: <span className="text-white font-bold">{forRate.toFixed(3)}</span> rpo</div>
            <div>Runs Against Rate: <span className="text-white font-bold">{againstRate.toFixed(3)}</span> rpo</div>
            <div className="text-[10px] text-[#8793A5]">Dec. Overs: {effectiveOversFaced.toFixed(2)} vs {effectiveOversBowled.toFixed(2)}</div>
          </div>
        </div>
      </div>
    );
  }

  if (slug === 'batting-average-calculator') {
    const dismissals = Math.max(1, batInnings - batNotOuts);
    const avg = batRuns / dismissals;

    return (
      <div className="p-6 sm:p-8 rounded-3xl bg-[#08111F] border border-[#D8AD55]/30 shadow-2xl space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-300 font-semibold">Total Runs</label>
            <input
              type="number"
              value={batRuns}
              onChange={(e) => setBatRuns(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0D1B2A] border border-white/10 text-white font-bold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-300 font-semibold">Total Innings Batted</label>
            <input
              type="number"
              value={batInnings}
              onChange={(e) => setBatInnings(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0D1B2A] border border-white/10 text-white font-bold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-300 font-semibold">Not Outs</label>
            <input
              type="number"
              value={batNotOuts}
              onChange={(e) => setBatNotOuts(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0D1B2A] border border-white/10 text-white font-bold"
            />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#0D1B2A] border border-[#D8AD55]/40 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase text-[#D8AD55]">Batting Average</div>
            <div className="font-display font-black text-4xl text-white">{avg.toFixed(2)}</div>
          </div>
          <div className="text-xs text-[#8793A5] text-right">
            Times Dismissed: <span className="text-white font-bold">{dismissals}</span>
          </div>
        </div>
      </div>
    );
  }

  if (slug === 'bowling-average-calculator') {
    const avg = bowlWickets > 0 ? bowlRuns / bowlWickets : 0;

    return (
      <div className="p-6 sm:p-8 rounded-3xl bg-[#08111F] border border-[#D8AD55]/30 shadow-2xl space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-300 font-semibold">Total Runs Conceded</label>
            <input
              type="number"
              value={bowlRuns}
              onChange={(e) => setBowlRuns(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0D1B2A] border border-white/10 text-white font-bold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-300 font-semibold">Total Wickets Taken</label>
            <input
              type="number"
              value={bowlWickets}
              onChange={(e) => setBowlWickets(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0D1B2A] border border-white/10 text-white font-bold"
            />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#0D1B2A] border border-[#D8AD55]/40 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase text-[#D8AD55]">Bowling Average</div>
            <div className="font-display font-black text-4xl text-white">{avg.toFixed(2)}</div>
          </div>
          <div className="text-xs text-[#8793A5]">Runs per wicket</div>
        </div>
      </div>
    );
  }

  if (slug === 'bowling-economy-calculator') {
    const decimalOvers = parseCricketOversToDecimal(econOvers);
    const econ = decimalOvers > 0 ? econRuns / decimalOvers : 0;

    return (
      <div className="p-6 sm:p-8 rounded-3xl bg-[#08111F] border border-[#D8AD55]/30 shadow-2xl space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-300 font-semibold">Runs Conceded</label>
            <input
              type="number"
              value={econRuns}
              onChange={(e) => setEconRuns(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0D1B2A] border border-white/10 text-white font-bold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-300 font-semibold">Overs Bowled (e.g. 3.4 for 3 ov &amp; 4 balls)</label>
            <input
              type="number"
              step="0.1"
              value={econOvers}
              onChange={(e) => setEconOvers(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0D1B2A] border border-white/10 text-white font-bold"
            />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#0D1B2A] border border-[#D8AD55]/40 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase text-[#D8AD55]">Economy Rate</div>
            <div className="font-display font-black text-4xl text-white">{econ.toFixed(2)}</div>
          </div>
          <div className="text-xs text-[#8793A5] text-right">
            <div>Runs per over</div>
            <div className="text-[10px]">Exact Decimal: {decimalOvers.toFixed(4)} ov</div>
          </div>
        </div>
      </div>
    );
  }

  if (slug === 'strike-rate-calculator') {
    const sr = srBalls > 0 ? (srRuns / srBalls) * 100 : 0;

    return (
      <div className="p-6 sm:p-8 rounded-3xl bg-[#08111F] border border-[#D8AD55]/30 shadow-2xl space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-300 font-semibold">Runs Scored</label>
            <input
              type="number"
              value={srRuns}
              onChange={(e) => setSrRuns(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0D1B2A] border border-white/10 text-white font-bold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-300 font-semibold">Balls Faced</label>
            <input
              type="number"
              value={srBalls}
              onChange={(e) => setSrBalls(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0D1B2A] border border-white/10 text-white font-bold"
            />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#0D1B2A] border border-[#D8AD55]/40 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase text-[#D8AD55]">Batting Strike Rate</div>
            <div className="font-display font-black text-4xl text-white">{sr.toFixed(2)}</div>
          </div>
          <div className="text-xs text-[#8793A5]">Runs per 100 balls</div>
        </div>
      </div>
    );
  }

  if (slug === 'required-run-rate-calculator') {
    const runsNeeded = Math.max(0, rrrTarget - rrrCurrentRuns);
    const decimalOversLeft = parseCricketOversToDecimal(rrrOversLeft);
    const rrr = decimalOversLeft > 0 ? runsNeeded / decimalOversLeft : 0;

    return (
      <div className="p-6 sm:p-8 rounded-3xl bg-[#08111F] border border-[#D8AD55]/30 shadow-2xl space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-300 font-semibold">Target Score</label>
            <input
              type="number"
              value={rrrTarget}
              onChange={(e) => setRrrTarget(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0D1B2A] border border-white/10 text-white font-bold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-300 font-semibold">Current Runs</label>
            <input
              type="number"
              value={rrrCurrentRuns}
              onChange={(e) => setRrrCurrentRuns(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0D1B2A] border border-white/10 text-white font-bold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-300 font-semibold">Overs Remaining (e.g. 4.2)</label>
            <input
              type="number"
              step="0.1"
              value={rrrOversLeft}
              onChange={(e) => setRrrOversLeft(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0D1B2A] border border-white/10 text-white font-bold"
            />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#0D1B2A] border border-[#D8AD55]/40 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase text-[#D8AD55]">Required Run Rate (RRR)</div>
            <div className="font-display font-black text-4xl text-white">{rrr.toFixed(2)}</div>
          </div>
          <div className="text-xs text-[#8793A5] text-right">
            <div>Need <span className="text-[#F2D69A] font-bold">{runsNeeded}</span> runs from <span className="text-[#F2D69A] font-bold">{rrrOversLeft}</span> overs</div>
          </div>
        </div>
      </div>
    );
  }

  if (slug === 'points-table-calculator') {
    const totalPlayed = ptWins + ptLosses + ptTies;
    const totalPoints = ptWins * ptPointsPerWin + ptTies * (ptPointsPerWin / 2);

    return (
      <div className="p-6 sm:p-8 rounded-3xl bg-[#08111F] border border-[#D8AD55]/30 shadow-2xl space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-300 font-semibold">Wins</label>
            <input
              type="number"
              value={ptWins}
              onChange={(e) => setPtWins(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0D1B2A] border border-white/10 text-white font-bold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-300 font-semibold">Losses</label>
            <input
              type="number"
              value={ptLosses}
              onChange={(e) => setPtLosses(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0D1B2A] border border-white/10 text-white font-bold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-300 font-semibold">Ties / No Result</label>
            <input
              type="number"
              value={ptTies}
              onChange={(e) => setPtTies(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0D1B2A] border border-white/10 text-white font-bold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-300 font-semibold">Pts / Win</label>
            <input
              type="number"
              value={ptPointsPerWin}
              onChange={(e) => setPtPointsPerWin(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0D1B2A] border border-white/10 text-white font-bold"
            />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#0D1B2A] border border-[#D8AD55]/40 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase text-[#D8AD55]">Total Tournament Points</div>
            <div className="font-display font-black text-4xl text-white">{totalPoints} Pts</div>
          </div>
          <div className="text-xs text-[#8793A5] text-right">
            Played: <span className="text-white font-bold">{totalPlayed}</span> Matches
          </div>
        </div>
      </div>
    );
  }

  if (slug === 'auction-budget-calculator') {
    const reserveNeeded = Math.max(0, (aucSlotsLeft - 1) * aucBasePrice);
    const maxBid = Math.max(0, aucPurse - reserveNeeded);

    return (
      <div className="p-6 sm:p-8 rounded-3xl bg-[#08111F] border border-[#D8AD55]/30 shadow-2xl space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-300 font-semibold">Available Team Purse (₹)</label>
            <input
              type="number"
              value={aucPurse}
              onChange={(e) => setAucPurse(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0D1B2A] border border-white/10 text-white font-bold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-300 font-semibold">Players Yet to Buy (Slots Left)</label>
            <input
              type="number"
              value={aucSlotsLeft}
              onChange={(e) => setAucSlotsLeft(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0D1B2A] border border-white/10 text-white font-bold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-300 font-semibold">Base Price per Slot (₹)</label>
            <input
              type="number"
              value={aucBasePrice}
              onChange={(e) => setAucBasePrice(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0D1B2A] border border-white/10 text-white font-bold"
            />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#0D1B2A] border border-[#D8AD55]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase text-[#D8AD55]">Maximum Bid for Next Player</div>
            <div className="font-display font-black text-4xl text-emerald-400">
              ₹{maxBid.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="text-xs text-[#8793A5] space-y-1 sm:text-right">
            <div>Mandatory Reserve for Other {aucSlotsLeft - 1} Slots: <span className="text-[#F2D69A] font-bold">₹{reserveNeeded.toLocaleString('en-IN')}</span></div>
            <div className="text-[10px]">Prevents illegal roster penalties in CricPlus &amp; IPL auctions</div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
