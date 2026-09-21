import { useEffect, useMemo, useRef, useState } from "react";
import { Info, MessageSquare, RefreshCcw, Send, Square, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const PANEL_WIDTH = 430;

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

const copy = {
  nl: {
    aria: "Clarus chatpaneel",
    title: "Clarus",
    over: "Over",
    conversation: "Gesprek",
    about: "Over Clarus",
    indexed: (amount) => `${amount} essays in de aanbevelingsindex.`,
    newChat: "Nieuw gesprek",
    close: "Sluiten",
    send: "Verstuur",
    stop: "Stop antwoord",
    stopped: "Antwoord gestopt. Je kunt een nieuwe vraag stellen.",
    connectionError:
      "Clarus is even niet bereikbaar. Je vraag staat weer klaar om opnieuw te versturen.",
    inputHint: "Enter om te versturen · Shift + Enter voor een nieuwe regel",
    placeholder: "Stel een vraag over dit essay...",
    corpusPlaceholder: "Vraag welk essay past bij jouw vraag...",
    loading: "Clarus formuleert een antwoord.",
    queued:
      "Clarus denkt na over je vraag. Bij het eerste gesprek kan dit iets langer duren.",
    noBackend:
      "Clarus is op dit moment niet beschikbaar. Probeer het later opnieuw.",
    emptyAnswer: "Clarus gaf geen bruikbaar antwoord terug.",
    intro: (title) =>
      `Ik ben Clarus. Stel een precieze vraag over "${title}", een begrip, een argument of een bezwaar.`,
    corpusIntro:
      "Ik ben Clarus. Beschrijf wat je wilt begrijpen, dan wijs ik je naar passende essays uit het archief en verduidelijk ik de begrippen.",
    notice:
      "Gesprekken worden gelogd om fouten, stijl en bruikbaarheid te beoordelen. Deel geen persoonlijke of gevoelige informatie.",
    corpusNotice:
      "Clarus helpt je essays te ontdekken en de ideeën daarin te onderzoeken. Zijn antwoorden zijn gebaseerd op het publieke archief.",
    aboutTitle: "Wat Clarus is",
    aboutBody: [
      "Clarus is de reflectieve assistent van degrondvraag.com. De naam verwijst naar helderheid.",
      "Het systeem is geen religieuze autoriteit en geen RAG-database. Clarus gebruikt de essaytekst, het publieke essayarchief, de gesprekscontext en vooraf geschreven instructies om vragen te verhelderen.",
      "Op deze pagina is zijn taak smal: lezers naar passende essays leiden en begrippen binnen de thematiek van de site preciezer maken.",
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
    indexed: (amount) => `${amount} essays indexed for recommendations.`,
    newChat: "New conversation",
    close: "Close",
    send: "Send",
    stop: "Stop response",
    stopped: "Response stopped. You can ask another question.",
    connectionError:
      "Clarus could not be reached. Your question is ready to send again.",
    inputHint: "Enter to send · Shift + Enter for a new line",
    placeholder: "Ask a question about this essay...",
    corpusPlaceholder: "Ask which essay fits your question...",
    loading: "Clarus is composing an answer.",
    queued:
      "Clarus is thinking about your question. The first response may take a little longer.",
    noBackend: "Clarus is currently unavailable. Please try again later.",
    emptyAnswer: "Clarus returned no usable answer.",
    intro: (title) =>
      `I am Clarus. Ask a precise question about "${title}", a concept, an argument or an objection.`,
    corpusIntro:
      "I am Clarus. Describe what you want to understand, and I will point you to fitting essays from the archive and clarify the concepts.",
    notice:
      "Conversations are logged so errors, style and usefulness can be reviewed. Do not share personal or sensitive information.",
    corpusNotice:
      "Clarus helps you discover essays and explore their ideas. Its answers draw on the public archive.",
    aboutTitle: "What Clarus Is",
    aboutBody: [
      "Clarus is the reflective assistant of degrondvraag.com. The name points to clarity.",
      "The system is not a religious authority and not a RAG database. Clarus uses essay text, the public essay archive, the conversation and pre-written instructions to clarify questions.",
      "On this page its task is narrow: guide readers to fitting essays and make concepts within the site's themes more precise.",
      "Conversations are logged on the backend so the administrator can evaluate errors, style and usefulness. Do not share personal, medical, legal or sensitive information.",
      "The administrator deliberately keeps himself outside the public experience. Clarus must not speculate about his identity.",
    ],
  },
};

function getSessionKey(language, essayId, contextType) {
  return `clarus-chat-history-v4:${contextType}:${language}:${essayId || "essay"}`;
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
        p: ({ children: nodeChildren }) => (
          <p className="mb-2 last:mb-0">{nodeChildren}</p>
        ),
        strong: ({ children: nodeChildren }) => (
          <strong className="font-semibold text-ink">{nodeChildren}</strong>
        ),
        em: ({ children: nodeChildren }) => (
          <em className="text-accent">{nodeChildren}</em>
        ),
        ol: ({ children: nodeChildren }) => (
          <ol className="mb-2 list-decimal space-y-1 pl-5">{nodeChildren}</ol>
        ),
        ul: ({ children: nodeChildren }) => (
          <ul className="mb-2 list-disc space-y-1 pl-5">{nodeChildren}</ul>
        ),
        li: ({ children: nodeChildren }) => (
          <li className="pl-1">{nodeChildren}</li>
        ),
        h1: ({ children: nodeChildren }) => (
          <h3 className="mb-2 text-base font-semibold text-ink">
            {nodeChildren}
          </h3>
        ),
        h2: ({ children: nodeChildren }) => (
          <h3 className="mb-2 text-base font-semibold text-ink">
            {nodeChildren}
          </h3>
        ),
        h3: ({ children: nodeChildren }) => (
          <h3 className="mb-2 text-sm font-semibold text-ink">
            {nodeChildren}
          </h3>
        ),
        code: ({ children: nodeChildren }) => (
          <code className="rounded border border-line bg-surface px-1 py-0.5 text-[0.92em] text-accent">
            {nodeChildren}
          </code>
        ),
      }}
    >
      {String(children || "")}
    </ReactMarkdown>
  );
}

