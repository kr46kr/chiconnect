import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useStore } from "@/hooks/use-store";
import { store } from "@/lib/store";
import { Link } from "react-router-dom";
import { Search, MapPin, Clock, UserPlus, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

export default function PeoplePage() {
  const { currentUser, viewMode, users } = useStore();
  const [search, setSearch] = useState("");

  // Admin sees everyone, user sees only people in their groups or shared events
  const visiblePeople = viewMode === 'admin'
    ? users.filter(u => u.id !== currentUser.id)
    : store.getVisiblePeople(currentUser.id);

  const filtered = useMemo(() => {
    return visiblePeople.filter(u => {
      if (!search) return true;
      const s = search.toLowerCase();
      return u.name.toLowerCase().includes(s) || u.interests.some(i => i.toLowerCase().includes(s)) || u.location_public.toLowerCase().includes(s);
    });
  }, [visiblePeople, search]);

  const handleFriendAction = (userId: string) => {
    if (currentUser.friendIds.includes(userId)) {
      store.removeFriend(currentUser.id, userId);
      toast("Friend removed");
    } else if (currentUser.sentFriendRequests.includes(userId)) {
      // Already sent
      toast("Request already sent");
    } else if (currentUser.pendingFriendRequests.includes(userId)) {
      store.acceptFriendRequest(currentUser.id, userId);
      toast.success("Friend request accepted! 🎉");
    } else {
      store.sendFriendRequest(currentUser.id, userId);
      toast.success("Friend request sent!");
    }
  };

  const getFriendStatus = (userId: string) => {
    if (currentUser.friendIds.includes(userId)) return 'friend';
    if (currentUser.sentFriendRequests.includes(userId)) return 'sent';
    if (currentUser.pendingFriendRequests.includes(userId)) return 'pending';
    return 'none';
  };

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-display font-bold mb-1">People</h1>
        <p className="text-muted-foreground mb-6">
          {viewMode === 'admin'
            ? `All ${users.length} community members`
            : `Discover ${visiblePeople.length} people in your groups and events`
          }
        </p>

        {/* Pending friend requests */}
        {currentUser.pendingFriendRequests.length > 0 && viewMode === 'user' && (
          <div className="bg-accent/10 rounded-xl p-4 mb-6">
            <h2 className="font-display font-semibold text-sm mb-3">Friend Requests ({currentUser.pendingFriendRequests.length})</h2>
            <div className="space-y-2">
              {currentUser.pendingFriendRequests.map(fromId => {
                const from = store.getUserById(fromId);
                if (!from) return null;
                return (
                  <div key={fromId} className="flex items-center justify-between bg-card rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <img src={from.avatar} alt={from.name} className="w-8 h-8 rounded-full bg-secondary" />
                      <p className="font-medium text-sm">{from.name}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => store.acceptFriendRequest(currentUser.id, fromId)} className="p-1.5 rounded-md bg-success/10 text-success hover:bg-success/20"><Check size={14} /></button>
                      <button onClick={() => store.declineFriendRequest(currentUser.id, fromId)} className="p-1.5 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20"><X size={14} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, location, or interest..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-xl pl-9 pr-4 py-2.5 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(user => {
            const isFriend = currentUser.friendIds.includes(user.id);
            const canSeeDetails = viewMode === 'admin' || isFriend;
            const friendStatus = getFriendStatus(user.id);

            return (
              <motion.div key={user.id} variants={item}>
                <div className="bg-card rounded-xl p-5 card-elevated text-center">
                  <Link to={`/people/${user.id}`}>
                    <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full bg-secondary mx-auto mb-3" />
                    <h3 className="font-display font-semibold text-sm">{user.name}</h3>
                  </Link>

                  {/* Location only visible to friends or admin */}
                  {canSeeDetails && (
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
                      <MapPin size={10} /> {user.location_public}
                    </p>
                  )}

                  {canSeeDetails && (
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                      <Clock size={10} /> {user.weeklyHours}h/week
                    </p>
                  )}

                  {/* Interests always visible */}
                  <div className="flex flex-wrap justify-center gap-1 mt-3">
                    {user.interests.slice(0, 3).map(i => (
                      <span key={i} className="interest-tag text-[10px] px-2 py-0.5">{i}</span>
                    ))}
                    {user.interests.length > 3 && (
                      <span className="text-[10px] text-muted-foreground">+{user.interests.length - 3}</span>
                    )}
                  </div>

                  {/* Friend action */}
                  {viewMode === 'user' && user.id !== currentUser.id && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleFriendAction(user.id)}
                      className={`mt-3 w-full py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        friendStatus === 'friend' ? 'bg-success/10 text-success' :
                        friendStatus === 'sent' ? 'bg-muted text-muted-foreground' :
                        friendStatus === 'pending' ? 'bg-accent/10 text-accent' :
                        'bg-primary text-primary-foreground'
                      }`}
                    >
                      {friendStatus === 'friend' ? '✓ Friends' :
                       friendStatus === 'sent' ? 'Request Sent' :
                       friendStatus === 'pending' ? 'Accept Request' :
                       'Add Friend'}
                    </motion.button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No people found matching your search.</p>
        )}
      </motion.div>
    </AppLayout>
  );
}
