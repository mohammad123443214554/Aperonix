"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { COUNTRY_CALLING_CODES } from "@/lib/countries";
import Chat from "@/components/chat/chat";

type Screen = "landing" | "choice" | "signup" | "signin" | "confirmation";

function screenForPath(pathname: string): Screen {
  if (pathname === "/signup") return "signup";
  if (pathname === "/signin") return "signin";
  if (pathname === "/confirm-email") return "confirmation";
  if (pathname === "/get-started") return "choice";
  return "landing";
}

function isProtectedPath(pathname: string) {
  return (
    pathname === "/chat" ||
    /^\/chat\/[^/]+$/.test(pathname) ||
    pathname === "/profile" ||
    pathname === "/profile/edit" ||
    pathname === "/account/delete" ||
    pathname === "/settings" ||
    pathname === "/settings/aperonix"
  );
}

function isAuthPath(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/signin" ||
    pathname === "/signup" ||
    pathname === "/get-started" ||
    pathname === "/confirm-email"
  );
}

const iconItems = [
  { label: "Coding", symbol: "</>" },
  { label: "Image generation", symbol: "▧" },
  { label: "Video generation", symbol: "▶" },
  { label: "Study & research", symbol: "▤" },
  { label: "Deep thinking", symbol: "◉" }
];

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function getYears() {
  const current = new Date().getFullYear();
  return Array.from({ length: current - 1899 }, (_, index) => current - index);
}

async function syncProfile(user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }) {
  const metadata = user.user_metadata ?? {};
  const fullName =
    typeof metadata.full_name === "string" ? metadata.full_name :
    typeof metadata.name === "string" ? metadata.name : "";

  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? null,
      first_name:
        typeof metadata.first_name === "string" ? metadata.first_name :
        parts[0] ?? null,
      last_name:
        typeof metadata.last_name === "string" ? metadata.last_name :
        parts.slice(1).join(" ") || null,
      avatar_url:
        typeof metadata.avatar_url === "string" ? metadata.avatar_url :
        typeof metadata.picture === "string" ? metadata.picture : null
    },
    { onConflict: "id" }
  );
}

