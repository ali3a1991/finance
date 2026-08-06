"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, Pencil, PlusCircle, Save, ShoppingBasket, Trash2, X } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { requestJson } from "@/lib/requestJson";
import type { ShoppingItem, ShoppingUnit } from "@/lib/types";

type ShoppingForm = {
  name: string;
  quantity: string;
  unit: ShoppingUnit;
  hasDeadline: boolean;
  deadline: string;
};

const emptyForm: ShoppingForm = { deadline: "", hasDeadline: false, name: "", quantity: "", unit: "piece" };

function localDateKey(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function ShoppingListManager() {
  const { canWrite } = useAuth();
  const { language, t } = useLanguage();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [form, setForm] = useState<ShoppingForm>(emptyForm);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    requestJson<{ items: ShoppingItem[] }>("/api/shopping-list")
      .then((body) => setItems(body.items))
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : t("shoppingList.error")))
      .finally(() => setIsLoading(false));
  }, [t]);

  const openItems = useMemo(
    () => items.filter((item) => !item.completedAt).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [items]
  );
  const completedGroups = useMemo(() => {
    const completed = items
      .filter((item) => item.completedAt)
      .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));
    return completed.reduce<Array<{ date: string; items: ShoppingItem[] }>>((groups, item) => {
      const date = localDateKey(item.completedAt!);
      const group = groups.find((entry) => entry.date === date);
      if (group) group.items.push(item);
      else groups.push({ date, items: [item] });
      return groups;
    }, []);
  }, [items]);

  const locale = language === "de" ? "de-DE" : "en-US";
  function formatDay(value: string) {
    return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "long", year: "numeric" }).format(
      new Date(`${value.slice(0, 10)}T12:00:00`)
    );
  }
  function unitLabel(unit: ShoppingUnit) {
    return t(`shoppingList.units.${unit}`);
  }
  function closeModal() {
    setIsOpen(false);
    setEditingItem(null);
    setForm(emptyForm);
  }

  function openAddModal() {
    setEditingItem(null);
    setForm(emptyForm);
    setIsOpen(true);
  }

  function openEditModal(item: ShoppingItem) {
    setEditingItem(item);
    setForm({
      deadline: item.deadline ?? "",
      hasDeadline: Boolean(item.deadline),
      name: item.name,
      quantity: String(item.quantity),
      unit: item.unit
    });
    setIsOpen(true);
  }

  async function saveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      const body = await requestJson<{ item: ShoppingItem }>(editingItem ? `/api/shopping-list/${editingItem.id}` : "/api/shopping-list", {
        body: JSON.stringify({
          deadline: form.hasDeadline ? form.deadline : null,
          name: form.name.trim(),
          quantity: Number(form.quantity),
          unit: form.unit
        }),
        method: editingItem ? "PATCH" : "POST"
      });
      setItems((current) => editingItem
        ? current.map((item) => item.id === editingItem.id ? body.item : item)
        : [body.item, ...current]
      );
      closeModal();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t("shoppingList.error"));
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleItem(item: ShoppingItem) {
    setBusyId(item.id);
    setError("");
    try {
      const body = await requestJson<{ item: ShoppingItem }>(`/api/shopping-list/${item.id}`, {
        body: JSON.stringify({ completed: !item.completedAt }),
        method: "PATCH"
      });
      setItems((current) => current.map((entry) => entry.id === item.id ? body.item : entry));
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : t("shoppingList.error"));
    } finally {
      setBusyId(null);
    }
  }

  async function deleteItem(item: ShoppingItem) {
    setBusyId(item.id);
    setError("");
    try {
      await requestJson(`/api/shopping-list/${item.id}`, { method: "DELETE" });
      setItems((current) => current.filter((entry) => entry.id !== item.id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : t("shoppingList.error"));
    } finally {
      setBusyId(null);
    }
  }

  function renderItem(item: ShoppingItem) {
    const completed = Boolean(item.completedAt);
    return (
      <article className={`shopping-item ${completed ? "completed" : ""}`} key={item.id}>
        <button
          className="shopping-check"
          type="button"
          disabled={!canWrite || busyId === item.id}
          onClick={() => toggleItem(item)}
          aria-label={completed ? t("shoppingList.markOpen") : t("shoppingList.markDone")}
        >
          {completed ? <Check size={18} aria-hidden="true" /> : null}
        </button>
        <div className="shopping-item-copy">
          <strong>{item.name}</strong>
          <span>{item.quantity.toLocaleString(locale)} {unitLabel(item.unit)}</span>
        </div>
        {item.deadline ? (
          <span className="shopping-deadline"><CalendarDays size={15} aria-hidden="true" />{formatDay(item.deadline)}</span>
        ) : null}
        {canWrite ? (
          <div className="shopping-actions">
            {!completed ? <button className="icon-button" type="button" disabled={busyId === item.id} onClick={() => openEditModal(item)} aria-label={t("shoppingList.edit")}><Pencil size={17} aria-hidden="true" /></button> : null}
            <button className="icon-button danger" type="button" disabled={busyId === item.id} onClick={() => deleteItem(item)} aria-label={t("shoppingList.delete")}><Trash2 size={17} aria-hidden="true" /></button>
          </div>
        ) : null}
      </article>
    );
  }

  return (
    <>
      {canWrite ? <div className="action-row"><button className="button primary" type="button" onClick={openAddModal}><PlusCircle size={18} aria-hidden="true" />{t("shoppingList.add")}</button></div> : null}
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {isLoading ? <p className="muted-text">{t("shoppingList.loading")}</p> : null}

      {!isLoading ? (
        <section className="shopping-panel">
          <div className="shopping-section-heading"><ShoppingBasket size={20} aria-hidden="true" /><span>{t("shoppingList.openItems")}</span><strong>{openItems.length}</strong></div>
          <div className="shopping-list">
            {openItems.map(renderItem)}
            {openItems.length === 0 ? <p className="shopping-empty">{t("shoppingList.empty")}</p> : null}
          </div>
        </section>
      ) : null}

      {completedGroups.map((group) => (
        <section className="shopping-panel completed-panel" key={group.date}>
          <div className="shopping-section-heading"><Check size={20} aria-hidden="true" /><span>{t("shoppingList.completedOn")} {formatDay(group.date)}</span><strong>{group.items.length}</strong></div>
          <div className="shopping-list">{group.items.map(renderItem)}</div>
        </section>
      ))}

      {isOpen ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="shopping-modal-title">
            <div className="modal-header"><div><span>{t("nav.shoppingList")}</span><h2 id="shopping-modal-title">{editingItem ? t("shoppingList.editTitle") : t("shoppingList.addTitle")}</h2></div><button className="icon-button" type="button" onClick={closeModal} aria-label={t("common.closeDialog")}><X size={20} aria-hidden="true" /></button></div>
            <form className="modal-form" onSubmit={saveItem}>
              <label className="form-field-full"><span>{t("shoppingList.name")}</span><input autoFocus required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></label>
              <label><span>{t("shoppingList.quantity")}</span><input required min="0.01" step="any" type="number" value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} /></label>
              <label><span>{t("shoppingList.unit")}</span><select value={form.unit} onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value as ShoppingUnit }))}><option value="kg">{unitLabel("kg")}</option><option value="package">{unitLabel("package")}</option><option value="piece">{unitLabel("piece")}</option></select></label>
              <label className="checkbox-row form-field-full"><input type="checkbox" checked={form.hasDeadline} onChange={(event) => setForm((current) => ({ ...current, hasDeadline: event.target.checked, deadline: event.target.checked ? current.deadline : "" }))} /><span>{t("shoppingList.hasDeadline")}</span></label>
              {form.hasDeadline ? <label className="form-field-full"><span>{t("shoppingList.deadline")}</span><input required type="date" value={form.deadline} onChange={(event) => setForm((current) => ({ ...current, deadline: event.target.value }))} /></label> : null}
              <div className="modal-actions"><button className="button secondary" type="button" onClick={closeModal}>{t("common.cancel")}</button><button className="button primary" type="submit" disabled={isSaving}><Save size={18} aria-hidden="true" />{isSaving ? t("common.saving") : t("common.save")}</button></div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
