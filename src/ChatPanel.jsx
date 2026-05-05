import { useEffect, useMemo, useRef, useState } from "react";
import { Info, MessageSquare, RefreshCcw, Send, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const PANEL_WIDTH = 430;

const copy = {
  nl: {
    aria: "Clarus chatpaneel",
    title: "Clarus",
    over: "Over",
    conversation: "Gesprek",
    about: "Over Clarus",
    newChat: "Nieuw gesprek",
    close: "Sluiten",
    send: "Verstuur",
    placeholder: "Stel een vraag over dit essay...",
    loading: "Clarus formuleert een antwoord.",
    queued:
      "Je vraag staat klaar. Als Render de backend wakker moet maken, kan dit ongeveer 50 seconden duren. Daarna verschijnt het antwoord hier woord voor woord.",
    noBackend: "Clarus is nog niet verbonden met de backend.",
    emptyAnswer: "Clarus gaf geen bruikbaar antwoord terug.",
    intro: (title) =>
      `Ik ben Clarus. Stel een precieze vraag over "${title}", een begrip, een argument of een bezwaar.`,
    notice:
      "Gesprekken worden gelogd om fouten, stijl en bruikbaarheid te beoordelen. Deel geen persoonlijke of gevoelige informatie.",
    aboutTitle: "Wat Clarus is",
    aboutBody: [
      "Clarus is de reflectieve assistent van degrondvraag.com. De naam verwijst naar helderheid.",
      "Het systeem is geen religieuze autoriteit en geen RAG-database. Clarus gebruikt de essaytekst, de gesprekscontext en vooraf geschreven instructies om vragen te verhelderen.",
      "Gesprekken worden op de backend gelogd, zodat de beheerder fouten, stijl en bruikbaarheid kan evalueren. Deel daarom geen persoonlijke, medische, juridische of gevoelige informatie.",
      "De beheerder houdt zichzelf bewust buiten de publieke ervaring. Clarus mag niet speculeren over zijn identiteit.",
    ],
  },
  en: {
    aria: "Clarus chat panel",
    title: "Clarus",
    over: "About",
    conversation: "Conversation",
    about: "About Clarus",
    newChat: "New conversation",
    close: "Close",
    send: "Send",
    placeholder: "Ask a question about this essay...",
    loading: "Clarus is composing an answer.",
    queued:
      "Your question is queued. If Render needs to wake the backend, this can take about 50 seconds. After that, the answer will appear here word by word.",
    noBackend: "Clarus is not connected to the backend yet.",
    emptyAnswer: "Clarus returned no usable answer.",
    intro: (title) =>
      `I am Clarus. Ask a precise question about "${title}", a concept, an argument or an objection.`,
    notice:
      "Conversations are logged so errors, style and usefulness can be reviewed. Do not share personal or sensitive information.",
    aboutTitle: "What Clarus Is",
    aboutBody: [
      "Clarus is the reflective assistant of degrondvraag.com. The name points to clarity.",
      "The system is not a religious authority and not a RAG database. Clarus uses the essay text, the conversation and pre-written instructions to clarify questions.",
      "Conversations are logged on the backend so the administrator can evaluate errors, style and usefulness. Do not share personal, medical, legal or sensitive information.",
      "The administrator deliberately keeps himself outside the public experience. Clarus must not speculate about his identity.",
    ],
  },
};

function getSessionKey(language, essayId) {
  return `clarus-chat-history-v3:${language}:${essayId || "essay"}`;
}

function toBackendHistory(messages) {
  return messages
    .filter((message) => !message.pending)
    .map((message) => ({
      role: message.from === "user" ? "user" : "assistant",
      content: message.text,
    }));
}

function parseSseRecord(record) {
  const lines = record.split("\n");
  let event = "message";
  const data = [];

  for (const line of lines) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
  }

  return {
    event,
    payload: data.length ? JSON.parse(data.join("\n")) : {},
  };
}

