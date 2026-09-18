import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../lib/auth';

function Shell({ children, title, sub }: { children: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-forest-950 lg:block">
        <div className="absolute inset-0 opacity-90" style={{ background: 'radial-gradient(1000px 500px at 20% 10%, #2b614f55, transparent), radial-gradient(800px 500px at 80% 80%, #e8b44a33, transparent), linear-gradient(160deg,#081c17,#14342b)' }} />
        <svg className="absolute inset-0 h-full w-full opacity-20" aria-hidden>
          {Array.from({ length: 12 }).map((_, i) => (
            <ellipse key={i} cx={`${8 + i * 8}%`} cy={`${15 + ((i * 37) % 70)}%`} rx="120" ry="40" fill="none" stroke="#bcd4c6" strokeWidth="1" transform={`rotate(-20 ${8 + i * 8} 50)`} />
          ))}
        </svg>
        <div className="relative flex h-full flex-col justify-between p-10 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10"><Leaf size={20} /></div>
            <p className="font-display text-lg font-extrabold">EcoAtlas<span className="text-accent">.Earth</span></p>
          </div>
          <div>
            <h1 className="font-display max-w-md text-4xl font-extrabold leading-tight">Mapping nature.<br />Measuring impact.</h1>
            <p className="mt-3 max-w-sm text-sm text-white/70">Geospatial carbon & biodiversity intelligence for restoration teams, investors and auditors.</p>
            <div className="mt-6 grid max-w-sm grid-cols-3 gap-3 text-center">
              {[['42.8K ha', 'Monitored'], ['1.28M', 'tCO₂e tracked'], ['186', 'Active sites']].map(([a, b]) => (
                <div key={b} className="rounded-2xl bg-white/10 p-3 backdrop-blur"><p className="font-display font-extrabold">{a}</p><p className="text-[11px] text-white/70">{b}</p></div>
              ))}
            </div>
          </div>
          <p className="text-xs text-white/50">Sample demo data · Satellite-style render for illustration</p>
        </div>
      </div>
      <div className="flex items-center justify-center bg-cream dark:bg-charcoal p-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="card p-8">
            <h2 className="font-display text-2xl font-extrabold">{title}</h2>
            <p className="mt-1 text-sm opacity-60">{sub}</p>
            <div className="mt-6">{children}</div>
          </div>
          <p className="mt-4 text-center text-xs opacity-50">Demo credentials — admin@ecoatlas.earth / EcoAtlas123!</p>
        </motion.div>
      </div>
    </div>
  );
}

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('admin@ecoatlas.earth');
  const [pw, setPw] = useState('EcoAtlas123!');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <Shell title="Welcome back" sub="Sign in to your environmental intelligence workspace.">
      <form className="space-y-4" onSubmit={async (e) => {
        e.preventDefault(); setErr('');
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setErr('Enter a valid email address.'); return; }
        if (pw.length < 6) { setErr('Password must be at least 6 characters.'); return; }
        setBusy(true);
        try { await login(email, pw); nav('/'); } catch (ex) { setErr(ex instanceof Error ? ex.message : 'Authentication failed'); }
        finally { setBusy(false); }
      }}>
        <div><label className="label" htmlFor="email">Email</label><input id="email" className="input mt-1" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></div>
        <div>
          <label className="label" htmlFor="pw">Password</label>
          <div className="relative mt-1">
            <input id="pw" type={show ? 'text' : 'password'} className="input pr-11" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 opacity-60 hover:opacity-100" aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff size={17} /> : <Eye size={17} />}</button>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 opacity-80"><input type="checkbox" defaultChecked className="h-4 w-4 accent-emerald-700" /> Remember me</label>
          <span className="font-semibold text-forest-600">Forgot password?</span>
        </div>
        {err && <p className="rounded-xl bg-red-50 dark:bg-red-500/10 px-3 py-2.5 text-sm text-red-700 dark:text-red-300" role="alert">{err}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy && <Loader2 className="animate-spin" size={17} />} Sign in to EcoAtlas</button>
        <p className="text-center text-sm opacity-70">New here? <Link to="/register" className="font-semibold text-forest-700 dark:text-emerald-300">Create account</Link></p>
      </form>
    </Shell>
  );
}

export function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <Shell title="Create your account" sub="Start mapping carbon & biodiversity impact today.">
      <form className="space-y-4" onSubmit={async (e) => {
        e.preventDefault(); setErr('');
        if (name.trim().length < 2) { setErr('Please enter your name.'); return; }
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setErr('Enter a valid email address.'); return; }
        if (pw.length < 8) { setErr('Password must be at least 8 characters.'); return; }
        setBusy(true);
        try { await register(name, email, pw); nav('/'); } catch (ex) { setErr(ex instanceof Error ? ex.message : 'Registration failed'); }
        finally { setBusy(false); }
      }}>
        <div><label className="label" htmlFor="name">Full name</label><input id="name" className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="Aarav Sharma" /></div>
        <div><label className="label" htmlFor="email">Email</label><input id="email" className="input mt-1" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@org.earth" /></div>
        <div><label className="label" htmlFor="pw">Password</label><input id="pw" type="password" className="input mt-1" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Min. 8 characters" /></div>
        {err && <p className="rounded-xl bg-red-50 dark:bg-red-500/10 px-3 py-2.5 text-sm text-red-700 dark:text-red-300" role="alert">{err}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy && <Loader2 className="animate-spin" size={17} />} Create account</button>
        <p className="text-center text-sm opacity-70">Have an account? <Link to="/login" className="font-semibold text-forest-700 dark:text-emerald-300">Sign in</Link></p>
      </form>
    </Shell>
  );
}
