"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { requestJson } from "@/lib/requestJson";
import type { Expense } from "@/lib/types";

const categories = ["Haushalt", "Wohnen", "Mobilitat", "Versicherungen", "Freizeit"];

function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function AusgabeForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(getTodayInputValue());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      await requestJson<{ expense: Expense }>("/api/expenses", {
        body: JSON.stringify({
          amount: Number(amount),
          category,
          date,
          recurring: false,
          title: title.trim()
        }),
        method: "POST"
      });

      router.push("/ausgaben");
      router.refresh();
    } catch {
      setError(t("expenses.saveError"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="form-panel" onSubmit={handleSubmit}>
      <label>
        <span>{t("expenses.title")}</span>
        <input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="z. B. Lebensmittel" />
      </label>
      <label>
        <span>{t("expenses.category")}</span>
        <select required value={category} onChange={(event) => setCategory(event.target.value)}>
          {categories.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>{t("expenses.amount")}</span>
        <input
          required
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          type="number"
          min="0"
          step="0.01"
          placeholder="0,00"
        />
      </label>
      <label>
        <span>{t("expenses.date")}</span>
        <input required value={date} onChange={(event) => setDate(event.target.value)} type="date" />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button className="button primary" type="submit" disabled={isSaving}>
        <Save size={18} aria-hidden="true" />
        {isSaving ? t("common.saving") : t("common.save")}
      </button>
    </form>
  );
}
