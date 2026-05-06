"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../src/lib/supabaseClient";

export default function TestPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const result = await supabase.from("test").select("*");
      setData(result.data);
      setError(result.error);
    };
    fetchData();
  }, []);

  return (
    <div>
      <h1>Supabase Test</h1>
      <pre>{JSON.stringify({ data, error }, null, 2)}</pre>
    </div>
  );
}