export default function AuthExperience() {
  const pathname = usePathname();
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>(() => screenForPath(pathname));
  const [sessionLoading, setSessionLoading] = useState(true);
  const [showSessionSpinner, setShowSessionSpinner] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("IN");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [signinEmail, setSigninEmail] = useState("");
  const [signinPassword, setSigninPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  const years = useMemo(getYears, []);

  useEffect(() => {
    setScreen(screenForPath(pathname));

    if (pathname === "/confirm-email" && typeof window !== "undefined") {
      const pendingEmail = window.sessionStorage.getItem("aperonix-confirm-email");
      if (pendingEmail) {
        setEmail(pendingEmail);
      }
    }
  }, [pathname]);

  useEffect(() => {
    if (!sessionLoading) {
      setShowSessionSpinner(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setShowSessionSpinner(true);
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [sessionLoading]);

  useEffect(() => {
    if (sessionLoading) return;

    if (authenticated && isAuthPath(pathname)) {
      router.replace("/chat");
      return;
    }

    if (!authenticated && isProtectedPath(pathname)) {
      router.replace("/signin");
    }
  }, [authenticated, pathname, router, sessionLoading]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;

      if (data.session?.user.is_anonymous) {
        await supabase.auth.signOut();
        setAuthenticated(false);
      } else {
        setAuthenticated(Boolean(data.session));
      }

      setSessionLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      const isRealAccount = Boolean(session && !session.user.is_anonymous);
      setAuthenticated(isRealAccount);

      if (event === "SIGNED_IN" && isRealAccount) {
        router.replace("/chat");
      }
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [router]);

  async function continueWithGoogle() {
    setError("");
    setBusy(true);

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin
      }
    });

    if (authError) {
      setBusy(false);
      setError(authError.message);
    }
  }

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const cleanedPhone = phone.replace(/\D/g, "");
    if (cleanedPhone.length !== 10) {
      setError("Phone number must contain exactly 10 digits.");
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter your first name and last name.");
      return;
    }

    if (!day || !month || !year || !gender) {
      setError("Please complete your date of birth and gender.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);

    const selectedCountry = COUNTRY_CALLING_CODES.find(
      (country) => country.iso2 === phoneCountry
    );

    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/confirm-email`,
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          date_of_birth: `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
          gender,
          phone_country_code: selectedCountry?.dialCode ?? "+91",
          phone_number: cleanedPhone
        }
      }
    });

    setBusy(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    if (data.session && data.user) {
      await syncProfile(data.user);
      setAuthenticated(true);
      router.replace("/chat");
      return;
    }

    setShowConfirmationModal(true);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("aperonix-confirm-email", email.trim());
    }
    router.replace("/confirm-email");
  }

  async function handleSignin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: signinEmail.trim(),
      password: signinPassword
    });

    setBusy(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    if (data.user) {
      await syncProfile(data.user);
      setAuthenticated(true);
      router.replace("/chat");
    }
  }

  function resetErrorAnd(screenName: Screen) {
    setError("");
    setScreen(screenName);

    const nextPath =
      screenName === "landing" ? "/" :
      screenName === "choice" ? "/get-started" :
      screenName === "signup" ? "/signup" :
      screenName === "signin" ? "/signin" :
      "/confirm-email";

    router.push(nextPath);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setAuthenticated(false);
    setScreen("landing");
    router.replace("/");
  }

  if (sessionLoading) {
    return showSessionSpinner ? (
      <main className="auth-loading">
        <img src="/aperonix-logo.png" alt="Aperonix AI" />
        <div className="auth-loading-ring" />
      </main>
    ) : (
      <main className="auth-loading" aria-hidden="true" />
    );
  }

  if (authenticated) {
    return <Chat onSignOut={signOut} />;
  }

  if (screen === "landing") {
    return (
      <main className="auth-landing">
        <header className="landing-nav">
          <div className="landing-brand">
            <img src="/aperonix-logo.png" alt="Aperonix AI" />
            <span>Aperonix AI</span>
          </div>

          <button
            type="button"
            className="nav-signin"
            onClick={() => resetErrorAnd("signin")}
          >
            Sign in
          </button>
        </header>

        <section className="landing-hero landing-hero-simple">
          <div className="hero-copy">
            <img
              className="landing-main-logo"
              src="/aperonix-logo.png"
              alt="Aperonix AI"
            />
            <span className="hero-kicker">A professional AI workspace</span>
            <h1>Build faster. Think deeper.</h1>
            <p>
              <strong>Aperonix AI</strong> transforms how you code, research, and create in one unified workspace.
            </p>

            <div className="landing-actions">
              <button
                type="button"
                className="get-started"
                onClick={() => resetErrorAnd("choice")}
              >
                Get Started
                <span>→</span>
              </button>

              <button
                type="button"
                className="landing-secondary-button"
                onClick={() => resetErrorAnd("signin")}
              >
                Sign in
              </button>
            </div>

            <div className="landing-trust-row">
              <span>Secure account</span>
              <i />
              <span>Your conversations stay with your account</span>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (screen === "choice") {
    return (
      <main className="auth-page">
        <div className="auth-backdrop" />
        <button className="auth-back" type="button" onClick={() => resetErrorAnd("landing")}>← Back</button>
        <section className="auth-card auth-choice-card">
          <img className="auth-logo" src="/aperonix-logo.png" alt="Aperonix AI" />
          <span className="hero-kicker">Welcome to Aperonix</span>
          <h1>Get started with your account</h1>
          <p className="auth-subtitle">Choose how you want to continue.</p>

          {error && <div className="auth-error">{error}</div>}

          <button type="button" className="auth-neon-button auth-google-button" onClick={() => void continueWithGoogle()} disabled={busy}>
            <span className="auth-button-icon google-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.57-.2-2.31H12v4.37h6.45a5.52 5.52 0 0 1-2.39 3.62v3.01h3.87c2.27-2.09 3.56-5.17 3.56-8.69Z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.87-3.01c-1.07.72-2.43 1.15-4.08 1.15-3.14 0-5.81-2.12-6.76-4.97H1.25v3.1A12 12 0 0 0 12 24Z"/>
                <path fill="#FBBC05" d="M5.24 14.27A7.23 7.23 0 0 1 4.86 12c0-.79.14-1.56.38-2.27v-3.1H1.25A12 12 0 0 0 0 12c0 1.93.46 3.75 1.25 5.37l3.99-3.1Z"/>
                <path fill="#EA4335" d="M12 4.76c1.77 0 3.36.61 4.61 1.8l3.45-3.45C17.95 1.09 15.24 0 12 0A12 12 0 0 0 1.25 6.63l3.99 3.1C6.19 6.88 8.86 4.76 12 4.76Z"/>
              </svg>
            </span>
            <span>Continue with Google</span>
          </button>

          <button type="button" className="auth-neon-button auth-email-button" onClick={() => resetErrorAnd("signup")} disabled={busy}>
            <span className="auth-button-icon email-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10.5" />
                <path d="m5.5 8.5 6.5 5 6.5-5" />
                <rect x="5.5" y="8.5" width="13" height="10" rx="2" />
              </svg>
            </span>
            <span>Continue with email</span>
          </button>

          <div className="auth-switch">
            Already have an account?
            <button type="button" onClick={() => resetErrorAnd("signin")}>Sign in</button>
          </div>
        </section>
      </main>
    );
  }

  if (screen === "confirmation") {
    return (
      <main className="auth-page">
        <div className="auth-backdrop" />
        <section className="auth-card auth-confirm-card">
          <div className="confirmation-icon">✓</div>
          <span className="hero-kicker">Almost there</span>
          <h1>Confirm your email</h1>
          <p>
            Supabase will send a confirmation message to <strong>{email.trim()}</strong>.
            It will come from Supabase, so you know it is part of the Aperonix account setup.
          </p>
          <p className="auth-small">
            Open that message and confirm your email. After confirmation, you will be
            taken into Aperonix AI.
          </p>
          <button type="button" className="get-started auth-full-button" onClick={() => resetErrorAnd("signin")}>
            Go to sign in
          </button>
        </section>
      </main>
    );
  }

  if (screen === "signin") {
    return (
      <main className="auth-page">
        <div className="auth-backdrop" />
        <button className="auth-back" type="button" onClick={() => resetErrorAnd("landing")}>← Back</button>
        <section className="auth-card">
          <img className="auth-logo" src="/aperonix-logo.png" alt="Aperonix AI" />
          <span className="hero-kicker">Welcome back</span>
          <h1>Sign in to Aperonix</h1>
          <p className="auth-subtitle">Use your email and password to continue.</p>

          {error && <div className="auth-error">{error}</div>}

          <div className="signin-oauth">
            <button
              type="button"
              className="auth-neon-button auth-google-button"
              onClick={() => void continueWithGoogle()}
              disabled={busy}
            >
              <span className="auth-button-icon google-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.57-.2-2.31H12v4.37h6.45a5.52 5.52 0 0 1-2.39 3.62v3.01h3.87c2.27-2.09 3.56-5.17 3.56-8.69Z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.87-3.01c-1.07.72-2.43 1.15-4.08 1.15-3.14 0-5.81-2.12-6.76-4.97H1.25v3.1A12 12 0 0 0 12 24Z"/>
                  <path fill="#FBBC05" d="M5.24 14.27A7.23 7.23 0 0 1 4.86 12c0-.79.14-1.56.38-2.27v-3.1H1.25A12 12 0 0 0 0 12c0 1.93.46 3.75 1.25 5.37l3.99-3.1Z"/>
                  <path fill="#EA4335" d="M12 4.76c1.77 0 3.36.61 4.61 1.8l3.45-3.45C17.95 1.09 15.24 0 12 0A12 12 0 0 0 1.25 6.63l3.99 3.1C6.19 6.88 8.86 4.76 12 4.76Z"/>
                </svg>
              </span>
              <span>Continue with Google</span>
            </button>
          </div>

          <div className="auth-divider"><span>or continue with email</span></div>

          <form className="auth-form" onSubmit={handleSignin}>
            <label>
              Email
              <input
                type="email"
                value={signinEmail}
                onChange={(event) => setSigninEmail(event.target.value)}
                autoComplete="email"
                required
                placeholder="you@example.com"
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={signinPassword}
                onChange={(event) => setSigninPassword(event.target.value)}
                autoComplete="current-password"
                required
                placeholder="Your password"
              />
            </label>

            <button type="submit" className="get-started auth-full-button" disabled={busy}>
              {busy ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="auth-switch">
            New to Aperonix?
            <button type="button" onClick={() => resetErrorAnd("choice")}>Create an account</button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <div className="auth-backdrop" />
      <button className="auth-back" type="button" onClick={() => resetErrorAnd("choice")}>← Back</button>
      <section className="auth-card signup-card">
        <img className="auth-logo" src="/aperonix-logo.png" alt="Aperonix AI" />
        <span className="hero-kicker">Create your account</span>
        <h1>Join Aperonix AI</h1>
        <p className="auth-subtitle">Your account keeps your chats and future Aperonix features together.</p>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSignup}>
          <div className="field-grid two">
            <label>
              First name
              <input value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name" required />
            </label>
            <label>
              Last name
              <input value={lastName} onChange={(event) => setLastName(event.target.value)} autoComplete="family-name" required />
            </label>
          </div>

          <div className="field-label">Date of birth</div>
          <div className="field-grid three">
            <select value={day} onChange={(event) => setDay(event.target.value)} required aria-label="Day">
              <option value="">Day</option>
              {Array.from({ length: 31 }, (_, index) => index + 1).map((value) => (
                <option key={value} value={String(value)}>{value}</option>
              ))}
            </select>
            <select value={month} onChange={(event) => setMonth(event.target.value)} required aria-label="Month">
              <option value="">Month</option>
              {months.map((name, index) => (
                <option key={name} value={String(index + 1)}>{name}</option>
              ))}
            </select>
            <select value={year} onChange={(event) => setYear(event.target.value)} required aria-label="Year">
              <option value="">Year</option>
              {years.map((value) => (
                <option key={value} value={String(value)}>{value}</option>
              ))}
            </select>
          </div>

          <label>
            Gender
            <select value={gender} onChange={(event) => setGender(event.target.value)} required>
              <option value="">Select gender</option>
              <option>Female</option>
              <option>Male</option>
              <option>Non-binary</option>
              <option>Other</option>
              <option>Prefer not to say</option>
            </select>
          </label>

          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required placeholder="you@example.com" />
          </label>

          <label>
            Phone number
            <div className="phone-row">
              <select value={phoneCountry} onChange={(event) => setPhoneCountry(event.target.value)} aria-label="Country calling code">
                {COUNTRY_CALLING_CODES.map((country) => (
                  <option key={country.iso2 + country.dialCode} value={country.iso2}>
                    {country.name} ({country.dialCode})
                  </option>
                ))}
              </select>
              <input
                inputMode="numeric"
                value={phone}
                onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 15))}
                maxLength={15}
                pattern="[0-9]{10}"
                autoComplete="tel-national"
                placeholder="10-digit phone number"
                required
                className={phone.length > 0 && phone.length !== 10 ? "input-invalid" : ""}
              />
            </div>
            {phone.length > 0 && phone.length !== 10 && (
              <span className="field-error">Enter exactly 10 digits.</span>
            )}
            <span className="field-hint">Your phone number is stored in your Aperonix profile. Phone verification is not used here.</span>
          </label>

          <div className="field-grid two">
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
                placeholder="8+ characters"
              />
            </label>
            <label>
              Confirm password
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
                placeholder="Repeat password"
                className={confirmPassword && password !== confirmPassword ? "input-invalid" : ""}
              />
            </label>
          </div>

          <button type="submit" className="get-started auth-full-button" disabled={busy}>
            {busy ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="auth-switch">
          Already have an account?
          <button type="button" onClick={() => resetErrorAnd("signin")}>Sign in</button>
        </div>
      </section>

      {showConfirmationModal && (
        <div className="auth-confirm-modal-backdrop" role="presentation">
          <div className="auth-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="email-confirm-title">
            <div className="confirmation-icon">✓</div>
            <h2 id="email-confirm-title">Check your email</h2>
            <p>
              A confirmation message will be sent to <strong>{email.trim()}</strong>
              from Supabase.
            </p>
            <p className="auth-small">
              Open the message and confirm your email. After confirmation, Aperonix AI
              will take you to the chatbot.
            </p>
            <button
              type="button"
              className="get-started auth-full-button"
              onClick={() => setShowConfirmationModal(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </main>
  );
} 
