"use client";

import { useState } from "react";
import { client } from "@/lib/appwrite";

type PingState = "idle" | "loading" | "ok" | "error";

export default function PingButton() {
  const [state, setState] = useState<PingState>("idle");
  const [message, setMessage] = useState<string>("");

  async function handlePing() {
    setState("loading");
    setMessage("");
    try {
      const result = await client.ping();
      setState("ok");
      setMessage(String(result));
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Unknown error");
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 sm:items-start">
      <button
        onClick={handlePing}
        disabled={state === "loading"}
        className="flex h-12 w-full items-center justify-center rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] disabled:opacity-50 md:w-[158px]"
      >
        {state === "loading" ? "Pinging…" : "Ping Appwrite"}
      </button>
      {message && (
        <p
          className={`text-sm ${
            state === "error"
              ? "text-red-500"
              : "text-green-600 dark:text-green-400"
          }`}
        >
          {state === "ok" ? "✓ " : "✗ "}
          {message}
        </p>
      )}
    </div>
  );
}
