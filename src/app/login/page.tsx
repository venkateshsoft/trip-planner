"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { safeReturnPath } from "@/components/auth/client-fetch";

export default function LoginPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error ?? "Could not sign in");
        return;
      }
      setToken("");
      const returnTo = new URLSearchParams(window.location.search).get("returnTo");
      router.push(safeReturnPath(returnTo));
      router.refresh();
    } catch {
      setError("Could not reach the sign-in service. Try again.");
    }
  }

  return (
    <main className="shell">
      <div className="empty-card login-card">
        <p className="eyebrow">PRIVATE TRIP PLANNER</p>
        <h1>Sign in</h1>
        <p className="muted">Use the APP_API_TOKEN configured for this deployment.</p>
        <form onSubmit={submit}>
          <label>
            Access token
            <input type="password" value={token} onChange={(event) => setToken(event.target.value)} required />
          </label>
          {error && <p className="notice" role="alert">{error}</p>}
          <button className="button primary" type="submit">Sign in</button>
        </form>
        <p><Link href="/">Back to planner</Link></p>
      </div>
    </main>
  );
}

