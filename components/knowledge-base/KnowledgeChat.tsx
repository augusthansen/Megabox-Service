"use client";

import { useState, useRef, useEffect } from "react";

interface Citation {
  documentId: string;
  documentTitle: string;
  chunkId: string;
  pageNumber: number | null;
  snippet: string;
  similarity: number;
  fileUrl?: string | null;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  wasHelpful?: boolean | null;
  createdAt?: string;
}

interface KnowledgeChatProps {
  userId: string;
  userName: string;
  ticketId?: string;
  machineModel?: string;
  manufacturer?: string;
  onClose?: () => void;
  embedded?: boolean;
}

// Document type categories for filtering
const DOCUMENT_CATEGORIES = [
  {
    id: "operator",
    label: "Operator",
    icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    description: "Operating instructions & user guides",
    documentTypes: ["quick_reference", "installation"]
  },
  {
    id: "service",
    label: "Service",
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
    description: "Service manuals, procedures & troubleshooting",
    documentTypes: ["service_manual", "procedures", "troubleshooting", "maintenance"]
  },
  {
    id: "parts",
    label: "Parts",
    icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
    description: "Parts lists & diagrams",
    documentTypes: ["parts_manual"]
  },
  {
    id: "other",
    label: "Other",
    icon: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    description: "TSBs, wiring diagrams & more",
    documentTypes: ["tsb", "wiring_diagram", "other"]
  },
];

// Machine/module categories for filtering
const MACHINE_CATEGORIES = [
  {
    group: "Inserter Systems",
    machines: [
      { id: "Epic", label: "Epic" },
      { id: "MPS", label: "MPS" },
      { id: "FPS", label: "FPS" },
      { id: "FPS-SD", label: "FPS-SD" },
      { id: "Flowmaster", label: "Flowmaster" },
      { id: "Rival", label: "Rival" },
      { id: "APS", label: "APS" },
      { id: "MSE", label: "MSE" },
      { id: "DI2000", label: "DI2000" },
    ]
  },
  {
    group: "Software",
    machines: [
      { id: "DC & RTP", label: "DC & RTP" },
      { id: "Scanning", label: "Scanning Software" },
    ]
  },
  {
    group: "Modules",
    machines: [
      { id: "Feeder Module", label: "Feeder Module" },
      { id: "Input Module", label: "Input Module" },
      { id: "Stacker Module", label: "Stacker Module" },
      { id: "Envelope Module", label: "Envelope Module" },
      { id: "Metering Module", label: "Metering Module" },
      { id: "Buckle Chute Module", label: "Buckle Chute Module" },
    ]
  },
];

