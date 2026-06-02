const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://foexoyakzskviskmkqqn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvZXhveWFrenNrdmlza21rcXFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1OTk2OTMsImV4cCI6MjA5NTE3NTY5M30.NLo_SYWaI59DIdOZLwvJI-fePk_SRh7ZCuzPSv1rC18';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('users').select('*');
  if (error) console.error('Error:', error);
  else console.log('Users:', data);
}
test();
