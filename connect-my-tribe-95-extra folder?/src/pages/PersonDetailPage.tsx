import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useStore } from "@/hooks/use-store";
import { store } from "@/lib/store";
import { MapPin, Clock, UserPlus, Check } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function PersonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { currentUser, viewMode } = useStore();
  const user = store.getUserById(id!);

  if (!user) {
    return <AppLayout><p className="text-muted-foreground">User not found.</p></AppLayout>;
  }

  const isMe = user.id === currentUser.id;
  const isFriend = currentUser.friendIds.includes(user.id);
  const canSeeFullProfile = viewMode === 'admin' || isFriend || isMe;

  const sharedGroups = user.groupIds.filter(gId => currentUser.groupIds.includes(gId)).map(gId => store.getGroupById(gId)).filter(Boolean);
  const sharedEvents = user.rsvpEventIds.filter(eId => currentUser.rsvpEventIds.includes(eId)).map(eId => store.getEventById(eId)).filter(Boolean);

  const handleFriendAction = () => {
    if (isFriend) {
      store.removeFriend(currentUser.id, user.id);
      toast("Friend removed");
    } else if (currentUser.sentFriendRequests.includes(user.id)) {
      toast("Request already sent");
    } else if (currentUser.pendingFriendRequests.includes(user.id)) {
      store.acceptFriendRequest(currentUser.id, user.id);
      toast.success("Friend request accepted! 🎉");
    } else {
      store.sendFriendRequest(currentUser.id, user.id);
      toast.success("Friend request sent!");
    }
  };

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
        <Link to="/people" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">← Back to People</Link>

        <div className="bg-card rounded-xl p-6 card-elevated mb-6 text-center">
          <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-full bg-secondary mx-auto mb-3" />
          <h1 className="text-2xl font-display font-bold">{user.name}</h1>

          {canSeeFullProfile && (
            <>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                <MapPin size={12} /> {user.location_public}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">Age: {user.age}</p>
              <p className="text-sm text-muted-foreground mt-1 italic">{user.bio}</p>
            </>
          )}

          {!canSeeFullProfile && (
            <p className="text-sm text-muted-foreground mt-2">Add {user.name.split(' ')[0]} as a friend to see their full profile.</p>
          )}

          {/* Interests always visible */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {user.interests.map(i => (
              <span key={i} className="interest-tag">{i}</span>
            ))}
          </div>

          {!isMe && viewMode === 'user' && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleFriendAction}
              className={`mt-4 px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                isFriend ? 'bg-success/10 text-success' : 'bg-primary text-primary-foreground'
              }`}
            >
              {isFriend ? '✓ Friends' :
               currentUser.sentFriendRequests.includes(user.id) ? 'Request Sent' :
               currentUser.pendingFriendRequests.includes(user.id) ? 'Accept Request' :
               'Add Friend'}
            </motion.button>
          )}
        </div>

        {/* Shared context - only shown if friend or admin or self */}
        {canSeeFullProfile && (
          <>
            {canSeeFullProfile && !isMe && sharedGroups.length > 0 && (
              <div className="bg-card rounded-xl p-5 card-elevated mb-4">
                <h2 className="font-display font-semibold mb-3">Shared Groups ({sharedGroups.length})</h2>
                <div className="space-y-2">
                  {sharedGroups.map(g => g && (
                    <Link key={g.id} to={`/groups/${g.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: g.color, color: 'white' }}>{g.name[0]}</div>
                      <p className="text-sm font-medium">{g.name}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {canSeeFullProfile && !isMe && sharedEvents.length > 0 && (
              <div className="bg-card rounded-xl p-5 card-elevated mb-4">
                <h2 className="font-display font-semibold mb-3">Shared Events ({sharedEvents.length})</h2>
                <div className="space-y-2">
                  {sharedEvents.map(e => e && (
                    <Link key={e.id} to={`/events/${e.id}`} className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary transition-colors">
                      <p className="text-sm font-medium">{e.title}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Admin extra info */}
            {viewMode === 'admin' && (
              <div className="bg-card rounded-xl p-5 card-elevated">
                <h2 className="font-display font-semibold mb-3">Admin Details</h2>
                <div className="space-y-2 text-sm">
                  <p><span className="text-muted-foreground">Private Address:</span> {user.location_private}</p>
                  <p><span className="text-muted-foreground">Public Area:</span> {user.location_public}</p>
                  <p><span className="text-muted-foreground">Age:</span> {user.age}</p>
                  <p><span className="text-muted-foreground">Weekly Hours:</span> {user.weeklyHours}h</p>
                  <p><span className="text-muted-foreground">Groups:</span> {user.groupIds.length}</p>
                  <p><span className="text-muted-foreground">Friends:</span> {user.friendIds.length}</p>
                  <p><span className="text-muted-foreground">RSVPs:</span> {user.rsvpEventIds.length}</p>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>
    </AppLayout>
  );
}