function MarkdownMessage({ children }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children: nodeChildren }) => <p className="mb-2 last:mb-0">{nodeChildren}</p>,
        strong: ({ children: nodeChildren }) => <strong className="font-semibold text-white">{nodeChildren}</strong>,
        em: ({ children: nodeChildren }) => <em className="text-sky-100">{nodeChildren}</em>,
        ol: ({ children: nodeChildren }) => <ol className="mb-2 list-decimal space-y-1 pl-5">{nodeChildren}</ol>,
        ul: ({ children: nodeChildren }) => <ul className="mb-2 list-disc space-y-1 pl-5">{nodeChildren}</ul>,
        li: ({ children: nodeChildren }) => <li className="pl-1">{nodeChildren}</li>,
        h1: ({ children: nodeChildren }) => <h3 className="mb-2 text-base font-semibold text-white">{nodeChildren}</h3>,
        h2: ({ children: nodeChildren }) => <h3 className="mb-2 text-base font-semibold text-white">{nodeChildren}</h3>,
        h3: ({ children: nodeChildren }) => <h3 className="mb-2 text-sm font-semibold text-white">{nodeChildren}</h3>,
        code: ({ children: nodeChildren }) => (
          <code className="rounded border border-white/10 bg-slate-950/70 px-1 py-0.5 text-[0.92em] text-sky-100">
            {nodeChildren}
          </code>
        ),
      }}
    >
      {String(children || "")}
    </ReactMarkdown>
  );
}

