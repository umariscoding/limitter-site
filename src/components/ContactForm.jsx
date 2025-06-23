"use client";

import { useState } from "react";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubmitted(true);
    setIsLoading(false);
    setFormData({
      name: "",
      email: "",
      subject: "",
      message: ""
    });
  };

  if (isSubmitted) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h4 className="text-xl font-semibold mb-2">Message Sent!</h4>
        <p className="text-gray-dark dark:text-gray mb-4">
          Thank you for contacting us. We&apos;ll get back to you within 24 hours.
        </p>
        <button
          onClick={() => setIsSubmitted(false)}
          className="text-primary hover:underline"
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-light dark:border-gray-dark/30 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-dark"
            placeholder="Your name"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-light dark:border-gray-dark/30 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-dark"
            placeholder="your@email.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium mb-2">
          Subject *
        </label>
        <select
          id="subject"
          name="subject"
          value={formData.subject}
          onChange={handleInputChange}
          required
          className="w-full px-3 py-2 border border-gray-light dark:border-gray-dark/30 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-dark"
        >
          <option value="">Select a topic...</option>
          <option value="general">General Question</option>
          <option value="technical">Technical Support</option>
          <option value="billing">Billing & Subscriptions</option>
          <option value="feature">Feature Request</option>
          <option value="bug">Bug Report</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium mb-2">
          Message *
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleInputChange}
          required
          rows={6}
          className="w-full px-3 py-2 border border-gray-light dark:border-gray-dark/30 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-dark"
          placeholder="Tell us how we can help you..."
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 font-medium"
      >
        {isLoading ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
} 