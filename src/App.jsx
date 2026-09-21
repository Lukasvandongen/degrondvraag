import { Analytics } from "@vercel/analytics/react";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BrowserRouter as Router,
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  Filter,
  Menu,
  BookOpen,
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
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";
import DOMPurify from "dompurify";
import QuestionField from "./QuestionField";
const TipTapEditor = lazy(() => import("./TipTapEditor"));

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
import {
  getDownloadURL,
  getStorage,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";

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

const CATEGORIES = [
  "geloof",
  "filosofie",
  "ethiek",
  "AI",
  "maatschappij",
  "wetenschap",
];

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
      clarus: "Clarus",
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
      intro:
        "Essays over wat we geloven, hoe we handelen en waarom we bestaan. Ruimte om verder te denken.",
      deskEyebrow: "REDACTIONELE NOTITIE",
      deskTitle: "Wat hier verschijnt",
      deskIntro:
        "Geen feed, geen haastige vorm, geen decor. De site verzamelt langere stukken die een vraag vasthouden totdat de vooronderstellingen zichtbaar worden.",
      deskItems: [
        ["Vorm", "Essay, notitie, reflectie"],
        ["Toon", "Onderzoekend en academisch"],
        ["Ritme", "Onregelmatig, alleen wanneer het stuk af is"],
      ],
      latestEyebrow: "Nieuw op de site",
      latestTitle: "Laatste essays",
      noPublishedTitle: "Nog geen gepubliceerde essays",
      noPublishedBody:
        "Publiceer je eerste essay via het adminpaneel. De startpagina vult daarna automatisch met de nieuwste stukken.",
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
      showingCount: "In beeld",
      clarusShortcutTitle: "Twijfel waar te beginnen?",
      clarusShortcutBody:
        "Laat Clarus je vraag lezen als route door het archief.",
      clarusShortcutAction: "Vraag Clarus om een ingang",
      clarusShortcutPrompt:
        "Ik weet nog niet waar ik moet beginnen. Kun je mij helpen een passend essay te kiezen?",
      emptyTitle: "Geen essays gevonden",
      emptyBody:
        "Pas je filters aan of publiceer een nieuw essay in het adminpaneel.",
      untitled: "Een essay zonder titel.",
      noExcerpt: "Een essay zonder samenvatting.",
      unavailableTitle: "Essay niet beschikbaar",
      unavailableBody: "Het essay bestaat niet of staat nog in concept.",
      fetchError: "Dit essay kon niet worden geladen.",
      notTranslatedTitle: "Engelse versie nog niet beschikbaar",
      notTranslatedBody:
        "Er is nog geen Engelse vertaling van dit essay. Wissel naar Nederlands om het te lezen.",
    },
    clarus: {
      eyebrow: "Clarus",
      title: "Chat met Clarus",
      intro:
        "Vraag Clarus welk essay past bij een begrip, bezwaar of grondvraag. Clarus gebruikt alleen het publieke essayarchief en blijft binnen de thematische grenzen van de site.",
      openChat: "Live archiefchat",
      corpusReady: (amount) => `${amount} essay(s) beschikbaar`,
      noHistory:
        "Geen accountkoppeling of persoonlijke chatgeschiedenis. Gesprekken kunnen wel technisch worden gelogd om Clarus te verbeteren.",
      promptTitle: "Probeer een scherpe ingang",
      examples: [
        "Ik wil vrijheid beter begrijpen. Waar begin ik?",
        "Welk essay past bij twijfel over geloof?",
        "Ik zoek een tekst over verantwoordelijkheid en techniek.",
      ],
      emptyTitle: "Clarus heeft nog geen essayarchief",
      emptyBody:
        "Publiceer eerst essays, daarna kan Clarus lezers door het archief leiden.",
      scopeTitle: "Een gids door het archief",
      scopeItems: [
        "Clarus leest je vraag als een ingang tot het essayarchief.",
        "Hij zoekt naar verwante begrippen, bezwaren en thematische lijnen.",
        "Zijn antwoorden blijven smal: welke tekst past, waarom die past en waar je kunt beginnen.",
      ],
      archiveTitle: "Beschikbaar archief",
    },
    firebase: {
      slow: "Het archief laat even op zich wachten. Probeer de pagina opnieuw te laden.",
      error:
        "Het archief is tijdelijk niet bereikbaar. Probeer het later opnieuw.",
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
      intro:
        "Stuur een opmerking, foutmelding of suggestie zonder naam of e-mailadres. Je bericht wordt alleen in het adminpaneel gelezen.",
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
      clarusLogsSubtitle:
        "Zoek, filter en vouw gesprekken open zonder door een ruwe lijst te hoeven scrollen.",
      clarusLogsEmpty: "Nog geen Clarus gesprekken.",
      clarusLogsLoadError: "Clarus logs konden niet worden geladen.",
      clarusLogsBackendMissing: "VITE_BACKEND_URL ontbreekt.",
      clarusLogsAuthError: "Admin token kon niet worden opgehaald.",
      clarusQuestion: "Vraag",
      clarusAnswer: "Antwoord",
      clarusError: "Fout",
      clarusSearch: "Zoek in vraag, antwoord, essay of model",
      clarusStatusAll: "Alle statussen",
      clarusContextAll: "Alle contexten",
      clarusCompleted: "Afgerond",
      clarusErrored: "Fouten",
      clarusRefused: "Geweigerd",
      clarusStarted: "Gestart",
      clarusRecentTitle: "Laatste activiteit",
      clarusNoMatches: "Geen logs passen bij deze filters.",
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
      imageUploadError:
        "Afbeelding uploaden is mislukt. Controleer Firebase Storage.",
      englishHelp:
        "Vul de Engelse versie met dezelfde academische toon. Gebruik geen em-dashes.",
      dutchHelp:
        "De Nederlandse versie blijft de standaardversie van het essay.",
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
        "Clarus helpt je verder te denken. Hij leest mee met de essays, verheldert begrippen en zoekt naar teksten die aansluiten bij jouw vraag.",
        "Gebruik de feedbackpagina voor opmerkingen, suggesties of foutmeldingen. Er is geen werkend feedbackadres per e-mail.",
      ],
      roadmapEyebrow: "Roadmap",
      roadmapTitle: "Waar de site staat",
      now: "Gerealiseerd",
      later: "Nabije toekomst",
      nowItems: [
        "V1 basis: essayarchief, individuele essaypagina's, categorieen, publicatiestatus en Firebase opslag",
        "V1 interactie: reacties, likes, dislikes en een beheeromgeving voor schrijven en publiceren",
        "Een monochrome interface met een interactief vraagteken, een doorzoekbaar tekstarchief en rustige leeskolommen",
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
      clarus: "Clarus",
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
      intro:
        "Essays on what we believe, how we act and why we exist. Room to think further.",
      deskEyebrow: "EDITORIAL NOTE",
      deskTitle: "What appears here",
      deskIntro:
        "No feed, no hurried format, no spectacle. The site gathers longer pieces that hold a question until its assumptions become visible.",
      deskItems: [
        ["Form", "Essay, note, reflection"],
        ["Register", "Inquiring and academic"],
        ["Rhythm", "Irregular, only when the piece is ready"],
      ],
      latestEyebrow: "New on the site",
      latestTitle: "Latest essays",
      noPublishedTitle: "No published essays yet",
      noPublishedBody:
        "Publish your first essay from the admin panel. The homepage will then fill itself with the newest pieces.",
    },
    essays: {
      eyebrow: "Archive",
      title: "Essays",
      intro:
        "Filter by subject or search directly through titles and summaries.",
      search: "Search essays",
      all: "All",
      readingTime: (minutes) => `${minutes} min read`,
      progress: (percent) => `${percent}% read`,
      outline: "Structure",
      showingCount: "Showing",
      clarusShortcutTitle: "Unsure where to begin?",
      clarusShortcutBody:
        "Let Clarus read your question as a route through the archive.",
      clarusShortcutAction: "Ask Clarus for an entry point",
      clarusShortcutPrompt:
        "I am not sure where to begin. Can you help me choose a fitting essay?",
      emptyTitle: "No essays found",
      emptyBody:
        "Adjust your filters or publish a new essay in the admin panel.",
      untitled: "An untitled essay.",
      noExcerpt: "An essay without a summary.",
      unavailableTitle: "Essay unavailable",
      unavailableBody: "The essay does not exist or is still a draft.",
      fetchError: "This essay could not be loaded.",
      notTranslatedTitle: "English version not available yet",
      notTranslatedBody:
        "There is no English translation of this essay yet. Switch to Dutch to read it.",
    },
    clarus: {
      eyebrow: "Clarus",
      title: "Chat With Clarus",
      intro:
        "Ask Clarus which essay fits a concept, objection or ground question. Clarus uses only the public essay archive and stays within the site's intellectual scope.",
      openChat: "Live archive chat",
      corpusReady: (amount) => `${amount} essay(s) available`,
      noHistory:
        "No account connection or personal chat history yet. Conversations may still be technically logged to improve Clarus.",
      promptTitle: "Try a precise entry point",
      examples: [
        "I want to understand freedom better. Where should I begin?",
        "Which essay fits doubt about faith?",
        "I am looking for a text on responsibility and technology.",
      ],
      emptyTitle: "Clarus has no essay archive yet",
      emptyBody:
        "Publish essays first, then Clarus can guide readers through the archive.",
      scopeTitle: "A Guide Through The Archive",
      scopeItems: [
        "Clarus reads your question as an entry point into the essay archive.",
        "It looks for related concepts, objections and thematic lines.",
        "Its answers stay narrow: which text fits, why it fits and where to begin.",
      ],
      archiveTitle: "Available archive",
    },
    firebase: {
      slow: "The archive is taking a little longer to load. Please try reloading the page.",
      error:
        "The archive is temporarily unavailable. Please try again shortly.",
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
      intro:
        "Send a note, bug report or suggestion without a name or e-mail address. Your message is only read in the admin panel.",
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
      clarusLogsSubtitle:
        "Search, filter and expand conversations without scrolling through a raw feed.",
      clarusLogsEmpty: "No Clarus conversations yet.",
      clarusLogsLoadError: "Clarus logs could not be loaded.",
      clarusLogsBackendMissing: "VITE_BACKEND_URL is missing.",
      clarusLogsAuthError: "Admin token could not be retrieved.",
      clarusQuestion: "Question",
      clarusAnswer: "Answer",
      clarusError: "Error",
      clarusSearch: "Search question, answer, essay or model",
      clarusStatusAll: "All statuses",
      clarusContextAll: "All contexts",
      clarusCompleted: "Completed",
      clarusErrored: "Errors",
      clarusRefused: "Refused",
      clarusStarted: "Started",
      clarusRecentTitle: "Latest activity",
      clarusNoMatches: "No logs match these filters.",
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
      englishHelp:
        "Write the English version in the same academic register. Use no em-dashes.",
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
        "Clarus helps you think further. It reads alongside the essays, clarifies concepts and finds texts that connect with your question.",
        "Use the feedback page for notes, suggestions or bug reports. There is no working feedback e-mail address.",
      ],
      roadmapEyebrow: "Roadmap",
      roadmapTitle: "Where the site stands",
      now: "Shipped",
      later: "Near future",
      nowItems: [
        "V1 foundation: essay archive, individual essay pages, categories, publication status and Firebase storage",
        "V1 interaction: responses, likes, dislikes and an admin environment for writing and publishing",
        "A monochrome interface with an interactive question mark, a searchable text archive and comfortable reading columns",
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
    title:
      essay.translations?.en?.title || essay.titleEn || essay.title_en || "",
    excerpt:
      essay.translations?.en?.excerpt ||
      essay.excerptEn ||
      essay.excerpt_en ||
      "",
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

const buildClarusCorpus = (essays, language) =>
  essays
    .filter((essay) => essay.status === "published")
    .map((essay) => {
      const localized = localizeEssay(essay, language);
      if (!localized.hasRequestedLanguage || !localized.displayBody)
        return null;

      return {
        id: essay.id,
        title: localized.displayTitle,
        excerpt: localized.displayExcerpt,
        categories: (essay.categories || []).map(
          (category) => categoryLabels[language][category] || category,
        ),
        date: essay.date || "",
        path: `/essays/${essay.id}`,
        body: textFromHTML(localized.displayBody).slice(0, 2200),
      };
    })
    .filter(Boolean);

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
          .sort((a, b) =>
            String(b.date || "").localeCompare(String(a.date || "")),
          );
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
      },
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
      const readableHeight = Math.max(
        article.offsetHeight - window.innerHeight * 0.62,
        1,
      );
      const current = window.scrollY - articleTop + window.innerHeight * 0.2;
      const nextProgress = Math.min(
        100,
        Math.max(0, Math.round((current / readableHeight) * 100)),
      );
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

