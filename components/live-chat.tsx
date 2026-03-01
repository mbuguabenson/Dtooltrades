"use client"

import React, { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, User, ChevronDown, Loader2 } from "lucide-react"

interface Reply { adminMsg: string; ts: number }
interface Msg { message: string; fromAdmin: boolean; ts: number }

function genVisitorId() {
    const stored = typeof window !== "undefined" ? localStorage.getItem("_dtool_vid") : null
    if (stored) return stored
    const id = `visitor_${Math.random().toString(36).slice(2, 10)}`
    if (typeof window !== "undefined") localStorage.setItem("_dtool_vid", id)
    return id
}

export function LiveChat() {
    const [open, setOpen] = useState(false)
    const [messages, setMessages] = useState<Msg[]>([])
    const [inputMsg, setInputMsg] = useState("")
    const [name, setName] = useState("")
    const [sending, setSending] = useState(false)
    const [visitorId, setVisitorId] = useState("")
    const [hasNewAdminReply, setHasNewAdminReply] = useState(false)
    const bottomRef = useRef<HTMLDivElement>(null)
    const lastReplyCount = useRef(0)

    useEffect(() => {
        setName(localStorage.getItem("_dtool_chat_name") || "")
        setVisitorId(genVisitorId())
    }, [])

    // Poll for admin replies every 15 seconds
    useEffect(() => {
        if (!visitorId) return
        const poll = async () => {
            try {
                const res = await fetch(`/api/chat/message?fromUser=${visitorId}`)
                const data = await res.json()
                if (data.messages?.length) {
                    const allReplies: Msg[] = []
                    data.messages.forEach((m: any) => {
                        allReplies.push({ message: m.message, fromAdmin: false, ts: m.ts })
                        m.replies.forEach((r: Reply) => {
                            allReplies.push({ message: r.adminMsg, fromAdmin: true, ts: r.ts })
                        })
                    })
                    allReplies.sort((a, b) => a.ts - b.ts)

                    const replyCount = allReplies.filter(m => m.fromAdmin).length
                    if (replyCount > lastReplyCount.current) {
                        setHasNewAdminReply(true)
                        lastReplyCount.current = replyCount
                    }
                    setMessages(allReplies)
                }
            } catch { }
        }
        poll()
        const iv = setInterval(poll, 15000)
        return () => clearInterval(iv)
    }, [visitorId])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, open])

    const sendMessage = async () => {
        if (!inputMsg.trim() || !visitorId) return
        setSending(true)
        const n = name || "Visitor"
        if (name) localStorage.setItem("_dtool_chat_name", name)
        const optimistic: Msg = { message: inputMsg, fromAdmin: false, ts: Math.floor(Date.now() / 1000) }
        setMessages(prev => [...prev, optimistic])
        setInputMsg("")
        try {
            await fetch("/api/chat/message", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fromUser: visitorId, name: n, message: inputMsg }),
            })
        } catch { }
        setSending(false)
    }

    return (
        <>
            {/* Floating Bubble */}
            <button
                onClick={() => { setOpen(!open); setHasNewAdminReply(false) }}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-500 rounded-2xl shadow-2xl shadow-blue-500/40 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            >
                {open ? <X className="h-6 w-6 text-white" /> : <MessageCircle className="h-6 w-6 text-white" />}
                {!open && hasNewAdminReply && (
                    <span className="absolute top-1 right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-[#050505] animate-pulse" />
                )}
            </button>

            {/* Chat Window */}
            {open && (
                <div className="fixed bottom-24 right-6 z-50 w-80 shadow-2xl rounded-3xl overflow-hidden border border-white/10 bg-[#0a0a0a] animate-in slide-in-from-bottom-4 fade-in duration-300">
                    {/* Header */}
                    <div className="bg-blue-600 px-5 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                                <MessageCircle className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-white">Live Support</p>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    <p className="text-[10px] text-blue-100">Admin Online</p>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setOpen(false)} className="text-blue-200 hover:text-white transition-colors">
                            <ChevronDown className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Name Input if empty */}
                    {!messages.length && !name && (
                        <div className="px-5 py-3 bg-blue-500/5 border-b border-white/5">
                            <input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Your name (optional)..."
                                className="w-full bg-transparent text-xs text-white placeholder:text-gray-600 focus:outline-none"
                            />
                        </div>
                    )}

                    {/* Messages */}
                    <div className="p-4 space-y-3 overflow-y-auto max-h-72 custom-scrollbar">
                        {messages.length === 0 ? (
                            <div className="text-center py-8">
                                <MessageCircle className="h-8 w-8 text-gray-700 mx-auto mb-2" />
                                <p className="text-xs text-gray-600">👋 Hi! How can we help?</p>
                                <p className="text-[10px] text-gray-700 mt-1">Send a message and our team will reply.</p>
                            </div>
                        ) : messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.fromAdmin ? "justify-start" : "justify-end"} gap-2`}>
                                {msg.fromAdmin && (
                                    <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                                        <span className="text-[9px] font-black text-white">A</span>
                                    </div>
                                )}
                                <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-xs ${msg.fromAdmin
                                    ? "bg-white/5 border border-white/5 text-gray-200 rounded-tl-none"
                                    : "bg-blue-600 text-white rounded-tr-none"
                                    }`}>
                                    {msg.message}
                                </div>
                            </div>
                        ))}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <div className="px-4 py-3 border-t border-white/5 flex gap-2 items-end">
                        <textarea
                            value={inputMsg}
                            onChange={e => setInputMsg(e.target.value)}
                            placeholder="Type a message..."
                            rows={1}
                            className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-xs text-white resize-none focus:outline-none focus:border-blue-500/50 placeholder:text-gray-700"
                            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={sending || !inputMsg.trim()}
                            className="w-9 h-9 bg-blue-600 hover:bg-blue-500 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-40"
                        >
                            {sending ? <Loader2 className="h-4 w-4 text-white animate-spin" /> : <Send className="h-4 w-4 text-white" />}
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}
