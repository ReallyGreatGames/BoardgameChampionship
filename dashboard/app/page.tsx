"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Models } from "appwrite";
import { account } from "@/lib/appwrite";
import PingButton from "@/app/ui/ping-button";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);

  useEffect(() => {
    account.get().then(setUser).catch(() => router.replace("/login"));
  }, [router]);

  async function handleLogout() {
    await account.deleteSession("current");
    router.replace("/login");
  }

  if (!user) return null;

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-start justify-between py-32 px-16 bg-white dark:bg-black">
        <div className="flex w-full items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Dashboard
          </h1>
          <button
            onClick={handleLogout}
            className="flex h-9 items-center rounded-full border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Sign out
          </button>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">Signed in as</p>
          <p className="font-medium text-zinc-900 dark:text-zinc-50">{user.name || user.email}</p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <PingButton />
        </div>
      </main>
    </div>
  );
}