export default function ChatPanel({ essay, language = "nl", onClose }) {
  const t = copy[language] || copy.nl;
  const sessionKey = useMemo(() => getSessionKey(language, essay?.id), [language, essay?.id]);
  const initialMessages = useMemo(
    () => [{ from: "clarus", text: t.intro(essay?.title || "dit essay") }],
    [essay?.title, t]
  );

  const [messages, setMessages] = useState(() => {
    try {
      const item = JSON.parse(localStorage.getItem(sessionKey));
      if (Array.isArray(item?.history)) return item.history;
    } catch (err) {
      console.warn("Could not restore Clarus session:", err);
    }
    return initialMessages;
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("conversation");
  const bottomRef = useRef(null);

  useEffect(() => {
    setVisible(true);
  }, []);

  useEffect(() => {
    setMessages(() => {
      try {
        const item = JSON.parse(localStorage.getItem(sessionKey));
        if (Array.isArray(item?.history)) return item.history;
      } catch (err) {
        console.warn("Could not restore Clarus session:", err);
      }
      return initialMessages;
    });
  }, [initialMessages, sessionKey]);

  useEffect(() => {
    localStorage.setItem(sessionKey, JSON.stringify({ history: messages }));
  }, [messages, sessionKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeTab]);

  const handleNewChat = () => {
    setMessages(initialMessages);
    setActiveTab("conversation");
  };

  const handleClose = () => {
    setVisible(false);
    window.setTimeout(onClose, 180);
  };

  const askClarus = async (question) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    if (!backendUrl) {
      setMessages((current) => [...current, { from: "clarus", text: t.noBackend }]);
      return;
    }

    setLoading(true);
    const userMessage = { from: "user", text: question };
    const placeholderMessage = { from: "clarus", text: t.queued, pending: true };
    const outgoingMessages = [...messages, userMessage, placeholderMessage];
    const placeholderIndex = outgoingMessages.length - 1;
    setMessages(outgoingMessages);

    const updatePlaceholder = (text, pending = true) => {
      setMessages((current) =>
        current.map((message, index) =>
          index === placeholderIndex ? { ...message, text, pending } : message
        )
      );
    };

    try {
      const res = await fetch(`${backendUrl}/chat-stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vraag: question,
          language,
          essay: essay.body,
          essayId: essay.id,
          essayTitle: essay.title,
          history: toBackendHistory(messages),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Server error ${res.status}`);
      }
      if (!res.body) throw new Error(t.emptyAnswer);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let answer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const records = buffer.split("\n\n");
        buffer = records.pop() || "";

        for (const record of records) {
          if (!record.trim()) continue;
          const { event, payload } = parseSseRecord(record);
          if (event === "status" && !answer) {
            updatePlaceholder(payload.message || t.queued);
          }
          if (event === "token") {
            answer += payload.token || "";
            updatePlaceholder(answer || t.loading);
          }
          if (event === "error") {
            throw new Error(payload.error || t.emptyAnswer);
          }
          if (event === "done") {
            updatePlaceholder(answer || t.emptyAnswer, false);
          }
        }
      }

      if (!answer) throw new Error(t.emptyAnswer);
      updatePlaceholder(answer, false);
    } catch (err) {
      updatePlaceholder(err instanceof Error ? err.message : t.emptyAnswer, false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const question = input.trim();
    if (!question || loading) return;
    setInput("");
    askClarus(question);
  };

  if (!essay?.body) return null;

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          if (event.target === event.currentTarget) handleClose();
        }}
        className={visible ? "fixed inset-0 z-40 cursor-default bg-[#010612]/70 backdrop-blur-sm transition-opacity" : "fixed inset-0 z-40 cursor-default bg-[#010612]/0 opacity-0 transition-opacity"}
        aria-label={t.close}
      />

      <aside
        className={visible ? "fixed right-0 top-0 z-50 h-full translate-x-0 border-l border-sky-300/15 bg-[#020817]/96 shadow-[0_0_70px_rgba(14,165,233,0.18)] backdrop-blur-xl transition-transform duration-200" : "fixed right-0 top-0 z-50 h-full translate-x-full border-l border-sky-300/15 bg-[#020817]/96 shadow-[0_0_70px_rgba(14,165,233,0.18)] backdrop-blur-xl transition-transform duration-200"}
        style={{ width: PANEL_WIDTH, maxWidth: "100vw" }}
        aria-label={t.aria}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.16),transparent_34%),linear-gradient(160deg,rgba(14,116,144,0.16),transparent_42%)]" />
        <div className="relative flex h-full flex-col">
          <header className="border-b border-white/10 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">{t.title}</p>
                <h2 className="mt-1 line-clamp-2 text-base font-semibold leading-6 text-white">
                  {t.over}: {essay.title}
                </h2>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={handleNewChat}
                  className="grid h-9 w-9 place-items-center rounded-md border border-white/10 bg-white/6 text-slate-300 transition hover:border-sky-300/35 hover:text-white"
                  aria-label={t.newChat}
                  title={t.newChat}
                  disabled={loading}
                >
                  <RefreshCcw size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="grid h-9 w-9 place-items-center rounded-md border border-white/10 bg-white/6 text-slate-300 transition hover:border-red-300/35 hover:text-red-100"
                  aria-label={t.close}
                  title={t.close}
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 rounded-md border border-white/10 bg-slate-950/60 p-1">
              <button
                type="button"
                onClick={() => setActiveTab("conversation")}
                className={activeTab === "conversation" ? "inline-flex items-center justify-center gap-2 rounded bg-sky-300 px-3 py-2 text-xs font-semibold text-slate-950" : "inline-flex items-center justify-center gap-2 rounded px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-white/8 hover:text-white"}
              >
                <MessageSquare size={14} />
                {t.conversation}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("about")}
                className={activeTab === "about" ? "inline-flex items-center justify-center gap-2 rounded bg-sky-300 px-3 py-2 text-xs font-semibold text-slate-950" : "inline-flex items-center justify-center gap-2 rounded px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-white/8 hover:text-white"}
              >
                <Info size={14} />
                {t.about}
              </button>
            </div>
          </header>

          {activeTab === "conversation" ? (
            <>
              <div className="border-b border-white/10 bg-sky-300/8 px-4 py-3 text-xs leading-5 text-sky-100">
                {t.notice}
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-5">
                <div className="space-y-3">
                  {messages.map((message, index) => (
                    <div
                      key={`${message.from}-${index}`}
                      className={message.from === "user" ? "ml-auto max-w-[84%] rounded-lg rounded-br-sm border border-sky-300/20 bg-sky-300/14 px-3 py-2.5 text-sm leading-6 text-sky-50" : "max-w-[88%] rounded-lg rounded-bl-sm border border-white/10 bg-white/7 px-3 py-2.5 text-sm leading-6 text-slate-200"}
                    >
                      {message.from === "clarus" ? (
                        <MarkdownMessage>{message.text}</MarkdownMessage>
                      ) : (
                        String(message.text || "")
                          .split("\n")
                          .map((line, lineIndex) => (
                            <p key={lineIndex} className="mb-2 last:mb-0">
                              {line}
                            </p>
                          ))
                      )}
                    </div>
                  ))}
                  {loading && <p className="text-xs text-slate-500">{t.loading}</p>}
                  <div ref={bottomRef} />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="border-t border-white/10 bg-[#020817]/95 p-4">
                <div className="flex items-end gap-2">
                  <textarea
                    className="field min-h-12 max-h-36 resize-y"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    disabled={loading}
                    placeholder={t.placeholder}
                    autoFocus
                    rows={2}
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-sky-300 text-slate-950 transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={t.send}
                    title={t.send}
                  >
                    <Send size={18} />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto px-5 py-6">
              <h3 className="text-xl font-semibold text-white">{t.aboutTitle}</h3>
              <div className="mt-5 space-y-4 text-sm leading-7 text-slate-300">
                {t.aboutBody.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
