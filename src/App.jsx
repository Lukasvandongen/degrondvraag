// degrondvraag.com – volledig React‑bestand

// EXTRA DEPENDENCIES:
//   npm install react-router-dom lucide-react react-markdown remark-gfm firebase
// Tailwind: darkMode: 'class' in tailwind.config.js

import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useParams,
  useNavigate,
} from "react-router-dom";
import { Sun, Moon, ThumbsUp, ThumbsDown, Lock, LogOut, Plus } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ChatPanel from "./ChatPanel";

// --- Firebase ---
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  getDocs,
} from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInAnonymously,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ----- ESSAYS -----
// Worden gehaald uit Firebase, dit heb ik uit de code gehaald omdat je anders aardig snel richting de 2000 regels gaat.

function Comments({ articleId }) {
  const [comments, setComments] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [text, setText] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "comments"),
      where("articleId", "==", articleId),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snap) => {
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [articleId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !text) return;
    await addDoc(collection(db, "comments"), {
      articleId,
      name,
      email,
      text,
      createdAt: Date.now(),
    });
    setText("");
  };

  return (
    <section className="mt-12 space-y-6">
      <button
        onClick={() => setShowForm((v) => !v)}
        className="bg-gray-900 text-white px-4 py-2 rounded dark:bg-gray-100 dark:text-gray-900"
      >
        {showForm ? "Verberg reactieveld" : "Reageer"}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Naam"
              className="border p-2 rounded w-full bg-white dark:bg-gray-800 dark:text-white"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="E‑mail (niet gepubliceerd)"
              className="border p-2 rounded w-full bg-white dark:bg-gray-800 dark:text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <textarea
            placeholder="Jouw reactie …"
            className="border p-2 rounded w-full bg-white dark:bg-gray-800 dark:text-white"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
          />
          <button className="bg-gray-900 text-white px-4 py-2 rounded dark:bg-gray-100 dark:text-gray-900">
            Verzenden
          </button>
          <p className="text-xs text-gray-500 mt-2">
            E‑mail wordt niet gepubliceerd.
          </p>
        </form>
      )}

      {comments.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-medium">{comments.length} reacties</h4>
          {comments.map((c) => (
            <div key={c.id} className="border rounded p-4 dark:border-gray-700">
              <p className="font-semibold mb-1">{c.name}</p>
              <p className="text-sm whitespace-pre-wrap">{c.text}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Likes({ articleId }) {
  const [user, setUser] = useState(null);
  const [vote, setVote] = useState(null); // "like", "dislike" of null
  const [stats, setStats] = useState({ likes: 0, dislikes: 0 });

  useEffect(() => {
    const unsub = onAuthStateChanged(getAuth(app), (firebaseUser) => {
      setUser(firebaseUser);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const col = collection(db, "likes", articleId, "votes");
    return onSnapshot(col, (snap) => {
      let likes = 0, dislikes = 0, userVote = null;
      snap.docs.forEach((doc) => {
        if (doc.data().type === "like") likes++;
        if (doc.data().type === "dislike") dislikes++;
        if (user && doc.id === user.uid) userVote = doc.data().type;
      });
      setStats({ likes, dislikes });
      setVote(userVote);
    });
  }, [articleId, user]);

  const castVote = async (type) => {
    if (!user) return;
    const ref = doc(db, "likes", articleId, "votes", user.uid);
    if (vote === type) {
      await deleteDoc(ref);
      return;
    }
    await setDoc(ref, { type }, { merge: true });
  };

  return (
    <div className="flex items-center gap-4 text-sm">
      <button
        onClick={() => castVote("like")}
        className={`flex items-center gap-1 hover:text-green-600 transition-transform ${vote === "like" ? "scale-110 font-bold" : ""}`}
        disabled={!user}
      >
        <ThumbsUp size={16} /> {stats.likes}
      </button>
      <button
        onClick={() => castVote("dislike")}
        className={`flex items-center gap-1 hover:text-red-600 transition-transform ${vote === "dislike" ? "scale-110 font-bold" : ""}`}
        disabled={!user}
      >
        <ThumbsDown size={16} /> {stats.dislikes}
      </button>
    </div>
  );
}

// ---------------------------------------------------- PAGES ------------------------------------------------------------------------
function HomePage() {
  return (
    <section className="space-y-6 max-w-prose mx-auto">
      <h2 className="text-4xl font-semibold">Welkom bij degrondvraag</h2>
      <p>Persoonlijke essays over moraal, religie en bestaan.</p>
      <Link to="/essays" className="inline-block bg-gray-900 text-white px-4 py-2 rounded transition hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300">Lees essays</Link>
    </section>
  );
}


// ---------------------------------------------------- ESSAYS ------------------------------------------------------------------------
function EssaysoverviewPage() {
   const [essays, setEssays] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "essays"), orderBy("date", "desc"));
    return onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setEssays(docs);
    });
  }, []);

  if (!essays || essays.length === 0) {
    return <p className="text-center mt-12 text-gray-500 dark:text-gray-400">Laden...</p>;
  }

  return (
    <section className="space-y-8 max-w-4xl mx-auto">
      <h2 className="text-3xl font-semibold">Essays</h2>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {essays.map((e) => {
          const Wrapper = e.status === "published" ? Link : "div";
          return (
            <Wrapper
              key={e.id}
              to={e.status === "published" ? `/essays/${e.id}` : undefined}
              className={`border rounded-xl p-6 flex flex-col justify-between dark:border-gray-700 ${e.status === "draft" ? "opacity-60 cursor-not-allowed" : "hover:shadow-lg"}`}
            >
              <div>
                <h3 className="text-xl font-bold mb-1">{e.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{e.date}</p>
                <p className="text-sm">{e.excerpt}</p>
              </div>
              {e.status === "draft" && (
                <span className="text-xs italic text-gray-400 mt-2">
                  Dit artikel komt binnenkort beschikbaar
                </span>
              )}
            </Wrapper>
          );
        })}
      </ul>
    </section>
  );
}



function EssayPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [essay, setEssay] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [loading, setLoading] = useState(true); // <- voeg deze toe


  useEffect(() => {
  const fetchEssay = async () => {
    const docRef = doc(db, "essays", id);
    const snap = await getDoc(docRef);
    if (snap.exists() && snap.data().status === "published") {
      setEssay({ id: snap.id, ...snap.data() });
    } else {
      setEssay(null);
    }
    
    setLoading(false); // <== dit verplaatsen naar buiten de if/else!
  };
  fetchEssay();
}, [id]);

if (loading) {
  return (
    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
      Essay wordt geladen...
    </div>
  );
}

if (!essay) {
  return (
    <div className="max-w-prose mx-auto space-y-6">
      <h2 className="text-2xl font-semibold">Artikel niet beschikbaar</h2>
      <button onClick={() => navigate(-1)} className="bg-gray-900 text-white px-4 py-2 rounded dark:bg-gray-100 dark:text-gray-900">
        Terug
      </button>
    </div>
  );
}

  return (
    <>
      <article className="prose dark:prose-invert mx-auto">
        <h1>{essay.title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-between">
          {essay.date}
          {/* Zet hier je likes-component */}
        </p>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {essay.body}
        </ReactMarkdown>

        {/* Zet hier je comments-component */}
        
        <button onClick={() => navigate(-1)} className="mt-12 bg-gray-900 text-white px-4 py-2 rounded dark:bg-gray-100 dark:text-gray-900">
          Terug naar overzicht
        </button>
      </article>
    

      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 p-4 rounded-full shadow-xl hover:scale-105 transition"
        >
          Chat met Clarus
        </button>
      )}

      {chatOpen && (
        <ChatPanel essay={essay} onClose={() => setChatOpen(false)} />
      )}
    </>
  );
}