function useActiveHeading(outline) {
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    if (!outline.length) {
      setActiveId("");
      return undefined;
    }

    const headings = outline
      .map((item) => document.getElementById(item.id))
      .filter(Boolean);
    if (!headings.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          )[0];
        if (visible?.target?.id) setActiveId(visible.target.id);
      },
      {
        rootMargin: "-18% 0px -64% 0px",
        threshold: [0, 1],
      },
    );

    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [outline]);

  return activeId;
}

function RouteScroll() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

function LanguageControl({ language, setLanguage }) {
  return (
    <div
      className="language-control"
      role="group"
      aria-label={copy[language].language.label}
    >
      {Object.keys(LANGUAGES).map((code) => (
        <button
          key={code}
          onClick={() => setLanguage(code)}
          aria-label={LANGUAGES[code]}
          aria-pressed={language === code}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function Header({ language, setLanguage, admin, onSignOut }) {
  const t = copy[language];
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const menuButton = useRef(null);
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);
  useEffect(() => {
    const close = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    if (menuOpen) document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [menuOpen]);
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link to="/" className="wordmark" aria-label="degrondvraag — start">
          degrondvraag<span>.</span>
        </Link>
        <nav
          id="primary-navigation"
          className={cx("primary-navigation", menuOpen && "is-open")}
          aria-label={language === "nl" ? "Hoofdnavigatie" : "Main navigation"}
        >
          {[
            ["/", t.nav.start],
            ["/essays", t.nav.essays],
            ["/clarus", t.nav.clarus],
            ["/over", t.nav.about],
          ].map(([path, label]) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/"}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </NavLink>
          ))}
          {admin && <NavLink to="/admin">{t.nav.admin}</NavLink>}
        </nav>
        <div className="header-controls">
          <LanguageControl language={language} setLanguage={setLanguage} />
          {admin && (
            <button
              className="icon-button"
              onClick={onSignOut}
              aria-label={t.actions.signOut}
            >
              <LogOut size={17} />
            </button>
          )}
          <button
            ref={menuButton}
            className="menu-toggle icon-button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            aria-label={
              menuOpen
                ? language === "nl"
                  ? "Menu sluiten"
                  : "Close menu"
                : language === "nl"
                  ? "Menu openen"
                  : "Open menu"
            }
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
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
          ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-300"
          : "border-amber-300/20 bg-amber-300/10 text-amber-200",
      )}
    >
      {live ? <CheckCircle2 size={13} /> : <FileText size={13} />}
      {t[status] || status}
    </span>
  );
}

