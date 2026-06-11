"use client";

import { useState, useEffect, useRef } from "react";

export default function ChatPage() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<
    { role: string; content: string }[]
  >([]);
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadHistory() {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch("/api/history", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    }

    loadHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function sendMessage() {
    if (!query.trim()) return;

    const userMsg = {
      role: "user",
      content: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuery("");
    setLoading(true);

    const token = localStorage.getItem("token");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: userMsg.content,
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    window.location.href = "/login";
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Support Portal
            </h1>
            <p className="text-sm text-gray-500">
              Ask questions and view conversation history
            </p>
          </div>

          <button
            onClick={logout}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Logout
          </button>
        </div>

        {/* Chat Container */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* Messages */}
          <div className="h-[600px] overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-20">
                Start a conversation by sending a message.
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[75%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-600 rounded-xl px-4 py-3 text-sm">
                  Thinking...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex gap-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading) {
                    sendMessage();
                  }
                }}
                placeholder="Type your message..."
                className="flex-1 h-11 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              />

              <button
                onClick={sendMessage}
                disabled={loading}
                className="px-5 h-11 bg-gray-900 text-white rounded-lg hover:bg-black disabled:opacity-50"
              >
                ASK
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}