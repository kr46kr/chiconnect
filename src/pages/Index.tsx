import { useStore } from "@/hooks/use-store";
import { store } from "@/lib/store";
import { AppLayout } from "@/components/AppLayout";
import { Link } from "react-router-dom";
import { Users, TrendingUp, Calendar, Clock, Star } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 400, damping: 30 } } };

const Index = () => {
  const { currentUser, viewMode } = useStore();
  const recommendedEvents = store.getRecommendedEvents(currentUser.id).slice(0, 5);
  const userGroups = currentUser.groupIds.map(id => store.getGroupById(id)).filter(Boolean);
  const allUsers = store.getUsers();
  const allGroups = store.getGroups();
  const allEvents = store.getEvents();

  const ratedEvents = Object.entries(currentUser.eventRatings).map(([eventId, rating]) => ({
    event: store.getEventById(eventId),
    rating,
  })).filter(r => r.event);

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-3xl font-display font-bold mb-1">
          Hey, {currentUser.name.split(' ')[0]}! 👋
        </h1>
        <p className="text-muted-foreground mb-6">Ready to connect with your community today?</p>

        {/* Stats */}
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Users, value: allUsers.length, label: "Total Users" },
            { icon: TrendingUp, value: allGroups.length, label: "Active Groups" },
            { icon: Calendar, value: allEvents.length, label: "Upcoming Events" },
            { icon: Clock, value: `${currentUser.weeklyHours}h`, label: "Your Weekly Hours" },
          ].map((stat, i) => (
            <motion.div key={i} variants={item} className="stat-card flex items-start gap-3">
              <div className="p-2 rounded-lg bg-secondary">
                <stat.icon size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold tabular-nums">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Upcoming Events */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-xl p-5 card-elevated">
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={18} className="text-primary" />
                <h2 className="text-lg font-display font-semibold">
                  {viewMode === 'admin' ? 'All Events' : 'Recommended Events'}
                </h2>
              </div>
              <div className="space-y-1">
                {(viewMode === 'admin' ? allEvents.slice(0, 5) : recommendedEvents).map(event => (
                  <Link
                    key={event.id}
                    to={`/events/${event.id}`}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary text-xs font-semibold">
                      <span>{format(new Date(event.date), 'MMM')}</span>
                      <span className="text-base">{format(new Date(event.date), 'd')}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground truncate">📍 {event.location}</p>
                    </div>
                    <span className={`text-xs font-medium ${event.price === 'Free' ? 'text-green-600' : 'text-primary'}`}>
                      {event.price}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Your Groups */}
          <div>
            <div className="bg-card rounded-xl p-5 card-elevated">
              <div className="flex items-center gap-2 mb-4">
                <Users size={18} className="text-primary" />
                <h2 className="text-lg font-display font-semibold">Your Groups</h2>
              </div>
              <div className="space-y-2">
                {userGroups.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No groups yet. Explore and join some!</p>
                ) : userGroups.map(group => group && (
                  <Link
                    key={group.id}
                    to={`/groups/${group.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ backgroundColor: group.color, color: 'white' }}
                    >
                      {group.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{group.name}</p>
                      <p className="text-xs text-muted-foreground">{group.memberIds.length} members</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Event Ratings */}
        {ratedEvents.length > 0 && (
          <div className="mt-6">
            <div className="bg-card rounded-xl p-5 card-elevated">
              <div className="flex items-center gap-2 mb-4">
                <Star size={18} className="text-primary" />
                <h2 className="text-lg font-display font-semibold">Your Event Ratings</h2>
                <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full font-medium">only visible to you</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {ratedEvents.map(({ event, rating }) => event && (
                  <div key={event.id} className="p-3 rounded-lg bg-secondary">
                    <p className="font-medium text-sm mb-1">{event.title}</p>
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={14} className={s <= rating ? 'text-warning fill-warning' : 'text-muted-foreground'} />
                      ))}
                      <span className="text-xs text-muted-foreground ml-1">{rating}/5</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
};

export default Index;
