"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import { Button } from "@/old/ui/button";
import { demoAccounts, signInDemo } from "@/lib/demo-client";
export default function Login() {
  const params = useSearchParams();
  const [selected, setSelected] = useState(demoAccounts[0].username);
  const [error, setError] = useState("");
  return <main className="main"><NavBar /><section id="main-content" className="mx-auto max-w-xl p-8 my-12 bg-white border rounded-lg">
    <h1 className="text-3xl font-bold mb-4">Example account</h1>
    <p className="mb-6">Choose a fictional account. Both website designs share the same local petitions, signatures, and drafts.</p>
    <label htmlFor="old-demo-account" className="block mb-2 font-semibold">Account</label>
    <select id="old-demo-account" className="w-full border p-3 mb-6 bg-white" value={selected} onChange={event => setSelected(event.target.value)}>
      {demoAccounts.map(account => <option key={account.username} value={account.username}>{account.first_name} {account.last_name} · {account.roles?.some(role => role.name === "committee_member") ? "Committee member" : "Student"}</option>)}
    </select>
    {error && <p role="alert">{error}</p>}
    <Button variant="highlight" onClick={() => {
      try {
        signInDemo(selected);
        const next = params.get("next") || "/old";
        window.location.assign(next === "/old" || next.startsWith("/old/") || next.startsWith("/old?") ? next : "/old");
      } catch (error) { setError(error instanceof Error ? error.message : "Unable to open this example account."); }
    }}>Open example account</Button>
  </section><Footer /></main>;
}
