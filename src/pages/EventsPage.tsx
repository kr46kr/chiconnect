import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useStore } from "@/hooks/use-store";
import { store } from "@/lib/store";
import { Link } from "react-router-dom";
import { Search, Star } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

const ALL_CATEGORIES = ["All", "Outdoor Social", "Food & Drinks Meetup", "Photography Walk", "Group Fitness", "Networking Event", "Comedy Night", "Workshop", "Art & Culture", "Summer Social", "Wellness", "Music", "Games"];

export default function EventsPage() {
  const { currentUser, viewMode, events } = useStore();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [tab, setTab] = useState<'recommended' | 'all' | 'my-rsvps'>('recommended');

  const recommendedEvents = useMemo(() => store.getRecommendedEvents(currentUser.id), [currentUser.interests, events]);
  const rsvpdEvents = useMemo(() => events.filter(e => currentUser.rsvpEventIds.includes(e.id)), [currentUser.rsvpEventIds, events]);

  const displayEvents = viewMode === 'admin' 
    ? events 
    : (tab === 'my-rsvps' ? rsvpdEvents : (tab === 'recommended' ? recommendedEvents : events));

  const filtered = useMemo(() => {
    return displayEvents.filter(e => {
      const matchesSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.location.toLowerCase().includes(search.toLowerCase());
      const matchesCat = category === "All" || e.category === category;
      return matchesSearch && matchesCat;
    });
  }, [displayEvents, search, category]);

  const categories = useMemo(() => {
    const cats = new Set(displayEvents.map(e => e.category));
    return ["All", ...cats];
  }, [displayEvents]);

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-display font-bold mb-1">Discover Events</h1>
        <p className="text-muted-foreground mb-6">
          {viewMode === 'admin' ? 'All events in the system' : 'Find affordable, fun events in the Chicagoland area'}
        </p>

        {viewMode !== 'admin' && (
          <div className="flex bg-secondary/50 p-1 rounded-xl mb-6 max-w-fit">
            <button
              onClick={() => { setTab('recommended'); setCategory('All'); }}
              className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
                tab === 'recommended' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Recommended For You
            </button>
            <button
              onClick={() => { setTab('all'); setCategory('All'); }}
              className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
                tab === 'all' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All Events
            </button>
            <button
              onClick={() => { setTab('my-rsvps'); setCategory('All'); }}
              className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
                tab === 'my-rsvps' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              My RSVPs
            </button>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search events or locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-xl pl-9 pr-4 py-2.5 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                category === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Events grid */}
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(event => (
            <motion.div key={event.id} variants={item}>
              <Link to={`/events/${event.id}`}>
                <div className="bg-card rounded-xl p-5 card-elevated h-full flex flex-col" style={{ borderTop: `3px solid hsl(25, 95%, 53%)` }}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-display font-semibold text-base">{event.title}</h3>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium">{event.category}</span>
                    </div>
                    <span className={`text-xs font-semibold ${event.price === 'Free' ? 'text-green-600' : 'text-primary'}`}>{event.price}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2 flex-1">{event.description}</p>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>📍 {event.location}</p>
                    <p>🕐 {format(new Date(event.date), 'MMM d, yyyy')} · {event.time}</p>
                    <p>👔 {event.dressCode}</p>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground">👥 {event.attendeeIds.length}/{event.maxAttendees}</span>
                    <span className="flex items-center gap-1 text-xs">
                      <Star size={12} className="text-warning fill-warning" />
                      {event.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {filtered.length === 0 && (
          <div className="text-center py-16 bg-card rounded-2xl border border-dashed border-border">
            <p className="text-xl font-display font-bold mb-2">
              {tab === 'my-rsvps' ? 'Your calendar is looking a bit empty!' : 'No events match your filters'}
            </p>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-8">
              {tab === 'my-rsvps' 
                ? 'Join some communities and RSVP to events to see them listed here.' 
                : 'Try adjusting your search or category filters to find more events.'}
            </p>
            {tab === 'my-rsvps' && (
              <button 
                onClick={() => setTab('recommended')}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
              >
                Discover Events
              </button>
            )}
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
}
