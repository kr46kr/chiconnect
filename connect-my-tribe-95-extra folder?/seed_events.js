import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Simple JS script to seed the database
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY; // Requires full/admin rights or works if RLS allows it

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Loading chicagoland_events.json...");
  const rawData = fs.readFileSync('./chicagoland_events.json', 'utf-8');
  const eventsData = JSON.parse(rawData);

  console.log(`Found ${eventsData.length} events to seed.`);

  // Clear existing events
  console.log("Clearing old events...");
  // We specify a large match to delete them all
  const { error: delError } = await supabase.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delError) {
    console.error("Failed to delete existing events:", delError);
  }

  const mappedEvents = eventsData.map((ev, i) => {
    return {
      title: ev["Event Name"],
      category: ev["Category"],
      date: ev["Start Date"],
      description: ev["Description"],
      location: `${ev["Venue"]}, ${ev["Neighborhood/City"]}`,
      price: ev["Cost"],
      max_attendees: 100 + Math.floor(Math.random() * 400),
      rating: 4.0 + (Math.random()),
      time: "19:00",
      dress_code: "Casual"
    };
  });

  console.log("Inserting new events...");
  const { data, error } = await supabase.from('events').insert(mappedEvents);

  if (error) {
    console.error("Error inserting events:", error);
  } else {
    console.log("Successfully seeded events!");
  }
}

run();