// ----------------------------------- ADMIN / AUTH / HIDDEN ENTRY -----------------------------------
function AdminEntry() {
  // Verborgen entry: triple click of lang hover op 'Over' in header
  const [hovered, setHovered] = useState(0);
  const navigate = useNavigate();
  useEffect(() => {
    if (hovered >= 4) {
      setTimeout(() => {
        navigate("/admin");
      }, 250);
    }
  }, [hovered, navigate]);
  return null;
}

function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const auth = getAuth(app);
      await signInWithEmailAndPassword(auth, email, password);
      onLogin();
    } catch (e) {
      setErr("Onjuiste inloggegevens");
    }
  };
  return (
    <form className="max-w-xs mx-auto mt-24 p-6 border rounded dark:border-gray-700" onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Lock size={18}/> Admin login</h2>
      <input className="border p-2 rounded w-full mb-2 dark:bg-gray-900" type="email" placeholder="E-mail" value={email} onChange={e=>setEmail(e.target.value)} />
      <input className="border p-2 rounded w-full mb-2 dark:bg-gray-900" type="password" placeholder="Wachtwoord" value={password} onChange={e=>setPassword(e.target.value)} />
      {err && <p className="text-red-500 text-sm mb-2">{err}</p>}
      <button className="w-full bg-gray-900 text-white px-4 py-2 rounded dark:bg-gray-100 dark:text-gray-900">Inloggen</button>
    </form>
  );
}

