import React, { useState, useMemo } from "react";

const palette = {
  navy: "#1B2A3D",
  steel: "#2F5D82",
  amber: "#E8A33D",
  paper: "#F1EFE9",
  card: "#FFFFFF",
  slate: "#6B7686",
  line: "#DEDAD1",
};

function currency(n) {
  return n.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  });
}

function Field({ label, hint, children }) {
  return (
    <div className="mb-5">
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="text-sm font-medium" style={{ color: palette.navy }}>
          {label}
        </label>
        {hint && (
          <span className="text-xs" style={{ color: palette.slate }}>
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function NumberInput({ value, onChange, prefix, suffix, editable = true }) {
  return (
    <div
      className="flex items-center rounded-md border px-3 py-2"
      style={{
        borderColor: palette.line,
        background: editable ? palette.card : "#FAF9F6",
      }}
    >
      {prefix && (
        <span className="mr-1 text-sm" style={{ color: palette.slate }}>
          {prefix}
        </span>
      )}
      <input
        type="number"
        value={value}
        disabled={!editable}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-transparent outline-none text-sm"
        style={{ color: palette.navy }}
      />
      {suffix && (
        <span className="ml-1 text-sm" style={{ color: palette.slate }}>
          {suffix}
        </span>
      )}
    </div>
  );
}

function StepBadge({ n }) {
  return (
    <div
      className="flex items-center justify-center rounded-full text-sm font-semibold shrink-0"
      style={{ width: 28, height: 28, background: palette.navy, color: palette.paper }}
    >
      {n}
    </div>
  );
}

function FollowmontNote({ title = "Note for Followmont", children }) {
  return (
    <div
      className="rounded-md px-4 py-3 text-xs leading-relaxed flex gap-2.5"
      style={{ background: "#FCEFD1", border: "1px solid #E8A33D" }}
    >
      <span className="shrink-0" style={{ color: "#8A5F17" }} aria-hidden="true">
        ⚠️
      </span>
      <div>
        <div className="font-semibold mb-1" style={{ color: "#8A5F17" }}>
          {title}
        </div>
        <div style={{ color: "#6B4E17" }}>{children}</div>
      </div>
    </div>
  );
}

export default function TTRPathway() {
  const [demoMode, setDemoMode] = useState(true);

  // Pathway choice — the only decision the worker makes about their schedule
  const [pathway, setPathway] = useState(null); // 'fulltime' | 'phased'

  // Step 1 — data the company already holds (auto-filled from Oracle HR / TruckM in production)
  const [workerName, setWorkerName] = useState("Ray Thompson");
  const [age, setAge] = useState(61);
  const [yearsOfService, setYearsOfService] = useState(17);
  const [currentSalary, setCurrentSalary] = useState(88000);

  // Worker's existing average night shifts — this is the system's rostering history,
  // not something the worker picks freely. It's the basis for the phased proposal below.
  const [currentAvgNightShifts, setCurrentAvgNightShifts] = useState(3);
  const [nightLoadingPct, setNightLoadingPct] = useState(30);

  // Phased schedule is fixed at 4 days — a 3-day option isn't offered.
  const phasedDays = 4;

  // Under a phased schedule, the worker picks between keeping their current night
  // shift pattern or reducing it — but the reduced number itself is always exactly
  // half, set automatically rather than freely chosen.
  const [phasedNightOption, setPhasedNightOption] = useState(null); // null | "same" | "reduced"

  // Step 2 — TTR pension is optional and separate from the schedule choice above.
  // A worker can move to a phased schedule without touching their pension at all.
  const [useTTR, setUseTTR] = useState(null); // null | true | false
  const [superBalance, setSuperBalance] = useState(310000);
  const [confirmedPreservationAge, setConfirmedPreservationAge] = useState(true);
  const [drawdownRate, setDrawdownRate] = useState(6);

  // HR submission — phased schedule only, never includes super/TTR fields
  const [hrRequestSent, setHrRequestSent] = useState(false);

  const fullTimeDays = 5;
  const weeksPerYear = 52;
  const dailyRate = currentSalary / (fullTimeDays * weeksPerYear);

  const scheduleDays = pathway === "phased" ? phasedDays : fullTimeDays;

  // Night shifts are never freely chosen by number. Full-time keeps the existing
  // TruckM-assigned pattern; under a phased schedule, the only choice is whether to
  // keep that pattern or halve it — the halved figure is always set automatically.
  const nightShiftsPerWeek =
    pathway === "phased"
      ? phasedNightOption === "reduced"
        ? Math.round(currentAvgNightShifts / 2)
        : currentAvgNightShifts
      : currentAvgNightShifts;

  const reducedSalary = useMemo(
    () => dailyRate * scheduleDays * weeksPerYear,
    [dailyRate, scheduleDays]
  );
  const nightShiftBonus = useMemo(
    () => dailyRate * nightShiftsPerWeek * weeksPerYear * (nightLoadingPct / 100),
    [dailyRate, nightShiftsPerWeek, nightLoadingPct]
  );
  const ttrIncome = useMemo(
    () => (useTTR ? (superBalance * drawdownRate) / 100 : 0),
    [useTTR, superBalance, drawdownRate]
  );
  // With TTR switched off, there's nothing to confirm before showing an income figure.
  const readyToShowIncome = useTTR ? confirmedPreservationAge : true;
  const totalIncome = reducedSalary + nightShiftBonus + ttrIncome;
  const delta = totalIncome - currentSalary;
  const deltaPct = (delta / currentSalary) * 100;
  const maxBar = Math.max(currentSalary, totalIncome);

  // Side-by-side comparison figures — reuses the same rates, just applied to both
  // schedules at once so a worker can see full-time vs phased together.
  const phasedNightShiftsForCompare =
    phasedNightOption === "reduced" ? Math.round(currentAvgNightShifts / 2) : currentAvgNightShifts;
  const fullTimeTotal =
    dailyRate * fullTimeDays * weeksPerYear +
    dailyRate * currentAvgNightShifts * weeksPerYear * (nightLoadingPct / 100) +
    ttrIncome;
  const phasedTotal =
    dailyRate * phasedDays * weeksPerYear +
    dailyRate * phasedNightShiftsForCompare * weeksPerYear * (nightLoadingPct / 100) +
    ttrIncome;

  // Builds the HR request email — schedule details only, never super/TTR fields.
  const hrRequestMailto = useMemo(() => {
    const subject = `Phased schedule request — ${workerName}`;
    const bodyLines = [
      `Employee: ${workerName}`,
      `Age: ${age}`,
      `Years of service: ${yearsOfService}`,
      "",
      "Requested schedule: 4-day phased week",
      `Night shift pattern: ${nightShiftsPerWeek} / week (${
        phasedNightOption === "reduced" ? "reduced from current average" : "same as current average"
      })`,
      "",
      "Submitted via the Followmont phased retirement pathway tool.",
      "No superannuation or TTR pension information is included in this request.",
    ];
    const body = bodyLines.join("\n");
    return `mailto:hr@followmont.com.au?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [workerName, age, yearsOfService, nightShiftsPerWeek, phasedNightOption]);

  return (
    <div
      className="w-full min-h-screen flex justify-center"
      style={{ background: palette.paper, fontFamily: "system-ui, -apple-system, sans-serif" }}
    >
      <div className="w-full max-w-2xl px-5 py-10">
        {/* Followmont-only notes about this prototype */}
        <div className="space-y-3 mb-8">
          <FollowmontNote>
            This prototype shows the personalised screen an eligible worker opens from
            their pathway link.
          </FollowmontNote>

          <FollowmontNote title="Where these starting numbers come from">
            This demo isn't wired to your systems yet, so several defaults below are
            stand-ins: current salary defaults to the Australian Trucking Association's
            2026 career factsheet (~$88,000/year), night shift loading defaults to the
            Fair Work Road Transport and Distribution Award 2020 (MA000038) minimum of
            30%, and current average night shifts is an illustrative placeholder. In
            production: salary and night shift history would come from your HR and
            rostering systems, and night shift loading should be replaced with your
            enterprise agreement rate.
          </FollowmontNote>

          <FollowmontNote title="Editable demo fields">
            <div className="flex items-center justify-between gap-4">
              <span>
                Fields below would normally be pulled automatically from your own HR
                and rostering systems. Toggle to edit them for this demo.
              </span>
              <button
                onClick={() => setDemoMode(!demoMode)}
                className="shrink-0 rounded px-3 py-1.5 font-medium text-xs"
                style={{ background: "#8A5F17", color: "#FCEFD1" }}
              >
                {demoMode ? "Editing" : "Locked"}
              </button>
            </div>
          </FollowmontNote>
        </div>

        {/* Header — worker-facing */}
        <div className="mb-8">
          <div className="text-xs font-medium tracking-wide mb-2" style={{ color: palette.steel }}>
            Followmont Transport — Transition to Retirement
          </div>
          <h1 className="text-2xl font-semibold leading-snug" style={{ color: palette.navy }}>
            Your phased retirement pathway
          </h1>
          <p className="text-sm mt-2 leading-relaxed" style={{ color: palette.slate }}>
            Based on your years of service, you're eligible to view this pathway. Choose
            how you'd like to see your numbers below, add your pension details, and
            preview your upcoming roster.
          </p>
          <div
            className="rounded-md px-3 py-2 mt-3 text-xs leading-relaxed"
            style={{ background: "#F4F6F3", color: palette.slate }}
          >
            Links like this one are being sent out in stages, sequenced by age and years
            of service — so it's expected that colleagues receive theirs at different times.
            This isn't a ranking of anyone's value to Followmont, just an order of rollout.
          </div>
        </div>

        {/* Step 0: Pathway choice */}
        <div className="rounded-lg p-6 mb-6" style={{ background: palette.card, border: `1px solid ${palette.line}` }}>
          <div className="flex items-center gap-3 mb-5">
            <StepBadge n={0} />
            <h2 className="text-base font-semibold" style={{ color: palette.navy }}>
              Choose your schedule
            </h2>
          </div>
          <p className="text-xs mb-4 ml-10 leading-relaxed" style={{ color: palette.slate }}>
            Both options stay open to you at any time — this just shows what each one
            looks like for your pay and roster.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setPathway("fulltime")}
              className="text-left rounded-md border p-4"
              style={{
                borderColor: pathway === "fulltime" ? palette.steel : palette.line,
                background: pathway === "fulltime" ? "#EAF1F6" : palette.card,
              }}
            >
              <div className="text-sm font-semibold mb-1.5" style={{ color: palette.navy }}>
                Stay on your full-time schedule
              </div>
              <ul className="text-xs space-y-1" style={{ color: palette.slate }}>
                <li>• 5 days a week, unchanged</li>
                <li>• Night shifts continue to be assigned by the company's rostering system</li>
                <li>• A TTR pension top-up is still available if you're eligible</li>
              </ul>
            </button>

            <button
              onClick={() => setPathway("phased")}
              className="text-left rounded-md border p-4"
              style={{
                borderColor: pathway === "phased" ? palette.amber : palette.line,
                background: pathway === "phased" ? "#FBF1E1" : palette.card,
              }}
            >
              <div className="text-sm font-semibold mb-1.5" style={{ color: palette.navy }}>
                Move to a phased schedule
              </div>
              <ul className="text-xs space-y-1" style={{ color: palette.slate }}>
                <li>• 4 days a week</li>
                <li>• Keep your current night shift pattern, or reduce it by half — your choice</li>
                <li>• Pairs well with a TTR pension top-up once you're eligible</li>
              </ul>
            </button>
          </div>

          <div className="rounded-md p-4 mt-4" style={{ background: "#F4F6F3" }}>
            <div className="text-sm font-medium mb-1.5" style={{ color: palette.navy }}>
              Your health comes first
            </div>
            <p className="text-xs leading-relaxed" style={{ color: palette.slate }}>
              Whichever schedule you choose, we want you healthy and with Followmont for
              the long run — this isn't about winding you down, it's about finding a pace
              that works for you. The research backs that up: a three-year study of Dutch
              workers who moved into phased retirement found they reported higher energy
              and less fatigue than peers who stayed full-time, especially those who were
              already running low on energy. A broader look at recent retirement research
              also found people who wind down gradually tend to keep more physical
              function and develop fewer chronic health conditions than those who stop
              working all at once.
            </p>
          </div>
        </div>

        {pathway === null ? (
          <div
            className="rounded-lg p-6 text-sm text-center"
            style={{ background: palette.card, border: `1px solid ${palette.line}`, color: palette.slate }}
          >
            Pick a schedule above to see your details, income estimate, and roster outlook.
          </div>
        ) : (
          <>
            {/* Step 1 */}
            <div className="rounded-lg p-6 mb-6" style={{ background: palette.card, border: `1px solid ${palette.line}` }}>
              <div className="flex items-center gap-3 mb-5">
                <StepBadge n={1} />
                <h2 className="text-base font-semibold" style={{ color: palette.navy }}>
                  Your current details
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-x-4">
                <Field label="Name">
                  <input
                    value={workerName}
                    disabled={!demoMode}
                    onChange={(e) => setWorkerName(e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-sm bg-transparent outline-none"
                    style={{ borderColor: palette.line, color: palette.navy }}
                  />
                </Field>
                <Field label="Age">
                  <NumberInput value={age} onChange={setAge} editable={demoMode} />
                </Field>
                <Field label="Years of service">
                  <NumberInput value={yearsOfService} onChange={setYearsOfService} editable={demoMode} />
                </Field>
                <Field label="Current annual salary" hint="from your record, full-time 5 days">
                  <NumberInput value={currentSalary} onChange={setCurrentSalary} prefix="$" editable={demoMode} />
                </Field>
              </div>

              {pathway === "phased" && (
                <div
                  className="rounded-md px-3 py-2 mb-5 text-xs"
                  style={{ background: "#F4F6F3", color: palette.slate }}
                >
                  Schedule: <span style={{ color: palette.navy, fontWeight: 600 }}>4-day week</span>
                </div>
              )}

              <div className="h-px my-6" style={{ background: palette.line }} />

              <Field
                label="Your current average night shifts"
                hint="from your rostering history"
              >
                <NumberInput
                  value={currentAvgNightShifts}
                  onChange={setCurrentAvgNightShifts}
                  suffix="/ week"
                  editable={demoMode}
                />
              </Field>

              <div
                className="rounded-md p-4 mb-5"
                style={{ background: pathway === "phased" ? "#FBF1E1" : "#F4F6F3" }}
              >
                <div className="text-sm font-medium mb-1" style={{ color: palette.navy }}>
                  {pathway === "phased" ? "Your night shifts under a phased schedule" : "Your night shifts, unchanged"}
                </div>

                {pathway === "phased" ? (
                  <>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <button
                        onClick={() => setPhasedNightOption("same")}
                        className="rounded-md py-2 text-xs font-medium border text-center"
                        style={{
                          borderColor: phasedNightOption === "same" ? palette.steel : palette.line,
                          background: phasedNightOption === "same" ? "#EAF1F6" : palette.card,
                          color: phasedNightOption === "same" ? palette.steel : palette.slate,
                        }}
                      >
                        Keep current pattern ({currentAvgNightShifts} / week)
                      </button>
                      <button
                        onClick={() => setPhasedNightOption("reduced")}
                        className="rounded-md py-2 text-xs font-medium border text-center"
                        style={{
                          borderColor: phasedNightOption === "reduced" ? palette.amber : palette.line,
                          background: phasedNightOption === "reduced" ? "#F6E4C2" : palette.card,
                          color: phasedNightOption === "reduced" ? "#8A5F17" : palette.slate,
                        }}
                      >
                        Reduce by half ({Math.round(currentAvgNightShifts / 2)} / week)
                      </button>
                    </div>
                    <p className="text-xs mb-3" style={{ color: palette.slate }}>
                      Figures in brackets are your average from your rostering history, not a
                      fixed number.
                    </p>
                    {phasedNightOption === null ? (
                      <p className="text-xs leading-relaxed" style={{ color: palette.slate }}>
                        Choose whether to keep your current night shift pattern or reduce it.
                      </p>
                    ) : (
                      <>
                        <div className="text-2xl font-semibold mb-1.5" style={{ color: palette.navy }}>
                          {nightShiftsPerWeek} / week
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: palette.slate }}>
                          {phasedNightOption === "reduced"
                            ? "This is always exactly half your current average, set automatically rather than left open for everyone to pick their own number — that keeps roster coverage predictable across the whole depot. If this doesn't work for your circumstances, raise it with your manager."
                            : "Your night shift pattern stays the same as it is now, even though your overall days have moved to 4 a week."}
                        </p>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-semibold mb-1.5" style={{ color: palette.navy }}>
                      {nightShiftsPerWeek} / week
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: palette.slate }}>
                      Night shifts keep being assigned the way the company's rostering system
                      currently handles them, based on forecast demand and rotation. Choosing
                      this schedule doesn't change that pattern.
                    </p>
                  </>
                )}
              </div>

              <Field label="Night shift loading" hint="Transport Award default — replace with your EA rate if it differs">
                <NumberInput value={nightLoadingPct} onChange={setNightLoadingPct} suffix="%" />
              </Field>
            </div>

            {/* Step 2 */}
            <div className="rounded-lg p-6 mb-6" style={{ background: palette.card, border: `1px solid ${palette.line}` }}>
              <div className="flex items-center gap-3 mb-1">
                <StepBadge n={2} />
                <h2 className="text-base font-semibold" style={{ color: palette.navy }}>
                  TTR pension — optional
                </h2>
              </div>
              <p className="text-xs mb-4 ml-10" style={{ color: palette.slate }}>
                A phased schedule and a TTR pension are two separate choices — you can move
                to fewer days without touching your pension at all, and add it in later
                whenever suits you.
              </p>

              <div className="rounded-md p-4 mb-5" style={{ background: "#F4F6F3" }}>
                <div className="text-sm font-medium mb-1.5" style={{ color: palette.navy }}>
                  Why some workers add a TTR pension
                </div>
                <p className="text-xs leading-relaxed" style={{ color: palette.slate }}>
                  Many workers use a TTR pension as a cash-flow bridge rather than a way to
                  grow overall savings — it lets you ease into fewer hours without giving up
                  income today. From age 60, TTR pension payments themselves are tax-free,
                  and any salary you choose to sacrifice into super is taxed at 15% instead
                  of your regular income tax rate, which can be a meaningful saving for
                  higher earners. It's worth checking with your super fund or a financial
                  adviser before starting to see if it makes sense for your situation.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                <button
                  onClick={() => setUseTTR(true)}
                  className="text-left rounded-md border p-3"
                  style={{
                    borderColor: useTTR === true ? palette.amber : palette.line,
                    background: useTTR === true ? "#FBF1E1" : palette.card,
                  }}
                >
                  <div className="text-sm font-semibold" style={{ color: palette.navy }}>
                    Add a TTR pension top-up
                  </div>
                  <div className="text-xs mt-1" style={{ color: palette.slate }}>
                    Draw down part of your super alongside your wages
                  </div>
                </button>
                <button
                  onClick={() => setUseTTR(false)}
                  className="text-left rounded-md border p-3"
                  style={{
                    borderColor: useTTR === false ? palette.steel : palette.line,
                    background: useTTR === false ? "#EAF1F6" : palette.card,
                  }}
                >
                  <div className="text-sm font-semibold" style={{ color: palette.navy }}>
                    No TTR for now
                  </div>
                  <div className="text-xs mt-1" style={{ color: palette.slate }}>
                    Just show my expected pay for this schedule
                  </div>
                </button>
              </div>

              {useTTR === true && (
                <>
                  <p className="text-xs mb-5" style={{ color: palette.slate }}>
                    These fields stay in your browser only — Followmont does not see or store your
                    super balance. This mirrors what your own super fund's TTR calculator would ask for.
                  </p>

                  <Field label="Super balance" hint="from your super fund statement">
                    <NumberInput value={superBalance} onChange={setSuperBalance} prefix="$" />
                  </Field>

                  <Field label="Annual TTR drawdown rate" hint="government limits: 4%–10% per year">
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={4}
                        max={10}
                        step={0.5}
                        value={drawdownRate}
                        onChange={(e) => setDrawdownRate(Number(e.target.value))}
                        className="w-full"
                        style={{ accentColor: palette.steel }}
                      />
                      <span className="text-sm font-semibold w-14 text-right" style={{ color: palette.navy }}>
                        {drawdownRate}%
                      </span>
                    </div>
                  </Field>

                  <label className="flex items-center gap-2 text-sm mb-5" style={{ color: palette.navy }}>
                    <input
                      type="checkbox"
                      checked={confirmedPreservationAge}
                      onChange={(e) => setConfirmedPreservationAge(e.target.checked)}
                      style={{ accentColor: palette.steel }}
                    />
                    I've reached my super preservation age
                  </label>
                </>
              )}

              {useTTR === false && (
                <p className="text-xs rounded-md p-3" style={{ background: "#F4F6F3", color: palette.slate }}>
                  Your income below reflects wages and night shift loading only. You can add a
                  TTR pension top-up here at any time.
                </p>
              )}
            </div>

            {/* Step 3: result */}
            <div className="rounded-lg p-6 mb-6" style={{ background: palette.navy }}>
              <div className="flex items-center gap-3 mb-5">
                <StepBadge n={3} />
                <h2 className="text-base font-semibold" style={{ color: palette.paper }}>
                  Your expected 1-year income
                </h2>
              </div>

              {useTTR !== null && readyToShowIncome && (
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div
                    className="rounded-md p-3"
                    style={{
                      background: pathway === "fulltime" ? "#28405A" : "#22334A",
                      border: pathway === "fulltime" ? `1px solid ${palette.steel}` : "1px solid transparent",
                    }}
                  >
                    <div className="text-xs mb-1" style={{ color: "#9FADBE" }}>
                      Full-time (5 days){pathway === "fulltime" ? " — selected" : ""}
                    </div>
                    <div className="text-lg font-semibold" style={{ color: palette.paper }}>
                      {currency(fullTimeTotal)}
                    </div>
                  </div>
                  <div
                    className="rounded-md p-3"
                    style={{
                      background: pathway === "phased" ? "#28405A" : "#22334A",
                      border: pathway === "phased" ? `1px solid ${palette.amber}` : "1px solid transparent",
                    }}
                  >
                    <div className="text-xs mb-1" style={{ color: "#9FADBE" }}>
                      Phased (4 days){pathway === "phased" ? " — selected" : ""}
                    </div>
                    <div className="text-lg font-semibold" style={{ color: palette.paper }}>
                      {currency(phasedTotal)}
                    </div>
                  </div>
                </div>
              )}

              {useTTR === null ? (
                <p className="text-sm" style={{ color: "#C9D2DC" }}>
                  Choose whether to add a TTR pension top-up above to see your expected income.
                </p>
              ) : !readyToShowIncome ? (
                <p className="text-sm" style={{ color: "#C9D2DC" }}>
                  You'll need to confirm your preservation age with your super fund before a
                  TTR pension can begin — check the box above once confirmed.
                </p>
              ) : (
                <>
                  <div className="text-3xl font-semibold mb-1" style={{ color: palette.paper }}>
                    {currency(totalIncome)}
                  </div>
                  <div className="text-sm mb-6" style={{ color: "#C9D2DC" }}>
                    {delta >= 0 ? "+" : ""}
                    {currency(delta)} ({deltaPct.toFixed(1)}%) vs your current full-time salary
                  </div>

                  <div className="space-y-3 mb-6">
                    <div>
                      <div className="flex justify-between text-xs mb-1" style={{ color: "#C9D2DC" }}>
                        <span>Current full-time salary</span>
                        <span>{currency(currentSalary)}</span>
                      </div>
                      <div className="h-2.5 rounded-full" style={{ background: "#2A3B50" }}>
                        <div
                          className="h-2.5 rounded-full"
                          style={{ width: `${(currentSalary / maxBar) * 100}%`, background: "#6B7F96" }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1" style={{ color: "#C9D2DC" }}>
                        <span>
                          {pathway === "phased" ? "Phased schedule" : "Full-time schedule"} (wages + night shift + TTR pension)
                        </span>
                        <span>{currency(totalIncome)}</span>
                      </div>
                      <div className="h-2.5 rounded-full flex overflow-hidden" style={{ background: "#2A3B50", width: "100%" }}>
                        <div style={{ width: `${(reducedSalary / maxBar) * 100}%`, background: palette.steel }} />
                        <div style={{ width: `${(nightShiftBonus / maxBar) * 100}%`, background: "#7FA9C4" }} />
                        <div style={{ width: `${(ttrIncome / maxBar) * 100}%`, background: palette.amber }} />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs mb-6" style={{ color: "#C9D2DC" }}>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: palette.steel }} />
                      Wages: {currency(reducedSalary)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "#7FA9C4" }} />
                      Night shift loading: {currency(nightShiftBonus)}
                    </div>
                    {useTTR === true && (
                      <div className="flex items-center gap-1.5">
                        <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: palette.amber }} />
                        TTR pension: {currency(ttrIncome)}
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="text-xs rounded-md p-3" style={{ background: "#22334A", color: "#9FADBE" }}>
                This is an estimate for planning purposes only and doesn't account for tax,
                Medicare levy, or your fund's specific pension rules. Confirm exact figures with
                your super fund's licensed TTR calculator before making a decision.
              </div>
            </div>

            {pathway === "phased" && (
              <div className="rounded-lg p-6" style={{ background: palette.card, border: `1px solid ${palette.line}` }}>
                <div className="text-sm font-semibold mb-1.5" style={{ color: palette.navy }}>
                  Ready to move forward?
                </div>
                <p className="text-xs mb-4 leading-relaxed" style={{ color: palette.slate }}>
                  Sending this shares only your requested 4-day schedule and night shift
                  pattern with the People &amp; Culture team — no super or TTR information is
                  included, even if you added a top-up above. There's no obligation; someone
                  will review it and reach out to talk through the details.
                </p>
                <a
                  href={hrRequestMailto}
                  onClick={() => setHrRequestSent(true)}
                  className="inline-block rounded-md px-4 py-2.5 text-sm font-medium"
                  style={{ background: palette.amber, color: palette.navy }}
                >
                  Send my phased schedule request
                </a>
                {hrRequestSent && (
                  <p className="text-xs mt-3" style={{ color: palette.slate }}>
                    Your email app should have opened with the request ready to send. Once
                    it's sent, the People &amp; Culture team will review it and get back to
                    you.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