function CategoryPills({ categories = [], language }) {
  return categories.length ? (
    <div className="category-labels">
      {categories.map((category) => (
        <span key={category}>
          {categoryLabels[language][category] || category}
        </span>
      ))}
    </div>
  ) : null;
}

function EssayCard({ essay, language, index = 0 }) {
  const location = useLocation();
  const localized = localizeEssay(essay, language);
  const stats = getTextStats(localized.displayBody);
  return (
    <Link
      to={"/essays/" + essay.id}
      state={{
        archive:
          location.pathname === "/essays"
            ? location.pathname + location.search
            : "/essays",
      }}
      className="essay-card"
    >
      <div className="essay-card-top">
        <span className="essay-number">
          {String(index + 1).padStart(2, "0")}
        </span>
        <CategoryPills categories={essay.categories} language={language} />
      </div>
      <h3>{localized.displayTitle}</h3>
      <p className="essay-excerpt">{localized.displayExcerpt}</p>
      <div className="essay-card-bottom">
        <span>
          {formatDate(essay.date, language)}
          <span className="meta-separator">/</span>
          {copy[language].essays.readingTime(stats.minutes)}
        </span>
        <ArrowRight size={20} aria-hidden="true" />
      </div>
    </Link>
  );
}

function EmptyState({ title, body, action }) {
  return (
    <div className="empty-state" role="status">
      <BookOpen size={26} strokeWidth={1.3} aria-hidden="true" />
      <h3>{title}</h3>
      <p>{body}</p>
      {action}
    </div>
  );
}

