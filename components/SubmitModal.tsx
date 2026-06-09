"use client";

import { useState } from "react";
import type { Borough, BoothType } from "@/lib/types";
import { TYPE_LABEL } from "@/lib/display";

const BOROUGHS: Borough[] = ["Manhattan", "Brooklyn", "Queens"];
const TYPES: BoothType[] = ["analog", "dedicated", "digital"];

export default function SubmitModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [borough, setBorough] = useState<Borough>("Manhattan");
  const [type, setType] = useState<BoothType>("analog");
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setError("");
    const res = await fetch("/api/booths", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, address, borough, type, price, note }),
    });
    if (res.ok) {
      setStatus("done");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Something went wrong");
      setStatus("error");
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {status === "done" ? (
          <div>
            <h2>On the roll</h2>
            <p className="lede">
              {name || "Your booth"} has been submitted. We verify each booth
              before it develops onto the public map.
            </p>
            <div className="modal-actions">
              <button className="btn primary" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit}>
            <h2>Add a booth</h2>
            <p className="lede">
              Know a booth we&apos;re missing? Out There is crowdsourced — drop
              the details and we&apos;ll verify it.
            </p>

            <label className="field">
              <span>Booth or venue name</span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Old Friend Photobooth"
              />
            </label>

            <label className="field">
              <span>Street address</span>
              <input
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 145 Allen St"
              />
            </label>

            <div className="row">
              <label className="field">
                <span>Borough</span>
                <select
                  value={borough}
                  onChange={(e) => setBorough(e.target.value as Borough)}
                >
                  {BOROUGHS.map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Type</span>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as BoothType)}
                >
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {TYPE_LABEL[t]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="field">
              <span>Price (optional)</span>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. $5/strip"
              />
            </label>

            <label className="field">
              <span>Note (optional)</span>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What should people know?"
              />
            </label>

            {status === "error" && <p className="form-err">{error}</p>}

            <div className="modal-actions">
              <button type="button" className="btn" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn primary" disabled={status === "saving"}>
                {status === "saving" ? "Submitting…" : "Submit booth"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