export default function KnowledgeChat({
  userId,
  userName,
  ticketId,
  machineModel: initialMachineModel,
  manufacturer: initialManufacturer,
  onClose,
  embedded = false,
}: KnowledgeChatProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCitations, setShowCitations] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<string | null>(initialMachineModel || null);

  // Get active filters for display and API
  const activeCategory = DOCUMENT_CATEGORIES.find(c => c.id === selectedCategory);
  const activeMachine = selectedMachine || initialMachineModel;

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/knowledge-base/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId,
          userId,
          userName,
          ticketId,
          machineModel: activeMachine,
          manufacturer: initialManufacturer || "Bluecrest",
          documentTypes: activeCategory?.documentTypes,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      setSessionId(data.sessionId);

      const assistantMessage: ChatMessage = {
        id: data.messageId,
        role: "assistant",
        content: data.response,
        citations: data.citations,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I encountered an error while processing your question. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (messageId: string, wasHelpful: boolean) => {
    try {
      await fetch(`/api/knowledge-base/chat/${messageId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wasHelpful }),
      });

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, wasHelpful } : msg
        )
      );
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }
  };

  const toggleCitations = (messageId: string) => {
    setShowCitations(showCitations === messageId ? null : messageId);
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedMachine(null);
  };

  // Dynamic suggested questions based on filters
  const getSuggestedQuestions = () => {
    const machinePrefix = activeMachine ? `${activeMachine} ` : "";

    if (selectedCategory === "operator") {
      return [
        `How do I start up the ${machinePrefix}machine?`,
        `What are the ${machinePrefix}operator daily checks?`,
        `How to load materials on ${machinePrefix || "the machine"}?`,
        `${machinePrefix}basic operation guide`,
      ];
    } else if (selectedCategory === "service") {
      return [
        `${machinePrefix}error codes and solutions`,
        `How to troubleshoot ${machinePrefix}paper jams?`,
        `${machinePrefix}preventive maintenance schedule`,
        `${machinePrefix}calibration procedure`,
      ];
    } else if (selectedCategory === "parts") {
      return [
        `${machinePrefix}belt replacement parts`,
        `${machinePrefix}sensor part numbers`,
        `${machinePrefix}roller specifications`,
        `Where to find ${machinePrefix}parts diagram?`,
      ];
    } else {
      return [
        `${machinePrefix}latest technical bulletins`,
        `${machinePrefix}wiring diagram`,
        `${machinePrefix}software updates`,
        `${machinePrefix}known issues`,
      ];
    }
  };

  const suggestedQuestions = getSuggestedQuestions();

  return (
    <div
      className={`bg-white dark:bg-slate-800 flex flex-col ${
        embedded ? "h-full" : "rounded-lg shadow-lg h-[700px]"
      }`}
    >
      {/* Header */}
      {!embedded && (
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold">Knowledge Assistant</h3>
              <p className="text-sm text-blue-100">
                Ask me about manuals, troubleshooting, and procedures
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col h-full">
            {/* Guided Filters Section */}
            <div className="space-y-6">
              {/* Step 1: What are you looking for? */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  What are you looking for help with?
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DOCUMENT_CATEGORIES.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        selectedCategory === category.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                          : "border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 bg-white dark:bg-slate-700"
                      }`}
                    >
                      <svg
                        className={`w-5 h-5 mb-1 ${
                          selectedCategory === category.id
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-500 dark:text-slate-400"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={category.icon}
                        />
                      </svg>
                      <div className={`font-medium text-sm ${
                        selectedCategory === category.id
                          ? "text-blue-700 dark:text-blue-300"
                          : "text-gray-700 dark:text-slate-200"
                      }`}>
                        {category.label}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                        {category.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Which machine or module? */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  Which machine or module do you need help with?
                </h4>
                <div className="space-y-3">
                  {MACHINE_CATEGORIES.map((group) => (
                    <div key={group.group}>
                      <div className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                        {group.group}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {group.machines.map((machine) => (
                          <button
                            key={machine.id}
                            onClick={() => setSelectedMachine(selectedMachine === machine.id ? null : machine.id)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                              selectedMachine === machine.id
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600"
                            }`}
                          >
                            {machine.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Filters Display */}
              {(selectedCategory || selectedMachine) && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-500 dark:text-slate-400">Active filters:</span>
                  {selectedCategory && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                      {DOCUMENT_CATEGORIES.find(c => c.id === selectedCategory)?.label}
                      <button onClick={() => setSelectedCategory(null)} className="hover:text-blue-900 dark:hover:text-blue-100">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  )}
                  {selectedMachine && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs">
                      {selectedMachine}
                      <button onClick={() => setSelectedMachine(null)} className="hover:text-green-900 dark:hover:text-green-100">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  )}
                  <button
                    onClick={clearFilters}
                    className="text-xs text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 underline"
                  >
                    Clear all
                  </button>
                </div>
              )}

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-slate-800 px-2 text-gray-500 dark:text-slate-400">
                    Or ask a question
                  </span>
                </div>
              </div>

              {/* Suggested questions */}
              <div>
                <h4 className="text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                  Suggested questions:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => setInput(question)}
                      className="text-left text-sm px-4 py-2 bg-gray-100 dark:bg-slate-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id}>
              <div
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-3 ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>

                  {/* Citations toggle for assistant messages */}
                  {message.role === "assistant" &&
                    message.citations &&
                    message.citations.length > 0 && (
                      <button
                        onClick={() => toggleCitations(message.id)}
                        className="mt-2 text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        {showCitations === message.id
                          ? "Hide sources"
                          : `${message.citations.length} sources`}
                      </button>
                    )}
                </div>
              </div>

              {/* Citations panel */}
              {message.role === "assistant" &&
                showCitations === message.id &&
                message.citations && (
                  <div className="mt-2 ml-4 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
                    <h5 className="text-xs font-semibold text-gray-600 dark:text-slate-300 mb-2">
                      Sources
                    </h5>
                    <div className="space-y-2">
                      {message.citations.map((citation, idx) => (
                        <div
                          key={idx}
                          className="text-xs p-2 bg-white dark:bg-slate-800 rounded border border-gray-100 dark:border-slate-600"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-medium text-blue-600 dark:text-blue-400">
                              {citation.documentTitle}
                            </span>
                            {citation.pageNumber && (
                              <span className="text-gray-400 dark:text-slate-500 text-[10px]">
                                Page {citation.pageNumber}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-500 dark:text-slate-400 mt-1 line-clamp-2">
                            {citation.snippet}
                          </p>
                          {/* View in PDF button */}
                          {citation.fileUrl && (
                            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-600">
                              <a
                                href={`${citation.fileUrl}${citation.pageNumber ? `#page=${citation.pageNumber}` : ''}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-[11px] font-medium"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                View in PDF
                                {citation.pageNumber && ` (Page ${citation.pageNumber})`}
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Feedback buttons for assistant messages */}
              {message.role === "assistant" && message.id && !message.id.startsWith("error") && (
                <div className="mt-2 ml-4 flex items-center gap-2">
                  {message.wasHelpful === undefined || message.wasHelpful === null ? (
                    <>
                      <span className="text-xs text-gray-500 dark:text-slate-400">Was this helpful?</span>
                      <button
                        onClick={() => handleFeedback(message.id, true)}
                        className="p-1 text-gray-400 dark:text-slate-500 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                        title="Yes, helpful"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleFeedback(message.id, false)}
                        className="p-1 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Not helpful"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
                          />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <span
                      className={`text-xs ${
                        message.wasHelpful ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {message.wasHelpful
                        ? "Thanks for the feedback!"
                        : "We'll work on improving"}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-slate-700 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-2 h-2 bg-gray-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-2 h-2 bg-gray-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
                <span className="text-sm text-gray-500 dark:text-slate-400">Searching documentation...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Context indicator - show when there are messages and filters are active */}
      {messages.length > 0 && (activeMachine || selectedCategory) && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-100 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              <span>
                Filtering:
                {selectedCategory && ` ${DOCUMENT_CATEGORIES.find(c => c.id === selectedCategory)?.label}`}
                {selectedCategory && activeMachine && " •"}
                {activeMachine && ` ${activeMachine}`}
              </span>
            </div>
            <button
              onClick={clearFilters}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear filters
            </button>
          </div>
        </div>
      )}

      {/* Input form */}
      <form onSubmit={handleSubmit} className="p-4 border-t dark:border-slate-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              activeMachine
                ? `Ask about ${activeMachine}...`
                : "Ask a question about the documentation..."
            }
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
