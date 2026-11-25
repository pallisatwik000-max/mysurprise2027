'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { THEMES, FIELDS, DEFAULTS } from '@/lib/defaults';

const newId = () => crypto.randomUUID().replace(/-/g, '').slice(0, 16);
const inp = 'w-full rounded-xl px-4 py-3 text-purple-900 bg-white/90 outline-none focus:ring-2 ring-pink-300';
const btn = 'px-5 py-3 rounded-full font-bold shadow-lg active:scale-95 transition disabled:opacity-50';

export default function Dashboard() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [list, setList] = useState([]);
  const [form, setForm] = useState(DEFAULTS);
  const [editId, setEditId] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [link, setLink] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  const load = async () => {
    const { data } = await supabase.from('proposals').select('*').order('created_at', { ascending: false });
    setList(data || []);
  };
  useEffect(() => { if (session) load(); }, [session]);
  useEffect(() => {
    if (!file) return;
    const u = URL.createObjectURL(file); setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const login = async (e) => {
    e.preventDefault(); setMsg('');
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    if (error) setMsg(error.message);
  };
  const reset = () => { setForm(DEFAULTS); setEditId(null); setFile(null); setPreview(null); setLink(''); setMsg(''); };
  const edit = (p) => { setForm({ ...DEFAULTS, ...p }); setEditId(p.id); setFile(null); setPreview(p.video_url); setLink(`${location.origin}/p/${p.id}`); setMsg(''); window.scrollTo(0, 0); };
  const pick = (f) => {
    if (!f) return;
    if (f.type !== 'video/mp4') return setMsg('Please choose an MP4 video.');
    if (f.size > 50 * 1024 * 1024) return setMsg('Video must be under 50 MB. Compress it (HandBrake) and try again.');
    setMsg(''); setFile(f);
  };

  const save = async () => {
    setBusy(true); setMsg('');
    try {
      const id = editId || newId();
      let video_url = list.find((x) => x.id === id)?.video_url || null;
      if (file) {
        const path = `${id}/${Date.now()}.mp4`;
        const { error } = await supabase.storage.from('videos').upload(path, file, { contentType: 'video/mp4', cacheControl: '31536000' });
        if (error) throw error;
        video_url = supabase.storage.from('videos').getPublicUrl(path).data.publicUrl;
      }
      if (!video_url) throw new Error('Please upload your proposal video first.');
      const row = { ...Object.fromEntries(Object.keys(DEFAULTS).map((k) => [k, form[k]])), video_url };
      const { error } = editId
        ? await supabase.from('proposals').update(row).eq('id', id)
        : await supabase.from('proposals').insert({ id, ...row });
      if (error) throw error;
      setEditId(id); setFile(null); setPreview(video_url);
      setLink(`${location.origin}/p/${id}`); setMsg(editId ? 'Saved ✅' : 'Link generated ✅');
      load();
    } catch (e) { setMsg(e.message || 'Something went wrong'); }
    setBusy(false);
  };
  const copy = async (u) => { await navigator.clipboard.writeText(u); setMsg('Link copied 📋'); };
  const remove = async (id) => {
    if (!confirm('Delete this proposal link?')) return;
    await supabase.from('proposals').delete().eq('id', id);
    if (id === editId) reset(); load();
  };

  const wrap = 'min-h-screen p-5 text-white';
  const bg = { background: THEMES[form.theme]?.bg || THEMES.rose.bg };
  if (!ready) return <main className={wrap} style={bg} />;

  if (!session) return (
    <main className={`${wrap} flex items-center justify-center`} style={bg}>
      <form onSubmit={login} className="glass w-full max-w-sm rounded-3xl p-7 space-y-4 text-center">
        <div className="text-5xl">💌</div>
        <h1 className="text-xl font-bold">Creator Login</h1>
        <input className={inp} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className={inp} type="password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} required />
        <button className={`${btn} bg-white text-pink-600 w-full`}>Login</button>
        {msg && <p className="text-sm">{msg}</p>}
      </form>
    </main>
  );

  return (
    <main className={wrap} style={bg}>
      <div className="max-w-xl mx-auto space-y-5">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">💌 Creator Dashboard</h1>
          <button className="text-sm underline" onClick={() => supabase.auth.signOut()}>Logout</button>
        </header>

        <section className="glass rounded-3xl p-5 space-y-4">
          <h2 className="font-bold">{editId ? 'Editing proposal' : 'New proposal'}</h2>
          {FIELDS.map(([k, label]) => (
            <label key={k} className="block text-sm">{label}
              <input className={`${inp} mt-1`} value={form[k] || ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
            </label>
          ))}
          <div className="text-sm">Theme
            <div className="grid grid-cols-2 gap-2 mt-1">
              {Object.entries(THEMES).map(([k, v]) => (
                <button key={k} onClick={() => setForm({ ...form, theme: k })}
                  className={`rounded-xl py-3 font-bold border-2 ${form.theme === k ? 'border-white' : 'border-transparent'}`}
                  style={{ background: v.bg }}>{v.name}</button>
              ))}
            </div>
          </div>
          <div className="text-sm">Proposal video (MP4, max 50 MB)
            <input type="file" accept="video/mp4" className="block mt-1 w-full" onChange={(e) => pick(e.target.files?.[0])} />
            {preview && <video src={preview} controls playsInline className="w-full rounded-xl mt-3 max-h-72 bg-black" />}
            {preview && <p className="mt-1 opacity-80">Choose another file above to replace this video.</p>}
          </div>
          <div className="flex gap-3 flex-wrap">
            <button disabled={busy} onClick={save} className={`${btn} bg-white text-pink-600`}>
              {busy ? 'Uploading… please wait' : editId ? 'Save changes' : 'Generate Proposal Link'}
            </button>
            {editId && <button onClick={reset} className={`${btn} bg-purple-900/60`}>Create new link</button>}
          </div>
          {msg && <p className="text-sm font-bold">{msg}</p>}
          {link && (
            <div className="rounded-xl bg-white/90 text-purple-900 p-3 space-y-2 break-all">
              <div className="text-sm">{link}</div>
              <div className="flex gap-2">
                <button onClick={() => copy(link)} className={`${btn} bg-pink-500 text-white !py-2`}>Copy link</button>
                <a href={link} target="_blank" className={`${btn} bg-purple-700 text-white !py-2`}>Open</a>
              </div>
            </div>
          )}
        </section>

        <section className="glass rounded-3xl p-5 space-y-3">
          <h2 className="font-bold">Your proposal links</h2>
          {!list.length && <p className="text-sm opacity-80">No links yet.</p>}
          {list.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-2 bg-white/20 rounded-xl p-3 text-sm">
              <span className="truncate">/p/{p.id}</span>
              <span className="flex gap-2 shrink-0">
                <button onClick={() => copy(`${location.origin}/p/${p.id}`)}>📋</button>
                <button onClick={() => edit(p)}>✏️</button>
                <button onClick={() => remove(p.id)}>🗑️</button>
              </span>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
                                                    }
