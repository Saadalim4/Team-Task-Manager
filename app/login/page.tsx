"use client";

import AuthForm from "@/components/AuthForm";
import { useState, useEffect } from "react";

export default function Login() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for environment variable issues
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      setError("Configuration error: Missing environment variables. Please check your deployment settings.");
      console.error("Missing Supabase environment variables:", { supabaseUrl: !!supabaseUrl, supabaseKey: !!supabaseKey });
    }
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Configuration Error</h1>
          <p className="text-gray-700 mb-4">{error}</p>
          <p className="text-sm text-gray-500">
            Please make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your Vercel environment variables.
          </p>
        </div>
      </div>
    );
  }

  return <AuthForm initialMode="login" />;
}
