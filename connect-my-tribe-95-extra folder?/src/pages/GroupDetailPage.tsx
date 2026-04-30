import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useStore } from "@/hooks/use-store";
import { store } from "@/lib/store";
import { Users, Calendar, MessageCircle, Send, Check } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { currentUser, viewMode, groups } = useStore();
  const group = store.getGroupById(id!);
  const [tab, setTab] = useState<'about' | 'events' | 'chat' | 'members'>('about');
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isMember = group ? currentUser.groupIds.includes(group.id) : false;

  useEffect(() => {
    if (tab === 'chat') chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [tab, group?.chatMessages.length]);

  if (!group) {
    return <AppLayout><p className="text-muted-foreground">Group not found.</p></AppLayout>;
  }

  const members = group.memberIds.map(uid => store.getUserById(uid)).filter(Boolean);
  const groupEvents = group.eventIds.map(eid => store.getEventById(eid)).filter(Boolean);

  const handleJoin = () => {
    if (isMember) {
      store.leaveGroup(currentUser.id, group.id);
      toast("Left group");
    } else {
      store.joinGroup(currentUser.id, group.id);
      toast.success("Joined group! 🎉");
    }
  };

  const handleSendChat = () => {
    if (!chatInput.trim() || !isMember) return;
    store.sendGroupChat(group.id, currentUser.id, chatInput.trim());
    setChatInput("");
  };

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl">
        <Link to="/groups" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">← Back to Groups</Link>

        {/* Header */}
        <div className="bg-card rounded-xl p-6 card-elevated mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold shrink-0"
                style={{ backgroundColor: group.color, color: 'white' }}
              >
                {group.name[0]}
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold">{group.name}</h1>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium">{group.category}</span>
                <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
                <p className="text-xs text-muted-foreground mt-1">{group.memberIds.length} members</p>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleJoin}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 ${
                isMember ? 'bg-success/10 text-success' : 'bg-primary text-primary-foreground'
              }`}
            >
              {isMember ? <span className="flex items-center gap-1"><Check size={14} /> Joined</span> : 'Join Group'}
            </motion.button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-secondary rounded-lg p-1">
          {(['about', 'events', 'chat', 'members'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative flex-1 px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                tab === t ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              {tab === t && (
                <motion.div layoutId="groupTab" className="absolute inset-0 bg-card rounded-md" style={{ boxShadow: 'var(--card-shadow)' }} transition={{ type: "spring", stiffness: 400, damping: 30 }} />
              )}
              <span className="relative z-10">{t}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'about' && (
          <div className="bg-card rounded-xl p-5 card-elevated">
            <h2 className="font-display font-semibold mb-2">About this group</h2>
            <p className="text-muted-foreground text-sm">{group.description}</p>
            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Users size={14} /> {group.memberIds.length} members</span>
              <span className="flex items-center gap-1"><Calendar size={14} /> {groupEvents.length} events</span>
            </div>
          </div>
        )}

        {tab === 'events' && (
          <div className="space-y-3">
            {groupEvents.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No events yet for this group.</p>
            ) : groupEvents.map(event => event && (
              <Link key={event.id} to={`/events/${event.id}`} className="block bg-card rounded-xl p-4 card-elevated hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary text-xs font-semibold">
                    <span>{format(new Date(event.date), 'MMM')}</span>
                    <span className="text-base">{format(new Date(event.date), 'd')}</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{event.title}</p>
                    <p className="text-xs text-muted-foreground">📍 {event.location} · {event.time}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {tab === 'chat' && (
          <div className="bg-card rounded-xl card-elevated overflow-hidden">
            <div className="h-[400px] overflow-y-auto p-4 space-y-3">
              {group.chatMessages.length === 0 ? (
                <p className="text-muted-foreground text-sm py-8 text-center">No messages yet. Start the conversation!</p>
              ) : group.chatMessages.map(msg => {
                const sender = store.getUserById(msg.userId);
                const isMe = msg.userId === currentUser.id;
                return (
                  <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <img src={sender?.avatar} alt="" className="w-7 h-7 rounded-full bg-secondary shrink-0" />
                    <div className={`max-w-[70%] ${isMe ? 'text-right' : ''}`}>
                      <p className="text-xs text-muted-foreground mb-0.5">{sender?.name?.split(' ')[0]}</p>
                      <div className={`inline-block px-3 py-2 rounded-xl text-sm ${isMe ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                        {msg.text}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{format(new Date(msg.timestamp), 'MMM d, h:mm a')}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
            {isMember ? (
              <div className="border-t border-border p-3 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSendChat}
                  className="p-2 rounded-lg bg-primary text-primary-foreground"
                >
                  <Send size={16} />
                </motion.button>
              </div>
            ) : (
              <div className="border-t border-border p-3 text-center text-sm text-muted-foreground">
                Join this group to chat
              </div>
            )}
          </div>
        )}

        {tab === 'members' && (
          <div className="bg-card rounded-xl p-5 card-elevated">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {members.map(user => user && (
                <Link key={user.id} to={`/people/${user.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors">
                  <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full bg-secondary" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{user.name}</p>
                    {(viewMode === 'admin' || currentUser.friendIds.includes(user.id)) && (
                      <p className="text-xs text-muted-foreground">{user.location}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {user.interests.slice(0, 3).map(i => (
                        <span key={i} className="interest-tag text-[10px] px-2 py-0.5">{i}</span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
}
