"use client";

import { useState, useEffect } from "react";
import { adminGetContactMessages, adminUpdateContactMessage, adminDeleteContactMessage } from "../../../lib/firebase";
import { toast } from "react-hot-toast";

const SUBJECT_LABELS = {
  deletion: "Account Deletion",
  general: "General Question",
  technical: "Technical Support",
  billing: "Billing & Subscriptions",
  feature: "Feature Request",
  bug: "Bug Report",
  partnership: "Partnership Inquiry",
  other: "Other",
};

const STATUS_COLORS = {
  new: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  read: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  replied: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  resolved: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
};

export default function AdminMessagesTab() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async (loadMore = false) => {
    try {
      const { messages: fetched, lastDoc: newLastDoc } = await adminGetContactMessages(
        loadMore ? lastDoc : null,
        20
      );
      if (fetched.length < 20) setHasMore(false);
      setMessages(prev => loadMore ? [...prev, ...fetched] : fetched);
      setLastDoc(newLastDoc);
    } catch (error) {
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (msgId, newStatus) => {
    try {
      await adminUpdateContactMessage(msgId, { status: newStatus });
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: newStatus } : m));
      toast.success(`Marked as ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (msgId) => {
    if (!confirm("Permanently delete this message?")) return;
    try {
      await adminDeleteContactMessage(msgId);
      setMessages(prev => prev.filter(m => m.id !== msgId));
      toast.success("Message deleted");
    } catch (error) {
      toast.error("Failed to delete message");
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "—";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const filtered = filter === "all" ? messages : messages.filter(m => m.status === filter);
  const newCount = messages.filter(m => m.status === "new").length;

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-500">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Contact Messages</h2>
              <p className="text-sm text-gray-500">{messages.length} total{newCount > 0 && `, ${newCount} new`}</p>
            </div>
          </div>

          <div className="flex gap-2">
            {["all", "new", "read", "replied", "resolved"].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                  filter === f
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f === "new" && newCount > 0 && (
                  <span className="ml-1.5 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{newCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-gray-500">No {filter === "all" ? "" : filter} messages</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(msg => (
              <div
                key={msg.id}
                className={`border rounded-lg transition-all ${
                  msg.status === "new"
                    ? "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg"
                  onClick={() => {
                    setExpandedId(expandedId === msg.id ? null : msg.id);
                    if (msg.status === "new") handleStatusChange(msg.id, "read");
                  }}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${msg.status === "new" ? "bg-red-500" : msg.status === "read" ? "bg-yellow-500" : msg.status === "replied" ? "bg-green-500" : "bg-gray-400"}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 dark:text-white truncate">{msg.name}</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${STATUS_COLORS[msg.status] || STATUS_COLORS.new}`}>
                          {msg.status}
                        </span>
                        {msg.subject === "deletion" && (
                          <span className="px-2 py-0.5 text-xs rounded-full font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            DELETION REQUEST
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">{msg.email} &middot; {SUBJECT_LABELS[msg.subject] || msg.subject}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-gray-400">{formatDate(msg.createdAt)}</span>
                    <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedId === msg.id ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {expandedId === msg.id && (
                  <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="mt-4 mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{msg.message}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 mr-2">Set status:</span>
                      {["read", "replied", "resolved"].map(s => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(msg.id, s)}
                          className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                            msg.status === s
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                          }`}
                        >
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      ))}
                      <a
                        href={`mailto:${msg.email}?subject=Re: ${SUBJECT_LABELS[msg.subject] || msg.subject} - Limitter Support`}
                        className="px-3 py-1 text-xs rounded-lg font-medium bg-primary text-white hover:bg-primary/90 transition-colors ml-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Reply via Email
                      </a>
                      <button
                        onClick={() => handleDelete(msg.id)}
                        className="px-3 py-1 text-xs rounded-lg font-medium bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {hasMore && filtered.length > 0 && (
          <div className="text-center mt-6">
            <button
              onClick={() => loadMessages(true)}
              className="px-6 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
