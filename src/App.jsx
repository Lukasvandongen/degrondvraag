import { Analytics } from "@vercel/analytics/react";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  BrowserRouter as Router,
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  FileText,
  Filter,
  Languages,
  Lock,
  LogOut,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Tag,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";
import DOMPurify from "dompurify";
import TipTapEditor from "./TipTapEditor";

const ChatPanel = lazy(() => import("./ChatPanel"));

import { initializeApp } from "firebase/app";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { getDownloadURL, getStorage, ref as storageRef, uploadBytes } from "firebase/storage";

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
const storage = getStorage(app);

const LANGUAGES = {
  nl: "Nederlands",
  en: "English",
};

const CATEGORIES = ["geloof", "filosofie", "ethiek", "AI", "maatschappij", "wetenschap"];

const categoryLabels = {
  nl: {
    geloof: "geloof",
    filosofie: "filosofie",
    ethiek: "ethiek",
    AI: "AI",
    maatschappij: "maatschappij",
    wetenschap: "wetenschap",
  },
  en: {
    geloof: "faith",
    filosofie: "philosophy",
    ethiek: "ethics",
    AI: "AI",
    maatschappij: "society",
    wetenschap: "science",
  },
};

const copy = {
  nl: {
    nav: {
      start: "Start",
      essays: "Essays",
      about: "Over",
      feedback: "Feedback",
      roadmap: "Roadmap",
      admin: "Admin",
    },
    language: {
      label: "Taal wijzigen",
      nl: "NL",
      en: "EN",
    },
    status: {
      draft: "Concept",
      published: "Live",
    },
    actions: {
      readEssays: "Lees essays",
      aboutProject: "Over het project",
      allEssays: "Alles bekijken",
      readEssay: "Lees essay",
      back: "Terug",
      backToEssays: "Terug naar essays",
      save: "Opslaan",
      saving: "Opslaan...",
      edit: "Bewerk",
      publish: "Publiceer",
      draft: "Concept",
      remove: "Verwijder",
      deleteComment: "Reactie verwijderen",
      deleteFeedback: "Feedback verwijderen",
      cancel: "Sluiten",
      reply: "Reageer",
      send: "Verzenden",
      sending: "Verzenden...",
      askClarus: "Vraag Clarus",
      refresh: "Vernieuw",
      signOut: "Uitloggen",
      newEssay: "Nieuw essay",
      toStart: "Naar start",
    },
    home: {
      badge: "Essays over geloof, moraal en bestaan",
      title: "degrondvraag",
      intro: "Een sober essayarchief voor vragen die traag, precies en zonder theatrale zekerheid onderzocht moeten worden.",
      deskEyebrow: "REDACTIONELE NOTITIE",
      deskTitle: "Wat hier verschijnt",
      deskIntro: "Geen feed, geen haastige vorm, geen decor. De site verzamelt langere stukken die een vraag vasthouden totdat de vooronderstellingen zichtbaar worden.",
      deskItems: [
        ["Vorm", "Essay, notitie, reflectie"],
        ["Toon", "Onderzoekend en academisch"],
        ["Ritme", "Onregelmatig, alleen wanneer het stuk af is"],
      ],
      latestEyebrow: "Nieuw op de site",
      latestTitle: "Laatste essays",
      noPublishedTitle: "Nog geen gepubliceerde essays",
      noPublishedBody: "Publiceer je eerste essay via het adminpaneel. De startpagina vult daarna automatisch met de nieuwste stukken.",
    },
    essays: {
      eyebrow: "Archief",
      title: "Essays",
      intro: "Filter op onderwerp of zoek direct in titels en samenvattingen.",
      search: "Zoek essays",
      all: "Alles",
      readingTime: (minutes) => `${minutes} min lezen`,
      progress: (percent) => `${percent}% gelezen`,
      outline: "Opbouw",
      emptyTitle: "Geen essays gevonden",
      emptyBody: "Pas je filters aan of publiceer een nieuw essay in het adminpaneel.",
      untitled: "Een essay zonder titel.",
      noExcerpt: "Een essay zonder samenvatting.",
      unavailableTitle: "Essay niet beschikbaar",
      unavailableBody: "Het essay bestaat niet of staat nog in concept.",
      fetchError: "Dit essay kon niet worden geladen.",
      notTranslatedTitle: "Engelse versie nog niet beschikbaar",
      notTranslatedBody: "Dit essay heeft nog geen Engelse versie in Firebase. Voeg de Engelse titel, samenvatting en body toe in het adminpaneel.",
    },
    firebase: {
      slow: "Firebase reageert traag of niet. De pagina blijft bruikbaar, maar live data ontbreekt.",
      error: "Firebase is tijdelijk niet bereikbaar. Probeer het zo opnieuw.",
      syncTitle: "Sync niet beschikbaar",
      loadTitle: "Essays konden niet laden",
      loading: "Essays laden...",
    },
    likes: {
      like: "Plaats like",
      dislike: "Plaats dislike",
      loadError: "Stemmen laden niet.",
      saveError: "Stem kon niet worden opgeslagen.",
    },
      comments: {
      title: "Reacties",
      count: (amount) => `${amount} reactie(s)`,
      name: "Naam",
      email: "E-mail optioneel",
      body: "Jouw reactie",
      wait: "Wacht even voordat je opnieuw reageert.",
      loadError: "Reacties konden niet worden geladen.",
      saveError: "Reactie kon niet worden opgeslagen.",
    },
    feedback: {
      eyebrow: "Feedback",
      title: "Anonieme feedback",
      intro: "Stuur een opmerking, foutmelding of suggestie zonder naam of e-mailadres. Je bericht wordt alleen in het adminpaneel gelezen.",
      label: "Feedback",
      placeholder: "Schrijf wat beter, onduidelijk of kapot is.",
      submit: "Verstuur feedback",
      sending: "Versturen...",
      thanksTitle: "Dank je",
      thanksBody: "Je feedback is opgeslagen.",
      required: "Schrijf eerst je feedback.",
      wait: "Wacht even voordat je opnieuw feedback verstuurt.",
      saveError: "Feedback kon niet worden opgeslagen.",
      inboxTitle: "Feedback inbox",
      emptyInbox: "Nog geen feedback ontvangen.",
      loadError: "Feedback kon niet worden geladen.",
    },
    admin: {
      eyebrow: "Admin",
      title: "Redactietafel",
      total: "Totaal",
      live: "Live",
      draft: "Concept",
      englishReady: "Engels klaar",
      translationMissing: "Vertaling mist",
      commentsTitle: "Reactiebeheer",
      commentsEmpty: "Er zijn nog geen reacties.",
      commentsLoadError: "Reacties konden niet worden geladen.",
      commentsDeleteError: "Reactie verwijderen is mislukt.",
      feedbackDeleteError: "Feedback verwijderen is mislukt.",
      clarusLogsTitle: "Clarus logs",
      clarusLogsEmpty: "Nog geen Clarus gesprekken.",
      clarusLogsLoadError: "Clarus logs konden niet worden geladen.",
      clarusLogsBackendMissing: "VITE_BACKEND_URL ontbreekt.",
      clarusLogsAuthError: "Admin token kon niet worden opgehaald.",
      clarusQuestion: "Vraag",
      clarusAnswer: "Antwoord",
      clarusError: "Fout",
      search: "Zoek titel, slug, categorie",
      all: "Alles",
      loginTitle: "Admin login",
      loginBody: "Gebruik je Firebase admin-account.",
      email: "E-mail",
      password: "Wachtwoord",
      login: "Inloggen",
      loginBusy: "Inloggen...",
      loginError: "Onjuiste inloggegevens.",
      existingEssay: "Bestaand manuscript",
      newEssay: "Nieuw manuscript",
      workingTitle: "Werk aan een manuscript",
      dutchVersion: "Nederlands",
      englishVersion: "English",
      titleLabel: "Titel",
      slugLabel: "Slug",
      dateLabel: "Datum",
      statusLabel: "Status",
      excerptLabel: "Samenvatting",
      bodyLabel: "Body",
      categoriesLabel: "Categorieen",
      preview: "Preview",
      textStats: "Tekststatistiek",
      wordCount: (amount) => `${amount} woorden`,
      readingTime: (minutes) => `${minutes} min lezen`,
      imageUploadError: "Afbeelding uploaden is mislukt. Controleer Firebase Storage.",
      englishHelp: "Vul de Engelse versie met dezelfde academische toon. Gebruik geen em-dashes.",
      dutchHelp: "De Nederlandse versie blijft de standaardversie van het essay.",
      titlePlaceholder: "Titel van het essay",
      slugPlaceholder: "automatisch-op-basis-van-titel",
      excerptPlaceholder: "Korte intro voor de overzichtspagina",
      noText: "Nog geen tekst.",
      required: "Titel en slug zijn verplicht.",
      saved: "Opgeslagen.",
      saveError: "Opslaan is mislukt. Controleer Firebase en probeer opnieuw.",
      published: "Essay gepubliceerd.",
      drafted: "Essay teruggezet naar concept.",
      statusError: "Status wijzigen is mislukt.",
      removed: "Essay verwijderd.",
      removeError: "Verwijderen is mislukt.",
      removeConfirm: (title) => `Verwijder "${title}" definitief?`,
      noEssays: "Geen essays gevonden.",
      untitled: "Zonder titel",
    },
    pages: {
      aboutEyebrow: "Over",
      aboutTitle: "Over deze site",
      about: [
        "Ik schrijf anoniem om het denken niet vast te zetten aan een enkele identiteit. De essays zijn experimenten: soms scherp, soms zoekend, altijd bedoeld als uitnodiging tot verder denken.",
        "Clarus is de reflectieve assistent bij de essays. Hij gebruikt geen Qdrant-database en geen religieuze databron, maar de essaytekst, projectcontext en vooraf geschreven instructies om vragen preciezer te maken.",
        "Gebruik de feedbackpagina voor opmerkingen, suggesties of foutmeldingen. Er is geen werkend feedbackadres per e-mail.",
      ],
      roadmapEyebrow: "Roadmap",
      roadmapTitle: "Waar de site staat",
      now: "Gerealiseerd",
      later: "Nabije toekomst",
      nowItems: [
        "V1 basis: essayarchief, individuele essaypagina's, categorieen, publicatiestatus en Firebase opslag",
        "V1 interactie: reacties, likes, dislikes en een beheeromgeving voor schrijven en publiceren",
        "V2 interface: donkerblauwe visuele laag, rustigere typografie, animatie, gradient en een praktischere navigatie",
        "V2 beheer: sneller manuscriptbeheer, Engelse velden, feedback inbox, reactiebeheer en Clarus logs",
        "Taalwisseling: Nederlands als standaardtaal en Engels als publieke optie voor sitecopy en essays",
        "Clarus opnieuw aangesloten zonder Qdrant, met streaming antwoorden, Markdown opmaak en transparante gesprekslogging",
        "Privacycorrectie: geen mailbelofte meer, anonieme feedback via Firebase en duidelijke Clarus uitleg in de chat",
      ],
      laterItems: [
        "Clarus scherper evalueren op academische toon, bronbescheidenheid, korte antwoorden en meertalige consistentie",
        "Een redactiedashboard met zoekbare feedback, Clarus sessies, publicatiegeschiedenis en duidelijke kwaliteitsnotities",
        "Essaycollecties bouwen rond terugkerende grondvragen, zodat lezers thematische routes kunnen volgen",
        "Een zorgvuldige revisielaag toevoegen waarin oudere essays zichtbaar kunnen worden bijgewerkt zonder hun geschiedenis te wissen",
        "Betere SEO en deelkaarten per essay, zodat lange stukken buiten de site serieuzer worden gepresenteerd",
        "Een lichte vorm van inhoudelijke aanbeveling bouwen die essays verbindt op thema en argument, zonder snelle feedlogica",
        "Publicatieflow verder automatiseren met preview, conceptcontrole en vertaalstatus per essay",
      ],
      privacyEyebrow: "Privacy",
      privacyTitle: "Privacy & transparantie",
      privacy: [
        "Reacties en stemmen kunnen via Firebase worden opgeslagen. E-mailadressen bij reacties worden gehasht en niet publiek getoond.",
        "Clarus gesprekken worden op de backend gelogd om fouten, stijl en bruikbaarheid te beoordelen. Deel geen persoonlijke of gevoelige informatie in de chat.",
        "Vragen of zorgen kunnen via de feedbackpagina worden gestuurd.",
      ],
      notFoundTitle: "Pagina niet gevonden",
      notFoundBody: "Deze route bestaat niet of is verplaatst.",
    },
  },
  en: {
    nav: {
      start: "Start",
      essays: "Essays",
      about: "About",
      feedback: "Feedback",
      roadmap: "Roadmap",
      admin: "Admin",
    },
    language: {
      label: "Change language",
      nl: "NL",
      en: "EN",
    },
    status: {
      draft: "Draft",
      published: "Live",
    },
    actions: {
      readEssays: "Read essays",
      aboutProject: "About the project",
      allEssays: "View all",
      readEssay: "Read essay",
      back: "Back",
      backToEssays: "Back to essays",
      save: "Save",
      saving: "Saving...",
      edit: "Edit",
      publish: "Publish",
      draft: "Draft",
      remove: "Delete",
      deleteComment: "Delete response",
      deleteFeedback: "Delete feedback",
      cancel: "Close",
      reply: "Respond",
      send: "Send",
      sending: "Sending...",
      askClarus: "Ask Clarus",
      refresh: "Refresh",
      signOut: "Sign out",
      newEssay: "New essay",
      toStart: "Go to start",
    },
    home: {
      badge: "Essays on faith, morality and existence",
      title: "degrondvraag",
      intro: "A restrained essay archive for questions that need to be examined slowly, precisely and without theatrical certainty.",
      deskEyebrow: "EDITORIAL NOTE",
      deskTitle: "What appears here",
      deskIntro: "No feed, no hurried format, no spectacle. The site gathers longer pieces that hold a question until its assumptions become visible.",
      deskItems: [
        ["Form", "Essay, note, reflection"],
        ["Register", "Inquiring and academic"],
        ["Rhythm", "Irregular, only when the piece is ready"],
      ],
      latestEyebrow: "New on the site",
      latestTitle: "Latest essays",
      noPublishedTitle: "No published essays yet",
      noPublishedBody: "Publish your first essay from the admin panel. The homepage will then fill itself with the newest pieces.",
    },
    essays: {
      eyebrow: "Archive",
      title: "Essays",
      intro: "Filter by subject or search directly through titles and summaries.",
      search: "Search essays",
      all: "All",
      readingTime: (minutes) => `${minutes} min read`,
      progress: (percent) => `${percent}% read`,
      outline: "Structure",
      emptyTitle: "No essays found",
      emptyBody: "Adjust your filters or publish a new essay in the admin panel.",
      untitled: "An untitled essay.",
      noExcerpt: "An essay without a summary.",
      unavailableTitle: "Essay unavailable",
      unavailableBody: "The essay does not exist or is still a draft.",
      fetchError: "This essay could not be loaded.",
      notTranslatedTitle: "English version not available yet",
      notTranslatedBody: "This essay does not yet have an English version in Firebase. Add the English title, summary and body in the admin panel.",
    },
    firebase: {
      slow: "Firebase is slow or unavailable. The page remains usable, but live data is missing.",
      error: "Firebase is temporarily unavailable. Please try again shortly.",
      syncTitle: "Sync unavailable",
      loadTitle: "Essays could not load",
      loading: "Loading essays...",
    },
    likes: {
      like: "Place like",
      dislike: "Place dislike",
      loadError: "Votes are not loading.",
      saveError: "Vote could not be saved.",
    },
    comments: {
      title: "Responses",
      count: (amount) => `${amount} response(s)`,
      name: "Name",
      email: "E-mail optional",
      body: "Your response",
      wait: "Wait a moment before responding again.",
      loadError: "Responses could not be loaded.",
      saveError: "Response could not be saved.",
    },
    feedback: {
      eyebrow: "Feedback",
      title: "Anonymous feedback",
      intro: "Send a note, bug report or suggestion without a name or e-mail address. Your message is only read in the admin panel.",
      label: "Feedback",
      placeholder: "Write what should be clearer, better or fixed.",
      submit: "Send feedback",
      sending: "Sending...",
      thanksTitle: "Thank you",
      thanksBody: "Your feedback has been saved.",
      required: "Write your feedback first.",
      wait: "Wait a moment before sending feedback again.",
      saveError: "Feedback could not be saved.",
      inboxTitle: "Feedback inbox",
      emptyInbox: "No feedback received yet.",
      loadError: "Feedback could not be loaded.",
    },
    admin: {
      eyebrow: "Admin",
      title: "Editorial desk",
      total: "Total",
      live: "Live",
      draft: "Draft",
      englishReady: "English ready",
      translationMissing: "Translation missing",
      commentsTitle: "Response management",
      commentsEmpty: "There are no responses yet.",
      commentsLoadError: "Responses could not be loaded.",
      commentsDeleteError: "Deleting the response failed.",
      feedbackDeleteError: "Deleting feedback failed.",
      clarusLogsTitle: "Clarus logs",
      clarusLogsEmpty: "No Clarus conversations yet.",
      clarusLogsLoadError: "Clarus logs could not be loaded.",
      clarusLogsBackendMissing: "VITE_BACKEND_URL is missing.",
      clarusLogsAuthError: "Admin token could not be retrieved.",
      clarusQuestion: "Question",
      clarusAnswer: "Answer",
      clarusError: "Error",
      search: "Search title, slug, category",
      all: "All",
      loginTitle: "Admin login",
      loginBody: "Use your Firebase admin account.",
      email: "E-mail",
      password: "Password",
      login: "Sign in",
      loginBusy: "Signing in...",
      loginError: "Incorrect credentials.",
      existingEssay: "Existing manuscript",
      newEssay: "New manuscript",
      workingTitle: "Work on a manuscript",
      dutchVersion: "Nederlands",
      englishVersion: "English",
      titleLabel: "Title",
      slugLabel: "Slug",
      dateLabel: "Date",
      statusLabel: "Status",
      excerptLabel: "Summary",
      bodyLabel: "Body",
      categoriesLabel: "Categories",
      preview: "Preview",
      textStats: "Text stats",
      wordCount: (amount) => `${amount} words`,
      readingTime: (minutes) => `${minutes} min read`,
      imageUploadError: "Image upload failed. Check Firebase Storage.",
      englishHelp: "Write the English version in the same academic register. Use no em-dashes.",
      dutchHelp: "The Dutch version remains the default version of the essay.",
      titlePlaceholder: "Essay title",
      slugPlaceholder: "automatic-from-title",
      excerptPlaceholder: "Short introduction for overview pages",
      noText: "No text yet.",
      required: "Title and slug are required.",
      saved: "Saved.",
      saveError: "Saving failed. Check Firebase and try again.",
      published: "Essay published.",
      drafted: "Essay returned to draft.",
      statusError: "Status change failed.",
      removed: "Essay deleted.",
      removeError: "Delete failed.",
      removeConfirm: (title) => `Delete "${title}" permanently?`,
      noEssays: "No essays found.",
      untitled: "Untitled",
    },
    pages: {
      aboutEyebrow: "About",
      aboutTitle: "About this site",
      about: [
        "I write anonymously so that thought is not fixed to a single identity. The essays are experiments: sometimes sharp, sometimes searching, always meant as an invitation to think further.",
        "Clarus is the reflective assistant attached to the essays. It uses no Qdrant database and no religious data source, but the essay text, project context and pre-written instructions to make questions more precise.",
        "Use the feedback page for notes, suggestions or bug reports. There is no working feedback e-mail address.",
      ],
      roadmapEyebrow: "Roadmap",
      roadmapTitle: "Where the site stands",
      now: "Shipped",
      later: "Near future",
      nowItems: [
        "V1 foundation: essay archive, individual essay pages, categories, publication status and Firebase storage",
        "V1 interaction: responses, likes, dislikes and an admin environment for writing and publishing",
        "V2 interface: dark blue visual layer, calmer typography, animation, gradient and more practical navigation",
        "V2 administration: faster manuscript management, English fields, feedback inbox, response moderation and Clarus logs",
        "Language switching: Dutch as the default language and English as a public option for site copy and essays",
        "Clarus reconnected without Qdrant, with streaming answers, Markdown formatting and transparent conversation logging",
        "Privacy correction: no mail promise, anonymous feedback through Firebase and clear Clarus disclosure inside the chat",
      ],
      laterItems: [
        "Evaluate Clarus more sharply for academic tone, source restraint, short answers and multilingual consistency",
        "Build an editorial dashboard with searchable feedback, Clarus sessions, publication history and clear quality notes",
        "Create essay collections around recurring ground questions, so readers can follow thematic routes",
        "Add a careful revision layer where older essays can be updated without erasing their history",
        "Improve SEO and essay share cards, so long pieces are presented more seriously outside the site",
        "Build a restrained recommendation layer that connects essays by theme and argument, without quick feed logic",
        "Further automate publication with preview, draft checks and translation status per essay",
      ],
      privacyEyebrow: "Privacy",
      privacyTitle: "Privacy & transparency",
      privacy: [
        "Responses and votes can be stored through Firebase. E-mail addresses attached to responses are hashed and are not shown publicly.",
        "Clarus conversations are logged on the backend to review errors, style and usefulness. Do not share personal or sensitive information in the chat.",
        "Questions or concerns can be sent through the feedback page.",
      ],
      notFoundTitle: "Page not found",
      notFoundBody: "This route does not exist or has moved.",
    },
  },
};

