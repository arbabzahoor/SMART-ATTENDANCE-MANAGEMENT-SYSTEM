import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ShieldAlert, LogOut, Clock, RefreshCw, Lock, Sparkles } from 'lucide-react';

interface IdleTimeoutModalProps {
  isLoggedIn: boolean;
  onLogout: () => void;
  // Standard idle time before showing warning: default 15 minutes (15 * 60 * 1000 ms)
  idleThresholdMs?: number;
  // Countdown duration once warning is triggered: default 60 seconds
  warningCountdownSec?: number;
}

export const IdleTimeoutModal: React.FC<IdleTimeoutModalProps> = ({
  isLoggedIn,
  onLogout,
  idleThresholdMs = 15 * 60 * 1000, // 15 minutes
  warningCountdownSec = 60, // 60s countdown
}) => {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(warningCountdownSec);
  const [demoMode, setDemoMode] = useState(false); // Allows testing in 10s instead of waiting 15 mins

  const lastActivityRef = useRef<number>(Date.now());
  const timerCheckRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const effectiveThresholdMs = demoMode ? 10 * 1000 : idleThresholdMs;

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (showWarning) {
      // If user interacts directly (e.g. typing or clicking inside warning), stay logged in
      // but usually they will click the "Stay Logged In" button.
    }
  }, [showWarning]);

  // Handle stay logged in button
  const handleStayLoggedIn = () => {
    lastActivityRef.current = Date.now();
    setShowWarning(false);
    setCountdown(warningCountdownSec);
  };

  // Immediate force logout
  const handleForceLogout = () => {
    setShowWarning(false);
    onLogout();
  };

  // Activity listeners
  useEffect(() => {
    if (!isLoggedIn) {
      setShowWarning(false);
      return;
    }

    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    const handleUserActivity = () => {
      // Only update activity timestamp if warning modal is NOT currently open
      if (!showWarning) {
        lastActivityRef.current = Date.now();
      }
    };

    events.forEach(evt => window.addEventListener(evt, handleUserActivity, { passive: true }));

    // Periodic check every 1 second
    timerCheckRef.current = setInterval(() => {
      if (!showWarning && isLoggedIn) {
        const elapsed = Date.now() - lastActivityRef.current;
        if (elapsed >= effectiveThresholdMs) {
          setShowWarning(true);
          setCountdown(warningCountdownSec);
        }
      }
    }, 1000);

    return () => {
      events.forEach(evt => window.removeEventListener(evt, handleUserActivity));
      if (timerCheckRef.current) clearInterval(timerCheckRef.current);
    };
  }, [isLoggedIn, showWarning, effectiveThresholdMs, warningCountdownSec]);

  // Countdown timer when warning modal is active
  useEffect(() => {
    if (showWarning) {
      countdownIntervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current as NodeJS.Timeout);
            setShowWarning(false);
            onLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    }

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [showWarning, onLogout]);

  if (!isLoggedIn || !showWarning) {
    // Show a small subtle demo indicator in the corner or bottom bar if desired, or render nothing
    return (
      <div className="fixed bottom-3 left-3 z-40 hidden md:block">
        <button
          onClick={() => {
            setDemoMode(!demoMode);
            lastActivityRef.current = Date.now();
          }}
          title={demoMode ? "Idle timeout set to 10s (Demo Mode)" : "15-Min Idle Session Security Active"}
          className={`px-3 py-1.5 rounded-full text-[10px] font-bold border shadow-xs transition-all flex items-center gap-1.5 ${
            demoMode
              ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
              : 'bg-slate-900/80 hover:bg-slate-900 text-slate-300 hover:text-white border-slate-700 backdrop-blur-md'
          }`}
        >
          <Lock className="w-3 h-3 text-emerald-400" />
          <span>{demoMode ? '⚡ Demo 10s Idle Mode Active' : '🔒 15-Min Security Timeout Active'}</span>
        </button>
      </div>
    );
  }

  // Calculate remaining minutes and seconds
  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-scaleUp">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="mx-auto w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-3 shadow-inner ring-4 ring-white/20 animate-bounce">
            <Clock className="w-8 h-8 text-white" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-white text-[11px] font-extrabold uppercase tracking-wider mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-200" />
            Security Session Timeout
          </div>

          <h3 className="text-xl font-black text-white">Inactivity Warning</h3>
          <p className="text-xs text-amber-100 mt-1">
            You have been inactive for {demoMode ? '10 seconds' : '15 minutes'}. For your privacy, your session is about to expire.
          </p>
        </div>

        {/* Countdown Visual Display */}
        <div className="p-6 space-y-6 text-center">
          
          <div className="py-4 px-6 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              Automatic Logout In
            </span>
            <div className="font-mono text-4xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="px-3 py-1 bg-slate-900 text-amber-400 rounded-xl shadow-inner">
                {formattedTime}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 pt-1">
              Click <strong className="text-slate-900">"Stay Logged In"</strong> to extend your current portal session.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleForceLogout}
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-600" />
              Log Out Now
            </button>

            <button
              onClick={handleStayLoggedIn}
              className="py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Stay Logged In
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
            <span>Alpine Portal Security Guard</span>
            <span>15-min idle protection</span>
          </div>

        </div>

      </div>
    </div>
  );
};
