import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://foexoyakzskviskmkqqn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvZXhveWFrenNrdmlza21rcXFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1OTk2OTMsImV4cCI6MjA5NTE3NTY5M30.NLo_SYWaI59DIdOZLwvJI-fePk_SRh7ZCuzPSv1rC18';
const supabase = createClient(supabaseUrl, supabaseKey);

const event = {
  id: 'test-event-id',
  title: 'Test Event',
  description: 'Test Description',
  category: 'Tech',
  organizer_id: 'org-id',
  organizer_name: 'Test Organizer',
  date: '2026-06-01',
  venue: 'Test Venue',
  city: 'Mumbai',
  capacity: 100,
  tickets_sold: 0,
  price: 0,
  pricing_type: 'fixed',
  banner_url: 'https://...',
  status: 'pending',
  spam_score: 0,
  ai_category: 'Tech',
  ai_confidence: 0,
  trending: 'Steady',
  booking_count: 0,
  created_at: new Date().toISOString(),
};

async function testInsert() {
  const { data, error } = await supabase.from('events').insert([event]).select();
  if (error) {
    console.error('Insert error details:', JSON.stringify(error, null, 2));
  } else {
    console.log('Successfully inserted event:', data);
  }
}
testInsert();
