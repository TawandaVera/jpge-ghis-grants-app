import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Bot, Send, Plus, MessageSquare, Sparkles, Shield } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

const AGENTS = [
  {
    id: "grant_advisor",
    label: "Grant Advisor",
    description: "Strategy, discovery, writing guidance, and pipeline advice",
    icon: Sparkles,
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    activeBg: "bg-emerald-600",
  },
  {
    id: "hil_reviewer",
    label: "HIL Reviewer",
    description: "Guided human-in-the-loop review for pending checkpoints",
    icon: Shield,
    color: "bg-amber-100 text-amber-700 border-amber-200",
    activeBg: "bg-amber-600",
  },
];

export default function AIAssistant() {
  const [activeAgent, setActiveAgent] = useState(AGENTS[0]);
  const [conversations, setConversations] = useState({});
  const [currentConv, setCurrentConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(false);
  const bottomRef = useRef(null);
  const unsubRef = useRef(null);

  useEffect(() => {
    loadConversations(activeAgent.id);
  }, [activeAgent]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Clean up any active subscription on unmount
  useEffect(() => () => { unsubRef.current?.(); }, []);

  const subscribe = (conversationId) => {
    unsubRef.current?.();
    unsubRef.current = base44.agents.subscribeToConversation(conversationId, (data) => {
      setMessages(data.messages || []);
    });
  };

  const loadConversations = async (agentId) => {
    setLoadingConvs(true);
    unsubRef.current?.();
    setCurrentConv(null);
    setMessages([]);
    try {
      const convs = await base44.agents.listConversations({ agent_name: agentId });
      setConversations(prev => ({ ...prev, [agentId]: convs || [] }));
    } catch (e) {
      toast.error("Failed to load conversations: " + e.message);
    }
    setLoadingConvs(false);
  };

  const newConversation = async () => {
    try {
      const conv = await base44.agents.createConversation({
        agent_name: activeAgent.id,
        metadata: { name: `Chat ${new Date().toLocaleTimeString()}` }
      });
      setCurrentConv(conv);
      setMessages([]);
      setConversations(prev => ({
        ...prev,
        [activeAgent.id]: [conv, ...(prev[activeAgent.id] || [])]
      }));
      subscribe(conv.id);
    } catch (e) {
      toast.error("Failed to start conversation: " + e.message);
    }
  };

  const openConversation = async (conv) => {
    try {
      const full = await base44.agents.getConversation(conv.id);
      setCurrentConv(full);
      setMessages(full.messages || []);
      subscribe(full.id);
    } catch (e) {
      toast.error("Failed to open conversation: " + e.message);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !currentConv || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);

    try {
      await base44.agents.addMessage(currentConv, { role: "user", content: text });
    } catch (e) {
      toast.error("Failed to send message: " + e.message);
    }
    setSending(false);
  };

  const agentConvs = conversations[activeAgent.id] || [];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left Panel */}
      <div className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="w-5 h-5 text-emerald-400" />
            <p className="font-semibold text-sm">AI Assistants</p>
          </div>
          {AGENTS.map(agent => {
            const Icon = agent.icon;
            return (
              <button
                key={agent.id}
                onClick={() => setActiveAgent(agent)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm mb-1 transition-colors border ${
                  activeAgent.id === agent.id
                    ? `${agent.activeBg} text-white border-transparent`
                    : "text-slate-400 hover:bg-slate-800 border-transparent"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="font-medium">{agent.label}</span>
                </div>
                <p className="text-xs opacity-70 mt-0.5 pl-6 leading-tight">{agent.description}</p>
              </button>
            );
          })}
        </div>

        <div className="p-3 border-b border-slate-800">
          <Button
            size="sm"
            className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
            onClick={newConversation}
          >
            <Plus className="w-3.5 h-3.5" /> New Chat
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loadingConvs ? (
            <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-slate-500" /></div>
          ) : agentConvs.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No conversations yet</p>
          ) : (
            agentConvs.slice(0, 20).map(conv => (
              <button
                key={conv.id}
                onClick={() => openConversation(conv)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs mb-1 transition-colors ${
                  currentConv?.id === conv.id ? "bg-slate-700 text-white" : "text-slate-400 hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-3 h-3 shrink-0" />
                  <span className="truncate">{conv.metadata?.name || "Chat"}</span>
                </div>
                <p className="text-slate-500 text-xs mt-0.5 pl-5">
                  {conv.created_date ? new Date(conv.created_date).toLocaleDateString() : ""}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b px-6 py-3 flex items-center gap-3">
          <div className={`p-1.5 rounded-lg ${activeAgent.color}`}>
            {<activeAgent.icon className="w-4 h-4" />}
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-sm">{activeAgent.label}</p>
            <p className="text-xs text-slate-500">{activeAgent.description}</p>
          </div>
          {currentConv && <Badge variant="outline" className="ml-auto text-xs">Active</Badge>}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!currentConv ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <div className={`p-4 rounded-2xl ${activeAgent.color}`}>
                <activeAgent.icon className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">{activeAgent.label}</h2>
                <p className="text-slate-500 text-sm mt-1 max-w-sm">{activeAgent.description}</p>
              </div>
              <Button onClick={newConversation} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                <Plus className="w-4 h-4" /> Start a Conversation
              </Button>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex justify-center py-12">
              <p className="text-slate-400 text-sm">Send a message to get started…</p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role !== "user" && (
                  <div className={`p-1.5 rounded-lg mr-2 mt-1 shrink-0 ${activeAgent.color}`}>
                    <activeAgent.icon className="w-3.5 h-3.5" />
                  </div>
                )}
                <Card className={`max-w-2xl ${msg.role === "user" ? "bg-slate-800 text-white border-0" : "bg-white"}`}>
                  <CardContent className="p-3 text-sm">
                    {msg.role === "user" ? (
                      <p>{msg.content}</p>
                    ) : (
                      <ReactMarkdown className="prose prose-sm max-w-none text-slate-800">
                        {msg.content || "…"}
                      </ReactMarkdown>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))
          )}
          {sending && (
            <div className="flex justify-start">
              <div className={`p-1.5 rounded-lg mr-2 ${activeAgent.color}`}>
                <activeAgent.icon className="w-3.5 h-3.5" />
              </div>
              <Card className="bg-white">
                <CardContent className="p-3">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                </CardContent>
              </Card>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {currentConv && (
          <div className="bg-white border-t p-4">
            <div className="flex gap-3 max-w-3xl mx-auto">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder={`Ask the ${activeAgent.label}…`}
                className="flex-1"
                disabled={sending}
              />
              <Button onClick={sendMessage} disabled={!input.trim() || sending} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}