const SITE_NAME = "degrondvraag";
const SITE_URL = "https://degrondvraag.com";
const DEFAULT_META = {
  nl: {
    title: SITE_NAME,
    description:
      "Een sober essayarchief voor vragen over geloof, moraal en bestaan die traag en precies onderzocht moeten worden.",
  },
  en: {
    title: SITE_NAME,
    description:
      "A restrained essay archive for questions about faith, morality and existence that need slow and precise examination.",
  },
};

const createEmptyEssay = () => ({
  title: "",
  id: "",
  excerpt: "",
  body: "",
  date: new Date().toISOString().slice(0, 10),
  status: "draft",
  categories: [],
  translations: {
    en: {
      title: "",
      excerpt: "",
      body: "",
    },
  },
});

const sanitizeHTML = (html = "") => DOMPurify.sanitize(html);

const textFromHTML = (html = "") => {
  const container = document.createElement("div");
  container.innerHTML = sanitizeHTML(html);
  return container.textContent || "";
};

const toPlainMeta = (value = "", maxLength = 160) => {
  const normalized = String(value).replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  const clipped = normalized.slice(0, maxLength - 3).replace(/\s+\S*$/, "");
  return `${clipped || normalized.slice(0, maxLength - 3)}...`;
};

const formatMetaTitle = (title) => {
  const cleanTitle = toPlainMeta(title, 70);
  if (!cleanTitle || cleanTitle.toLowerCase() === SITE_NAME) return SITE_NAME;
  return `${cleanTitle} | ${SITE_NAME}`;
};

