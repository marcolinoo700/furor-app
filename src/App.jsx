import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── SUPABASE CLIENT ──────────────────────────────────────────────────────────
const SUPABASE_URL = "https://bjvkfkizmblzodvmgprr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqdmtma2l6bWJsem9kdm1ncHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNjUyODIsImV4cCI6MjA5MTg0MTI4Mn0.khw72pNgi5iiiMNhxpD1_tYulG6w6Lj4pEz655j-aq4";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function formatScore(score, type) {
  if (!score) return "-";
  if (type === "time") {
    const s = parseInt(score);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }
  if (type === "weight") return `${score} kg`;
  return `${score} reps`;
}

function sortResults(results, scoreType) {
  return [...results].sort((a, b) =>
    scoreType === "time" ? a.score - b.score : b.score - a.score
  );
}

// ─── LOGIN / REGISTER SCREEN ──────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError("Email o password errati"); setLoading(false); return; }
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
    onLogin({ ...data.user, name: profile?.name || email, role: profile?.role || "client" });
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Inserisci il tuo nome"); return; }
    setLoading(true);
    const { data, error: err } = await supabase.auth.signUp({ email, password });
    if (err) { setError(err.message); setLoading(false); return; }
    if (data.user) {
      await supabase.from("profiles").insert({ id: data.user.id, name: name.trim(), email, role: "client" });
    }
    setRegistered(true);
    setLoading(false);
  };

  if (registered) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6 text-center">
        <span className="text-5xl mb-4">✅</span>
        <p className="text-white font-bold text-xl">Registrazione completata!</p>
        <p className="text-gray-500 text-sm mt-2">Controlla la tua email per confermare l'account, poi accedi.</p>
        <button onClick={() => { setRegistered(false); setTab("login"); }} className="mt-6 bg-orange-500 text-white px-6 py-3 rounded-xl text-sm font-bold">
          Vai al Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-lg">🏋️</div>
          <span className="font-black text-white text-2xl">FUROR</span>
        </div>
        <div className="flex bg-gray-900 rounded-xl p-1 mb-6">
          <button onClick={() => setTab("login")} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "login" ? "bg-orange-500 text-white" : "text-gray-500"}`}>Accedi</button>
          <button onClick={() => setTab("register")} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "register" ? "bg-orange-500 text-white" : "text-gray-500"}`}>Registrati</button>
        </div>
        <form onSubmit={tab === "login" ? handleLogin : handleRegister} className="space-y-3">
          {tab === "register" && (
            <input type="text" placeholder="Nome e Cognome" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-600" />
          )}
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-600" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-600" />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-xl text-base transition-all disabled:opacity-50">
            {loading ? "Caricamento..." : tab === "login" ? "Accedi 🏋️" : "Crea Account →"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
function BottomNav({ active, setActiveTab, isAdmin }) {
  const adminTabs = [
    { id: "wod", icon: "🔥", label: "WOD" },
    { id: "results", icon: "📊", label: "Risultati" },
    { id: "newwod", icon: "➕", label: "Nuovo WOD" },
    { id: "athletes", icon: "👥", label: "Atleti" },
  ];
  const clientTabs = [
    { id: "wod", icon: "🔥", label: "WOD" },
    { id: "submit", icon: "📝", label: "Invia" },
    { id: "leaderboard", icon: "🏆", label: "Classifica" },
  ];
  const tabs = isAdmin ? adminTabs : clientTabs;
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-950 border-t border-gray-800 flex z-10">
      {tabs.map((t) => (
        <button key={t.id} onClick={() => setActiveTab(t.id)}
          className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition-all ${active === t.id ? "text-orange-500" : "text-gray-600"}`}>
          <span className="text-xl">{t.icon}</span>
          <span className="text-xs font-semibold">{t.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── CLIENT: WOD Tab ──────────────────────────────────────────────────────────
function ClientWodTab({ wods }) {
  const today = new Date().toISOString().split("T")[0];
  const todayWod = wods.find((w) => w.date === today) || wods[0];
  if (!todayWod) return (
    <div className="flex flex-col items-center justify-center h-64 text-center px-6">
      <span className="text-5xl block mb-3">😴</span>
      <p className="text-gray-500">Nessun WOD oggi</p>
    </div>
  );
  return (
    <div className="px-4 pt-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-white font-black text-xl">{todayWod.title}</h2>
          <p className="text-gray-500 text-xs mt-0.5">{new Date(todayWod.date + "T12:00:00").toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}</p>
        </div>
        <span className="text-3xl">🔥</span>
      </div>
      {todayWod.description && (
        <div className="bg-gray-900 rounded-2xl px-4 py-3 mb-3">
          <p className="text-gray-300 text-sm">{todayWod.description}</p>
        </div>
      )}
      {todayWod.exercises && todayWod.exercises.length > 0 && (
        <div className="bg-gray-900 rounded-2xl px-4 py-3 space-y-2">
          {todayWod.exercises.map((ex, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-orange-500 font-black text-sm w-5">{i + 1}.</span>
              <p className="text-white text-sm">{ex}</p>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl px-4 py-3 flex items-center justify-between">
        <span className="text-gray-400 text-sm">Tipo score</span>
        <span className="text-orange-400 font-bold text-sm">
          {todayWod.score_type === "time" ? "⏱ Tempo" : todayWod.score_type === "reps" ? "🔢 Reps" : "🏋️ Peso"}
        </span>
      </div>
    </div>
  );
}

// ─── CLIENT: Submit Result Tab ────────────────────────────────────────────────
function SubmitResultTab({ wods, results, setResults, user }) {
  const today = new Date().toISOString().split("T")[0];
  const todayWod = wods.find((w) => w.date === today) || wods[0];
  const [scoreType, setScoreType] = useState(todayWod?.score_type || "time");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [scoreVal, setScoreVal] = useState("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (todayWod) setScoreType(todayWod.score_type);
  }, [todayWod]);

  const alreadySubmitted = todayWod && results.some((r) => r.wod_id === todayWod.id && r.user_id === user.id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!todayWod) return;
    setLoading(true);
    setError("");
    let score;
    if (scoreType === "time") {
      score = (parseInt(minutes || 0) * 60) + parseInt(seconds || 0);
    } else {
      score = parseFloat(scoreVal);
    }
    if (!score || isNaN(score)) { setError("Inserisci un risultato valido"); setLoading(false); return; }
    const newResult = { wod_id: todayWod.id, user_id: user.id, user_name: user.name, score, note };
    const { data, error: err } = await supabase.from("results").insert(newResult).select().single();
    if (err) { setError("Errore nel salvataggio: " + err.message); setLoading(false); return; }
    setResults((prev) => [...prev, data]);
    setSubmitted(true);
    setLoading(false);
  };

  if (alreadySubmitted || submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-64 px-6 text-center">
        <span className="text-5xl mb-4">✅</span>
        <p className="text-white font-bold text-xl">Risultato Salvato!</p>
        <p className="text-gray-500 text-sm mt-2">Controlla la classifica!</p>
      </div>
    );
  }

  if (!todayWod) return (
    <div className="flex flex-col items-center justify-center h-64 text-center px-6">
      <span className="text-5xl block mb-3">😴</span>
      <p className="text-gray-500">Nessun WOD oggi</p>
    </div>
  );

  return (
    <div className="px-4 pt-4 pb-24">
      <h2 className="text-white font-black text-xl mb-1">Il Tuo Risultato</h2>
      <p className="text-gray-500 text-xs mb-4">{todayWod.title}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-gray-400 text-sm mb-2 block">Tipo di score</label>
          <div className="flex gap-2">
            {[{ v: "time", l: "⏱ Tempo" }, { v: "reps", l: "🔢 Reps" }, { v: "weight", l: "🏋️ Peso" }].map((s) => (
              <button key={s.v} type="button" onClick={() => setScoreType(s.v)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${scoreType === s.v ? "bg-orange-500 text-white" : "bg-gray-800 text-gray-400"}`}>
                {s.l}
              </button>
            ))}
          </div>
        </div>
        {scoreType === "time" ? (
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Tempo (min:sec)</label>
            <div className="flex gap-2">
              <input type="number" placeholder="Min" value={minutes} onChange={(e) => setMinutes(e.target.value)} min="0"
                className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-600" />
              <input type="number" placeholder="Sec" value={seconds} onChange={(e) => setSeconds(e.target.value)} min="0" max="59"
                className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-600" />
            </div>
          </div>
        ) : (
          <div>
            <label className="text-gray-400 text-sm mb-2 block">{scoreType === "weight" ? "Peso (kg)" : "Ripetizioni"}</label>
            <input type="number" placeholder={scoreType === "weight" ? "es. 80" : "es. 150"} value={scoreVal} onChange={(e) => setScoreVal(e.target.value)} min="0"
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-600" />
          </div>
        )}
        <div>
          <label className="text-gray-400 text-sm mb-2 block">Note (opzionale)</label>
          <textarea rows={2} placeholder="es. scaled, RX, commento..." value={note} onChange={(e) => setNote(e.target.value)}
            className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-600 resize-none" />
        </div>
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-xl text-base transition-all disabled:opacity-50">
          {loading ? "Salvataggio..." : "Salva Risultato 🚀"}
        </button>
      </form>
    </div>
  );
}

