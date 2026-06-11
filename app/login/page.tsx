"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);

  async function login() {
    try {
      setLoading(true);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      window.location.href = "/chat";
    } finally {
      setLoading(false);
    }
  }

  return (
  <main className="min-h-screen bg-gray-50">
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto">
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-gray-900">
            Sign In
          </h1>

          <p className="text-sm text-gray-500 mt-1 mb-6">
            Access your account
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-3 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 px-3 border border-gray-300 rounded-lg"
              />
            </div>

            <button
              onClick={login}
              disabled={loading}
              className="w-full h-11 rounded-lg bg-gray-900 text-white font-medium"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500">Demo Account</p>
            <p className="text-sm text-gray-700 mt-1">
              admin@example.com
            </p>
            <p className="text-sm text-gray-700">
              admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  </main>
);
}