function upsertMeta(attribute, key, content) {
  let tag = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function upsertCanonical(href) {
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
}

function usePageMeta(language, { title, description, type = "website" } = {}) {
  const location = useLocation();

  useEffect(() => {
    const defaults = DEFAULT_META[language] || DEFAULT_META.nl;
    const pageTitle = formatMetaTitle(title || defaults.title);
    const pageDescription = toPlainMeta(description || defaults.description);
    const canonical = `${SITE_URL}${location.pathname}`;

    document.title = pageTitle;
    upsertMeta("name", "description", pageDescription);
    upsertMeta("property", "og:title", pageTitle);
    upsertMeta("property", "og:description", pageDescription);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("name", "twitter:card", "summary");
    upsertMeta("name", "twitter:title", pageTitle);
    upsertMeta("name", "twitter:description", pageDescription);
    upsertCanonical(canonical);
  }, [description, language, location.pathname, title, type]);
}

const getTextStats = (html = "") => {
  const words = textFromHTML(html).trim().split(/\s+/).filter(Boolean).length;
  return {
    words,
    minutes: Math.max(1, Math.ceil(words / 220)),
  };
};

const slugify = (str = "") =>
  str
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const prepareEssayContent = (html = "") => {
  const safeHTML = sanitizeHTML(html);
  const container = document.createElement("div");
  container.innerHTML = safeHTML;
  const usedIds = new Set();
  const outline = [];

  container.querySelectorAll("h2, h3").forEach((heading, index) => {
    const text = heading.textContent?.replace(/\s+/g, " ").trim();
    if (!text) return;

    const base = slugify(text) || `section-${index + 1}`;
    let id = base;
    let counter = 2;
    while (usedIds.has(id)) {
      id = `${base}-${counter}`;
      counter += 1;
    }

    usedIds.add(id);
    heading.id = id;
    heading.classList.add("scroll-mt-28");
    outline.push({
      id,
      text,
      level: heading.tagName === "H3" ? 3 : 2,
    });
  });

  return {
    html: container.innerHTML,
    outline,
  };
};

const normalizeTranslations = (essay = {}) => ({
  en: {
    title: essay.translations?.en?.title || essay.titleEn || essay.title_en || "",
    excerpt: essay.translations?.en?.excerpt || essay.excerptEn || essay.excerpt_en || "",
    body: essay.translations?.en?.body || essay.bodyEn || essay.body_en || "",
  },
});

const hasEnglishTranslation = (essay = {}) => {
  const en = normalizeTranslations(essay).en;
  return Boolean(en.title && en.excerpt && en.body);
};

const localizeEssay = (essay, language) => {
  const translations = normalizeTranslations(essay);
  if (language === "en") {
    const en = translations.en;
    const hasEnglish = Boolean(en.title || en.excerpt || en.body);
    return {
      ...essay,
      displayTitle: en.title || copy.en.essays.notTranslatedTitle,
      displayExcerpt: en.excerpt || copy.en.essays.notTranslatedBody,
      displayBody: en.body || "",
      hasRequestedLanguage: hasEnglish,
    };
  }

  return {
    ...essay,
    displayTitle: essay.title || copy.nl.essays.untitled,
    displayExcerpt: essay.excerpt || copy.nl.essays.noExcerpt,
    displayBody: essay.body || "",
    hasRequestedLanguage: true,
  };
};

const formatDate = (value, language) => {
  if (!value) return language === "en" ? "No date" : "Geen datum";
  try {
    return new Intl.DateTimeFormat(language === "en" ? "en-GB" : "nl-NL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(`${value}T00:00:00`));
  } catch {
    return value;
  }
};

async function sha256(text) {
  const enc = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", enc);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function useLanguage() {
  const [language, setLanguage] = useState(() => {
    const urlLanguage = new URLSearchParams(window.location.search).get("lang");
    if (urlLanguage === "en") return "en";
    const stored = localStorage.getItem("language");
    return stored === "en" ? "en" : "nl";
  });

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.classList.add("dark");
    localStorage.setItem("language", language);
  }, [language]);

  return [language, setLanguage];
}

function useEssays(language, includeDrafts = false) {
  const t = copy[language].firebase;
  const [state, setState] = useState({
    essays: [],
    loading: true,
    error: "",
  });

  useEffect(() => {
    let settled = false;
    const timeout = window.setTimeout(() => {
      if (!settled) {
        setState((current) => ({
          ...current,
          loading: false,
          error: t.slow,
        }));
      }
    }, 4500);

    const qRef = includeDrafts
      ? query(collection(db, "essays"), orderBy("date", "desc"))
      : query(collection(db, "essays"), where("status", "==", "published"));
    const unsubscribe = onSnapshot(
      qRef,
      (snap) => {
        settled = true;
        window.clearTimeout(timeout);
        const essays = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
        setState({
          essays,
          loading: false,
          error: "",
        });
      },
      (err) => {
        settled = true;
        window.clearTimeout(timeout);
        console.error("Essay sync failed:", err);
        setState({
          essays: [],
          loading: false,
          error: t.error,
        });
      }
    );

    return () => {
      window.clearTimeout(timeout);
      unsubscribe();
    };
  }, [includeDrafts, t.error, t.slow]);

  return state;
}

function useReadingProgress(articleRef) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const article = articleRef.current;
      if (!article) {
        setProgress(0);
        return;
      }

      const rect = article.getBoundingClientRect();
      const articleTop = window.scrollY + rect.top;
      const readableHeight = Math.max(article.offsetHeight - window.innerHeight * 0.62, 1);
      const current = window.scrollY - articleTop + window.innerHeight * 0.2;
      const nextProgress = Math.min(100, Math.max(0, Math.round((current / readableHeight) * 100)));
      setProgress(nextProgress);
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [articleRef]);

  return progress;
}

function BackgroundScene() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#020817]" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_12%,rgba(17,54,98,0.34),transparent_32%),radial-gradient(circle_at_75%_18%,rgba(14,66,112,0.16),transparent_30%),linear-gradient(135deg,#020817_0%,#06112a_48%,#010612_100%)]" />
      <div className="ink-wash ink-wash-one" />
      <div className="ink-wash ink-wash-two" />
      <div className="paper-field" />
      <div className="noise-layer" />
    </div>
  );
}

const navLinkClass = ({ isActive }) =>
  cx(
    "rounded-md px-3 py-2 text-sm font-medium transition",
    isActive ? "bg-sky-400/12 text-sky-100" : "text-slate-300 hover:bg-white/8 hover:text-white"
  );

