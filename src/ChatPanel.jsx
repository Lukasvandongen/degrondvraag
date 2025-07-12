// Gewijzigde versie van ChatPanel.jsx die het sluiten voorkomt bij klikken in input of formulier

import { useState, useRef, useEffect } from "react";
import { RefreshCcw, X } from "lucide-react";

const SESSION_KEY = "clarus-chat-history-v2";
const PANEL_WIDTH = 410;

export default function ChatPanel({ essay, onClose }) {
  const [messages, setMessages] = useState(() => {
    try {
      const item = JSON.parse(localStorage.getItem(SESSION_KEY));
      if (item && item.essayId === essay.id) return item.history;
    } catch {}
    return [
      {
        from: "clarus",
        text: `Welkom terug. Waar in \"${essay.title}\" zit je gedachte vast?`,
      },
    ];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    setVisible(true);
    return () => setVisible(false);
  }, []);

  useEffect(() => {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ essayId: essay.id, history: messages })
    );
  }, [messages, essay.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNewChat = () => {
    setMessages([
      {
        from: "clarus",
        text: `Welkom terug. Ik ben aan het opstarten, dit kan een minuutje duren. Waar in \"${essay.title}\" zit je gedachte vast?`,
      },
    ]);
  };

  const askClarus = async (vraag) => {
    setLoading(true);
    const newMessages = [...messages, { from: "user", text: vraag }];
    setMessages(newMessages);
    try {
      const history = newMessages.filter((m) => m.from !== "system").map((m) => ({
        role: m.from === "user" ? "user" : "assistant",
        content: m.text,
      }));

      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vraag, essay: essay.body, history }),
      });

      const data = await res.json();
      setMessages((msgs) => [...msgs, { from: "clarus", text: data.antwoord }]);
    } catch {
      setMessages((msgs) => [...msgs, {
        from: "clarus",
        text: "Er ging iets mis met Clarus. Probeer het later opnieuw.",
      }]);
    }
    setLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    askClarus(input);
    setInput("");
  };

  if (!essay?.body) return null;

  function handleOverlayClick(e) {
    // voorkom sluiten als het klikdoel een kindelement van het paneel is
    if (e.target.classList.contains("clarus-overlay")) {
      setVisible(false);
      setTimeout(onClose, 220);
    }
  }

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 220);
  }

  return (
    <>
      
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0 pointer-events-none"
        } clarus-overlay`}
        onClick={handleOverlayClick}
        aria-label="Sluit Clarus chat"
      />

      <aside
        className={`fixed top-0 right-0 z-50 h-full bg-white dark:bg-gray-900 shadow-lg transition-transform duration-200 ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ width: PANEL_WIDTH, maxWidth: "100vw" }}
        aria-label="Clarus chatpaneel"
      >
        <div className="absolute top-0 left-0 w-full h-full bg-white/80 dark:bg-gray-900/80 backdrop-blur transition-opacity duration-200" />
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur">
            <div className="font-semibold text-base">
              Clarus over: <span className="font-bold">{essay.title}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={handleNewChat} title="Nieuw gesprek" className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800" disabled={loading}>
                <RefreshCcw size={18} />
              </button>
              <button onClick={handleClose} title="Chat sluiten" className="p-2 rounded hover:bg-red-100 dark:hover:bg-red-800 transition">
                <X size={22} />
              </button>
            </div>
          </div>

          <div className="p-2 bg-yellow-100 dark:bg-yellow-900 text-xs text-yellow-800 dark:text-yellow-100 rounded mb-3">
          Let op: gesprekken met Clarus kunnen worden opgeslagen voor kwaliteitsverbetering. Deel geen privé-informatie. <a href="/privacy" className="underline">Meer info</a>
          </div>


          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50 dark:bg-gray-900">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`text-sm max-w-[80%] ${
                  m.from === "clarus"
                    ? "bg-blue-50 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100 rounded-xl rounded-bl-none p-3 self-start"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-50 rounded-xl rounded-br-none p-3 self-end ml-auto"
                }`}
              >
                {m.text.split("\n").map((line, idx) => (
                <p key={idx} className="mb-2 last:mb-0">{line}</p>
              ))}

              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
            autoComplete="off"
          >
            <input
              className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder="Stel een vraag over dit essay…"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-xl px-4 py-2 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 font-semibold transition"
            >
              Verstuur
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