function HomePage({ language }) {
  const t = copy[language];
  const nl = language === "nl";
  usePageMeta(language, { title: t.home.title, description: t.home.intro });
  const { essays, loading, error } = useEssays(language);
  const published = essays.filter((essay) => essay.status === "published");
  const latest = published.slice(0, 3);
  return (
    <div className="home-page page-width">
      <section
        className="night-hero"
        aria-label={nl ? "Over degrondvraag" : "About degrondvraag"}
      >
        <div className="hero-masthead">
          <span>
            {nl
              ? "Een persoonlijk essayarchief"
              : "An independent essay archive"}
          </span>
          <span>
            {nl ? "Geloof, moraal & bestaan" : "Faith, morality & existence"}
          </span>
        </div>
        <h1 className="night-title">
          degrondvraag<span aria-hidden="true">_</span>
        </h1>
        <div className="night-introduction">
          <p className="night-statement">
            {nl ? (
              <>
                Wat nemen we
                <br />
                voor waar aan?
              </>
            ) : (
              <>
                What do we
                <br />
                take for granted?
              </>
            )}
          </p>
          <p className="night-description">
            {nl
              ? "Ik schrijf over geloof, moraal en bestaan. Om te onderzoeken waar mijn overtuigingen vandaan komen. En waar ze ophouden te kloppen."
              : "I write about faith, morality and existence. To examine where my convictions come from. And where they stop making sense."}
          </p>
          <Link className="night-read" to="/essays">
            {nl ? "Lees de essays" : "Read the essays"}
            <ArrowRight size={20} />
          </Link>
        </div>
        <QuestionField language={language} />
        <div className="hero-baseline">
          <span>
            {nl ? "Geen definitieve antwoorden." : "No final answers."}
          </span>
          <a href="#recent-essays">
            {nl ? "Verder lezen" : "Keep reading"}
            <span aria-hidden="true">↓</span>
          </a>
        </div>
      </section>
      <section id="recent-essays" className="latest-section">
        <div className="section-heading">
          <h2>{nl ? "Recent geschreven" : "Recent writing"}</h2>
          <Link className="text-link" to="/essays">
            {nl ? "Volledig archief" : "Full archive"}
            {!loading && !error && (
              <span className="index-count">
                {String(published.length).padStart(2, "0")}
              </span>
            )}
            <ArrowRight size={16} />
          </Link>
        </div>
        {loading ? (
          <SkeletonGrid />
        ) : error ? (
          <EmptyState title={t.firebase.loadTitle} body={error} />
        ) : latest.length ? (
          <div className="essay-grid">
            {latest.map((essay, index) => (
              <EssayCard
                key={essay.id}
                essay={essay}
                index={index}
                language={language}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title={t.home.noPublishedTitle}
            body={
              nl
                ? "De eerste stukken verschijnen hier zodra ze klaar zijn."
                : "The first essays will appear here when they are ready."
            }
          />
        )}
      </section>
      <section className="home-bottom">
        <nav
          className="subject-index"
          aria-label={nl ? "Verken een onderwerp" : "Explore a subject"}
        >
          <h2>{nl ? "Onderwerpen" : "Subjects"}</h2>
          <div>
            {CATEGORIES.map((category) => (
              <Link
                key={category}
                to={"/essays?category=" + encodeURIComponent(category)}
              >
                {categoryLabels[language][category]}
                <span aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        </nav>
        <div className="clarus-entry">
          <span className="entry-label">Clarus</span>
          <h2>
            {nl ? "Leg je vraag op tafel." : "Put your question on the table."}
          </h2>
          <p>
            {nl
              ? "Een gesprekspartner bij de essays. Voor een tegenargument, een ander perspectief of een plek om te beginnen."
              : "A companion to the essays. For a counterargument, another perspective or somewhere to begin."}
          </p>
          <Link className="text-link" to="/clarus">
            {nl ? "Open een gesprek" : "Open a conversation"}
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="min-h-[220px] animate-pulse rounded-lg border border-line bg-wash p-5"
        >
          <div className="h-4 w-28 rounded bg-wash" />
          <div className="mt-8 h-6 w-3/4 rounded bg-wash" />
          <div className="mt-4 h-4 rounded bg-wash" />
          <div className="mt-2 h-4 w-5/6 rounded bg-wash" />
        </div>
      ))}
    </div>
  );
}

function EssaysOverviewPage({ language }) {
  const t = copy[language];
  const nl = language === "nl";
  usePageMeta(language, { title: t.essays.title, description: t.essays.intro });
  const { essays, loading, error } = useEssays(language);
  const [params, setParams] = useSearchParams();
  const selectedCategory = CATEGORIES.includes(params.get("category"))
    ? params.get("category")
    : "all";
  const search = params.get("q") || "";
  const sort = params.get("sort") || "newest";
  const updateFilter = (key, value) => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value && value !== "all" && value !== "newest")
          next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );
  };
  const allPublishedEssays = essays.filter(
    (essay) => essay.status === "published",
  );
  const filtered = allPublishedEssays
    .filter((essay) => {
      const localized = localizeEssay(essay, language);
      const text = [
        localized.displayTitle,
        localized.displayExcerpt,
        textFromHTML(localized.displayBody),
        ...(essay.categories || []).map(
          (c) => categoryLabels[language][c] || c,
        ),
      ]
        .join(" ")
        .toLowerCase();
      return (
        (selectedCategory === "all" ||
          (essay.categories || []).includes(selectedCategory)) &&
        text.includes(search.trim().toLowerCase())
      );
    })
    .sort((a, b) =>
      sort === "oldest"
        ? String(a.date).localeCompare(String(b.date))
        : sort === "title"
          ? localizeEssay(a, language).displayTitle.localeCompare(
              localizeEssay(b, language).displayTitle,
              language,
            )
          : String(b.date).localeCompare(String(a.date)),
    );
  return (
    <section className="archive-page page-width">
      <div className="archive-heading">
        <div>
          <p className="eyebrow">{nl ? "Het archief" : "The archive"}</p>
          <h1>{nl ? "Essays." : "Essays."}</h1>
          <p>
            {nl
              ? "Over geloof, moraal en bestaan."
              : "On faith, morality and existence."}
          </p>
        </div>
        <Link
          className="text-link"
          to={
            "/clarus?prompt=" +
            encodeURIComponent(t.essays.clarusShortcutPrompt)
          }
        >
          {nl ? "Laat Clarus je op weg helpen" : "Let Clarus help you begin"}
          <ArrowRight size={16} />
        </Link>
      </div>
      <div className="archive-tools">
        <label className="archive-search">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            aria-label={t.essays.search}
            placeholder={
              nl
                ? "Zoek een titel, begrip of gedachte…"
                : "Search a title, concept or thought…"
            }
            value={search}
            onChange={(e) => updateFilter("q", e.target.value)}
          />
        </label>
        <label className="archive-sort">
          <span>{nl ? "Sorteer op" : "Sort by"}</span>
          <select
            value={sort}
            onChange={(e) => updateFilter("sort", e.target.value)}
          >
            <option value="newest">
              {nl ? "Nieuwste eerst" : "Newest first"}
            </option>
            <option value="oldest">
              {nl ? "Oudste eerst" : "Oldest first"}
            </option>
            <option value="title">{nl ? "Titel A–Z" : "Title A–Z"}</option>
          </select>
        </label>
      </div>
      <div
        className="archive-filters"
        role="group"
        aria-label={nl ? "Filter op onderwerp" : "Filter by subject"}
      >
        {["all", ...CATEGORIES].map((category) => (
          <button
            key={category}
            aria-pressed={selectedCategory === category}
            onClick={() => updateFilter("category", category)}
          >
            {category === "all"
              ? t.essays.all
              : categoryLabels[language][category]}
            <span>
              {category === "all"
                ? allPublishedEssays.length
                : allPublishedEssays.filter((e) =>
                    (e.categories || []).includes(category),
                  ).length}
            </span>
          </button>
        ))}
      </div>
      <div className="archive-results" role="status">
        {loading
          ? t.firebase.loading
          : error
            ? t.firebase.loadTitle
            : filtered.length +
              " " +
              (filtered.length === 1 ? "essay" : "essays")}
        {(search || selectedCategory !== "all") && (
          <button className="text-link" onClick={() => setParams({})}>
            {nl ? "Wis filters" : "Clear filters"}
            <X size={14} />
          </button>
        )}
      </div>
      {loading ? (
        <SkeletonGrid />
      ) : error ? (
        <EmptyState title={t.firebase.loadTitle} body={error} />
      ) : filtered.length ? (
        <div className="essay-grid archive-grid">
          {filtered.map((essay, index) => (
            <EssayCard
              key={essay.id}
              essay={essay}
              index={index}
              language={language}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title={t.essays.emptyTitle}
          body={
            nl
              ? "Probeer een ander zoekwoord of kies een ander onderwerp."
              : "Try another search term or choose a different subject."
          }
        />
      )}
    </section>
  );
}

function ReadingCompass({ progress, outline, activeId, stats, language }) {
  const t = copy[language].essays;

  return (
    <>
      <div
        className="reading-progress-line fixed inset-x-0 z-30 h-px bg-wash"
        aria-hidden="true"
      >
        <div
          className="h-full bg-accent shadow-none transition-[width] duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      <aside className="fixed right-5 top-28 z-30 hidden w-[260px] 2xl:block">
        <div className="reading-compass-shell rounded-lg border border-line bg-surface p-4 shadow-none backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-muted">
              <FileText size={14} />
              {t.readingTime(stats.minutes)}
            </div>
            <span className="rounded border border-accent/30 bg-accent/10 px-2 py-1 text-[11px] font-semibold text-accent">
              {t.progress(progress)}
            </span>
          </div>

          {outline.length > 0 && (
            <nav className="mt-3" aria-label={t.outline}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                {t.outline}
              </p>
              <ol className="max-h-[36vh] space-y-1 overflow-y-auto pr-1">
                {outline.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className={cx(
                        "relative block rounded px-2 py-1.5 text-xs leading-5 transition hover:bg-wash hover:text-accent",
                        activeId === item.id
                          ? "bg-accent/10 text-accent shadow-none"
                          : "text-muted",
                        item.level === 3 && "pl-5",
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

function EssayCommandBar({ progress, language, onBack, onAsk }) {
  const t = copy[language];

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
      <div className="essay-command-bar pointer-events-auto flex w-full max-w-2xl items-center gap-2 rounded-lg border border-accent/30 bg-surface p-2 shadow-none backdrop-blur-xl">
        <button
          type="button"
          onClick={onBack}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-line bg-wash text-ink transition hover:border-accent/30 hover:text-ink"
          aria-label={t.actions.back}
          title={t.actions.back}
        >
          <ArrowLeft size={17} />
        </button>
        <Link
          to="/essays"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-line bg-wash text-ink transition hover:border-accent/30 hover:text-ink"
          aria-label={t.actions.backToEssays}
          title={t.actions.backToEssays}
        >
          <FileText size={17} />
        </Link>
        <div className="min-w-0 flex-1 px-2">
          <div className="mb-1 flex items-center justify-between gap-3 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
            <span className="truncate">
              {language === "nl" ? "Leesvoortgang" : "Reading progress"}
            </span>
            <span className="shrink-0 text-accent">
              {copy[language].essays.progress(progress)}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-wash">
            <div
              className="h-full rounded-full bg-accent shadow-none transition-[width] duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={onAsk}
          aria-label={t.actions.askClarus}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md bg-accent px-3 text-sm font-semibold text-paper transition hover:bg-ink"
        >
          <MessageSquare size={16} />
          <span className="hidden sm:inline">{t.actions.askClarus}</span>
        </button>
      </div>
    </div>
  );
}

function EssayPage({ language }) {
  const t = copy[language];
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const backToArchive = () => navigate(location.state?.archive || "/essays");
  const [essay, setEssay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const articleRef = useRef(null);
  const localized = essay ? localizeEssay(essay, language) : null;
  const preparedContent = useMemo(
    () => prepareEssayContent(localized?.displayBody || ""),
    [localized?.displayBody],
  );
  const readingStats = useMemo(
    () => getTextStats(localized?.displayBody || ""),
    [localized?.displayBody],
  );
  const readingProgress = useReadingProgress(articleRef);
  const activeHeading = useActiveHeading(preparedContent.outline);

  usePageMeta(language, {
    title: localized?.hasRequestedLanguage
      ? localized.displayTitle
      : t.essays.title,
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
        <div className="h-5 w-32 animate-pulse rounded bg-wash" />
        <div className="mt-8 h-12 w-3/4 animate-pulse rounded bg-wash" />
        <div className="mt-8 space-y-3">
          <div className="h-4 animate-pulse rounded bg-wash" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-wash" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-wash" />
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
              className="mt-5 inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-paper"
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
              className="mt-5 inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-paper"
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
        activeId={activeHeading}
        stats={readingStats}
        language={language}
      />

      <article
        ref={articleRef}
        className="essay-reading mx-auto max-w-3xl px-4 pt-12 pb-28 sm:px-6"
      >
        <button
          onClick={backToArchive}
          className="mb-8 inline-flex items-center gap-2 rounded-md border border-line bg-wash px-3 py-2 text-sm font-medium text-ink transition hover:border-accent/30 hover:text-ink"
        >
          <ArrowLeft size={16} />
          {t.actions.back}
        </button>

        <header className="border-b border-line pb-8">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 text-sm text-muted">
              <CalendarDays size={16} />
              {formatDate(essay.date, language)}
            </span>
            <span className="inline-flex items-center gap-2 text-sm text-muted">
              <FileText size={16} />
              {t.essays.readingTime(readingStats.minutes)}
            </span>
            <CategoryPills categories={essay.categories} language={language} />
          </div>
          <h1 className="text-4xl font-semibold leading-tight text-ink sm:text-5xl">
            {localized.displayTitle}
          </h1>
          {localized.displayExcerpt && (
            <p className="mt-5 text-lg leading-8 text-muted">
              {localized.displayExcerpt}
            </p>
          )}
          <div className="mt-6">
            <Likes articleId={essay.id} language={language} />
          </div>
        </header>

        <div
          className="prose prose-editorial prose-slate mt-10 max-w-none prose-headings:text-ink prose-a:text-accent prose-strong:text-ink"
          dangerouslySetInnerHTML={{ __html: preparedContent.html }}
        />

        <Comments articleId={essay.id} language={language} />
      </article>

      <EssayCommandBar
        progress={readingProgress}
        language={language}
        onBack={backToArchive}
        onAsk={() => setChatOpen(true)}
      />

      {chatOpen && (
        <Suspense fallback={null}>
          <ChatPanel
            essay={clarusEssay}
            language={language}
            onClose={() => setChatOpen(false)}
          />
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
      },
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
            ? "border-emerald-300/35 bg-emerald-300/12 text-emerald-300"
            : "border-line bg-wash text-muted hover:border-emerald-300/30",
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
            ? "border-red-300/35 bg-red-300/12 text-red-300"
            : "border-line bg-wash text-muted hover:border-red-300/30",
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
      orderBy("createdAt", "desc"),
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
      },
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
    <section className="mt-14 border-t border-line pt-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-ink">{t.title}</h2>
          <p className="mt-1 text-sm text-muted">{t.count(comments.length)}</p>
        </div>
        <button
          onClick={() => setShowForm((value) => !value)}
          className="inline-flex items-center gap-2 rounded-md border border-accent/30 bg-accent/10 px-4 py-2.5 text-sm font-semibold text-accent transition hover:border-accent/30"
        >
          {showForm ? <X size={16} /> : <Send size={16} />}
          {showForm
            ? copy[language].actions.cancel
            : copy[language].actions.reply}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4 rounded-lg border border-line bg-surface p-5"
        >
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
            className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-paper transition hover:bg-ink disabled:opacity-60"
            disabled={submitting}
            aria-busy={submitting}
          >
            <Send size={16} />
            {submitting
              ? copy[language].actions.sending
              : copy[language].actions.send}
          </button>
        </form>
      )}

      {error && (
        <p className="mt-4 rounded-md border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-sm text-amber-200">
          {error}
        </p>
      )}

      {comments.length > 0 && (
        <div className="mt-6 space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-lg border border-line bg-wash p-4"
            >
              <p className="font-semibold text-ink">{comment.name}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">
                {comment.text}
              </p>
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
    <section className="info-page mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="text-sm font-medium text-accent">{t.eyebrow}</p>
      <h1 className="mt-2 text-4xl font-semibold text-ink">{t.title}</h1>
      <p className="mt-5 max-w-2xl text-base leading-7 text-muted">{t.intro}</p>

      {done ? (
        <div className="mt-8">
          <EmptyState title={t.thanksTitle} body={t.thanksBody} />
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-4 rounded-md border border-line bg-surface p-5"
        >
          <label className="block space-y-2">
            <span className="text-sm font-medium text-muted">{t.label}</span>
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
          {error && (
            <p className="rounded-md border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-sm text-amber-200">
              {error}
            </p>
          )}
          <button
            className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-paper transition hover:bg-ink disabled:opacity-60"
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

function ClarusPage({ language }) {
  const t = copy[language];
  const location = useLocation();
  const { essays, loading, error } = useEssays(language);
  const [starterQuestion, setStarterQuestion] = useState("");
  const [starterQuestionKey, setStarterQuestionKey] = useState(0);
  const urlPrompt = useMemo(
    () => new URLSearchParams(location.search).get("prompt") || "",
    [location.search],
  );
  const corpus = useMemo(
    () => buildClarusCorpus(essays, language),
    [essays, language],
  );
  const corpusEssay = useMemo(
    () => ({
      id: "degrondvraag-archive",
      title:
        language === "en"
          ? "degrondvraag essay archive"
          : "het essayarchief van degrondvraag",
      body:
        corpus
          .map((essay) => `${essay.title}. ${essay.excerpt || ""}`)
          .join("\n\n") || "degrondvraag",
    }),
    [corpus, language],
  );

  usePageMeta(language, {
    title: t.clarus.title,
    description: t.clarus.intro,
  });

  const applyStarterQuestion = useCallback((prompt) => {
    setStarterQuestion(prompt);
    setStarterQuestionKey((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!urlPrompt || loading || !corpus.length) return;
    applyStarterQuestion(urlPrompt);
  }, [applyStarterQuestion, corpus.length, loading, urlPrompt]);

  const nl = language === "nl";
  return (
    <section className="clarus-page page-width">
      <div className="clarus-sidebar">
        <p className="eyebrow">
          Clarus ·{" "}
          {nl
            ? "Je gesprekspartner bij het archief"
            : "Your companion to the archive"}
        </p>
        <h1>
          {nl ? (
            <>
              Denk een
              <br />
              <em>stap verder.</em>
            </>
          ) : (
            <>
              Take a thought
              <br />
              <em>further.</em>
            </>
          )}
        </h1>
        <p className="clarus-intro">
          {nl
            ? "Een vraag hoeft nog niet af te zijn. Onderzoek een gedachte, vind een essay of bekijk een argument van een andere kant."
            : "A question need not be fully formed. Explore a thought, find an essay or look at an argument from another angle."}
        </p>
        {error && !loading && (
          <p className="mt-5 text-sm text-amber-200" role="status">
            {error}
          </p>
        )}
        {!!corpus.length && (
          <div className="clarus-starters">
            <h2>
              {nl ? "Waar wil je beginnen?" : "Where would you like to begin?"}
            </h2>
            {t.clarus.examples.map((example, index) => (
              <button
                key={example}
                onClick={() => applyStarterQuestion(example)}
              >
                <span className="essay-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>{example}</span>
                <ArrowRight size={17} />
              </button>
            ))}
          </div>
        )}
        <details className="clarus-archive">
          <summary>
            {nl
              ? "Het archief achter het gesprek"
              : "The archive behind the conversation"}
            <span>{corpus.length}</span>
          </summary>
          <div>
            {corpus.map((essay) => (
              <Link key={essay.id} to={essay.path}>
                {essay.title}
                <ArrowRight size={14} />
              </Link>
            ))}
          </div>
        </details>
        <p className="clarus-footnote">
          {nl
            ? "Clarus denkt mee vanuit de gepubliceerde essays. Gesprekken worden opgeslagen om de antwoorden te verbeteren."
            : "Clarus draws on the published essays. Conversations are logged to improve its responses."}{" "}
          <Link to="/privacy">{nl ? "Meer hierover" : "Learn more"}</Link>
        </p>
      </div>
      <div className="clarus-workspace">
        {loading ? (
          <div className="chat-loading" role="status">
            <span className="eyebrow">Clarus</span>
            <p>{t.firebase.loading}</p>
            <div className="mt-8 h-20 animate-pulse bg-wash" />
          </div>
        ) : error ? (
          <EmptyState title={t.firebase.loadTitle} body={error} />
        ) : corpus.length > 0 ? (
          <Suspense
            fallback={
              <div className="chat-loading" role="status">
                {nl ? "Gesprek laden…" : "Loading conversation…"}
              </div>
            }
          >
            <ChatPanel
              variant="embedded"
              essay={corpusEssay}
              essayCorpus={corpus}
              contextType="corpus"
              initialInput={starterQuestion}
              initialInputKey={starterQuestionKey}
              language={language}
            />
          </Suspense>
        ) : (
          <EmptyState
            title={t.clarus.emptyTitle}
            body={
              nl
                ? "Zodra de eerste essays verschijnen, kun je hier verder denken met Clarus."
                : "Once the first essays are published, you can explore them here with Clarus."
            }
          />
        )}
      </div>
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
      <form
        onSubmit={handleSubmit}
        className="w-full rounded-lg border border-line bg-surface p-6 shadow-none"
      >
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-accent/10 text-accent">
            <Lock size={18} />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-ink">{t.loginTitle}</h1>
            <p className="text-sm text-muted">{t.loginBody}</p>
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
        {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
        <button
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-3 text-sm font-semibold text-paper transition hover:bg-ink disabled:opacity-60"
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
  const date =
    typeof value.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(language === "en" ? "en-GB" : "nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getStoredDate = (value) => {
  if (!value) return null;
  const date =
    typeof value.toDate === "function" ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatLogDay = (value, language) => {
  const date = getStoredDate(value);
  if (!date) return language === "en" ? "Unknown date" : "Onbekende datum";
  return new Intl.DateTimeFormat(language === "en" ? "en-GB" : "nl-NL", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
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
    const qRef = query(
      collection(db, "feedback"),
      orderBy("createdAt", "desc"),
    );
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
      },
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
    <section className="rounded-lg border border-line bg-surface p-4">
      <div className="mb-4 flex items-center gap-3">
        <MessageSquare className="text-accent" size={18} />
        <div>
          <h2 className="text-lg font-semibold text-ink">
            {t.feedback.inboxTitle}
          </h2>
          <p className="text-sm text-muted">
            {items.length} {t.nav.feedback.toLowerCase()}
          </p>
        </div>
      </div>
      {error && (
        <p className="mb-3 rounded-md border border-red-300/20 bg-red-300/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
      {loading && <p className="text-sm text-muted">{t.firebase.loading}</p>}
      {!loading && items.length === 0 && (
        <p className="text-sm text-muted">{t.feedback.emptyInbox}</p>
      )}
      <div className="space-y-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-md border border-line bg-wash p-4"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
              <span>{formatStoredDate(item.createdAt, language)}</span>
              <span className="rounded border border-line px-2 py-1 uppercase tracking-[0.14em]">
                {item.language || "nl"}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-6 text-ink">
              {item.text}
            </p>
            <button
              type="button"
              onClick={() => removeFeedback(item.id)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-xs text-red-300 hover:border-red-300/35"
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
    const qRef = query(
      collection(db, "comments"),
      orderBy("createdAt", "desc"),
    );
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
      },
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
    <section className="rounded-lg border border-line bg-surface p-4">
      <div className="mb-4 flex items-center gap-3">
        <MessageSquare className="text-accent" size={18} />
        <div>
          <h2 className="text-lg font-semibold text-ink">
            {t.admin.commentsTitle}
          </h2>
          <p className="text-sm text-muted">
            {comments.length} {t.comments.title.toLowerCase()}
          </p>
        </div>
      </div>
      {error && (
        <p className="mb-3 rounded-md border border-red-300/20 bg-red-300/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
      {loading && <p className="text-sm text-muted">{t.firebase.loading}</p>}
      {!loading && comments.length === 0 && (
        <p className="text-sm text-muted">{t.admin.commentsEmpty}</p>
      )}
      <div className="space-y-3">
        {comments.map((comment) => (
          <article
            key={comment.id}
            className="rounded-md border border-line bg-wash p-4"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
              <span>{comment.articleId}</span>
              <span>{formatStoredDate(comment.createdAt, language)}</span>
            </div>
            <p className="font-semibold text-ink">
              {comment.name || "Anoniem"}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink">
              {comment.text}
            </p>
            <button
              type="button"
              onClick={() => removeComment(comment.id)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-xs text-red-300 hover:border-red-300/35"
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [contextFilter, setContextFilter] = useState("all");
  const [expandedId, setExpandedId] = useState("");

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
        if (!res.ok)
          throw new Error(data?.error || t.admin.clarusLogsLoadError);
        if (!cancelled) {
          const entries = Array.isArray(data.logs) ? data.logs : [];
          setLogs(entries);
          setExpandedId(entries[0]?.id || "");
        }
      } catch (err) {
        console.error("Clarus logs load failed:", err);
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : t.admin.clarusLogsLoadError,
          );
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

  const logStats = useMemo(
    () => ({
      total: logs.length,
      completed: logs.filter((entry) => entry.status === "completed").length,
      refused: logs.filter((entry) =>
        String(entry.status || "").includes("refused"),
      ).length,
      errors: logs.filter((entry) => entry.error || entry.status === "error")
        .length,
    }),
    [logs],
  );

  const contextOptions = useMemo(() => {
    const contexts = Array.from(
      new Set(logs.map((entry) => entry.contextType || "essay")),
    );
    return ["all", ...contexts.sort()];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return logs.filter((entry) => {
      const status = entry.status || (entry.error ? "error" : "completed");
      const statusMatch =
        statusFilter === "all" ||
        (statusFilter === "error" && (entry.error || status === "error")) ||
        (statusFilter === "refused" && String(status).includes("refused")) ||
        status === statusFilter;
      const contextMatch =
        contextFilter === "all" ||
        (entry.contextType || "essay") === contextFilter;
      const haystack = [
        entry.question,
        entry.answer,
        entry.error,
        entry.essayTitle,
        entry.essayId,
        entry.model,
        entry.contextType,
        entry.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return (
        statusMatch && contextMatch && (!needle || haystack.includes(needle))
      );
    });
  }, [contextFilter, logs, search, statusFilter]);

  const groupedLogs = useMemo(() => {
    const groups = new Map();
    for (const entry of filteredLogs) {
      const key = formatLogDay(entry.timestamp, language);
      groups.set(key, [...(groups.get(key) || []), entry]);
    }
    return Array.from(groups.entries());
  }, [filteredLogs, language]);

  const statusOptions = [
    ["all", t.admin.clarusStatusAll],
    ["completed", t.admin.clarusCompleted],
    ["refused", t.admin.clarusRefused],
    ["error", t.admin.clarusErrored],
    ["started", t.admin.clarusStarted],
  ];

  return (
    <section className="rounded-lg border border-line bg-surface p-4 xl:col-span-3">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-accent" size={18} />
          <div>
            <h2 className="text-lg font-semibold text-ink">
              {t.admin.clarusLogsTitle}
            </h2>
            <p className="text-sm text-muted">{t.admin.clarusLogsSubtitle}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setReloadKey((value) => value + 1)}
          className="grid h-9 w-9 place-items-center rounded-md border border-line bg-wash text-muted transition hover:border-accent/30 hover:text-ink"
          aria-label={t.actions.refresh}
          title={t.actions.refresh}
          disabled={loading}
        >
          <RefreshCcw size={15} />
        </button>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <AdminStat label={t.admin.total} value={logStats.total} />
        <AdminStat
          label={t.admin.clarusCompleted}
          value={logStats.completed}
          tone="green"
        />
        <AdminStat
          label={t.admin.clarusRefused}
          value={logStats.refused}
          tone="amber"
        />
        <AdminStat
          label={t.admin.clarusErrored}
          value={logStats.errors}
          tone="red"
        />
      </div>

      <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
        <label className="relative block">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            size={17}
          />
          <input
            className="field pl-10"
            placeholder={t.admin.clarusSearch}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <select
          className="field"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          {statusOptions.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          className="field"
          value={contextFilter}
          onChange={(event) => setContextFilter(event.target.value)}
        >
          <option value="all">{t.admin.clarusContextAll}</option>
          {contextOptions
            .filter((value) => value !== "all")
            .map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
        </select>
      </div>

      {error && (
        <p className="mb-3 rounded-md border border-red-300/20 bg-red-300/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
      {loading && <p className="text-sm text-muted">{t.firebase.loading}</p>}
      {!loading && logs.length === 0 && !error && (
        <p className="text-sm text-muted">{t.admin.clarusLogsEmpty}</p>
      )}
      {!loading && logs.length > 0 && filteredLogs.length === 0 && (
        <p className="rounded-md border border-line bg-wash p-4 text-sm text-muted">
          {t.admin.clarusNoMatches}
        </p>
      )}
      <div className="space-y-4">
        {groupedLogs.map(([day, entries]) => (
          <section
            key={day}
            className="rounded-md border border-line bg-wash p-3"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-ink">{day}</h3>
              <span className="rounded border border-line px-2 py-1 text-xs text-muted">
                {entries.length}
              </span>
            </div>
            <div className="space-y-2">
              {entries.map((entry) => {
                const open = expandedId === entry.id;
                const status =
                  entry.status || (entry.error ? "error" : "completed");
                const statusTone =
                  entry.error || status === "error"
                    ? "border-red-300/25 bg-red-300/10 text-red-300"
                    : String(status).includes("refused")
                      ? "border-amber-300/25 bg-amber-300/10 text-amber-200"
                      : "border-emerald-300/25 bg-emerald-300/10 text-emerald-300";

                return (
                  <article
                    key={entry.id}
                    className="rounded-md border border-line bg-surface"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedId(open ? "" : entry.id)}
                      className="flex w-full items-start gap-3 p-3 text-left"
                    >
                      <span className="mt-0.5 text-muted">
                        {open ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                          <span
                            className={cx(
                              "rounded border px-2 py-1",
                              statusTone,
                            )}
                          >
                            {status}
                          </span>
                          <span className="rounded border border-line px-2 py-1 text-muted">
                            {entry.contextType || "essay"}
                          </span>
                          <span className="text-muted">
                            {formatStoredDate(entry.timestamp, language)}
                          </span>
                          <span className="text-muted">
                            {entry.model || "model unknown"}
                          </span>
                        </div>
                        <p className="line-clamp-2 text-sm font-medium leading-6 text-ink">
                          {entry.question || t.admin.clarusQuestion}
                        </p>
                        {(entry.essayTitle || entry.essayId) && (
                          <p className="mt-1 truncate text-xs text-accent">
                            {entry.essayTitle || entry.essayId}
                          </p>
                        )}
                      </div>
                    </button>

                    {open && (
                      <div className="border-t border-line p-4">
                        <div className="grid gap-4 lg:grid-cols-2">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                              {t.admin.clarusQuestion}
                            </p>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink">
                              {entry.question}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                              {entry.error
                                ? t.admin.clarusError
                                : t.admin.clarusAnswer}
                            </p>
                            <p
                              className={
                                entry.error
                                  ? "mt-2 whitespace-pre-wrap text-sm leading-6 text-red-300"
                                  : "mt-2 whitespace-pre-wrap text-sm leading-6 text-muted"
                              }
                            >
                              {entry.error || entry.answer || ""}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
                          <span className="rounded border border-line px-2 py-1">
                            id: {entry.id}
                          </span>
                          {entry.corpusSize !== undefined && (
                            <span className="rounded border border-line px-2 py-1">
                              corpus: {entry.corpusSize}
                            </span>
                          )}
                          {entry.essayId && (
                            <span className="rounded border border-line px-2 py-1">
                              {entry.essayId}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
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
      englishReady: essays.filter((essay) => hasEnglishTranslation(essay))
        .length,
    }),
    [essays],
  );

  const filteredEssays = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return essays.filter((essay) => {
      const localized = localizeEssay(essay, language);
      const statusMatch =
        statusFilter === "all" || essay.status === statusFilter;
      const searchMatch =
        !needle ||
        [
          essay.title,
          localized.displayTitle,
          essay.id,
          essay.excerpt,
          localized.displayExcerpt,
          ...(essay.categories || []),
        ]
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
  const editorHelp =
    editorLanguage === "en" ? t.admin.englishHelp : t.admin.dutchHelp;
  const editorStats = useMemo(
    () => getTextStats(currentText.body),
    [currentText.body],
  );

  const uploadEssayImage = async (file) => {
    const essayId = slugify(form.id || form.title || "draft");
    if (!essayId) throw new Error(t.admin.imageUploadError);
    const extension = file.name.includes(".")
      ? file.name.split(".").pop()
      : "jpg";
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
        { merge: true },
      );
      setNotice(
        nextStatus === "published" ? t.admin.published : t.admin.drafted,
      );
      if (form.id === essay.id)
        setForm((current) => ({ ...current, status: nextStatus }));
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
          <p className="inline-flex items-center gap-2 text-sm font-medium text-accent">
            <ShieldCheck size={16} />
            {t.admin.eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">
            {t.admin.title}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={startNew}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-paper transition hover:bg-ink"
          >
            <Plus size={17} />
            {t.actions.newEssay}
          </button>
          <button
            onClick={onSignOut}
            className="inline-flex items-center gap-2 rounded-md border border-line bg-wash px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-red-300/40 hover:text-red-300"
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
        <AdminStat
          label={t.admin.englishReady}
          value={stats.englishReady}
          tone="blue"
        />
      </div>

      {(syncError || error || notice) && (
        <div className="mb-5 space-y-2">
          {syncError && (
            <p className="rounded-md border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-sm text-amber-200">
              {syncError}
            </p>
          )}
          {error && (
            <p className="rounded-md border border-red-300/20 bg-red-300/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}
          {notice && (
            <p className="rounded-md border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-sm text-emerald-300">
              {notice}
            </p>
          )}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(320px,0.82fr)_minmax(0,1.35fr)]">
        <aside className="rounded-lg border border-line bg-surface p-4">
          <div className="space-y-3">
            <label className="relative block">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                size={17}
              />
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
                      ? "border-accent/30 bg-accent/10 text-accent"
                      : "border-line bg-wash text-muted hover:border-accent/30",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 max-h-[780px] space-y-2 overflow-y-auto pr-1">
            {loading && (
              <p className="p-3 text-sm text-muted">{t.firebase.loading}</p>
            )}
            {!loading && filteredEssays.length === 0 && (
              <p className="rounded-md border border-line bg-wash p-4 text-sm text-muted">
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
                      ? "border-accent/30 bg-accent/10"
                      : "border-line bg-wash hover:border-line",
                  )}
                >
                  <button
                    onClick={() => handleEdit(essay)}
                    className="block w-full text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold leading-snug text-ink">
                          {localized.displayTitle || t.admin.untitled}
                        </h3>
                        <p className="mt-1 text-xs text-muted">{essay.id}</p>
                      </div>
                      <StatusBadge status={essay.status} language={language} />
                    </div>
                    <p className="mt-2 text-xs text-muted">
                      {formatDate(essay.date, language)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded border border-slate-400/20 bg-wash px-2 py-1 text-[11px] font-semibold text-muted">
                        NL
                      </span>
                      <span
                        className={cx(
                          "rounded border px-2 py-1 text-[11px] font-semibold",
                          englishReady
                            ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-300"
                            : "border-amber-300/25 bg-amber-300/10 text-amber-200",
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
                      className="inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-xs text-ink hover:border-accent/30"
                    >
                      <Pencil size={13} />
                      {t.actions.edit}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateStatus(
                          essay,
                          essay.status === "published" ? "draft" : "published",
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-xs text-ink hover:border-emerald-300/35"
                    >
                      <CheckCircle2 size={13} />
                      {essay.status === "published"
                        ? t.actions.draft
                        : t.actions.publish}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeEssay(essay)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-xs text-red-300 hover:border-red-300/35"
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

        <form
          onSubmit={saveEssay}
          className="rounded-lg border border-line bg-surface p-4 sm:p-5"
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <div>
              <p className="text-sm text-muted">
                {isEditing ? t.admin.existingEssay : t.admin.newEssay}
              </p>
              <h2 className="text-xl font-semibold text-ink">
                {currentText.title || form.title || t.admin.workingTitle}
              </h2>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-paper transition hover:bg-ink disabled:opacity-60"
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
                    ? "border-accent/30 bg-accent/10 text-accent"
                    : "border-line bg-wash text-muted hover:border-accent/30",
                )}
              >
                <Languages size={15} />
                {label}
              </button>
            ))}
          </div>
          <p className="mb-5 rounded-md border border-line bg-wash px-3 py-2 text-sm text-muted">
            {editorHelp}
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-muted">
                {t.admin.titleLabel}
              </span>
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
              <span className="text-sm font-medium text-muted">
                {t.admin.slugLabel}
              </span>
              <input
                className="field disabled:opacity-60"
                value={form.id}
                onChange={(e) => {
                  setIdTouched(true);
                  setForm((current) => ({
                    ...current,
                    id: slugify(e.target.value),
                  }));
                }}
                placeholder={t.admin.slugPlaceholder}
                disabled={isEditing || editorLanguage === "en"}
                maxLength={200}
                required
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-muted">
                {t.admin.dateLabel}
              </span>
              <input
                type="date"
                className="field"
                value={form.date}
                onChange={(e) =>
                  setForm((current) => ({ ...current, date: e.target.value }))
                }
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-muted">
                {t.admin.statusLabel}
              </span>
              <select
                className="field"
                value={form.status}
                onChange={(e) =>
                  setForm((current) => ({ ...current, status: e.target.value }))
                }
              >
                <option value="draft">{t.status.draft}</option>
                <option value="published">{t.status.published}</option>
              </select>
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-muted">
                {t.admin.excerptLabel}
              </span>
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
            <p className="mb-2 text-sm font-medium text-muted">
              {t.admin.categoriesLabel}
            </p>
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
                        ? "border-accent/30 bg-accent/10 text-accent"
                        : "border-line bg-wash text-muted hover:border-accent/30",
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
              <p className="text-sm font-medium text-muted">
                {t.admin.bodyLabel}
              </p>
              <div className="inline-flex items-center gap-2 rounded-md border border-line bg-wash px-2.5 py-1.5 text-xs text-muted">
                <FileText size={13} />
                <span>{t.admin.textStats}</span>
                <span>{t.admin.wordCount(editorStats.words)}</span>
                <span>{t.admin.readingTime(editorStats.minutes)}</span>
              </div>
            </div>
            <Suspense
              fallback={
                <p className="py-12 text-sm text-muted" role="status">
                  {language === "nl"
                    ? "Schrijfomgeving laden…"
                    : "Loading editor…"}
                </p>
              }
            >
              <TipTapEditor
                value={currentText.body}
                onChange={(val) => setLocalizedField("body", val)}
                language={language}
                onUploadImage={uploadEssayImage}
              />
            </Suspense>
          </div>

          <div className="mt-6 rounded-lg border border-line bg-surface p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted">
              <FileText size={16} />
              {t.admin.preview}
            </div>
            <div
              className="prose prose-editorial max-w-none prose-headings:text-ink prose-a:text-accent"
              dangerouslySetInnerHTML={{
                __html: sanitizeHTML(
                  currentText.body || `<p>${t.admin.noText}</p>`,
                ),
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
      ? "text-emerald-300 border-emerald-300/20 bg-emerald-300/8"
      : tone === "amber"
        ? "text-amber-200 border-amber-300/20 bg-amber-300/8"
        : tone === "red"
          ? "text-red-300 border-red-300/20 bg-red-300/8"
          : "text-accent border-accent/30 bg-accent/10";

  return (
    <div className={cx("rounded-lg border p-4", toneClass)}>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-ink">{value}</p>
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
    <section className="info-page mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="text-sm font-medium text-accent">{t.aboutEyebrow}</p>
      <h1 className="mt-2 text-4xl font-semibold text-ink">{t.aboutTitle}</h1>
      <div className="prose prose-editorial mt-8 max-w-none prose-a:text-accent">
        {t.about.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <Link
        to="/feedback"
        className="mt-8 inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-paper transition hover:bg-ink"
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
    <section className="info-page mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <p className="text-sm font-medium text-accent">{t.roadmapEyebrow}</p>
      <h1 className="mt-2 text-4xl font-semibold text-ink">{t.roadmapTitle}</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <RoadmapBlock title={t.now} items={t.nowItems} />
        <RoadmapBlock title={t.later} items={t.laterItems} />
      </div>
    </section>
  );
}

function RoadmapBlock({ title, items }) {
  return (
    <div className="glow-surface rounded-lg border border-line bg-surface p-5">
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-6 text-muted">
            <CheckCircle2 className="mt-1 shrink-0 text-accent" size={16} />
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
    <section className="info-page mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="text-sm font-medium text-accent">{t.privacyEyebrow}</p>
      <h1 className="mt-2 text-4xl font-semibold text-ink">{t.privacyTitle}</h1>
      <div className="prose prose-editorial mt-8 max-w-none prose-a:text-accent">
        {t.privacy.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <Link
        to="/feedback"
        className="mt-8 inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-paper transition hover:bg-ink"
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
            className="mt-5 inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-paper"
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
    <footer className="site-footer">
      <div className="page-width">
        <div className="footer-main">
          <Link to="/" className="wordmark">
            degrondvraag<span>.</span>
          </Link>
          <p>
            {language === "nl"
              ? "Een persoonlijk essayarchief."
              : "An independent essay archive."}
          </p>
          <Link to="/essays" className="text-link">
            {t.essays}
            <ArrowRight size={15} />
          </Link>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} degrondvraag</span>
          <nav
            aria-label={language === "nl" ? "Overige pagina’s" : "More pages"}
          >
            <Link to="/over">{t.about}</Link>
            <Link to="/feedback">{t.feedback}</Link>
            <Link to="/roadmap">{t.roadmap}</Link>
            <Link to="/privacy">Privacy</Link>
          </nav>
          <span>
            {language === "nl"
              ? "Geloof, moraal & bestaan."
              : "Faith, morality & existence."}
          </span>
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
          signInAnonymously(auth).catch((err) =>
            console.error("Anonymous sign-in failed:", err),
          );
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
      <RouteScroll />
      <div className="site-shell">
        <Header
          language={language}
          setLanguage={setLanguage}
          admin={admin}
          onSignOut={handleSignOut}
        />
        <a href="#main-content" className="skip-link">
          {language === "nl" ? "Naar de inhoud" : "Skip to content"}
        </a>
        <main id="main-content" tabIndex={-1}>
          <Routes>
            <Route path="/" element={<HomePage language={language} />} />
            <Route
              path="/essays"
              element={<EssaysOverviewPage language={language} />}
            />
            <Route
              path="/essays/:id"
              element={<EssayPage language={language} />}
            />
            <Route path="/over" element={<AboutPage language={language} />} />
            <Route
              path="/feedback"
              element={<FeedbackPage language={language} />}
            />
            <Route
              path="/clarus"
              element={<ClarusPage language={language} />}
            />
            <Route
              path="/roadmap"
              element={<RoadmapPage language={language} />}
            />
            <Route
              path="/privacy"
              element={<PrivacyPage language={language} />}
            />
            <Route
              path="/admin"
              element={
                admin ? (
                  <AdminPanel language={language} onSignOut={handleSignOut} />
                ) : (
                  <AdminLogin
                    language={language}
                    onLogin={() => setAdmin(true)}
                  />
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
