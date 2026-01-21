// Test script to verify PAN services real-time functionality
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRealTimeSetup() {
  console.log('🔍 Testing PAN services real-time setup...');

  try {
    // Check if pan_services table is in realtime publication
    const { data: publications, error: pubError } = await supabase
      .from('pg_publication_tables')
      .select('*')
      .eq('pubname', 'supabase_realtime')
      .eq('tablename', 'pan_services');

    if (pubError) {
      console.error('❌ Error checking publications:', pubError);
      return;
    }

    if (publications && publications.length > 0) {
      console.log('✅ pan_services table is in realtime publication');
    } else {
      console.log('❌ pan_services table is NOT in realtime publication');
      console.log('🔧 Adding pan_services to realtime publication...');
      
      const { error: addError } = await supabase.rpc('exec', {
        sql: 'ALTER PUBLICATION supabase_realtime ADD TABLE pan_services;'
      });
      
      if (addError) {
        console.error('❌ Failed to add table to publication:', addError);
      } else {
        console.log('✅ Successfully added pan_services to realtime publication');
      }
    }

    // Test basic query
    const { data: services, error: queryError } = await supabase
      .from('pan_services')
      .select('id, order_id, status, updated_at')
      .limit(5);

    if (queryError) {
      console.error('❌ Error querying pan_services:', queryError);
    } else {
      console.log('✅ Successfully queried pan_services:', services?.length || 0, 'records');
    }

    // Test real-time subscription
    console.log('🔄 Testing real-time subscription...');
    
    const channel = supabase
      .channel('test-pan-services')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pan_services'
        },
        (payload) => {
          console.log('📡 Real-time update received:', payload);
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time subscription is working!');
          
          // Clean up after 5 seconds
          setTimeout(() => {
            supabase.removeChannel(channel);
            console.log('🛑 Test completed, subscription cleaned up');
            process.exit(0);
          }, 5000);
        }
      });

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testRealTimeSetup();