// ─── CLIENT: Leaderboard Tab ──────────────────────────────────────────────────
function LeaderboardTab({ wods, results }) {
  const today = new Date().toISOString().split("T")[0];
  const todayWod = wods.find((w) => w.date === today) || wods[0];
  const wodResults = todayWod ? sortResults(results.filter((r) => r.wod_id === todayWod.id), todayWod.score_type) : [];
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div className="px-4 pt-4 pb-24">
      <h2 className="text-white font-black text-xl mb-1">Classifica Oggi</h2>
      {todayWod && <p className="text-gray-500 text-xs mb-4">{todayWod.title}</p>}
      {wodResults.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-5xl block mb-3">🏁</span>
          <p className="text-gray-500">Nessun risultato ancora</p>
        </div>
      ) : (
        <div className="space-y-3">
          {wodResults.map((r, i) => (
            <div key={r.id} className={`bg-gray-900 rounded-2xl px-4 py-3 flex items-center gap-4 ${i === 0 ? "border border-yellow-600/50" : ""}`}>
              <span className="text-2xl w-8 text-center">{medals[i] || `#${i + 1}`}</span>
              <div className="flex-1">
                <p className="text-white font-bold text-sm">{r.user_name}</p>
                {r.note && <p className="text-gray-600 text-xs italic truncate">{r.note}</p>}
              </div>
              <span className="text-orange-400 font-black text-lg">{formatScore(r.score, todayWod?.score_type)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ADMIN: Results Tab ───────────────────────────────────────────────────────
function AdminResultsTab({ wods, results }) {
  const today = new Date().toISOString().split("T")[0];
  const todayWod = wods.find((w) => w.date === today) || wods[0];
  const wodResults = todayWod ? sortResults(results.filter((r) => r.wod_id === todayWod.id), todayWod.score_type) : [];
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div className="px-4 pt-4 pb-24">
      <h2 className="text-white font-black text-xl mb-1">Risultati Atleti</h2>
      <p className="text-gray-500 text-xs mb-4">{todayWod?.title}</p>
      {wodResults.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-5xl block mb-3">📋</span>
          <p className="text-gray-500">Ancora nessun risultato</p>
        </div>
      ) : (
        <div className="space-y-3">
          {wodResults.map((r, i) => (
            <div key={r.id} className="bg-gray-900 rounded-2xl px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{medals[i] || `#${i + 1}`}</span>
                  <div>
                    <p className="text-white font-bold text-sm">{r.user_name}</p>
                    <p className="text-gray-600 text-xs">{new Date(r.created_at).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
                <span className="text-orange-400 font-black">{formatScore(r.score, todayWod?.score_type)}</span>
              </div>
              {r.note && <p className="text-gray-500 text-xs mt-2 italic pl-9">"{r.note}"</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ADMIN: Athletes Tab ──────────────────────────────────────────────────────
function AthletesTab() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from("profiles").select("*").eq("role", "client").then(({ data }) => {
      setClients(data || []);
      setLoading(false);
    });
  }, []);
  if (loading) return <div className="flex items-center justify-center h-64"><span className="text-gray-500">Caricamento...</span></div>;
  return (
    <div className="px-4 pt-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-black text-xl">Atleti</h2>
        <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">{clients.length} attivi</span>
      </div>
      <div className="space-y-3">
        {clients.map((u) => (
          <div key={u.id} className="bg-gray-900 rounded-2xl px-4 py-3 flex items-center gap-4">
            <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center text-lg">
              {u.name.charAt(0)}
            </div>
            <div>
              <p className="text-white font-bold text-sm">{u.name}</p>
              <p className="text-gray-500 text-xs">{u.email}</p>
            </div>
          </div>
        ))}
        {clients.length === 0 && (
          <div className="text-center py-12">
            <span className="text-5xl block mb-3">👥</span>
            <p className="text-gray-500">Nessun atleta registrato</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ADMIN: New WOD Tab ───────────────────────────────────────────────────────
function NewWodTab({ wods, setWods }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("3 Rounds For Time:");
  const [exercises, setExercises] = useState(["", "", ""]);
  const [scoreType, setScoreType] = useState("time");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateExercise = (i, val) => { const u = [...exercises]; u[i] = val; setExercises(u); };
  const addExercise = () => setExercises([...exercises, ""]);
  const removeExercise = (i) => setExercises(exercises.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const today = new Date().toISOString().split("T")[0];
    const newWod = {
      date: today,
      title: title || "WOD – " + new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" }),
      description,
      exercises: exercises.filter(Boolean),
      score_type: scoreType,
    };
    const { data, error: err } = await supabase.from("wods").upsert(newWod, { onConflict: "date" }).select().single();
    if (err) { setError("Errore: " + err.message); setLoading(false); return; }
    setWods((prev) => [data, ...prev.filter((w) => w.date !== today)]);
    setSaved(true);
    setLoading(false);
  };

  if (saved) return (
    <div className="flex flex-col items-center justify-center h-64 px-6 text-center">
      <span className="text-5xl mb-4">✅</span>
      <p className="text-white font-bold text-xl">WOD Pubblicato!</p>
      <p className="text-gray-500 text-sm mt-2">I tuoi atleti possono vederlo adesso.</p>
      <button onClick={() => { setSaved(false); setTitle(""); setExercises(["", "", ""]); }}
        className="mt-6 bg-gray-800 text-gray-300 px-6 py-3 rounded-xl text-sm">
        Crea un altro WOD
      </button>
    </div>
  );

  return (
    <div className="px-4 pt-4 pb-24">
      <h2 className="text-white font-black text-xl mb-4">Pubblica WOD</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-gray-400 text-sm mb-1 block">Titolo (opzionale)</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="WOD – Lunedì 13 Aprile"
            className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-600" />
        </div>
        <div>
          <label className="text-gray-400 text-sm mb-1 block">Descrizione</label>
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="es. 3 Rounds For Time:"
            className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-600" />
        </div>
        <div>
          <label className="text-gray-400 text-sm mb-2 block">Esercizi</label>
          <div className="space-y-2">
            {exercises.map((ex, i) => (
              <div key={i} className="flex gap-2">
                <input type="text" value={ex} onChange={(e) => updateExercise(i, e.target.value)}
                  placeholder={`Esercizio ${i + 1}…`}
                  className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-600" />
                {exercises.length > 1 && (
                  <button type="button" onClick={() => removeExercise(i)} className="text-gray-600 px-2">✕</button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={addExercise} className="mt-2 text-orange-500 text-sm font-semibold">+ Aggiungi esercizio</button>
        </div>
        <div>
          <label className="text-gray-400 text-sm mb-2 block">Tipo di score</label>
          <div className="flex gap-2">
            {[{ v: "time", l: "⏱ Tempo" }, { v: "reps", l: "🔢 Reps" }, { v: "weight", l: "🏋️ Peso" }].map((s) => (
              <button key={s.v} type="button" onClick={() => setScoreType(s.v)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${scoreType === s.v ? "bg-orange-500 text-white" : "bg-gray-800 text-gray-400"}`}>
                {s.l}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-xl text-base transition-all">
          {loading ? "Pubblicazione..." : "Pubblica WOD 🚀"}
        </button>
      </form>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("wod");
  const [wods, setWods] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === "admin";

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        setUser({ ...session.user, name: profile?.name || session.user.email, role: profile?.role || "client" });
      }
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") { setUser(null); setActiveTab("wod"); }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load wods and results
  useEffect(() => {
    if (!user) return;
    supabase.from("wods").select("*").order("date", { ascending: false }).then(({ data }) => setWods(data || []));
    supabase.from("results").select("*").order("created_at", { ascending: false }).then(({ data }) => setResults(data || []));

    // Realtime
    const channel = supabase.channel("realtime-furor")
      .on("postgres_changes", { event: "*", schema: "public", table: "wods" }, (payload) => {
        if (payload.eventType === "INSERT") setWods((p) => [payload.new, ...p]);
        if (payload.eventType === "UPDATE") setWods((p) => p.map((w) => w.id === payload.new.id ? payload.new : w));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "results" }, (payload) => {
        setResults((p) => [payload.new, ...p]);
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setActiveTab("wod");
  };

  const renderTab = () => {
    if (isAdmin) {
      if (activeTab === "wod") return <ClientWodTab wods={wods} />;
      if (activeTab === "results") return <AdminResultsTab wods={wods} results={results} />;
      if (activeTab === "newwod") return <NewWodTab wods={wods} setWods={setWods} />;
      if (activeTab === "athletes") return <AthletesTab />;
    } else {
      if (activeTab === "wod") return <ClientWodTab wods={wods} />;
      if (activeTab === "submit") return <SubmitResultTab wods={wods} results={results} setResults={setResults} user={user} />;
      if (activeTab === "leaderboard") return <LeaderboardTab wods={wods} results={results} />;
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-3">🏋️</div>
        <p className="text-gray-500 text-sm">Caricamento...</p>
      </div>
    </div>
  );

  if (!user) return <LoginScreen onLogin={setUser} />;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-950 border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-sm">🏋️</div>
          <span className="font-black text-white">FUROR</span>
          {isAdmin && <span className="bg-orange-500/20 text-orange-400 text-xs px-2 py-0.5 rounded-full font-semibold">TRAINER</span>}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-500 text-xs">{user.name.split(" ")[0]}</span>
          <button onClick={handleLogout} className="text-gray-600 text-xs bg-gray-800 px-3 py-1.5 rounded-lg">Esci</button>
        </div>
      </div>

      {/* Content */}
      <div className="pb-24 overflow-y-auto">
        {renderTab()}
      </div>

      {/* Bottom Nav */}
      <BottomNav active={activeTab} setActiveTab={setActiveTab} isAdmin={isAdmin} />
    </div>
  );
}
