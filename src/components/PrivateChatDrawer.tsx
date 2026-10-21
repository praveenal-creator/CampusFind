import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  MapPin,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Claim, HandoverEvent, Message, ReportItem, UserProfile } from '../types.ts';
import { storage, storageEvents } from '../services/storage.ts';

interface PrivateChatDrawerProps {
  claimId: string | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onOpenHandoverModal: (claimId: string) => void;
}

export const PrivateChatDrawer: React.FC<PrivateChatDrawerProps> = ({
  claimId,
  isOpen,
  onClose,
  currentUser,
  onOpenHandoverModal
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [handover, setHandover] = useState<HandoverEvent | undefined>(undefined);
  const [claim, setClaim] = useState<Claim | undefined>(undefined);
  const [report, setReport] = useState<ReportItem | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadData = () => {
    if (!claimId) return;
    const c = storage.getClaims().find((item) => item.id === claimId);
    setClaim(c);
    if (c) {
      setReport(storage.getReportById(c.report_id));
    }
    setMessages(storage.getMessages(claimId));
    setHandover(storage.getHandoverForClaim(claimId));
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    storageEvents.addEventListener('messages_changed', handleUpdate);
    storageEvents.addEventListener('handovers_changed', handleUpdate);
    storageEvents.addEventListener('claims_changed', handleUpdate);

    return () => {
      storageEvents.removeEventListener('messages_changed', handleUpdate);
      storageEvents.removeEventListener('handovers_changed', handleUpdate);
      storageEvents.removeEventListener('claims_changed', handleUpdate);
    };
  }, [claimId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen || !claimId || !claim) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    try {
      storage.sendMessage(claimId, inputText.trim());
      setInputText('');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const handleConfirmHandover = () => {
    try {
      storage.confirmHandover(claimId);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const isFinder = report?.user_id === currentUser.id;
  const isClaimant = claim.claimant_id === currentUser.id;
  const otherPartyName = isFinder ? claim.claimant_name : report?.user_name || 'Item Finder';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-stone-900/40 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-stone-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-800 font-bold text-xs">
              {otherPartyName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 leading-tight">
                {otherPartyName}
              </h3>
              <p className="text-[11px] text-stone-500 truncate max-w-xs">
                Re: {claim.report_title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Safe Handover Banner */}
        <div className="px-6 py-3 bg-teal-50/80 border-b border-teal-200/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
            <div className="text-xs">
              <span className="font-semibold text-teal-950">Safe Campus Handover</span>
              {handover ? (
                <p className="text-[11px] text-teal-800 truncate max-w-xs">
                  {handover.location_name}
                </p>
              ) : (
                <p className="text-[11px] text-teal-800">No meeting spot arranged yet</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {handover && handover.status === 'scheduled' ? (
              <button
                onClick={handleConfirmHandover}
                className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md transition-colors flex items-center gap-1 shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm Pickup</span>
              </button>
            ) : handover && handover.status === 'completed' ? (
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                Returned
              </span>
            ) : (
              <button
                onClick={() => onOpenHandoverModal(claimId)}
                className="px-2.5 py-1 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md transition-colors"
              >
                Schedule Spot
              </button>
            )}
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#FBFBFA]">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-stone-400 text-xs">
              No messages yet. Send a message to coordinate safe item return.
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === currentUser.id;
              const isSystem = msg.content.startsWith('System:') || msg.content.startsWith('Safe Handover');

              if (isSystem) {
                return (
                  <div key={msg.id} className="text-center my-3">
                    <span className="inline-block px-3 py-1 bg-stone-100 border border-stone-200 text-stone-600 text-[11px] rounded-full max-w-sm text-balance">
                      {msg.content}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-baseline gap-1.5 mb-1 text-[10px] text-stone-400">
                    <span className="font-semibold text-stone-600">{msg.sender_name}</span>
                    <span>·</span>
                    <span>
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-xs ${
                      isMe
                        ? 'bg-teal-700 text-white rounded-tr-xs'
                        : 'bg-white border border-stone-200 text-stone-900 rounded-tl-xs'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form
          onSubmit={handleSend}
          className="p-4 bg-white border-t border-stone-200 flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a private coordination message..."
            className="flex-1 px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2 text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-40 rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