function AdminPanel({ user }) {
  const [essays, setEssays] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    id: "",
    excerpt: "",
    body: "",
    date: new Date().toISOString().slice(0,10),
    status: "draft",
  });
  useEffect(() => {
    const q = query(collection(db, "essays"), orderBy("date", "desc"));
    return onSnapshot(q, (snap) => {
      setEssays(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.id || !form.title) return;
    await setDoc(doc(db, "essays", form.id), { ...form });
    setShowForm(false);
    setForm({ title: "", id: "", excerpt: "", body: "", date: new Date().toISOString().slice(0,10), status: "draft" });
  };
  return (
    <div className="max-w-3xl mx-auto my-12">
      <h2 className="text-2xl font-bold mb-6">Admin Console</h2>
      <button onClick={()=>setShowForm(f=>!f)} className="mb-6 flex items-center gap-2 bg-gray-900 text-white px-3 py-2 rounded dark:bg-gray-100 dark:text-gray-900"><Plus size={16}/>Nieuw essay</button>
      {showForm && (
        <form className="space-y-4 mb-8" onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-2 gap-4">
            <input type="text" placeholder="Unieke ID (slug)" className="border p-2 rounded w-full" value={form.id} onChange={e=>setForm(f=>({...f,id:e.target.value}))} required />
            <input type="text" placeholder="Titel" className="border p-2 rounded w-full" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required />
            <input type="text" placeholder="Korte samenvatting" className="border p-2 rounded w-full col-span-2" value={form.excerpt} onChange={e=>setForm(f=>({...f,excerpt:e.target.value}))} />
            <input type="date" className="border p-2 rounded w-full" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} />
            <select className="border p-2 rounded w-full" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
              <option value="draft">Concept</option>
              <option value="published">Gepubliceerd</option>
            </select>
          </div>
          <textarea placeholder="Essay body (Markdown)" className="border p-2 rounded w-full" rows={10} value={form.body} onChange={e=>setForm(f=>({...f,body:e.target.value}))} />
          <button className="bg-gray-900 text-white px-4 py-2 rounded dark:bg-gray-100 dark:text-gray-900">Opslaan</button>
        </form>
      )}
      <div className="divide-y dark:divide-gray-800">
        {essays.map(e => (
          <div key={e.id} className="py-4 flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
            <span className="font-bold">{e.title}</span>
            <span className="text-xs text-gray-500">{e.id}</span>
            <span className="text-xs text-gray-500">{e.date}</span>
            <span className="text-xs text-gray-500">{e.status}</span>
            <button className="ml-auto text-red-500 text-xs underline" onClick={async()=>await deleteDoc(doc(db, "essays", e.id))}>Verwijder</button>
          </div>
        ))}
      </div>
    </div>
  );
}



// ----------------------------------- APP MAIN -----------------------------------
export default function App() {
  const [dark, setDark] = useDarkMode();
  const [admin, setAdmin] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const auth = getAuth(app);
    const unsub = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
      setAdmin(!!usr && usr.email); // Alleen als niet-anoniem user
    });
    signInAnonymously(auth).catch(() => {});
    return unsub;
  }, []);

  const [overHover, setOverHover] = useState(0);

  return (
    <Router>
      <div className="relative z-10 min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors">
        <header className="flex justify-between items-center px-6 py-4 max-w-4xl mx-auto">
          <Link to="/" className="text-xl font-bold">degrondvraag</Link>
          <nav className="flex gap-4 items-center">
            <Link to="/essays" className="hover:underline">Essays</Link>
            <Link
              to="/over"
              className="hover:underline cursor-pointer"
              onClick={() => setOverHover((v) => v + 1)}
              onMouseLeave={() => setOverHover(0)}
            >
              Over
            </Link>
          
            <Link to="/roadmap">Roadmap</Link>

            <button onClick={() => setDark(!dark)}>
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {admin && (
              <>
                <Link to="/admin" className="text-green-400 flex items-center gap-1 hover:underline">
                  <Plus size={16} /> Administrator
                </Link>
                <button
                  onClick={() => {
                    signOut(getAuth(app));
                    setAdmin(false);
                  }}
                  className="text-sm text-gray-500 dark:text-gray-300 hover:text-red-500"
                  title="Uitloggen"
                >
                  <LogOut size={18} />
                </button>
              </>
            )}
          </nav>
          <AdminEntry hovered={overHover} />
        </header>

        {/* rest blijft gelijk */}
        <main className="px-6 pb-12 pt-4">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/essays" element={<EssaysoverviewPage />} />
            <Route path="/essays/:id" element={<EssayPage />} />
            <Route path="/over" element={<AboutPage />} />
            <Route path="/roadmap" element={<RoadmapPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/admin" element={admin ? <AdminPanel user={user} /> : <AdminLogin onLogin={() => setAdmin(true)} />} />
          </Routes>
        </main>

        <footer className="text-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 py-6 mt-12">
          &copy; 2025 degrondvraag.com
        </footer>
      </div>
    </Router>
  );
}

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem("theme");
    return stored === "dark";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return [dark, setDark];
}