function LanguageControl({ language, setLanguage }) {
  const t = copy[language].language;
  return (
    <div
      className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/7 p-1"
      aria-label={t.label}
      title={t.label}
    >
      <span className="grid h-8 w-8 place-items-center text-slate-200">
        <Languages size={18} />
      </span>
      {Object.keys(LANGUAGES).map((code) => (
        <button
          key={code}
          onClick={() => setLanguage(code)}
          className={cx(
            "h-8 rounded px-2 text-xs font-semibold transition",
            language === code ? "bg-sky-300 text-slate-950" : "text-slate-300 hover:bg-white/8 hover:text-white"
          )}
          aria-label={LANGUAGES[code]}
        >
          {t[code]}
        </button>
      ))}
    </div>
  );
}

function Header({ language, setLanguage, admin, onSignOut }) {
  const t = copy[language];
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#020817]/78 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-md border border-sky-300/25 bg-sky-300/10 text-sm font-black text-sky-100 shadow-[0_0_32px_rgba(14,165,233,0.18)]">
            dg
          </span>
          <span className="text-base font-semibold tracking-wide text-white">degrondvraag</span>
        </Link>

        <nav className="flex flex-wrap items-center gap-1">
          <NavLink to="/" end className={navLinkClass}>
            {t.nav.start}
          </NavLink>
          <NavLink to="/essays" className={navLinkClass}>
            {t.nav.essays}
          </NavLink>
          <NavLink to="/over" className={navLinkClass}>
            {t.nav.about}
          </NavLink>
          <NavLink to="/feedback" className={navLinkClass}>
            {t.nav.feedback}
          </NavLink>
          <NavLink to="/roadmap" className={navLinkClass}>
            {t.nav.roadmap}
          </NavLink>
          {admin && (
            <NavLink to="/admin" className={navLinkClass}>
              {t.nav.admin}
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageControl language={language} setLanguage={setLanguage} />
          {admin && (
            <button
              onClick={onSignOut}
              className="grid h-10 w-10 place-items-center rounded-md border border-white/10 bg-white/7 text-slate-300 transition hover:border-red-300/50 hover:text-red-100"
              aria-label={t.actions.signOut}
              title={t.actions.signOut}
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function StatusBadge({ status, language }) {
  const live = status === "published";
  const t = copy[language].status;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        live
          ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
          : "border-amber-300/20 bg-amber-300/10 text-amber-100"
      )}
    >
      {live ? <CheckCircle2 size={13} /> : <FileText size={13} />}
      {t[status] || status}
    </span>
  );
}

function CategoryPills({ categories = [], language }) {
  if (!categories.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <span
          key={category}
          className="inline-flex items-center gap-1 rounded-full border border-sky-300/15 bg-sky-300/8 px-2.5 py-1 text-xs text-sky-100"
        >
          <Tag size={12} />
          {categoryLabels[language][category] || category}
        </span>
      ))}
    </div>
  );
}

function EssayCard({ essay, language }) {
  const t = copy[language];
  const localized = localizeEssay(essay, language);
  return (
    <Link
      to={`/essays/${essay.id}`}
      className="group flex min-h-[250px] flex-col rounded-md border border-white/10 bg-[#071126]/72 p-5 shadow-[0_22px_70px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 hover:border-sky-200/28 hover:bg-[#09162f]/86"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-xs text-slate-400">
          <CalendarDays size={14} />
          {formatDate(essay.date, language)}
        </span>
        <span className="rounded border border-white/10 px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-slate-500">
          Essay
        </span>
      </div>

      <h3 className="text-xl font-semibold leading-snug text-white">{localized.displayTitle}</h3>
      <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-300">{localized.displayExcerpt}</p>

      <div className="mt-5">
        <CategoryPills categories={essay.categories} language={language} />
      </div>

      <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-medium text-sky-100">
        {t.actions.readEssay}
        <ArrowRight size={16} className="transition group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

function EmptyState({ title, body, action }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/45 p-8 text-center">
      <Sparkles className="mx-auto mb-4 text-sky-200" size={26} />
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">{body}</p>
      {action}
    </div>
  );
}

function HomePage({ language }) {
  const t = copy[language];
  usePageMeta(language, {
    title: t.home.title,
    description: t.home.intro,
  });
  const { essays, loading, error } = useEssays(language);
  const latest = essays.filter((essay) => essay.status === "published").slice(0, 3);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:pt-16">
      <section className="grid min-h-[62vh] items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/8 px-3 py-1 text-xs font-medium text-sky-100">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            {t.home.badge}
          </div>
          <h1 className="text-5xl font-semibold leading-[1.02] text-white sm:text-6xl lg:text-7xl">
            {t.home.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">{t.home.intro}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/essays"
              className="inline-flex items-center gap-2 rounded-md bg-sky-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-200"
            >
              {t.actions.readEssays}
              <ArrowRight size={17} />
            </Link>
            <Link
              to="/over"
              className="inline-flex items-center gap-2 rounded-md border border-white/12 bg-white/7 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-sky-300/45 hover:bg-white/10"
            >
              {t.actions.aboutProject}
            </Link>
          </div>
        </div>

        <div className="editorial-note min-h-[360px] rounded-md border border-white/10 bg-[#071126]/76 p-6 shadow-[0_28px_100px_rgba(0,0,0,0.32)]">
          <p className="text-xs uppercase tracking-[0.24em] text-sky-200/75">{t.home.deskEyebrow}</p>
          <h2 className="mt-4 max-w-sm text-3xl font-semibold leading-tight text-white">{t.home.deskTitle}</h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">{t.home.deskIntro}</p>
          <dl className="mt-8 divide-y divide-white/10 border-y border-white/10">
            {t.home.deskItems.map(([label, value]) => (
              <div key={label} className="grid gap-3 py-4 sm:grid-cols-[120px_1fr]">
                <dt className="text-sm text-slate-500">{label}</dt>
                <dd className="text-sm leading-6 text-slate-200">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mt-12">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-sky-200">{t.home.latestEyebrow}</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">{t.home.latestTitle}</h2>
          </div>
          <Link to="/essays" className="hidden items-center gap-2 text-sm font-medium text-sky-100 sm:inline-flex">
            {t.actions.allEssays} <ArrowRight size={16} />
          </Link>
        </div>

        {loading && <SkeletonGrid />}
        {error && !loading && <EmptyState title={t.firebase.syncTitle} body={error} />}
        {!loading && !error && latest.length === 0 && (
          <EmptyState title={t.home.noPublishedTitle} body={t.home.noPublishedBody} />
        )}
        {!loading && !error && latest.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            {latest.map((essay) => (
              <EssayCard key={essay.id} essay={essay} language={language} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="min-h-[220px] animate-pulse rounded-lg border border-white/10 bg-white/5 p-5">
          <div className="h-4 w-28 rounded bg-white/10" />
          <div className="mt-8 h-6 w-3/4 rounded bg-white/10" />
          <div className="mt-4 h-4 rounded bg-white/10" />
          <div className="mt-2 h-4 w-5/6 rounded bg-white/10" />
        </div>
      ))}
    </div>
  );
}

function EssaysOverviewPage({ language }) {
  const t = copy[language];
  usePageMeta(language, {
    title: t.essays.title,
    description: t.essays.intro,
  });
  const { essays, loading, error } = useEssays(language);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");

  const publishedEssays = useMemo(
    () =>
      essays
        .filter((essay) => essay.status === "published")
        .filter((essay) => selectedCategory === "all" || (essay.categories || []).includes(selectedCategory))
        .filter((essay) => {
          const needle = search.trim().toLowerCase();
          if (!needle) return true;
          const localized = localizeEssay(essay, language);
          return [localized.displayTitle, localized.displayExcerpt, essay.id, ...(essay.categories || [])]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(needle));
        }),
    [essays, language, search, selectedCategory]
  );

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-sky-200">{t.essays.eyebrow}</p>
          <h1 className="mt-2 text-4xl font-semibold text-white">{t.essays.title}</h1>
          <p className="mt-3 max-w-2xl text-slate-400">{t.essays.intro}</p>
        </div>
        <label className="relative block w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-white/10 bg-slate-950/65 py-3 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/50 focus:ring-2 focus:ring-sky-400/15"
            placeholder={t.essays.search}
          />
        </label>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory("all")}
          className={cx(
            "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition",
            selectedCategory === "all"
              ? "border-sky-300/50 bg-sky-300/12 text-sky-100"
              : "border-white/10 bg-white/5 text-slate-300 hover:border-sky-300/30"
          )}
        >
          <Filter size={15} />
          {t.essays.all}
        </button>
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={cx(
              "rounded-md border px-3 py-2 text-sm transition",
              selectedCategory === category
                ? "border-sky-300/50 bg-sky-300/12 text-sky-100"
                : "border-white/10 bg-white/5 text-slate-300 hover:border-sky-300/30"
            )}
          >
            {categoryLabels[language][category] || category}
          </button>
        ))}
      </div>

      {loading && <SkeletonGrid />}
      {error && !loading && <EmptyState title={t.firebase.loadTitle} body={error} />}
      {!loading && !error && publishedEssays.length === 0 && (
        <EmptyState title={t.essays.emptyTitle} body={t.essays.emptyBody} />
      )}
      {!loading && !error && publishedEssays.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {publishedEssays.map((essay) => (
            <EssayCard key={essay.id} essay={essay} language={language} />
          ))}
        </div>
      )}
    </section>
  );
}

