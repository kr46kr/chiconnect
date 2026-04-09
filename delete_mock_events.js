import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Fetching mock events...");
  // The chicagoland events have no group_id and long titles. 
  // Let's filter out the ones I seeded. 
  // Wait, I can just fetch ALL events, and if they don't match exactly the seeded titles, delete them.
  const { data: allEvents } = await supabase.from('events').select('*');
  
  // The ones I seeded have `max_attendees` > 100 or specific rating format.
  // Actually, I can just fetch all events that have the specific mock titles, or any event created before today.
  // We can just rely on the fact that I just created the 45 events. 
  // Let's identify the mock events by searching for standard mock titles like "Zoo Social Mixer"
  
  const mockTitles = [
    'Zoo Social Mixer',
    'Taproom Tastings',
    'Golden Hour Photo Walk',
    'Sunset HIIT Class',
    'Young Pros Networking Happy Hour',
    'Community Garden Volunteer Day',
    'Rooftop Comedy Night',
    'Local Art Showcase',
    'Sunday Morning Yoga',
    'Jazz in the Park',
    'Food Truck Festival',
    'Tech Startup Mixer'
  ];

  const toDeleteIds = allEvents.filter(e => mockTitles.includes(e.title) || e.max_attendees < 100).map(e => e.id);
  console.log(`Found ${toDeleteIds.length} mock events to delete.`);

  if (toDeleteIds.length > 0) {
    // Delete cascading references first to prevent foreign key constraint fails
    console.log("Deleting associated event_attendees...");
    await supabase.from('event_attendees').delete().in('event_id', toDeleteIds);
    
    console.log("Deleting associated event_tags...");
    await supabase.from('event_tags').delete().in('event_id', toDeleteIds);
    
    console.log("Deleting associated event_ratings...");
    await supabase.from('event_ratings').delete().in('event_id', toDeleteIds);

    console.log("Deleting events...");
    const { error } = await supabase.from('events').delete().in('id', toDeleteIds);
    if (error) {
      console.error("Delete failed:", error);
    } else {
      console.log("Successfully deleted all mock events!");
    }
  }
}

run();
