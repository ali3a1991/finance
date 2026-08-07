"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Check, Pencil, PlusCircle, Save, Send, Share2, ShoppingBasket, Trash2, X } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { requestJson } from "@/lib/requestJson";
import type { ShoppingItem, ShoppingSuggestion, ShoppingUnit } from "@/lib/types";

type ShoppingForm = {
  name: string;
  quantity: string;
  unit: ShoppingUnit;
  hasDeadline: boolean;
  deadline: string;
};

const emptyForm: ShoppingForm = { deadline: "", hasDeadline: false, name: "", quantity: "1", unit: "piece" };

function localDateKey(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function ShoppingListManager() {
  const { can } = useAuth();
  const { language, t } = useLanguage();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [addForm, setAddForm] = useState<ShoppingForm>(emptyForm);
  const [editForm, setEditForm] = useState<ShoppingForm>(emptyForm);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [suggestions, setSuggestions] = useState<ShoppingSuggestion[]>([]);
  const [areSuggestionsLoading, setAreSuggestionsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isShareMode, setIsShareMode] = useState(false);
  const [selectedShareIds, setSelectedShareIds] = useState<Set<string>>(new Set());
  const [shareNotice, setShareNotice] = useState("");
  const [error, setError] = useState("");
  const suggestionsLoaded = useRef(false);

  useEffect(() => {
    requestJson<{ items: ShoppingItem[] }>("/api/shopping-list")
      .then((body) => setItems(body.items))
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : t("shoppingList.error")))
      .finally(() => setIsLoading(false));
  }, [t]);

  useEffect(() => {
    if (suggestionsLoaded.current) return;
    suggestionsLoaded.current = true;
    void loadSuggestions();
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
    setEditForm(emptyForm);
  }

  async function loadSuggestions() {
    setAreSuggestionsLoading(true);
    try {
      const body = await requestJson<{ suggestions: ShoppingSuggestion[] }>("/api/shopping-list/suggestions");
      setSuggestions(body.suggestions);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t("shoppingList.error"));
    } finally {
      setAreSuggestionsLoading(false);
    }
  }

  function openEditModal(item: ShoppingItem) {
    setEditingItem(item);
    setEditForm({
      deadline: item.deadline ?? "",
      hasDeadline: Boolean(item.deadline),
      name: item.name,
      quantity: String(item.quantity),
      unit: item.unit
    });
    setIsOpen(true);
  }

  function updateItemName(form: ShoppingForm, setForm: (form: ShoppingForm) => void, name: string) {
    const selected = suggestions.find((suggestion) => suggestion.name.trim().toLocaleLowerCase() === name.trim().toLocaleLowerCase());
    setForm({ ...form, name, unit: selected?.unit ?? form.unit });
  }

  async function createItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      const body = await requestJson<{ item: ShoppingItem }>("/api/shopping-list", {
        body: JSON.stringify({
          deadline: addForm.hasDeadline ? addForm.deadline : null,
          name: addForm.name.trim(),
          quantity: Number(addForm.quantity),
          unit: addForm.unit
        }),
        method: "POST"
      });
      setItems((current) => [body.item, ...current]);
      setAddForm(emptyForm);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t("shoppingList.error"));
    } finally {
      setIsSaving(false);
    }
  }

  async function saveEditedItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingItem) return;
    setIsSaving(true);
    setError("");
    try {
      const body = await requestJson<{ item: ShoppingItem }>(`/api/shopping-list/${editingItem.id}`, {
        body: JSON.stringify({
          deadline: editForm.hasDeadline ? editForm.deadline : null,
          name: editForm.name.trim(),
          quantity: Number(editForm.quantity),
          unit: editForm.unit
        }),
        method: "PATCH"
      });
      setItems((current) => current.map((item) => item.id === editingItem.id ? body.item : item));
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

  function startSharing() {
    setSelectedShareIds(new Set());
    setShareNotice("");
    setIsShareMode(true);
  }

  function cancelSharing() {
    setSelectedShareIds(new Set());
    setIsShareMode(false);
  }

  function toggleShareSelection(id: string) {
    setSelectedShareIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedShareIds((current) => current.size === openItems.length
      ? new Set()
      : new Set(openItems.map((item) => item.id))
    );
  }

  async function shareSelectedItems() {
    const selectedItems = openItems.filter((item) => selectedShareIds.has(item.id));
    if (selectedItems.length === 0) return;

    const text = [
      `🛒 ${t("shoppingList.shareTitle")}`,
      "",
      ...selectedItems.map((item) => `☐ ${item.name} — ${item.quantity.toLocaleString(locale)} ${unitLabel(item.unit)}${item.deadline ? ` · 📅 ${formatDay(item.deadline)}` : ""}`),
      "",
      `${t("shoppingList.totalItems")}: ${selectedItems.length.toLocaleString(locale)}`
    ].join("\n");

    try {
      if (navigator.share) {
        await navigator.share({ text, title: t("shoppingList.shareTitle") });
        cancelSharing();
        return;
      }

      await navigator.clipboard.writeText(text);
      setShareNotice(t("shoppingList.copiedToClipboard"));
      cancelSharing();
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === "AbortError") return;
      setError(t("shoppingList.shareError"));
    }
  }

  function renderItem(item: ShoppingItem) {
    const completed = Boolean(item.completedAt);
    const isSelectable = isShareMode && !completed;
    const isSelected = selectedShareIds.has(item.id);
    return (
      <article className={`shopping-item ${completed ? "completed" : ""} ${isSelected ? "share-selected" : ""}`} key={item.id}>
        <button
          className={`shopping-check ${isSelectable ? "share-check" : ""}`}
          type="button"
          disabled={isSelectable ? false : !can("shopping.complete") || busyId === item.id}
          onClick={() => isSelectable ? toggleShareSelection(item.id) : toggleItem(item)}
          aria-label={isSelectable ? (isSelected ? t("shoppingList.deselectForShare") : t("shoppingList.selectForShare")) : (completed ? t("shoppingList.markOpen") : t("shoppingList.markDone"))}
          aria-pressed={isSelectable ? isSelected : undefined}
        >
          {completed || isSelected ? <Check size={18} aria-hidden="true" /> : null}
        </button>
        <div className="shopping-item-copy">
          <strong>{item.name}</strong>
          <span>{item.quantity.toLocaleString(locale)} {unitLabel(item.unit)}</span>
        </div>
        {item.deadline ? (
          <span className="shopping-deadline"><CalendarDays size={15} aria-hidden="true" />{formatDay(item.deadline)}</span>
        ) : null}
        {!isShareMode && (can("shopping.edit") || can("shopping.delete")) ? (
          <div className="shopping-actions">
            {!completed && can("shopping.edit") ? <button className="icon-button" type="button" disabled={busyId === item.id} onClick={() => openEditModal(item)} aria-label={t("shoppingList.edit")}><Pencil size={17} aria-hidden="true" /></button> : null}
            {can("shopping.delete") ? <button className="icon-button danger" type="button" disabled={busyId === item.id} onClick={() => deleteItem(item)} aria-label={t("shoppingList.delete")}><Trash2 size={17} aria-hidden="true" /></button> : null}
          </div>
        ) : null}
      </article>
    );
  }

  return (
    <>
      {can("shopping.create") ? (
        <section className="shopping-add-panel" aria-labelledby="shopping-add-title">
          <div className="shopping-add-heading"><PlusCircle size={19} aria-hidden="true" /><strong id="shopping-add-title">{t("shoppingList.addTitle")}</strong></div>
          <form className="shopping-inline-form" onSubmit={createItem}>
            <label className="shopping-name-field"><span>{t("shoppingList.name")}</span><input required list="shopping-add-suggestions" autoComplete="off" value={addForm.name} onChange={(event) => updateItemName(addForm, setAddForm, event.target.value)} /><datalist id="shopping-add-suggestions">{suggestions.map((suggestion) => <option key={suggestion.name.toLocaleLowerCase()} value={suggestion.name} label={`${suggestion.name} · ${unitLabel(suggestion.unit)}`} />)}</datalist>{areSuggestionsLoading ? <small className="shopping-suggestions-status">{t("shoppingList.loadingSuggestions")}</small> : null}</label>
            <label className="shopping-quantity-field"><span>{t("shoppingList.quantity")}</span><input required min="0.01" step="any" type="number" value={addForm.quantity} onChange={(event) => setAddForm((current) => ({ ...current, quantity: event.target.value }))} /></label>
            <label className="shopping-unit-field"><span>{t("shoppingList.unit")}</span><select value={addForm.unit} onChange={(event) => setAddForm((current) => ({ ...current, unit: event.target.value as ShoppingUnit }))}><option value="kg">{unitLabel("kg")}</option><option value="package">{unitLabel("package")}</option><option value="piece">{unitLabel("piece")}</option><option value="bottle">{unitLabel("bottle")}</option></select></label>
            <label className="checkbox-row shopping-deadline-toggle"><input type="checkbox" checked={addForm.hasDeadline} onChange={(event) => setAddForm((current) => ({ ...current, hasDeadline: event.target.checked, deadline: event.target.checked ? current.deadline : "" }))} /><span>{t("shoppingList.hasDeadline")}</span></label>
            {addForm.hasDeadline ? <label className="shopping-date-field"><span>{t("shoppingList.deadline")}</span><input required type="date" value={addForm.deadline} onChange={(event) => setAddForm((current) => ({ ...current, deadline: event.target.value }))} /></label> : null}
            <button className="button primary shopping-add-submit" type="submit" disabled={isSaving}><PlusCircle size={18} aria-hidden="true" />{isSaving ? t("common.saving") : t("shoppingList.add")}</button>
          </form>
        </section>
      ) : null}
      {shareNotice ? <p className="form-info" role="status">{shareNotice}</p> : null}
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {isLoading ? <p className="muted-text">{t("shoppingList.loading")}</p> : null}

      {!isLoading ? (
        <section className="shopping-panel">
          <div className="shopping-section-heading"><ShoppingBasket size={20} aria-hidden="true" /><span>{t("shoppingList.openItems")}</span><div className="shopping-heading-actions"><strong>{openItems.length}</strong>{openItems.length > 0 && !isShareMode ? <button className="button secondary compact shopping-share-start" type="button" onClick={startSharing}><Share2 size={17} aria-hidden="true" />{t("shoppingList.share")}</button> : null}</div></div>
          {isShareMode ? (
            <div className="shopping-share-toolbar">
              <div><strong>{t("shoppingList.selectItemsToShare")}</strong><span>{selectedShareIds.size.toLocaleString(locale)} {t("shoppingList.selected")}</span></div>
              <div className="shopping-share-actions"><button className="button secondary compact" type="button" onClick={toggleSelectAll}>{selectedShareIds.size === openItems.length ? t("shoppingList.clearSelection") : t("shoppingList.selectAll")}</button><button className="button secondary compact" type="button" onClick={cancelSharing}>{t("common.cancel")}</button><button className="button primary compact" type="button" disabled={selectedShareIds.size === 0} onClick={shareSelectedItems}><Send size={17} aria-hidden="true" />{t("shoppingList.shareSelected")}</button></div>
            </div>
          ) : null}
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
            <div className="modal-header"><div><span>{t("nav.shoppingList")}</span><h2 id="shopping-modal-title">{t("shoppingList.editTitle")}</h2></div><button className="icon-button" type="button" onClick={closeModal} aria-label={t("common.closeDialog")}><X size={20} aria-hidden="true" /></button></div>
            <form className="modal-form" onSubmit={saveEditedItem}>
              <label className="form-field-full"><span>{t("shoppingList.name")}</span><input autoFocus required list="shopping-edit-suggestions" autoComplete="off" value={editForm.name} onChange={(event) => updateItemName(editForm, setEditForm, event.target.value)} /><datalist id="shopping-edit-suggestions">{suggestions.map((suggestion) => <option key={suggestion.name.toLocaleLowerCase()} value={suggestion.name} label={`${suggestion.name} · ${unitLabel(suggestion.unit)}`} />)}</datalist>{areSuggestionsLoading ? <small className="shopping-suggestions-status">{t("shoppingList.loadingSuggestions")}</small> : null}</label>
              <label><span>{t("shoppingList.quantity")}</span><input required min="0.01" step="any" type="number" value={editForm.quantity} onChange={(event) => setEditForm((current) => ({ ...current, quantity: event.target.value }))} /></label>
              <label><span>{t("shoppingList.unit")}</span><select value={editForm.unit} onChange={(event) => setEditForm((current) => ({ ...current, unit: event.target.value as ShoppingUnit }))}><option value="kg">{unitLabel("kg")}</option><option value="package">{unitLabel("package")}</option><option value="piece">{unitLabel("piece")}</option><option value="bottle">{unitLabel("bottle")}</option></select></label>
              <label className="checkbox-row form-field-full"><input type="checkbox" checked={editForm.hasDeadline} onChange={(event) => setEditForm((current) => ({ ...current, hasDeadline: event.target.checked, deadline: event.target.checked ? current.deadline : "" }))} /><span>{t("shoppingList.hasDeadline")}</span></label>
              {editForm.hasDeadline ? <label className="form-field-full"><span>{t("shoppingList.deadline")}</span><input required type="date" value={editForm.deadline} onChange={(event) => setEditForm((current) => ({ ...current, deadline: event.target.value }))} /></label> : null}
              <div className="modal-actions"><button className="button secondary" type="button" onClick={closeModal}>{t("common.cancel")}</button><button className="button primary" type="submit" disabled={isSaving}><Save size={18} aria-hidden="true" />{isSaving ? t("common.saving") : t("common.save")}</button></div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