function TypingIndicator({ label }) {
  return (
    <div
      className="inline-flex items-center gap-1.5 py-1"
      aria-label={label}
      role="status"
    >
      <span className="typing-dot" />
      <span className="typing-dot typing-dot-delay-1" />
      <span className="typing-dot typing-dot-delay-2" />
    </div>
  );
}

export default function ChatPanel({
  essay,
  essayCorpus = [],
  contextType = "essay",
  initialInput = "",
  initialInputKey = 0,
  variant = "panel",
  language = "nl",
  onClose,
}) {
  const t = copy[language] || copy.nl;
  const isCorpus = contextType === "corpus";
  const embedded = variant === "embedded";
  const sessionKey = useMemo(
    () => getSessionKey(language, essay?.id, contextType),
    [contextType, language, essay?.id],
  );
  const initialMessages = useMemo(
    () => [
      {
        from: "clarus",
        text: isCorpus ? t.corpusIntro : t.intro(essay?.title || "dit essay"),
      },
    ],
    [essay?.title, isCorpus, t],
  );

  const [messages, setMessages] = useState(() => {
    if (isCorpus) return initialMessages;
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
  const conversationRef = useRef(null);
  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const requestRef = useRef(null);
  const followMessages = useRef(true);

  useEffect(() => () => requestRef.current?.abort(), []);

  useEffect(() => {
    if (embedded) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    const handleKey = (event) => {
      if (event.key === "Escape") onClose?.();
      if (event.key !== "Tab") return;
      const controls = panelRef.current?.querySelectorAll(
        'button:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]',
      );
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
      previousFocus?.focus();
    };
  }, [embedded, onClose]);

  useEffect(() => {
    if (!embedded) setVisible(true);
  }, [embedded]);

  useEffect(() => {
    if (isCorpus) {
      setMessages(initialMessages);
      return;
    }
    setMessages(() => {
      try {
        const item = JSON.parse(localStorage.getItem(sessionKey));
        if (Array.isArray(item?.history)) return item.history;
      } catch (err) {
        console.warn("Could not restore Clarus session:", err);
      }
      return initialMessages;
    });
  }, [initialMessages, isCorpus, sessionKey]);

  useEffect(() => {
    if (isCorpus) return;
    localStorage.setItem(sessionKey, JSON.stringify({ history: messages }));
  }, [isCorpus, messages, sessionKey]);

  useEffect(() => {
    const container = conversationRef.current;
    if (container && followMessages.current)
      container.scrollTop = container.scrollHeight;
  }, [messages, activeTab]);

  useEffect(() => {
    if (initialInput) {
      setInput(initialInput);
      setActiveTab("conversation");
      inputRef.current?.focus({ preventScroll: true });
      inputRef.current?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [initialInput, initialInputKey]);

  const handleNewChat = () => {
    setMessages(initialMessages);
    setActiveTab("conversation");
    setInput("");
    followMessages.current = true;
  };

  const handleClose = () => {
    if (!onClose) return;
    setVisible(false);
    window.setTimeout(onClose, 180);
  };

  const askClarus = async (question) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    if (!backendUrl) {
      setMessages((current) => [
        ...current,
        { from: "clarus", text: t.noBackend },
      ]);
      return;
    }

    setLoading(true);
    followMessages.current = true;
    const controller = new AbortController();
    requestRef.current = controller;
    const userMessage = { from: "user", text: question };
    const placeholderMessage = {
      from: "clarus",
      text: t.queued,
      pending: true,
    };
    const outgoingMessages = [...messages, userMessage, placeholderMessage];
    const placeholderIndex = outgoingMessages.length - 1;
    setMessages(outgoingMessages);

    const updatePlaceholder = (text, pending = true) => {
      setMessages((current) =>
        current.map((message, index) =>
          index === placeholderIndex ? { ...message, text, pending } : message,
        ),
      );
    };

    let answer = "";
    try {
      const res = await fetch(`${backendUrl}/chat-stream`, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vraag: question,
          language,
          contextType,
          essay: essay?.body || "",
          essayId: essay?.id,
          essayTitle: essay?.title,
          essayCorpus,
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
            updatePlaceholder(answer || t.loading, false);
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
      if (err?.name !== "AbortError") setInput(question);
      updatePlaceholder(
        err?.name === "AbortError"
          ? answer || t.stopped
          : err instanceof TypeError
            ? t.connectionError
            : err instanceof Error
              ? err.message
              : t.emptyAnswer,
        false,
      );
    } finally {
      setLoading(false);
      requestRef.current = null;
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const question = input.trim();
    if (!question || loading) return;
    setInput("");
    askClarus(question);
  };

  if (!essay?.body && !essayCorpus.length) return null;

  const tabClass = (tab) =>
    cx(
      "inline-flex items-center justify-center gap-2 rounded px-3 py-2 text-xs font-semibold transition",
      activeTab === tab
        ? embedded
          ? "bg-wash text-accent shadow-none"
          : "bg-accent text-paper"
        : "text-muted hover:bg-wash hover:text-ink",
    );

  const chatContent = (
    <>
      <div className="pointer-events-none absolute inset-0 bg-paper" />
      <div className="relative flex h-full w-full flex-col">
        <header
          className={
            embedded
              ? "border-b border-line px-5 py-5"
              : "border-b border-line px-4 py-4"
          }
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                {t.title}
              </p>
              <h2 className="mt-1 line-clamp-2 text-base font-semibold leading-6 text-ink">
                {isCorpus ? essay?.title : `${t.over}: ${essay?.title}`}
              </h2>
              {embedded && isCorpus && (
                <p className="mt-2 text-xs leading-5 text-muted">
                  {t.indexed(essayCorpus.length)}
                </p>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={handleNewChat}
                className="grid h-9 w-9 place-items-center rounded-md border border-line bg-wash text-muted transition hover:border-accent/30 hover:text-ink"
                aria-label={t.newChat}
                title={t.newChat}
                disabled={loading}
              >
                <RefreshCcw size={16} />
              </button>
              {!embedded && (
                <button
                  type="button"
                  onClick={handleClose}
                  className="grid h-9 w-9 place-items-center rounded-md border border-line bg-wash text-muted transition hover:border-red-300/35 hover:text-red-800"
                  aria-label={t.close}
                  title={t.close}
                >
                  <X size={17} />
                </button>
              )}
            </div>
          </div>

          <div
            className={
              embedded
                ? "mt-5 grid grid-cols-2 gap-1 rounded-md border border-line bg-surface p-1"
                : "mt-4 grid grid-cols-2 gap-2 rounded-md border border-line bg-surface p-1"
            }
          >
            <button
              type="button"
              onClick={() => setActiveTab("conversation")}
              className={tabClass("conversation")}
            >
              <MessageSquare size={14} />
              {t.conversation}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("about")}
              className={tabClass("about")}
            >
              <Info size={14} />
              {t.about}
            </button>
          </div>
        </header>

        {activeTab === "conversation" ? (
          <>
            <div
              className={
                embedded
                  ? "border-b border-line bg-wash px-5 py-3 text-xs leading-5 text-muted"
                  : "border-b border-line bg-accent/10 px-4 py-3 text-xs leading-5 text-accent"
              }
            >
              {isCorpus ? t.corpusNotice : t.notice}
            </div>

            <div
              ref={conversationRef}
              onScroll={(event) => {
                const el = event.currentTarget;
                followMessages.current =
                  el.scrollHeight - el.scrollTop - el.clientHeight < 80;
              }}
              role="log"
              aria-label={t.conversation}
              aria-live="polite"
              className={
                embedded
                  ? "clarus-dialogue-field flex-1 overflow-y-auto px-5 py-6"
                  : "flex-1 overflow-y-auto px-4 py-5"
              }
            >
              <div className="space-y-3">
                {messages.map((message, index) => (
                  <div
                    key={`${message.from}-${index}`}
                    className={
                      message.from === "user"
                        ? "chat-message-user"
                        : "chat-message-clarus"
                    }
                  >
                    {message.pending ? (
                      <div>
                        <TypingIndicator label={t.loading} />
                        <p className="mt-2 text-xs text-muted">
                          {message.text}
                        </p>
                      </div>
                    ) : message.from === "clarus" ? (
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
                {loading && !messages.some((message) => message.pending) && (
                  <div className="max-w-[88%] rounded-lg rounded-bl-sm border border-line bg-wash px-3 py-2.5">
                    <TypingIndicator label={t.loading} />
                  </div>
                )}
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className={
                embedded
                  ? "mt-auto border-t border-line bg-surface p-4"
                  : "border-t border-line bg-surface p-4"
              }
            >
              <div className="flex items-end gap-2 rounded-lg border border-line bg-surface p-1.5 shadow-none">
                <textarea
                  className="field min-h-12 max-h-36 resize-none border-0 bg-transparent focus:ring-0"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  disabled={loading}
                  placeholder={isCorpus ? t.corpusPlaceholder : t.placeholder}
                  ref={inputRef}
                  aria-label={isCorpus ? t.corpusPlaceholder : t.placeholder}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey &&
                      !event.nativeEvent.isComposing
                    ) {
                      event.preventDefault();
                      event.currentTarget.form.requestSubmit();
                    }
                  }}
                  rows={2}
                />
                <button
                  type={loading ? "button" : "submit"}
                  onClick={
                    loading ? () => requestRef.current?.abort() : undefined
                  }
                  disabled={!loading && !input.trim()}
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-accent text-paper shadow-none transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={loading ? t.stop : t.send}
                  title={loading ? t.stop : t.send}
                >
                  {loading ? <Square size={16} /> : <Send size={18} />}
                </button>
              </div>
              <p className="mt-2 text-[10px] text-muted">{t.inputHint}</p>
            </form>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-6">
            <h3 className="text-xl font-semibold text-ink">{t.aboutTitle}</h3>
            <div className="mt-5 space-y-4 text-sm leading-7 text-muted">
              {t.aboutBody.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );

  if (embedded) {
    return (
      <section
        className="clarus-chat-embed relative flex h-[calc(100vh-8rem)] min-h-[560px] max-h-[760px] w-full overflow-hidden rounded-lg border border-accent/30 bg-surface shadow-none backdrop-blur-xl"
        aria-label={t.aria}
      >
        {chatContent}
      </section>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          if (event.target === event.currentTarget) handleClose();
        }}
        className={
          visible
            ? "fixed inset-0 z-40 cursor-default bg-black/70 backdrop-blur-sm transition-opacity"
            : "fixed inset-0 z-40 cursor-default bg-black/0 opacity-0 transition-opacity"
        }
        aria-label={t.close}
      />

      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        className={
          visible
            ? "fixed right-0 top-0 z-50 h-full translate-x-0 border-l border-accent/30 bg-surface shadow-none backdrop-blur-xl transition-transform duration-200"
            : "fixed right-0 top-0 z-50 h-full translate-x-full border-l border-accent/30 bg-surface shadow-none backdrop-blur-xl transition-transform duration-200"
        }
        style={{ width: PANEL_WIDTH, maxWidth: "100vw" }}
        aria-label={t.aria}
      >
        {chatContent}
      </aside>
    </>
  );
}