function ReadingCompass({ progress, outline, stats, language }) {
  const t = copy[language].essays;

  return (
    <>
      <div className="fixed inset-x-0 top-[65px] z-30 h-px bg-white/8" aria-hidden="true">
        <div
          className="h-full bg-sky-300 shadow-[0_0_18px_rgba(125,211,252,0.65)] transition-[width] duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      <aside className="fixed bottom-5 left-5 z-30 hidden w-[250px] 2xl:block">
        <div className="rounded-lg border border-white/10 bg-[#071126]/86 p-4 shadow-[0_22px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-300">
              <FileText size={14} />
              {t.readingTime(stats.minutes)}
            </div>
            <span className="rounded border border-sky-300/20 bg-sky-300/10 px-2 py-1 text-[11px] font-semibold text-sky-100">
              {t.progress(progress)}
            </span>
          </div>

          {outline.length > 0 && (
            <nav className="mt-3" aria-label={t.outline}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t.outline}</p>
              <ol className="max-h-[36vh] space-y-1 overflow-y-auto pr-1">
                {outline.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className={cx(
                        "block rounded px-2 py-1.5 text-xs leading-5 text-slate-400 transition hover:bg-white/7 hover:text-sky-100",
                        item.level === 3 && "pl-5"
                      )}
                    >
                      {item.text}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}
        </div>
      </aside>
    </>
  );
}

function EssayPage({ language }) {
  const t = copy[language];
  const { id } = useParams();
  const navigate = useNavigate();
  const [essay, setEssay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const articleRef = useRef(null);
  const localized = essay ? localizeEssay(essay, language) : null;
  const preparedContent = useMemo(
    () => prepareEssayContent(localized?.displayBody || ""),
    [localized?.displayBody]
  );
  const readingStats = useMemo(() => getTextStats(localized?.displayBody || ""), [localized?.displayBody]);
  const readingProgress = useReadingProgress(articleRef);

  usePageMeta(language, {
    title: localized?.hasRequestedLanguage ? localized.displayTitle : t.essays.title,
    description: localized?.hasRequestedLanguage
      ? localized.displayExcerpt || textFromHTML(localized.displayBody)
      : error || t.essays.intro,
    type: "article",
  });

  useEffect(() => {
    let cancelled = false;

    const fetchEssay = async () => {
      try {
        setLoading(true);
        const snap = await getDoc(doc(db, "essays", id));
        if (cancelled) return;
        if (snap.exists() && snap.data().status === "published") {
          setEssay({ id: snap.id, ...snap.data() });
          setError("");
        } else {
          setEssay(null);
          setError(t.essays.unavailableBody);
        }
      } catch (err) {
        console.error("Essay fetch failed:", err);
        if (!cancelled) {
          setEssay(null);
          setError(t.essays.fetchError);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchEssay();
    return () => {
      cancelled = true;
    };
  }, [id, t.essays.fetchError, t.essays.unavailableBody]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="h-5 w-32 animate-pulse rounded bg-white/10" />
        <div className="mt-8 h-12 w-3/4 animate-pulse rounded bg-white/10" />
        <div className="mt-8 space-y-3">
          <div className="h-4 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-white/10" />
        </div>
      </div>
    );
  }

  if (!essay) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          title={t.essays.unavailableTitle}
          body={error || t.essays.unavailableBody}
          action={
            <button
              onClick={() => navigate("/essays")}
              className="mt-5 inline-flex items-center gap-2 rounded-md bg-sky-300 px-4 py-2.5 text-sm font-semibold text-slate-950"
            >
              <ArrowLeft size={16} />
              {t.actions.backToEssays}
            </button>
          }
        />
      </section>
    );
  }

  const clarusEssay = {
    ...essay,
    title: localized.displayTitle,
    body: localized.displayBody,
  };

  if (!localized.hasRequestedLanguage) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          title={t.essays.notTranslatedTitle}
          body={t.essays.notTranslatedBody}
          action={
            <button
              onClick={() => navigate("/essays")}
              className="mt-5 inline-flex items-center gap-2 rounded-md bg-sky-300 px-4 py-2.5 text-sm font-semibold text-slate-950"
            >
              <ArrowLeft size={16} />
              {t.actions.backToEssays}
            </button>
          }
        />
      </section>
    );
  }

  return (
    <>
      <ReadingCompass
        progress={readingProgress}
        outline={preparedContent.outline}
        stats={readingStats}
        language={language}
      />

      <article ref={articleRef} className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-8 inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/6 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-sky-300/35 hover:text-white"
      >
        <ArrowLeft size={16} />
        {t.actions.back}
      </button>

      <header className="border-b border-white/10 pb-8">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 text-sm text-slate-400">
            <CalendarDays size={16} />
            {formatDate(essay.date, language)}
          </span>
          <span className="inline-flex items-center gap-2 text-sm text-slate-400">
            <FileText size={16} />
            {t.essays.readingTime(readingStats.minutes)}
          </span>
          <CategoryPills categories={essay.categories} language={language} />
        </div>
        <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">{localized.displayTitle}</h1>
        {localized.displayExcerpt && <p className="mt-5 text-lg leading-8 text-slate-300">{localized.displayExcerpt}</p>}
        <div className="mt-6">
          <Likes articleId={essay.id} language={language} />
        </div>
      </header>

      <div
        className="prose prose-invert prose-slate mt-10 max-w-none prose-headings:text-white prose-a:text-sky-200 prose-strong:text-white"
        dangerouslySetInnerHTML={{ __html: preparedContent.html }}
      />

      <Comments articleId={essay.id} language={language} />
      </article>

      <button
        type="button"
        onClick={() => setChatOpen(true)}
        className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 rounded-md border border-sky-300/30 bg-sky-300 px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_42px_rgba(14,165,233,0.26)] transition hover:bg-sky-200"
      >
        <Sparkles size={17} />
        {t.actions.askClarus}
      </button>

      {chatOpen && (
        <Suspense fallback={null}>
          <ChatPanel essay={clarusEssay} language={language} onClose={() => setChatOpen(false)} />
        </Suspense>
      )}
    </>
  );
}

function Likes({ articleId, language }) {
  const t = copy[language].likes;
  const [user, setUser] = useState(null);
  const [vote, setVote] = useState(null);
  const [stats, setStats] = useState({ likes: 0, dislikes: 0 });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => onAuthStateChanged(getAuth(app), setUser), []);

  useEffect(() => {
    const col = collection(db, "likes", articleId, "votes");
    return onSnapshot(
      col,
      (snap) => {
        let likes = 0;
        let dislikes = 0;
        let userVote = null;
        snap.docs.forEach((d) => {
          if (d.data().type === "like") likes += 1;
          if (d.data().type === "dislike") dislikes += 1;
          if (user && d.id === user.uid) userVote = d.data().type;
        });
        setStats({ likes, dislikes });
        setVote(userVote);
        setError("");
      },
      (err) => {
        console.error("Like sync failed:", err);
        setError(t.loadError);
      }
    );
  }, [articleId, t.loadError, user]);

  const castVote = async (type) => {
    if (!user || pending) return;
    const ref = doc(db, "likes", articleId, "votes", user.uid);
    try {
      setPending(true);
      setError("");
      if (vote === type) {
        await deleteDoc(ref);
      } else {
        await setDoc(ref, { type }, { merge: true });
      }
    } catch (err) {
      console.error("Vote failed:", err);
      setError(t.saveError);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={() => castVote("like")}
        className={cx(
          "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-50",
          vote === "like"
            ? "border-emerald-300/35 bg-emerald-300/12 text-emerald-100"
            : "border-white/10 bg-white/5 text-slate-300 hover:border-emerald-300/30"
        )}
        disabled={!user || pending}
        aria-label={t.like}
        aria-pressed={vote === "like"}
      >
        <ThumbsUp size={16} />
        {stats.likes}
      </button>
      <button
        onClick={() => castVote("dislike")}
        className={cx(
          "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-50",
          vote === "dislike"
            ? "border-red-300/35 bg-red-300/12 text-red-100"
            : "border-white/10 bg-white/5 text-slate-300 hover:border-red-300/30"
        )}
        disabled={!user || pending}
        aria-label={t.dislike}
        aria-pressed={vote === "dislike"}
      >
        <ThumbsDown size={16} />
        {stats.dislikes}
      </button>
      {error && <span className="text-xs text-amber-200">{error}</span>}
    </div>
  );
}

