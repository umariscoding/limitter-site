"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";

export default function AdminContactTab() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "contact_messages"), orderBy("created_at", "desc"));
      const snapshot = await getDocs(q);
      const msgs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMessages(msgs);
    } catch (error) {
      console.error("Error loading contact messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (msgId) => {
    try {
      await updateDoc(doc(db, "contact_messages", msgId), { status: "read" });
      setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, status: "read" } : m)));
      if (selectedMessage?.id === msgId) setSelectedMessage((prev) => ({ ...prev, status: "read" }));
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const markAsResolved = async (msgId) => {
    try {
      await updateDoc(doc(db, "contact_messages", msgId), { status: "resolved" });
      setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, status: "resolved" } : m)));
      if (selectedMessage?.id === msgId) setSelectedMessage((prev) => ({ ...prev, status: "resolved" }));
    } catch (error) {
      console.error("Error marking as resolved:", error);
    }
  };

  const deleteMessage = async (msgId) => {
    if (!confirm("Delete this message permanently?")) return;
    try {
      await deleteDoc(doc(db, "contact_messages", msgId));
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      if (selectedMessage?.id === msgId) setSelectedMessage(null);
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const filtered = filter === "all" ? messages : messages.filter((m) => (m.status || "new") === filter);

  const statusColor = (status) => {
    switch (status) {
      case "read": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "resolved": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      default: return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    }
  };

  const subjectLabel = (subject) => {
    const map = {
      deletion: "Account Deletion",
      general: "General Question",
      technical: "Technical Support",
      billing: "Billing & Subscriptions",
      feature: "Feature Request",
      bug: "Bug Report",
      partnership: "Partnership Inquiry",
      other: "Other",
    };
    return map[subject] || subject || "Unknown";
  };

  const formatDate = (ts) => {
    if (!ts) return "N/A";
    const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const newCount = messages.filter((m) => !m.status || m.status === "new").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading messages...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Contact Messages</h2>
          {newCount > 0 && (
            <span className="px-2.5 py-0.5 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded-full text-xs font-medium">
              {newCount} new
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {["all", "new", "read", "resolved"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">No {filter !== "all" ? filter : ""} messages</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-2 max-h-[70vh] overflow-y-auto">
            {filtered.map((msg) => (
              <div
                key={msg.id}
                onClick={() => {
                  setSelectedMessage(msg);
                  if (!msg.status || msg.status === "new") markAsRead(msg.id);
                }}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedMessage?.id === msg.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm text-gray-900 dark:text-white truncate">{msg.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(msg.status || "new")}`}>
                    {msg.status || "new"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{msg.email}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 truncate">{subjectLabel(msg.subject)}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatDate(msg.created_at)}</p>
              </div>
            ))}
          </div>

          <div className="lg:col-span-2">
            {selectedMessage ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedMessage.name}</h3>
                    <a href={`mailto:${selectedMessage.email}`} className="text-sm text-blue-600 hover:underline">
                      {selectedMessage.email}
                    </a>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor(selectedMessage.status || "new")}`}>
                    {selectedMessage.status || "new"}
                  </span>
                </div>

                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Subject</span>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {subjectLabel(selectedMessage.subject)}
                  </p>
                </div>

                <div className="mb-6">
                  <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Message</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-wrap leading-relaxed">
                    {selectedMessage.message}
                  </p>
                </div>

                <div className="text-xs text-gray-400 dark:text-gray-500 mb-6">
                  Received: {formatDate(selectedMessage.created_at)}
                </div>

                <div className="flex gap-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                  {(selectedMessage.status || "new") !== "resolved" && (
                    <button
                      onClick={() => markAsResolved(selectedMessage.id)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Mark Resolved
                    </button>
                  )}
                  <a
                    href={`mailto:${selectedMessage.email}?subject=Re: ${subjectLabel(selectedMessage.subject)}`}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Reply via Email
                  </a>
                  <button
                    onClick={() => deleteMessage(selectedMessage.id)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors ml-auto"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400">Select a message to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
