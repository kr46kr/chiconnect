import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useStore } from "@/hooks/use-store";
import { store } from "@/lib/store";
import { Calendar, MapPin, Clock, Users, Star, Check } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { currentUser, viewMode } = useStore();
  const event = store.getEventById(id!);

  if (!event) {
    return <AppLayout><p className="text-muted-foreground">Event not found.</p></AppLayout>;
  }

  const isRsvpd = currentUser.rsvpEventIds.includes(event.id);
  const attendees = event.attendeeIds.map(uid => store.getUserById(uid)).filter(Boolean);
  const group = event.groupId ? store.getGroupById(event.groupId) : null;

  const handleRsvp = async () => {
    try {
      if (isRsvpd) {
        await store.unrsvpEvent(currentUser.id, event.id);
        toast("RSVP cancelled");
      } else {
        await store.rsvpEvent(currentUser.id, event.id);
        toast.success("You're going! 🎉");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update RSVP.");
    }
  };

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
        <Link to="/events" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">← Back to Events</Link>

        <div className="bg-card rounded-xl p-6 card-elevated mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-display font-bold">{event.title}</h1>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium">{event.category}</span>
            </div>
            <span className={`text-lg font-bold ${event.price === 'Free' ? 'text-green-600' : 'text-primary'}`}>{event.price}</span>
          </div>

          <p className="text-muted-foreground mb-6">{event.description}</p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-2 text-sm"><MapPin size={16} className="text-primary" /> {event.location}</div>
            <div className="flex items-center gap-2 text-sm"><Calendar size={16} className="text-primary" /> {format(new Date(event.date), 'MMM d, yyyy')}</div>
            <div className="flex items-center gap-2 text-sm"><Clock size={16} className="text-primary" /> {event.time}</div>
            <div className="flex items-center gap-2 text-sm"><Users size={16} className="text-primary" /> {event.attendeeIds.length}/{event.maxAttendees}</div>
          </div>

          {group && (
            <div className="mb-4 p-3 rounded-lg bg-secondary">
              <p className="text-xs text-muted-foreground mb-1">Hosted by</p>
              <Link to={`/groups/${group.id}`} className="font-medium text-sm hover:text-primary transition-colors">{group.name}</Link>
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleRsvp}
            className={`w-full py-3 rounded-lg font-medium text-sm transition-colors ${
              isRsvpd
                ? 'bg-success text-success-foreground'
                : 'bg-primary text-primary-foreground hover:opacity-90'
            }`}
          >
            {isRsvpd ? <span className="flex items-center justify-center gap-2"><Check size={16} /> You're going!</span> : 'RSVP'}
          </motion.button>
        </div>

        {/* Attendees */}
        <div className="bg-card rounded-xl p-5 card-elevated">
          <h2 className="font-display font-semibold mb-3">Attendees ({attendees.length})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {attendees.map(user => user && (
              <Link key={user.id} to={`/people/${user.id}`} className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary transition-colors">
                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full bg-secondary" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  {(viewMode === 'admin' || currentUser.friendIds.includes(user.id)) && (
                    <p className="text-xs text-muted-foreground truncate">{user.location}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </motion.div>
    </AppLayout>
  );
}