function AboutPage() {
  return (
    <section className="space-y-6 max-w-prose mx-auto">
      <h2 className="text-3xl font-semibold">Over deze site</h2>
      <p>
        Ik schrijf anoniem om het denken niet te verankeren aan één identiteit.
        Alles hier is experiment, hypothese, uitnodiging tot dialoog.
      </p>

      <h3 className="text-xl font-bold mt-6 mb-2">Disclaimers:</h3>
      <p>
        Let op: Chatgesprekken met Clarus zijn toegankelijk voor beheerders en kunnen worden gebruikt voor onderzoek en verbetering van de AI.
        Gebruik Clarus niet om breaches te zoeken of persoonlijke informatie te delen. Ik doe mijn best om de AI te verbeteren, maar het is geen vervanging voor menselijke reflectie.
      </p>

      <h3 className="text-xl font-bold mt-6 mb-2">Dan nog:</h3>
      <p>
        Degrondvraag.com is ongeveer een weekje oud. Er is een grote kans dat je hier en daar nog wat bugs tegenkomt.
        Mocht je iets tegenkomen wat niet werkt, of heb je een suggestie voor verbetering? Stuur dan een mailtje naar feedback@degrondvraag.com
      </p>
      <p>
        Deze site is gebouwd met React, Firebase en Tailwind CSS. De essays zijn geschreven in Markdown en worden dynamisch geladen.
      </p>
    </section>
  );
}


