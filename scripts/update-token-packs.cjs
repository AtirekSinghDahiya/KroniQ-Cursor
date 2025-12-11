// Script to update token_packs in Supabase
// Run with: node scripts/update-token-packs.cjs

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
    console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'SET' : 'MISSING');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateTokenPacks() {
    console.log('Updating token packs...');

    // First, let's see what packs exist
    const { data: existingPacks, error: fetchError } = await supabase
        .from('token_packs')
        .select('*')
        .order('price_usd', { ascending: true });

    if (fetchError) {
        console.error('Error fetching packs:', fetchError);
        return;
    }

    console.log('\n📦 Existing token packs:');
    console.table(existingPacks?.map(p => ({ name: p.name, tokens: p.tokens, price: p.price_usd })));

    // Update $2 pack to 400K tokens
    const { error: error1 } = await supabase
        .from('token_packs')
        .update({ tokens: 400000 })
        .eq('price_usd', 2);

    if (error1) {
        console.error('Error updating $2 pack:', error1);
    } else {
        console.log('✅ Updated $2 pack to 400,000 tokens');
    }

    // Update $5 pack to 1M tokens
    const { error: error2 } = await supabase
        .from('token_packs')
        .update({ tokens: 1000000 })
        .eq('price_usd', 5);

    if (error2) {
        console.error('Error updating $5 pack:', error2);
    } else {
        console.log('✅ Updated $5 pack to 1,000,000 tokens');
    }

    // Update $10 pack to 2M tokens
    const { error: error3 } = await supabase
        .from('token_packs')
        .update({ tokens: 2000000 })
        .eq('price_usd', 10);

    if (error3) {
        console.error('Error updating $10 pack:', error3);
    } else {
        console.log('✅ Updated $10 pack to 2,000,000 tokens');
    }

    // Verify the updates
    const { data, error } = await supabase
        .from('token_packs')
        .select('name, tokens, price_usd')
        .order('price_usd', { ascending: true });

    if (error) {
        console.error('Error fetching packs:', error);
    } else {
        console.log('\n📦 Updated token packs:');
        console.table(data);
    }

    console.log('\n✅ Token pack update complete!');
}

updateTokenPacks();
