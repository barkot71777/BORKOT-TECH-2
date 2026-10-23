import React, { useState, useEffect } from 'react';
import { SupportMessage, ProductReview } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Headphones, Star, Check, X, MessageSquare, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export const AdminSupportReviews: React.FC = () => {
  const { authFetch } = useAuth();
  const { language } = useLanguage();

  const [activeTab, setActiveTab] = useState<'support' | 'reviews'>('support');
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);

  // Reply State
  const [replyingMessageId, setReplyingMessageId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [msgRes, revRes] = await Promise.all([
        authFetch('/api/admin/support'),
        authFetch('/api/admin/reviews')
      ]);
      if (msgRes.ok) setMessages(await msgRes.json());
      if (revRes.ok) setReviews(await revRes.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleModerateReview = async (id: string, status: 'approved' | 'rejected') => {
    setActionError('');
    setActionSuccess('');
    try {
      const res = await authFetch(`/api/admin/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setActionSuccess(`Review marked as ${status}.`);
        fetchData();
      } else {
        const data = await res.json();
        setActionError(data.error || 'Failed to update review status');
      }
    } catch {
      setActionError('Error updating review status due to network error');
    }
  };

  const handleSendReply = async (id: string) => {
    if (!replyText.trim()) return;
    setIsReplying(true);
    setActionError('');
    setActionSuccess('');
    try {
      const res = await authFetch(`/api/admin/support/${id}/reply`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replyText: replyText.trim() })
      });
      if (res.ok) {
        setReplyingMessageId(null);
        setReplyText('');
        setActionSuccess('Official reply sent to customer enquiry.');
        fetchData();
      } else {
        const data = await res.json();
        setActionError(data.error || 'Failed to send reply');
      }
    } catch {
      setActionError('Failed to send reply due to network error');
    } finally {
      setIsReplying(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Customer Support & Review Moderation</h1>
          <p className="text-xs text-slate-400 mt-1">
            Answer customer enquiries from the Dhaka showroom and moderate public customer product ratings.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
          <button
            onClick={() => setActiveTab('support')}
            className={`px-4 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              activeTab === 'support' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Enquiries ({messages.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              activeTab === 'reviews' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Reviews ({reviews.length})
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-500 text-xs">Loading records...</div>
      ) : activeTab === 'support' ? (
        /* Support Enquiries List */
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs bg-slate-900 border border-slate-800 rounded-xl">
              No customer enquiries received yet.
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 text-xs">
                <div className="flex justify-between items-start gap-4 border-b border-slate-800 pb-2">
                  <div>
                    <h3 className="font-bold text-white text-sm">{m.subject}</h3>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      From: <span className="text-white font-semibold">{m.name}</span> ({m.email} {m.phone ? `· ${m.phone}` : ''})
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      m.status === 'replied' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400'
                    }`}>
                      {m.status}
                    </span>
                    <span className="block text-[10px] text-slate-500 mt-1 font-mono">
                      {new Date(m.createdAt).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                </div>

                <p className="text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                  "{m.message}"
                </p>

                {m.replyText && (
                  <div className="p-3 bg-cyan-950/20 border border-cyan-800/40 rounded-lg text-cyan-200">
                    <span className="font-bold block text-[10px] text-cyan-400 uppercase mb-0.5">Staff Reply:</span>
                    {m.replyText}
                  </div>
                )}

                {!m.replyText && (
                  <div>
                    {replyingMessageId === m.id ? (
                      <div className="space-y-2 pt-2">
                        <textarea
                          rows={2}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Type your official reply note..."
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setReplyingMessageId(null)}
                            className="px-3 py-1 text-slate-400 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSendReply(m.id)}
                            disabled={isReplying}
                            className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded flex items-center gap-1.5 cursor-pointer"
                          >
                            <Send className="w-3 h-3" />
                            <span>{isReplying ? 'Sending...' : 'Record Reply'}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setReplyingMessageId(m.id);
                          setReplyText('');
                        }}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded transition-colors cursor-pointer"
                      >
                        Reply to Enquiry
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        /* Customer Reviews Moderation */
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs bg-slate-900 border border-slate-800 rounded-xl">
              No customer reviews submitted yet.
            </div>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{r.customerName}</span>
                    <span className="text-slate-500">·</span>
                    <div className="flex text-amber-400">
                      {[...Array(r.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    r.status === 'approved' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                    r.status === 'rejected' ? 'bg-rose-950 text-rose-400' :
                    'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}>
                    {r.status}
                  </span>
                </div>

                <p className="text-slate-300 italic bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  "{r.comment}"
                </p>

                {r.status === 'pending' && (
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => handleModerateReview(r.id, 'rejected')}
                      className="px-3 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded font-semibold cursor-pointer flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={() => handleModerateReview(r.id, 'approved')}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve & Publish</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
};
