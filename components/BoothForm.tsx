"use client";

import { useState } from "react";
import type { Booth, Borough, BoothType } from "@/lib/types";
import { TYPE_LABEL } from "@/lib/display";

const BOROUGHS: Borough[] = ["Manhattan", "Brooklyn", "Queens"];
const TYPES: BoothType[] = ["analog", "dedicated", "digital"];
const PAYMENTS = ["", "Cash only", "Cash or card", "Card only"];

export default function BoothForm({
  mode,
  booth,
  onClose,
  onSaved,
}: {
  mode: "add" | "edit";
  booth?: Booth;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = mode === "edit";
  const [name, setName] = useState(booth?.name ?? "");
  const [address, setAddress] = useState(booth?.address ?? "");
  const [borough, setBorough] = useState<Borough>(booth?.borough ?? "Manhattan");
  const [type, setType] = useState<BoothType>(booth?.type ?? "analog");
  const [price, setPrice] = useState(booth?.price ?? "");
  const [hours, setHours] = useState(booth?.hours ?? "");
  const [payment, setPayment] = useState(booth?.payment ?? "");
  const [condition, setCondition] = useState(booth?.condition ?? "");
  const [note, setNote] = useState(booth?.note ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setError("");
    const res = await fetch("/api/booths", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        isEdit
          ? { slug: booth!.slug, price, hours, payment, condition, note }
          : { name, address, borough, type, price, hours, payment, condition, note },
      ),
    });
    if (res.ok) {
      onSaved();
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
            <h2>{isEdit ? "Updated" : "On the map"}</h2>
            <p className="lede">
              {isEdit
                ? "Thanks for keeping it accurate — your update is live."
                : `${name || "Your booth"} is live on the map now.`}
            </p>
            <div className="modal-actions">
              <button className="btn primary" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit}>
            <h2>{isEdit ? `Edit ${booth!.name}` : "Add a booth"}</h2>
            <p className="lede">
              Out There is crowdsourced — anyone can {isEdit ? "edit" : "add"}.
              Your change goes live immediately.
            </p>

            {!isEdit && (
              <>
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
              </>
            )}

            <div className="row">
              <label className="field">
                <span>Price</span>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. $5/strip"
                />
              </label>
              <label className="field">
                <span>Condition</span>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                >
                  <option value="">Unknown</option>
                  <option value="working">Working</option>
                  <option value="broken">Reported broken</option>
                </select>
              </label>
            </div>

            <div className="row">
              <label className="field">
                <span>Hours</span>
                <input
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="e.g. Daily 4pm–2am"
                />
              </label>
              <label className="field">
                <span>Payment</span>
                <select
                  value={payment}
                  onChange={(e) => setPayment(e.target.value)}
                >
                  {PAYMENTS.map((p) => (
                    <option key={p} value={p}>
                      {p || "Unknown"}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="field">
              <span>Note</span>
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
                {status === "saving"
                  ? "Saving…"
                  : isEdit
                    ? "Save changes"
                    : "Add booth"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
