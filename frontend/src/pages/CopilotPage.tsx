import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { api } from '../lib/api';
import { ChatMessage } from '../types';
import {
  Bot,
  Send,
  Trash2,
  Sparkles,
  Info,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Tag,
  User
} from 'lucide-react';

export const CopilotPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<string>('gemini-ai');
  const [citedRecords, setCitedRecords] = useState<string[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend || textToSend.trim() === '' || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: textToSend.trim() };
    const newHistory = [...messages, userMsg];

    setMessages(newHistory);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const res = await api.sendCopilotMessage(textToSend.trim(), messages);
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: res.data.answer
      };

      setMessages([...newHistory, assistantMsg]);
      setProvider(res.data.provider);
      if (res.data.citedRecords && res.data.citedRecords.length > 0) {
        setCitedRecords((prev) => Array.from(new Set([...prev, ...res.data.citedRecords])));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reach AI Copilot assistant');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    setError(null);
    setCitedRecords([]);
  };

  const suggestedQuestions = [
    'Why was BEN-1001 flagged?',
    'Are there shared-account relationships between beneficiaries?',
    'Which records support this risk finding?',
    'Summarize the current audit findings.'
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto flex flex-col h-[calc(100vh-6rem)]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="cyan">Grounded Forensic AI</Badge>
            <Badge variant="outline">
              {provider === 'gemini-ai' ? 'Google Gemini AI' : 'Grounded Audit Engine'}
            </Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-1 flex items-center gap-2">
            <Bot className="w-7 h-7 text-blue-400" /> AI Audit Copilot
          </h1>
          <p className="text-sm text-slate-400">
            Ask questions grounded strictly in live beneficiary ledgers, graph edges, and explainable risk rules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {messages.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleClear}>
              <Trash2 className="w-4 h-4 mr-1.5" /> Clear Chat
            </Button>
          )}
        </div>
      </div>

      {/* Human Review Disclaimer Banner */}
      <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 text-slate-300 text-xs flex items-center gap-2.5 shrink-0">
        <Info className="w-4 h-4 text-blue-400 shrink-0" />
        <span className="text-[11px] leading-tight">
          <strong className="text-blue-300">Forensic Audit Standard:</strong> Copilot answers are generated from live audit records. Scored risk indicators require human review and do not constitute legal proof of fraud.
        </span>
      </div>

      {/* Chat Messages Window */}
      <Card className="flex-1 flex flex-col min-h-0 overflow-hidden border border-slate-800">
        <CardContent className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 my-auto py-8">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 p-0.5 shadow-xl shadow-cyan-500/10">
                <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-cyan-400" />
                </div>
              </div>

              <div className="space-y-2 max-w-md">
                <h3 className="text-lg font-bold text-white">How can I assist your micro-audit today?</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  I have direct access to ingested beneficiaries, scheme disbursements, financial web graph edges, and explainable risk signals.
                </p>
              </div>

              {/* Suggested Prompt Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-xl w-full pt-2">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q)}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900/60 text-left text-xs text-slate-300 hover:text-white transition group space-y-1"
                  >
                    <div className="flex items-center justify-between text-blue-400 font-medium">
                      <span>Suggested Query</span>
                      <Sparkles className="w-3 h-3 group-hover:scale-110 transition" />
                    </div>
                    <div>"{q}"</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed space-y-2 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white font-medium rounded-br-none shadow-md'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none shadow-lg'
                  }`}
                >
                  <div className="font-mono text-[10px] opacity-70 mb-1 flex items-center gap-1">
                    {msg.role === 'user' ? (
                      <>
                        <User className="w-3 h-3" /> Auditor
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3 h-3 text-cyan-400" /> FinTrace AI Copilot
                      </>
                    )}
                  </div>

                  {/* Message Content with Line formatting */}
                  <div className="whitespace-pre-wrap space-y-1 font-sans">
                    {msg.content}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))
          )}

          {loading && (
            <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
              <span>Analyzing live telemetry and generating grounded response...</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </CardContent>

        {/* Cited Record Badges Bar */}
        {citedRecords.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/80 flex items-center gap-2 overflow-x-auto text-[11px]">
            <Tag className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="font-mono text-slate-400 shrink-0">Cited Audit Records:</span>
            {citedRecords.map((rec, rIdx) => (
              <span key={rIdx} className="font-mono px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300 shrink-0">
                {rec}
              </span>
            ))}
          </div>
        )}

        {/* Message Input Controls */}
        <div className="p-3 md:p-4 border-t border-slate-800 bg-slate-900/60 flex items-center gap-3">
          <input
            type="text"
            placeholder="Ask Copilot about flagged beneficiaries, shared accounts, or audit findings..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={loading}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
          <Button
            variant="primary"
            size="md"
            onClick={() => handleSend()}
            disabled={loading || input.trim() === ''}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};
