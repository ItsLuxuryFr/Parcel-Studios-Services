import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const intervalRef = useRef<number | null>(null);
  const serverBackoffRef = useRef<number>(0);
  const [status, setStatus] = useState<'checking' | 'waiting' | 'verified' | 'error'>('checking');

  const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-verification`;
  const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const cleanupAndRedirect = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }
    try {
      localStorage.removeItem('pendingEmail');
    } catch (e) {
      // noop
    }
    navigate('/onboarding');
  };

  const callServerCheck = async (pendingEmail: string) => {
    if (serverBackoffRef.current > 0) {
      serverBackoffRef.current -= 1;
      return { ok: false, backoff: true };
    }

    try {
      const resp = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: ANON_KEY,
          Authorization: `Bearer ${ANON_KEY}`,
        },
        body: JSON.stringify({ email: pendingEmail }),
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => '<no-body>');
        console.error('Server-side verification call failed', resp.status, text);
        serverBackoffRef.current = 5;
        return { ok: false };
      }

      const json = await resp.json();
      return { ok: true, json };
    } catch (err) {
      console.error('Server check failed:', err);
      serverBackoffRef.current = 5;
      return { ok: false };
    }
  };

  const checkVerification = async () => {
    try {
      // Try to get current session first
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Check if email is confirmed from the session user
        if (session.user.email_confirmed_at) {
          console.log('Session found, email confirmed:', session.user.email_confirmed_at);
          setStatus('verified');
          cleanupAndRedirect();
          return;
        }
      }

      // Fallback: check via getUser API
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email_confirmed_at) {
        console.log('User found, email confirmed:', user.email_confirmed_at);
        setStatus('verified');
        cleanupAndRedirect();
        return;
      }

      // If we have a user but no email_confirmed_at, try server check
      const pendingEmail = user?.email || localStorage.getItem('pendingEmail');
      if (pendingEmail) {
        console.log('User exists but not confirmed, checking server for:', pendingEmail);
        const res = await callServerCheck(pendingEmail);
        if (res.ok && res.json?.verified) {
          console.log('Server confirms verified');
          setStatus('verified');
          cleanupAndRedirect();
          return;
        }
      }

      setStatus('waiting');
    } catch (error) {
      console.error('Check verification error:', error);
      // Fallback to server check
      const pendingEmail = localStorage.getItem('pendingEmail');
      if (!pendingEmail) {
        return setStatus('waiting');
      }

      const res = await callServerCheck(pendingEmail);
      if (res.ok && res.json?.verified) {
        setStatus('verified');
        cleanupAndRedirect();
      } else {
        setStatus('waiting');
      }
    }
  };

  useEffect(() => {
    checkVerification();
    intervalRef.current = window.setInterval(checkVerification, 2000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-900">
      <h1 className="text-2xl font-semibold mb-2 text-white">Check your inbox</h1>
      <p className="mb-4 text-center max-w-lg text-slate-400">
        We sent a verification link to your email. This page checks every 2 seconds.
      </p>
      <button
        onClick={checkVerification}
        className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
      >
        I clicked the link — Check now
      </button>
      <div className="mt-4 text-center text-slate-400">
        {status === 'checking' && "Checking…"}
        {status === 'waiting' && "Waiting for verification…"}
        {status === 'verified' && <span className="text-emerald-400">Verified! Redirecting…</span>}
        {status === 'error' && <span className="text-red-500">Error checking verification.</span>}
      </div>
    </div>
  );
}