function RoadmapPage() {
  return (
    <section className="max-w-prose mx-auto space-y-6">
      <h2 className="text-3xl font-semibold">Roadmap</h2>
      <p>Deze website wordt onderhouden door één ambitieuze individu. Wat kun je verwachten op degrondvraag.com?</p>

      <div>
        <h3 className="text-xl font-bold mt-6 mb-2">In ontwikkeling</h3>
        <ul className="list-disc ml-5 space-y-1">
          <li>Google Adsense integratie (juli 2025)</li>
          <li>Essay tags, viewcount & filtermogelijkheden</li>
          <li>Verbeterde Clarus-gesprekken (sneller, contextueler)</li>
          <li>Feedback pagina (email naar info@degrondvraag.com)</li>
        </ul>
      </div>

      <div>
        <h3 className="text-xl font-bold mt-6 mb-2">Recent afgerond</h3>
        <ul className="list-disc ml-5 space-y-1">
          <li>Adminconsole gelanceerd</li>
          <li>Essay-reacties toegevoegd</li>
          <li>Chatfunctie Clarus</li>
        </ul>
      </div>
    </section>
  );
}

// PrivacyPage.jsx

function PrivacyPage() {
  return (
    <section className="max-w-prose mx-auto py-12 space-y-6">
      <h2 className="text-3xl font-bold">Privacy & Transparantie</h2>
      <p>
        <strong>Clarus</strong> is een experimenteel algoritme dat is ontworpen om de kern van deze essays op een bijzonder diep niveau te doorgronden. Het doel is niet oppervlakkig advies, maar werkelijk lucide reflectie op existentiële vragen.<br />
        </p>
      <p>
        <strong>Clarus</strong> is geen commercieel product, maar een voortdurend lerend project. Iedere dag wordt het model slimmer op basis van feedback en (anonieme) gebruikersinteracties.
      </p>
      <p>
          Omdat Clarus voortdurend leert en wordt bijgestuurd, kunnen jouw vragen en gesprekken bijdragen aan het verfijnen van zijn antwoorden. Soms reageert Clarus dus scherper, soms wellicht iets minder lucide – dat hoort bij het groeiproces van kunstmatige intelligentie.
      </p>
      <h3 className="text-xl font-semibold mt-8">Wat gebeurt er met mijn chat?</h3>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          Gesprekken met Clarus kunnen worden opgeslagen en geanalyseerd om de kwaliteit van antwoorden te verbeteren.
        </li>
        <li>
          Jouw vragen worden nooit actief verkocht of commercieel gedeeld.
        </li>
        <li>
          Deel <span className="font-bold text-red-600">geen gevoelige of persoonlijke informatie</span> in de chat.
        </li>
      </ul>
      <h3 className="text-xl font-semibold mt-8">Waarom deze aanpak?</h3>
      <p>
        Clarus is bedoeld als open denkoefening en leert voortdurend van de input die gebruikers geven. Jouw feedback maakt het systeem slimmer, eerlijker en meer afgestemd op de vragen van andere mensen.<br />
        Het systeem kan soms fouten maken; zie Clarus vooral als <span className="italic">gespreksgenoot</span>, niet als ultieme autoriteit.
      </p>
      <h3 className="text-xl font-semibold mt-8">Vragen?</h3>
      <p>
        Heb je vragen of zorgen over privacy, mail dan gerust: <a href="mailto:info@degrondvraag.com" className="text-blue-600 underline">info@degrondvraag.com</a>
      </p>
      <p className="text-xs text-gray-500">
        Laatste update: juli 2025
      </p>
    </section>
  );
}