function Comments({ articleId, language }) {
  const t = copy[language].comments;
  const [comments, setComments] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [text, setText] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const qRef = query(
      collection(db, "comments"),
      where("articleId", "==", articleId),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(
      qRef,
      (snap) => {
        setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setError("");
      },
      (err) => {
        console.error("Comment sync failed:", err);
        setError(t.loadError);
      }
    );
  }, [articleId, t.loadError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting || !name.trim() || !text.trim() || honeypot) return;

    const last = Number(localStorage.getItem("dgq:lastComment")) || 0;
    if (Date.now() - last < 60_000) {
      setError(t.wait);
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const emailHash = email ? await sha256(email.trim().toLowerCase()) : null;
      await addDoc(collection(db, "comments"), {
        articleId,
        name: name.trim().slice(0, 120),
        text: text.trim().slice(0, 5000),
        emailHash,
        createdAt: serverTimestamp(),
      });
      setText("");
      setShowForm(false);
      localStorage.setItem("dgq:lastComment", String(Date.now()));
    } catch (err) {
      console.error("Comment save failed:", err);
      setError(t.saveError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-14 border-t border-white/10 pt-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">{t.title}</h2>
          <p className="mt-1 text-sm text-slate-400">{t.count(comments.length)}</p>
        </div>
        <button
          onClick={() => setShowForm((value) => !value)}
          className="inline-flex items-center gap-2 rounded-md border border-sky-300/25 bg-sky-300/10 px-4 py-2.5 text-sm font-semibold text-sky-100 transition hover:border-sky-300/50"
        >
          {showForm ? <X size={16} /> : <Send size={16} />}
          {showForm ? copy[language].actions.cancel : copy[language].actions.reply}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-lg border border-white/10 bg-slate-950/45 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              type="text"
              placeholder={t.name}
              className="field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={120}
            />
            <input
              type="email"
              placeholder={t.email}
              className="field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="text"
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>
          <textarea
            placeholder={t.body}
            className="field min-h-32 resize-y"
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            maxLength={5000}
          />
          <button
            className="inline-flex items-center gap-2 rounded-md bg-sky-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-200 disabled:opacity-60"
            disabled={submitting}
            aria-busy={submitting}
          >
            <Send size={16} />
            {submitting ? copy[language].actions.sending : copy[language].actions.send}
          </button>
        </form>
      )}

      {error && <p className="mt-4 rounded-md border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">{error}</p>}

      {comments.length > 0 && (
        <div className="mt-6 space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="font-semibold text-white">{comment.name}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">{comment.text}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function FeedbackPage({ language }) {
  const t = copy[language].feedback;
  usePageMeta(language, {
    title: t.title,
    description: t.intro,
  });
  const [text, setText] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) {
      setError(t.required);
      return;
    }
    if (honeypot || submitting) return;

    const last = Number(localStorage.getItem("dgq:lastFeedback")) || 0;
    if (Date.now() - last < 60_000) {
      setError(t.wait);
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      await addDoc(collection(db, "feedback"), {
        text: value.slice(0, 5000),
        language,
        page: window.location.pathname,
        createdAt: serverTimestamp(),
        status: "new",
      });
      localStorage.setItem("dgq:lastFeedback", String(Date.now()));
      setText("");
      setDone(true);
    } catch (err) {
      console.error("Feedback save failed:", err);
      setError(t.saveError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="text-sm font-medium text-sky-200">{t.eyebrow}</p>
      <h1 className="mt-2 text-4xl font-semibold text-white">{t.title}</h1>
      <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">{t.intro}</p>

      {done ? (
        <div className="mt-8">
          <EmptyState title={t.thanksTitle} body={t.thanksBody} />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-md border border-white/10 bg-[#071126]/72 p-5">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-300">{t.label}</span>
            <textarea
              className="field min-h-48 resize-y"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t.placeholder}
              maxLength={5000}
              required
            />
          </label>
          <input
            type="text"
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
          {error && <p className="rounded-md border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">{error}</p>}
          <button
            className="inline-flex items-center gap-2 rounded-md bg-sky-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-200 disabled:opacity-60"
            disabled={submitting}
            aria-busy={submitting}
          >
            <Send size={16} />
            {submitting ? t.sending : t.submit}
          </button>
        </form>
      )}
    </section>
  );
}

function AdminLogin({ language, onLogin }) {
  const t = copy[language].admin;
  usePageMeta(language, {
    title: t.loginTitle,
    description: t.loginBody,
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      setLoading(true);
      await signInWithEmailAndPassword(getAuth(app), email, password);
      onLogin();
    } catch (error) {
      console.error("Admin login failed:", error);
      setErr(t.loginError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12">
      <form onSubmit={handleSubmit} className="w-full rounded-lg border border-white/10 bg-slate-950/55 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.35)]">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-sky-300/10 text-sky-100">
            <Lock size={18} />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-white">{t.loginTitle}</h1>
            <p className="text-sm text-slate-400">{t.loginBody}</p>
          </div>
        </div>
        <div className="space-y-3">
          <input
            className="field"
            type="email"
            placeholder={t.email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <input
            className="field"
            type="password"
            placeholder={t.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        {err && <p className="mt-3 text-sm text-red-200">{err}</p>}
        <button
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-sky-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-200 disabled:opacity-60"
          disabled={loading}
        >
          <ShieldCheck size={17} />
          {loading ? t.loginBusy : t.login}
        </button>
      </form>
    </section>
  );
}

const formatStoredDate = (value, language) => {
  if (!value) return "";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(language === "en" ? "en-GB" : "nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const cleanStorageName = (value = "image") =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "image";

function AdminFeedbackInbox({ language }) {
  const t = copy[language];
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const qRef = query(collection(db, "feedback"), orderBy("createdAt", "desc"));
    return onSnapshot(
      qRef,
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
        setError("");
      },
      (err) => {
        console.error("Feedback inbox sync failed:", err);
        setLoading(false);
        setError(t.feedback.loadError);
      }
    );
  }, [t.feedback.loadError]);

  const removeFeedback = async (id) => {
    try {
      setError("");
      await deleteDoc(doc(db, "feedback", id));
    } catch (err) {
      console.error("Feedback delete failed:", err);
      setError(t.admin.feedbackDeleteError);
    }
  };

  return (
    <section className="rounded-lg border border-white/10 bg-slate-950/52 p-4">
      <div className="mb-4 flex items-center gap-3">
        <MessageSquare className="text-sky-200" size={18} />
        <div>
          <h2 className="text-lg font-semibold text-white">{t.feedback.inboxTitle}</h2>
          <p className="text-sm text-slate-500">{items.length} {t.nav.feedback.toLowerCase()}</p>
        </div>
      </div>
      {error && <p className="mb-3 rounded-md border border-red-300/20 bg-red-300/10 px-3 py-2 text-sm text-red-100">{error}</p>}
      {loading && <p className="text-sm text-slate-400">{t.firebase.loading}</p>}
      {!loading && items.length === 0 && <p className="text-sm text-slate-400">{t.feedback.emptyInbox}</p>}
      <div className="space-y-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-md border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>{formatStoredDate(item.createdAt, language)}</span>
              <span className="rounded border border-white/10 px-2 py-1 uppercase tracking-[0.14em]">{item.language || "nl"}</span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-200">{item.text}</p>
            <button
              type="button"
              onClick={() => removeFeedback(item.id)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-red-100 hover:border-red-300/35"
            >
              <Trash2 size={13} />
              {t.actions.deleteFeedback}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function AdminCommentsPanel({ language }) {
  const t = copy[language];
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const qRef = query(collection(db, "comments"), orderBy("createdAt", "desc"));
    return onSnapshot(
      qRef,
      (snap) => {
        setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
        setError("");
      },
      (err) => {
        console.error("Admin comments sync failed:", err);
        setLoading(false);
        setError(t.admin.commentsLoadError);
      }
    );
  }, [t.admin.commentsLoadError]);

  const removeComment = async (id) => {
    try {
      setError("");
      await deleteDoc(doc(db, "comments", id));
    } catch (err) {
      console.error("Comment delete failed:", err);
      setError(t.admin.commentsDeleteError);
    }
  };

  return (
    <section className="rounded-lg border border-white/10 bg-slate-950/52 p-4">
      <div className="mb-4 flex items-center gap-3">
        <MessageSquare className="text-sky-200" size={18} />
        <div>
          <h2 className="text-lg font-semibold text-white">{t.admin.commentsTitle}</h2>
          <p className="text-sm text-slate-500">{comments.length} {t.comments.title.toLowerCase()}</p>
        </div>
      </div>
      {error && <p className="mb-3 rounded-md border border-red-300/20 bg-red-300/10 px-3 py-2 text-sm text-red-100">{error}</p>}
      {loading && <p className="text-sm text-slate-400">{t.firebase.loading}</p>}
      {!loading && comments.length === 0 && <p className="text-sm text-slate-400">{t.admin.commentsEmpty}</p>}
      <div className="space-y-3">
        {comments.map((comment) => (
          <article key={comment.id} className="rounded-md border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>{comment.articleId}</span>
              <span>{formatStoredDate(comment.createdAt, language)}</span>
            </div>
            <p className="font-semibold text-white">{comment.name || "Anoniem"}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-200">{comment.text}</p>
            <button
              type="button"
              onClick={() => removeComment(comment.id)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-red-100 hover:border-red-300/35"
            >
              <Trash2 size={13} />
              {t.actions.deleteComment}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function AdminClarusLogsPanel({ language }) {
  const t = copy[language];
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadLogs = async () => {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      if (!backendUrl) {
        setError(t.admin.clarusLogsBackendMissing);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const currentUser = getAuth(app).currentUser;
        const token = await currentUser?.getIdToken(true);
        if (!token) throw new Error(t.admin.clarusLogsAuthError);

        const res = await fetch(`${backendUrl}/admin/clarus/logs?limit=80`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || t.admin.clarusLogsLoadError);
        if (!cancelled) setLogs(Array.isArray(data.logs) ? data.logs : []);
      } catch (err) {
        console.error("Clarus logs load failed:", err);
        if (!cancelled) setError(err instanceof Error ? err.message : t.admin.clarusLogsLoadError);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadLogs();
    return () => {
      cancelled = true;
    };
  }, [
    reloadKey,
    t.admin.clarusLogsAuthError,
    t.admin.clarusLogsBackendMissing,
    t.admin.clarusLogsLoadError,
  ]);

  return (
    <section className="rounded-lg border border-white/10 bg-slate-950/52 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-sky-200" size={18} />
          <div>
            <h2 className="text-lg font-semibold text-white">{t.admin.clarusLogsTitle}</h2>
            <p className="text-sm text-slate-500">{logs.length} {t.admin.clarusLogsTitle.toLowerCase()}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setReloadKey((value) => value + 1)}
          className="grid h-9 w-9 place-items-center rounded-md border border-white/10 bg-white/6 text-slate-300 transition hover:border-sky-300/35 hover:text-white"
          aria-label={t.actions.refresh}
          title={t.actions.refresh}
          disabled={loading}
        >
          <RefreshCcw size={15} />
        </button>
      </div>
      {error && <p className="mb-3 rounded-md border border-red-300/20 bg-red-300/10 px-3 py-2 text-sm text-red-100">{error}</p>}
      {loading && <p className="text-sm text-slate-400">{t.firebase.loading}</p>}
      {!loading && logs.length === 0 && !error && <p className="text-sm text-slate-400">{t.admin.clarusLogsEmpty}</p>}
      <div className="space-y-3">
        {logs.map((entry) => (
          <article key={entry.id} className="rounded-md border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>{formatStoredDate(entry.timestamp, language)}</span>
              <span className="rounded border border-white/10 px-2 py-1">{entry.model || "model unknown"}</span>
            </div>
            {(entry.essayTitle || entry.essayId) && (
              <p className="mb-3 text-xs text-sky-100">{entry.essayTitle || entry.essayId}</p>
            )}
            <div className="space-y-3 text-sm leading-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{t.admin.clarusQuestion}</p>
                <p className="mt-1 whitespace-pre-wrap text-slate-200">{entry.question}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {entry.error ? t.admin.clarusError : t.admin.clarusAnswer}
                </p>
                <p className={entry.error ? "mt-1 whitespace-pre-wrap text-red-100" : "mt-1 whitespace-pre-wrap text-slate-300"}>
                  {entry.error || entry.answer}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function AdminPanel({ language, onSignOut }) {
  const t = copy[language];
  usePageMeta(language, {
    title: t.admin.title,
    description: t.admin.workingTitle,
  });
  const { essays, loading, error: syncError } = useEssays(language, true);
  const [form, setForm] = useState(createEmptyEssay);
  const [editorLanguage, setEditorLanguage] = useState("nl");
  const [isEditing, setIsEditing] = useState(false);
  const [idTouched, setIdTouched] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const stats = useMemo(
    () => ({
      total: essays.length,
      published: essays.filter((essay) => essay.status === "published").length,
      draft: essays.filter((essay) => essay.status !== "published").length,
      englishReady: essays.filter((essay) => hasEnglishTranslation(essay)).length,
    }),
    [essays]
  );

  const filteredEssays = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return essays.filter((essay) => {
      const localized = localizeEssay(essay, language);
      const statusMatch = statusFilter === "all" || essay.status === statusFilter;
      const searchMatch =
        !needle ||
        [essay.title, localized.displayTitle, essay.id, essay.excerpt, localized.displayExcerpt, ...(essay.categories || [])]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(needle));
      return statusMatch && searchMatch;
    });
  }, [essays, language, search, statusFilter]);

  const startNew = () => {
    setForm(createEmptyEssay());
    setIsEditing(false);
    setIdTouched(false);
    setEditorLanguage("nl");
    setNotice("");
    setError("");
  };

  const handleEdit = (essay) => {
    const translations = normalizeTranslations(essay);
    setForm({
      title: essay.title || "",
      id: essay.id || "",
      excerpt: essay.excerpt || "",
      body: essay.body || "",
      date: essay.date || new Date().toISOString().slice(0, 10),
      status: essay.status || "draft",
      categories: essay.categories || [],
      translations,
    });
    setIsEditing(true);
    setIdTouched(true);
    setEditorLanguage(language === "en" ? "en" : "nl");
    setNotice("");
    setError("");
  };

  const currentText = editorLanguage === "en" ? form.translations.en : form;
  const editorHelp = editorLanguage === "en" ? t.admin.englishHelp : t.admin.dutchHelp;
  const editorStats = useMemo(() => getTextStats(currentText.body), [currentText.body]);

  const uploadEssayImage = async (file) => {
    const essayId = slugify(form.id || form.title || "draft");
    if (!essayId) throw new Error(t.admin.imageUploadError);
    const extension = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
    const safeName = cleanStorageName(file.name || `image.${extension}`);
    const path = `essays/${essayId}/${Date.now()}-${safeName}`;
    const imageRef = storageRef(storage, path);
    await uploadBytes(imageRef, file, {
      contentType: file.type || "image/jpeg",
      customMetadata: {
        essayId,
        language: editorLanguage,
      },
    });
    return getDownloadURL(imageRef);
  };

  const setLocalizedField = (field, value) => {
    if (editorLanguage === "en") {
      setForm((current) => ({
        ...current,
        translations: {
          ...current.translations,
          en: {
            ...current.translations.en,
            [field]: value,
          },
        },
      }));
      return;
    }

    if (field === "title") {
      setForm((current) => ({
        ...current,
        title: value,
        id: !isEditing && !idTouched ? slugify(value) : current.id,
      }));
      return;
    }

    setForm((current) => ({ ...current, [field]: value }));
  };

  const toggleCategory = (category) => {
    setForm((current) => {
      const hasCategory = current.categories.includes(category);
      return {
        ...current,
        categories: hasCategory
          ? current.categories.filter((item) => item !== category)
          : [...current.categories, category],
      };
    });
  };

  const saveEssay = async (e) => {
    e.preventDefault();
    const id = isEditing ? form.id : slugify(form.id || form.title);
    if (!id || !form.title.trim()) {
      setError(t.admin.required);
      return;
    }

    try {
      setSaving(true);
      setError("");
      setNotice("");

      const en = {
        title: form.translations.en.title.trim(),
        excerpt: form.translations.en.excerpt.trim(),
        body: sanitizeHTML(form.translations.en.body),
      };

      const payload = {
        id,
        title: form.title.trim(),
        excerpt: form.excerpt.trim(),
        body: sanitizeHTML(form.body),
        date: form.date,
        status: form.status,
        categories: form.categories,
        translations: {
          en,
        },
        titleEn: en.title,
        excerptEn: en.excerpt,
        bodyEn: en.body,
        updatedAt: serverTimestamp(),
      };
      if (!isEditing) payload.createdAt = serverTimestamp();

      await setDoc(doc(db, "essays", id), payload, { merge: true });
      setForm((current) => ({ ...current, id }));
      setIsEditing(true);
      setIdTouched(true);
      setNotice(t.admin.saved);
    } catch (err) {
      console.error("Essay save failed:", err);
      setError(t.admin.saveError);
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (essay, nextStatus) => {
    try {
      setError("");
      await setDoc(
        doc(db, "essays", essay.id),
        { status: nextStatus, updatedAt: serverTimestamp() },
        { merge: true }
      );
      setNotice(nextStatus === "published" ? t.admin.published : t.admin.drafted);
      if (form.id === essay.id) setForm((current) => ({ ...current, status: nextStatus }));
    } catch (err) {
      console.error("Status update failed:", err);
      setError(t.admin.statusError);
    }
  };

  const removeEssay = async (essay) => {
    if (!confirm(t.admin.removeConfirm(essay.title || essay.id))) return;
    try {
      setError("");
      await deleteDoc(doc(db, "essays", essay.id));
      if (form.id === essay.id) startNew();
      setNotice(t.admin.removed);
    } catch (err) {
      console.error("Essay delete failed:", err);
      setError(t.admin.removeError);
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-medium text-sky-200">
            <ShieldCheck size={16} />
            {t.admin.eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">{t.admin.title}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={startNew}
            className="inline-flex items-center gap-2 rounded-md bg-sky-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-200"
          >
            <Plus size={17} />
            {t.actions.newEssay}
          </button>
          <button
            onClick={onSignOut}
            className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/6 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-red-300/40 hover:text-red-100"
          >
            <LogOut size={17} />
            {t.actions.signOut}
          </button>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStat label={t.admin.total} value={stats.total} />
        <AdminStat label={t.admin.live} value={stats.published} tone="green" />
        <AdminStat label={t.admin.draft} value={stats.draft} tone="amber" />
        <AdminStat label={t.admin.englishReady} value={stats.englishReady} tone="blue" />
      </div>

      {(syncError || error || notice) && (
        <div className="mb-5 space-y-2">
          {syncError && <p className="rounded-md border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">{syncError}</p>}
          {error && <p className="rounded-md border border-red-300/20 bg-red-300/10 px-3 py-2 text-sm text-red-100">{error}</p>}
          {notice && <p className="rounded-md border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-sm text-emerald-100">{notice}</p>}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(320px,0.82fr)_minmax(0,1.35fr)]">
        <aside className="rounded-lg border border-white/10 bg-slate-950/52 p-4">
          <div className="space-y-3">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
              <input
                className="field pl-10"
                placeholder={t.admin.search}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                ["all", t.admin.all],
                ["published", t.admin.live],
                ["draft", t.admin.draft],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setStatusFilter(value)}
                  className={cx(
                    "rounded-md border px-3 py-2 text-sm transition",
                    statusFilter === value
                      ? "border-sky-300/50 bg-sky-300/12 text-sky-100"
                      : "border-white/10 bg-white/5 text-slate-300 hover:border-sky-300/30"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 max-h-[780px] space-y-2 overflow-y-auto pr-1">
            {loading && <p className="p-3 text-sm text-slate-400">{t.firebase.loading}</p>}
            {!loading && filteredEssays.length === 0 && (
              <p className="rounded-md border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                {t.admin.noEssays}
              </p>
            )}
            {filteredEssays.map((essay) => {
              const localized = localizeEssay(essay, language);
              const englishReady = hasEnglishTranslation(essay);
              return (
                <div
                  key={essay.id}
                  className={cx(
                    "rounded-md border p-3 transition",
                    form.id === essay.id
                      ? "border-sky-300/45 bg-sky-300/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  )}
                >
                  <button onClick={() => handleEdit(essay)} className="block w-full text-left">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold leading-snug text-white">{localized.displayTitle || t.admin.untitled}</h3>
                        <p className="mt-1 text-xs text-slate-500">{essay.id}</p>
                      </div>
                      <StatusBadge status={essay.status} language={language} />
                    </div>
                    <p className="mt-2 text-xs text-slate-400">{formatDate(essay.date, language)}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded border border-slate-400/20 bg-white/5 px-2 py-1 text-[11px] font-semibold text-slate-300">
                        NL
                      </span>
                      <span
                        className={cx(
                          "rounded border px-2 py-1 text-[11px] font-semibold",
                          englishReady
                            ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
                            : "border-amber-300/25 bg-amber-300/10 text-amber-100"
                        )}
                      >
                        {englishReady ? "EN" : t.admin.translationMissing}
                      </span>
                    </div>
                  </button>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(essay)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-slate-200 hover:border-sky-300/35"
                    >
                      <Pencil size={13} />
                      {t.actions.edit}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatus(essay, essay.status === "published" ? "draft" : "published")}
                      className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-slate-200 hover:border-emerald-300/35"
                    >
                      <CheckCircle2 size={13} />
                      {essay.status === "published" ? t.actions.draft : t.actions.publish}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeEssay(essay)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-red-100 hover:border-red-300/35"
                    >
                      <Trash2 size={13} />
                      {t.actions.remove}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        <form onSubmit={saveEssay} className="rounded-lg border border-white/10 bg-slate-950/52 p-4 sm:p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <p className="text-sm text-slate-400">{isEditing ? t.admin.existingEssay : t.admin.newEssay}</p>
              <h2 className="text-xl font-semibold text-white">{currentText.title || form.title || t.admin.workingTitle}</h2>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-sky-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-200 disabled:opacity-60"
            >
              <Save size={17} />
              {saving ? t.actions.saving : t.actions.save}
            </button>
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            {[
              ["nl", t.admin.dutchVersion],
              ["en", t.admin.englishVersion],
            ].map(([code, label]) => (
              <button
                key={code}
                type="button"
                onClick={() => setEditorLanguage(code)}
                className={cx(
                  "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition",
                  editorLanguage === code
                    ? "border-sky-300/50 bg-sky-300/12 text-sky-100"
                    : "border-white/10 bg-white/5 text-slate-300 hover:border-sky-300/30"
                )}
              >
                <Languages size={15} />
                {label}
              </button>
            ))}
          </div>
          <p className="mb-5 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">{editorHelp}</p>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-300">{t.admin.titleLabel}</span>
              <input
                className="field"
                value={currentText.title}
                onChange={(e) => setLocalizedField("title", e.target.value)}
                placeholder={t.admin.titlePlaceholder}
                maxLength={240}
                required={editorLanguage === "nl"}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-300">{t.admin.slugLabel}</span>
              <input
                className="field disabled:opacity-60"
                value={form.id}
                onChange={(e) => {
                  setIdTouched(true);
                  setForm((current) => ({ ...current, id: slugify(e.target.value) }));
                }}
                placeholder={t.admin.slugPlaceholder}
                disabled={isEditing || editorLanguage === "en"}
                maxLength={200}
                required
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-300">{t.admin.dateLabel}</span>
              <input
                type="date"
                className="field"
                value={form.date}
                onChange={(e) => setForm((current) => ({ ...current, date: e.target.value }))}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-300">{t.admin.statusLabel}</span>
              <select
                className="field"
                value={form.status}
                onChange={(e) => setForm((current) => ({ ...current, status: e.target.value }))}
              >
                <option value="draft">{t.status.draft}</option>
                <option value="published">{t.status.published}</option>
              </select>
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-300">{t.admin.excerptLabel}</span>
              <textarea
                className="field min-h-24 resize-y"
                value={currentText.excerpt}
                onChange={(e) => setLocalizedField("excerpt", e.target.value)}
                placeholder={t.admin.excerptPlaceholder}
                maxLength={500}
              />
            </label>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-sm font-medium text-slate-300">{t.admin.categoriesLabel}</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => {
                const active = form.categories.includes(category);
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className={cx(
                      "rounded-md border px-3 py-2 text-sm transition",
                      active
                        ? "border-sky-300/50 bg-sky-300/12 text-sky-100"
                        : "border-white/10 bg-white/5 text-slate-300 hover:border-sky-300/30"
                    )}
                  >
                    {categoryLabels[language][category] || category}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-slate-300">{t.admin.bodyLabel}</p>
              <div className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-400">
                <FileText size={13} />
                <span>{t.admin.textStats}</span>
                <span>{t.admin.wordCount(editorStats.words)}</span>
                <span>{t.admin.readingTime(editorStats.minutes)}</span>
              </div>
            </div>
            <TipTapEditor
              value={currentText.body}
              onChange={(val) => setLocalizedField("body", val)}
              language={language}
              onUploadImage={uploadEssayImage}
            />
          </div>

          <div className="mt-6 rounded-lg border border-white/10 bg-slate-950/65 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-300">
              <FileText size={16} />
              {t.admin.preview}
            </div>
            <div
              className="prose prose-invert max-w-none prose-headings:text-white prose-a:text-sky-200"
              dangerouslySetInnerHTML={{
                __html: sanitizeHTML(currentText.body || `<p>${t.admin.noText}</p>`),
              }}
            />
          </div>
        </form>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-3">
        <AdminFeedbackInbox language={language} />
        <AdminCommentsPanel language={language} />
        <AdminClarusLogsPanel language={language} />
      </div>
    </section>
  );
}

function AdminStat({ label, value, tone = "blue" }) {
  const toneClass =
    tone === "green"
      ? "text-emerald-100 border-emerald-300/20 bg-emerald-300/8"
      : tone === "amber"
        ? "text-amber-100 border-amber-300/20 bg-amber-300/8"
        : "text-sky-100 border-sky-300/20 bg-sky-300/8";

  return (
    <div className={cx("rounded-lg border p-4", toneClass)}>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

function AboutPage({ language }) {
  const t = copy[language].pages;
  usePageMeta(language, {
    title: t.aboutTitle,
    description: t.about[0],
  });
  return (
    <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="text-sm font-medium text-sky-200">{t.aboutEyebrow}</p>
      <h1 className="mt-2 text-4xl font-semibold text-white">{t.aboutTitle}</h1>
      <div className="prose prose-invert mt-8 max-w-none prose-a:text-sky-200">
        {t.about.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <Link
        to="/feedback"
        className="mt-8 inline-flex items-center gap-2 rounded-md bg-sky-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-200"
      >
        <MessageSquare size={16} />
        {copy[language].nav.feedback}
      </Link>
    </section>
  );
}

function RoadmapPage({ language }) {
  const t = copy[language].pages;
  usePageMeta(language, {
    title: t.roadmapTitle,
    description: t.laterItems[0],
  });
  return (
    <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <p className="text-sm font-medium text-sky-200">{t.roadmapEyebrow}</p>
      <h1 className="mt-2 text-4xl font-semibold text-white">{t.roadmapTitle}</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <RoadmapBlock title={t.now} items={t.nowItems} />
        <RoadmapBlock title={t.later} items={t.laterItems} />
      </div>
    </section>
  );
}

function RoadmapBlock({ title, items }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/52 p-5">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-6 text-slate-300">
            <CheckCircle2 className="mt-1 shrink-0 text-sky-200" size={16} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PrivacyPage({ language }) {
  const t = copy[language].pages;
  usePageMeta(language, {
    title: t.privacyTitle,
    description: t.privacy[0],
  });
  return (
    <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="text-sm font-medium text-sky-200">{t.privacyEyebrow}</p>
      <h1 className="mt-2 text-4xl font-semibold text-white">{t.privacyTitle}</h1>
      <div className="prose prose-invert mt-8 max-w-none prose-a:text-sky-200">
        {t.privacy.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <Link
        to="/feedback"
        className="mt-8 inline-flex items-center gap-2 rounded-md bg-sky-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-200"
      >
        <MessageSquare size={16} />
        {copy[language].nav.feedback}
      </Link>
    </section>
  );
}

function NotFoundPage({ language }) {
  const t = copy[language];
  usePageMeta(language, {
    title: t.pages.notFoundTitle,
    description: t.pages.notFoundBody,
  });
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 text-center">
      <EmptyState
        title={t.pages.notFoundTitle}
        body={t.pages.notFoundBody}
        action={
          <Link
            to="/"
            className="mt-5 inline-flex items-center gap-2 rounded-md bg-sky-300 px-4 py-2.5 text-sm font-semibold text-slate-950"
          >
            {t.actions.toStart}
            <ArrowRight size={16} />
          </Link>
        }
      />
    </section>
  );
}

function Footer({ language }) {
  const t = copy[language].nav;
  return (
    <footer className="border-t border-white/10 bg-[#020817]/70 px-4 py-8 text-sm text-slate-500 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; {new Date().getFullYear()} degrondvraag.com</p>
        <div className="flex gap-4">
          <Link to="/privacy" className="hover:text-slate-200">
            Privacy
          </Link>
          <Link to="/over" className="hover:text-slate-200">
            {t.about}
          </Link>
          <Link to="/feedback" className="hover:text-slate-200">
            {t.feedback}
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  const [language, setLanguage] = useLanguage();
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    const auth = getAuth(app);
    let anonymousStarted = false;
    const unsub = onAuthStateChanged(auth, async (usr) => {
      if (!usr) {
        setAdmin(false);
        if (!anonymousStarted) {
          anonymousStarted = true;
          signInAnonymously(auth).catch((err) => console.error("Anonymous sign-in failed:", err));
        }
        return;
      }

      if (usr.isAnonymous) {
        setAdmin(false);
        return;
      }

      try {
        const token = await usr.getIdTokenResult();
        setAdmin(token?.claims?.admin === true || Boolean(usr.email));
      } catch {
        setAdmin(Boolean(usr.email));
      }
    });

    return unsub;
  }, []);

  const handleSignOut = async () => {
    await signOut(getAuth(app));
    setAdmin(false);
  };

  return (
    <Router>
      <BackgroundScene />
      <div className="min-h-screen text-slate-100">
        <Header language={language} setLanguage={setLanguage} admin={admin} onSignOut={handleSignOut} />
        <main>
          <Routes>
            <Route path="/" element={<HomePage language={language} />} />
            <Route path="/essays" element={<EssaysOverviewPage language={language} />} />
            <Route path="/essays/:id" element={<EssayPage language={language} />} />
            <Route path="/over" element={<AboutPage language={language} />} />
            <Route path="/feedback" element={<FeedbackPage language={language} />} />
            <Route path="/roadmap" element={<RoadmapPage language={language} />} />
            <Route path="/privacy" element={<PrivacyPage language={language} />} />
            <Route
              path="/admin"
              element={
                admin ? (
                  <AdminPanel language={language} onSignOut={handleSignOut} />
                ) : (
                  <AdminLogin language={language} onLogin={() => setAdmin(true)} />
                )
              }
            />
            <Route path="*" element={<NotFoundPage language={language} />} />
          </Routes>
        </main>
        <Footer language={language} />
      </div>
      <Analytics />
    </Router>
  );
}
