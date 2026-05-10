"use client";

import ContactForm from "@/components/ContactForm";
import { FaEnvelope, FaClock, FaShieldAlt } from "react-icons/fa";

export default function ContactPage() {
  return (
    <div className="min-h-screen py-16 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Get in <span className="gradient-text">Touch</span>
          </h1>
          <p className="text-lg text-gray-dark dark:text-gray max-w-2xl mx-auto">
            Have a question, need help, or want to request account deletion? We&apos;re here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white dark:bg-gray-dark/20 rounded-xl p-8 border border-gray-light dark:border-gray-dark/30">
            <h2 className="text-2xl font-bold mb-6">Send us a message</h2>
            <ContactForm />
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-dark/20 rounded-xl p-6 border border-gray-light dark:border-gray-dark/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FaEnvelope className="text-primary" />
                </div>
                <h3 className="font-bold text-lg">Email</h3>
              </div>
              <a href="mailto:support@Limitter.com" className="text-primary hover:underline">
                support@Limitter.com
              </a>
            </div>

            <div className="bg-white dark:bg-gray-dark/20 rounded-xl p-6 border border-gray-light dark:border-gray-dark/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FaClock className="text-primary" />
                </div>
                <h3 className="font-bold text-lg">Support Hours</h3>
              </div>
              <p className="text-gray-dark dark:text-gray">Mon &ndash; Fri</p>
              <p className="text-gray-dark dark:text-gray">9:00 AM &ndash; 5:00 PM EST</p>
            </div>

            <div className="bg-white dark:bg-gray-dark/20 rounded-xl p-6 border border-gray-light dark:border-gray-dark/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FaShieldAlt className="text-primary" />
                </div>
                <h3 className="font-bold text-lg">Account Deletion</h3>
              </div>
              <p className="text-gray-dark dark:text-gray text-sm">
                Select &quot;Request Account Deletion&quot; from the subject dropdown and provide your registered email. We process deletion requests within 7 business days.
              </p>
            </div>

            <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-6 border border-primary/20">
              <h3 className="font-bold text-lg mb-2">Response Time</h3>
              <p className="text-gray-dark dark:text-gray text-sm">
                We typically respond within 24 hours. For urgent issues, include &quot;URGENT&quot; in your message.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
