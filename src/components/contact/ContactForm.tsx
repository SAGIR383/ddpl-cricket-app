'use client';

import { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      alert('Please fill out all required fields.');
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="p-8 rounded-3xl bg-[#08111F] border border-emerald-500/30 text-center space-y-3 shadow-2xl">
        <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400" />
        <h3 className="font-display font-bold text-lg text-white">Message Delivered</h3>
        <p className="text-xs text-gray-300 max-w-sm mx-auto">
          Thank you, {name}. Your inquiry has been forwarded to the CricPlus24 desk. Our team will get back to you within 24–48 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-8 rounded-3xl bg-[#08111F] border border-white/10 space-y-4 shadow-2xl">
      <h2 className="font-display font-bold text-xl text-white">Send a Message</h2>
      <div className="space-y-3 text-xs">
        <div className="space-y-1">
          <label className="text-gray-300 font-semibold">Your Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="w-full px-3 py-2 rounded-xl bg-[#0D1B2A] border border-white/10 text-white"
          />
        </div>
        <div className="space-y-1">
          <label className="text-gray-300 font-semibold">Email Address *</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            className="w-full px-3 py-2 rounded-xl bg-[#0D1B2A] border border-white/10 text-white"
          />
        </div>
        <div className="space-y-1">
          <label className="text-gray-300 font-semibold">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Editorial / Partnership / Technical"
            className="w-full px-3 py-2 rounded-xl bg-[#0D1B2A] border border-white/10 text-white"
          />
        </div>
        <div className="space-y-1">
          <label className="text-gray-300 font-semibold">Message *</label>
          <textarea
            rows={4}
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="How can we help?"
            className="w-full px-3 py-2 rounded-xl bg-[#0D1B2A] border border-white/10 text-white"
          />
        </div>
        <button
          type="submit"
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] font-bold text-xs uppercase tracking-wider hover:opacity-95 transition-opacity"
        >
          Submit Message
        </button>
      </div>
    </form>
  );
}
