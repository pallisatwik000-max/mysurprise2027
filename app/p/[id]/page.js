import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Proposal from '@/components/Proposal';
export const dynamic = 'force-dynamic';
export default async function Page({ params }) {
  const { data } = await supabase.from('proposals').select('*').eq('id', params.id).maybeSingle();
  if (!data) notFound();
  return <Proposal p={data} />;
}
