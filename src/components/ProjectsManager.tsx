"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Calculator,
  FolderKanban,
  Pencil,
  Plus,
  PlusCircle,
  ReceiptText,
  Save,
  Scale,
  Share2,
  Trash2,
  Users,
  X
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { formatCurrency, formatDate } from "@/lib/formatting";
import { requestJson } from "@/lib/requestJson";
import type {
  ExpenseProject,
  ExpenseProjectDetail,
  ExpenseProjectInput,
  ProjectExpense,
  ProjectExpenseInput
} from "@/lib/types";

type ProjectFormState = {
  title: string;
  startDate: string;
  description: string;
  categories: Array<{ id?: string; name: string }>;
  members: Array<{ id?: string; name: string; shareWeight: string }>;
};

type ExpenseFormState = {
  amount: string;
  date: string;
  categoryId: string;
  paidByMemberId: string;
  description: string;
};

type SettlementTransfer = {
  from: string;
  to: string;
  amount: number;
};

function emptyProjectForm(): ProjectFormState {
  return {
    categories: [{ name: "" }],
    description: "",
    members: [{ name: "", shareWeight: "1" }],
    startDate: new Date().toISOString().slice(0, 10),
    title: ""
  };
}

function projectToForm(project: ExpenseProject): ProjectFormState {
  return {
    categories: project.categories.filter((category) => category.active).map(({ id, name }) => ({ id, name })),
    description: project.description ?? "",
    members: project.members
      .filter((member) => member.active)
      .map(({ id, name, shareWeight }) => ({ id, name, shareWeight: String(shareWeight) })),
    startDate: project.startDate,
    title: project.title
  };
}

function projectPayload(form: ProjectFormState): ExpenseProjectInput {
  return {
    categories: form.categories.map((category) => ({ id: category.id, name: category.name.trim() })),
    description: form.description.trim() || null,
    members: form.members.map((member) => ({
      id: member.id,
      name: member.name.trim(),
      shareWeight: Number(member.shareWeight.replace(",", "."))
    })),
    startDate: form.startDate,
    title: form.title.trim()
  };
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function isolateText(value: string | number) {
  return `\u2068${value}\u2069`;
}

function calculateSettlementTransfers(project: ExpenseProjectDetail): SettlementTransfer[] {
  const creditors = project.memberBalances
    .filter((member) => Math.round(member.balance * 100) > 0)
    .map((member) => ({ name: member.memberName, cents: Math.round(member.balance * 100) }))
    .sort((a, b) => b.cents - a.cents);
  const debtors = project.memberBalances
    .filter((member) => Math.round(member.balance * 100) < 0)
    .map((member) => ({ name: member.memberName, cents: -Math.round(member.balance * 100) }))
    .sort((a, b) => b.cents - a.cents);
  const transfers: SettlementTransfer[] = [];

  while (creditors.length && debtors.length) {
    let creditorIndex = 0;
    let debtorIndex = 0;
    let exactMatchFound = false;
    for (let currentCreditorIndex = 0; currentCreditorIndex < creditors.length && !exactMatchFound; currentCreditorIndex += 1) {
      const exactDebtorIndex = debtors.findIndex((debtor) => debtor.cents === creditors[currentCreditorIndex].cents);
      if (exactDebtorIndex >= 0) {
        creditorIndex = currentCreditorIndex;
        debtorIndex = exactDebtorIndex;
        exactMatchFound = true;
      }
    }
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];
    const cents = Math.min(creditor.cents, debtor.cents);

    transfers.push({ amount: cents / 100, from: debtor.name, to: creditor.name });
    creditor.cents -= cents;
    debtor.cents -= cents;
    if (creditor.cents === 0) creditors.splice(creditorIndex, 1);
    if (debtor.cents === 0) debtors.splice(debtorIndex, 1);
    creditors.sort((a, b) => b.cents - a.cents);
    debtors.sort((a, b) => b.cents - a.cents);
  }

  return transfers;
}

export function ProjectsManager() {
  const { can } = useAuth();
  const { t } = useLanguage();
  const [projects, setProjects] = useState<ExpenseProject[]>([]);
  const [form, setForm] = useState<ProjectFormState>(emptyProjectForm());
  const [editingProject, setEditingProject] = useState<ExpenseProject | null>(null);
  const [deletingProject, setDeletingProject] = useState<ExpenseProject | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [sharingProjectId, setSharingProjectId] = useState<string | null>(null);
  const [shareNotice, setShareNotice] = useState("");
  const [settlementProject, setSettlementProject] = useState<ExpenseProjectDetail | null>(null);
  const [settlementLoadingId, setSettlementLoadingId] = useState<string | null>(null);
  const [settlementNotice, setSettlementNotice] = useState("");
  const [error, setError] = useState("");

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const body = await requestJson<{ projects: ExpenseProject[] }>("/api/projects");
      setProjects(body.projects);
    } catch (loadError) {
      setError(errorMessage(loadError, t("projects.operationFailed")));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  function openAdd() {
    setEditingProject(null);
    setForm(emptyProjectForm());
    setError("");
    setIsOpen(true);
  }

  function openEdit(project: ExpenseProject) {
    setEditingProject(project);
    setForm(projectToForm(project));
    setError("");
    setIsOpen(true);
  }

  async function submitProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      const url = editingProject ? `/api/projects/${editingProject.id}` : "/api/projects";
      const body = await requestJson<{ project: ExpenseProject }>(url, {
        body: JSON.stringify(projectPayload(form)),
        method: editingProject ? "PUT" : "POST"
      });
      setProjects((current) =>
        editingProject
          ? current.map((project) => (project.id === editingProject.id ? body.project : project))
          : [body.project, ...current]
      );
      setIsOpen(false);
      setEditingProject(null);
    } catch (saveError) {
      setError(errorMessage(saveError, t("projects.operationFailed")));
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDeleteProject() {
    if (!deletingProject) return;
    setIsSaving(true);
    setError("");
    try {
      await requestJson(`/api/projects/${deletingProject.id}`, { method: "DELETE" });
      setProjects((current) => current.filter((project) => project.id !== deletingProject.id));
      setDeletingProject(null);
    } catch (deleteError) {
      setError(errorMessage(deleteError, t("projects.operationFailed")));
    } finally {
      setIsSaving(false);
    }
  }

  async function shareProject(project: ExpenseProject) {
    setSharingProjectId(project.id);
    setShareNotice("");
    setError("");
    try {
      const body = await requestJson<{ project: ExpenseProjectDetail }>(`/api/projects/${project.id}`);
      const detail = body.project;
      const activeMembers = detail.members.filter((member) => member.active);
      const categoryTotals = detail.categoryTotals.filter((category) => Math.abs(category.amount) >= 0.005);
      const divider = "──────────────";
      const lines = [
        `📁 ${isolateText(detail.title)}`,
        `📅 ${isolateText(formatDate(detail.startDate))}`,
        ...(detail.description ? [`📝 ${isolateText(detail.description)}`] : []),
        "",
        divider,
        `💶 ${t("projects.totalExpenses")}`,
        isolateText(formatCurrency(detail.totalExpense)),
        `🧾 ${isolateText(detail.expenseCount)} ${t("projects.expenseCount")}  ·  👥 ${isolateText(activeMembers.length)} ${t("projects.members")}`,
        ...(categoryTotals.length ? [
          "",
          divider,
          `📊 ${t("projects.categorySpending")}`,
          "",
          ...categoryTotals.flatMap((category) => [
            `• ${isolateText(category.categoryName)}`,
            `  ${isolateText(formatCurrency(category.amount))}`
          ])
        ] : []),
        ...(detail.memberBalances.length ? [
          "",
          divider,
          `⚖️ ${t("projects.memberBalances")}`,
          "",
          ...detail.memberBalances.flatMap((member, index) => {
            const balance = `${member.balance > 0 ? "+" : ""}${formatCurrency(member.balance)}`;
            const balanceIcon = member.balance > 0.005 ? "🟢" : member.balance < -0.005 ? "🔴" : "⚪";
            return [
              `👤 ${isolateText(member.memberName)}`,
              `${t("projects.paid")}: ${isolateText(formatCurrency(member.paid))}`,
              `${t("projects.expected")}: ${isolateText(formatCurrency(member.expected))}`,
              `${balanceIcon} ${t("projects.balance")}: ${isolateText(balance)}`,
              ...(index < detail.memberBalances.length - 1 ? [""] : [])
            ];
          })
        ] : [])
      ];
      const text = lines.join("\n");

      if (navigator.share) {
        await navigator.share({ text, title: detail.title });
      } else {
        await navigator.clipboard.writeText(text);
        setShareNotice(t("projects.copiedToClipboard"));
      }
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === "AbortError") return;
      setError(t("projects.shareFailed"));
    } finally {
      setSharingProjectId(null);
    }
  }

  async function openSettlement(project: ExpenseProject) {
    setSettlementLoadingId(project.id);
    setSettlementNotice("");
    setError("");
    try {
      const body = await requestJson<{ project: ExpenseProjectDetail }>(`/api/projects/${project.id}`);
      setSettlementProject(body.project);
    } catch (loadError) {
      setError(errorMessage(loadError, t("projects.operationFailed")));
    } finally {
      setSettlementLoadingId(null);
    }
  }

  async function shareSettlement() {
    if (!settlementProject) return;
    const transfers = calculateSettlementTransfers(settlementProject);
    const text = [
      `🧮 ${t("projects.settlementTitle")}`,
      `📁 ${isolateText(settlementProject.title)}`,
      `${t("projects.transferCount")} · ${isolateText(transfers.length)}`,
      "──────────────",
      "",
      ...(transfers.length ? transfers.flatMap((transfer, index) => [
        `${String(index + 1).padStart(2, "0")}  ${isolateText(transfer.from)}  ➜  ${isolateText(transfer.to)}`,
        `    ${isolateText(formatCurrency(transfer.amount))}`,
        ...(index < transfers.length - 1 ? [""] : [])
      ]) : [`✅ ${t("projects.alreadySettled")}`])
    ].join("\n");

    try {
      if (navigator.share) {
        await navigator.share({ text, title: t("projects.settlementTitle") });
      } else {
        await navigator.clipboard.writeText(text);
        setSettlementNotice(t("projects.settlementCopied"));
      }
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === "AbortError") return;
      setSettlementNotice(t("projects.shareFailed"));
    }
  }

  return (
    <>
      {can("projects.create") ? (
        <div className="action-row">
          <button className="button primary" type="button" onClick={openAdd}>
            <PlusCircle size={18} aria-hidden="true" />
            {t("projects.addProject")}
          </button>
        </div>
      ) : null}

      {shareNotice ? <p className="form-info" role="status">{shareNotice}</p> : null}
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {isLoading ? <p className="muted-text">{t("projects.loading")}</p> : null}

      {!isLoading && projects.length === 0 ? (
        <section className="project-empty-state">
          <FolderKanban size={34} aria-hidden="true" />
          <p>{t("projects.empty")}</p>
        </section>
      ) : null}

      <section className="project-card-grid">
        {projects.map((project) => (
          <article className="project-card" key={project.id}>
            <div className="project-card-heading">
              <div className="project-card-icon"><FolderKanban size={22} aria-hidden="true" /></div>
              <div>
                <h2>{project.title}</h2>
                <span><CalendarDays size={15} aria-hidden="true" /> {formatDate(project.startDate)}</span>
              </div>
            </div>
            {project.description ? <p>{project.description}</p> : null}
            <div className="project-card-metrics">
              <div><span>{t("projects.totalExpenses")}</span><strong>{formatCurrency(project.totalExpense)}</strong></div>
              <div><span>{t("projects.expenseCount")}</span><strong>{project.expenseCount}</strong></div>
              <div><span>{t("projects.members")}</span><strong>{project.members.filter((member) => member.active).length}</strong></div>
            </div>
            <div className="project-card-actions">
              <Link className="button secondary" href={`/projects/${project.id}`}>
                {t("projects.openProject")} <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <div className="table-actions">
                  <button className="icon-button project-settlement-button" type="button" disabled={settlementLoadingId === project.id} onClick={() => openSettlement(project)} aria-label={t("projects.calculateSettlement")} title={t("projects.calculateSettlement")}>
                    <Calculator size={17} aria-hidden="true" />
                  </button>
                  <button className="icon-button project-share-button" type="button" disabled={sharingProjectId === project.id} onClick={() => shareProject(project)} aria-label={t("projects.shareProject")} title={t("projects.shareProject")}>
                    <Share2 size={17} aria-hidden="true" />
                  </button>
                  {can("projects.edit") ? <button className="icon-button" type="button" onClick={() => openEdit(project)} aria-label={t("projects.editProject")}>
                    <Pencil size={16} aria-hidden="true" />
                  </button> : null}
                  {can("projects.delete") ? <button className="icon-button danger" type="button" onClick={() => setDeletingProject(project)} aria-label={t("projects.deleteProject")}>
                    <Trash2 size={16} aria-hidden="true" />
                  </button> : null}
              </div>
            </div>
          </article>
        ))}
      </section>

      {isOpen ? (
        <ProjectModal
          form={form}
          isSaving={isSaving}
          onChange={setForm}
          onClose={() => setIsOpen(false)}
          onSubmit={submitProject}
          title={editingProject ? t("projects.editProject") : t("projects.addProject")}
        />
      ) : null}

      {deletingProject ? (
        <ConfirmModal
          isSaving={isSaving}
          onCancel={() => setDeletingProject(null)}
          onConfirm={confirmDeleteProject}
          text={`${deletingProject.title} ${t("projects.deleteProjectText")}`}
          title={t("projects.deleteProjectTitle")}
        />
      ) : null}

      {settlementProject ? (
        <SettlementModal
          notice={settlementNotice}
          onClose={() => { setSettlementProject(null); setSettlementNotice(""); }}
          onShare={shareSettlement}
          project={settlementProject}
          transfers={calculateSettlementTransfers(settlementProject)}
        />
      ) : null}
    </>
  );
}

function SettlementModal({ notice, onClose, onShare, project, transfers }: {
  notice: string;
  onClose: () => void;
  onShare: () => void;
  project: ExpenseProjectDetail;
  transfers: SettlementTransfer[];
}) {
  const { t } = useLanguage();
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-panel settlement-modal" role="dialog" aria-modal="true" aria-labelledby="settlement-modal-title">
        <div className="modal-header">
          <div><span>{project.title}</span><h2 id="settlement-modal-title">{t("projects.settlementTitle")}</h2></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label={t("common.closeDialog")}><X size={20} aria-hidden="true" /></button>
        </div>
        <div className="settlement-modal-body">
          <div className="settlement-intro"><Calculator size={22} aria-hidden="true" /><div><strong>{transfers.length} {t("projects.transferCount")}</strong><p>{t("projects.settlementHint")}</p></div></div>
          {transfers.length ? (
            <div className="settlement-transfer-list">
              {transfers.map((transfer, index) => (
                <article className="settlement-transfer" key={`${transfer.from}-${transfer.to}-${index}`}>
                  <span className="settlement-transfer-index">{String(index + 1).padStart(2, "0")}</span>
                  <div className="settlement-parties"><strong>{transfer.from}</strong><span>{t("projects.paysTo")} <ArrowRight size={15} aria-hidden="true" /></span><strong>{transfer.to}</strong></div>
                  <b>{formatCurrency(transfer.amount)}</b>
                </article>
              ))}
            </div>
          ) : (
            <div className="settlement-empty"><span>✓</span><strong>{t("projects.alreadySettled")}</strong><p>{t("projects.alreadySettledHint")}</p></div>
          )}
          {notice ? <p className="form-info" role="status">{notice}</p> : null}
          <div className="settlement-actions"><button className="button secondary" type="button" onClick={onClose}>{t("common.cancel")}</button><button className="button primary" type="button" onClick={onShare}><Share2 size={18} aria-hidden="true" />{t("projects.shareSettlement")}</button></div>
        </div>
      </section>
    </div>
  );
}

export function ProjectDetailManager({ projectId }: { projectId: string }) {
  const { can } = useAuth();
  const { t } = useLanguage();
  const [project, setProject] = useState<ExpenseProjectDetail | null>(null);
  const [expenseForm, setExpenseForm] = useState<ExpenseFormState | null>(null);
  const [editingExpense, setEditingExpense] = useState<ProjectExpense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<ProjectExpense | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const loadProject = useCallback(async () => {
    setIsLoading(true);
    try {
      const body = await requestJson<{ project: ExpenseProjectDetail }>(`/api/projects/${projectId}`);
      setProject(body.project);
    } catch (loadError) {
      setError(errorMessage(loadError, t("projects.operationFailed")));
    } finally {
      setIsLoading(false);
    }
  }, [projectId, t]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  const activeCategories = project?.categories.filter((category) => category.active) ?? [];
  const activeMembers = project?.members.filter((member) => member.active) ?? [];

  function openAddExpense() {
    setEditingExpense(null);
    setExpenseForm({
      amount: "",
      categoryId: activeCategories[0]?.id ?? "",
      date: new Date().toISOString().slice(0, 10),
      description: "",
      paidByMemberId: activeMembers[0]?.id ?? ""
    });
  }

  function openEditExpense(expense: ProjectExpense) {
    const validCategory = activeCategories.some((category) => category.id === expense.categoryId);
    const validPayer = activeMembers.some((member) => member.id === expense.paidByMemberId);
    setEditingExpense(expense);
    setExpenseForm({
      amount: String(expense.amount),
      categoryId: validCategory ? expense.categoryId : (activeCategories[0]?.id ?? ""),
      date: expense.date,
      description: expense.description ?? "",
      paidByMemberId: validPayer ? expense.paidByMemberId : (activeMembers[0]?.id ?? "")
    });
  }

  async function submitExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!expenseForm) return;
    setIsSaving(true);
    setError("");
    const payload: ProjectExpenseInput = {
      amount: Number(expenseForm.amount.replace(",", ".")),
      categoryId: expenseForm.categoryId,
      date: expenseForm.date,
      description: expenseForm.description.trim() || null,
      paidByMemberId: expenseForm.paidByMemberId
    };
    try {
      const url = editingExpense
        ? `/api/projects/${projectId}/expenses/${editingExpense.id}`
        : `/api/projects/${projectId}/expenses`;
      const body = await requestJson<{ project: ExpenseProjectDetail }>(url, {
        body: JSON.stringify(payload),
        method: editingExpense ? "PUT" : "POST"
      });
      setProject(body.project);
      setExpenseForm(null);
      setEditingExpense(null);
    } catch (saveError) {
      setError(errorMessage(saveError, t("projects.operationFailed")));
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDeleteExpense() {
    if (!deletingExpense) return;
    setIsSaving(true);
    setError("");
    try {
      await requestJson(`/api/projects/${projectId}/expenses/${deletingExpense.id}`, { method: "DELETE" });
      setDeletingExpense(null);
      await loadProject();
    } catch (deleteError) {
      setError(errorMessage(deleteError, t("projects.operationFailed")));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <p className="muted-text">{t("projects.loading")}</p>;
  if (!project) return <p className="form-error">{error || t("projects.operationFailed")}</p>;

  const visibleCategoryTotals = project.categoryTotals.filter((category) => Math.abs(category.amount) >= 0.005);
  const maxCategoryAmount = Math.max(...visibleCategoryTotals.map((category) => category.amount), 1);

  return (
    <>
      {can("projects.expenses.create") ? (
        <div className="action-row">
          <button className="button primary" type="button" onClick={openAddExpense} disabled={!activeCategories.length || !activeMembers.length}>
            <PlusCircle size={18} aria-hidden="true" /> {t("projects.addExpense")}
          </button>
        </div>
      ) : null}
      {error ? <p className="form-error" role="alert">{error}</p> : null}

      <div className="project-overview-card">
        <section className="project-detail-hero">
          <div className="project-card-icon"><FolderKanban size={24} aria-hidden="true" /></div>
          <div>
            <span>{t("projects.projectDetails")}</span>
            <h1>{project.title}</h1>
            {project.description ? <p>{project.description}</p> : null}
          </div>
          <div className="project-start-date"><CalendarDays size={17} aria-hidden="true" /><span>{t("projects.startDate")}</span><strong>{formatDate(project.startDate)}</strong></div>
        </section>

        <section className="project-summary-grid" aria-label={t("projects.overview")}>
          <div><ReceiptText size={20} aria-hidden="true" /><span>{t("projects.totalExpenses")}</span><strong>{formatCurrency(project.totalExpense)}</strong></div>
          <div><Scale size={20} aria-hidden="true" /><span>{t("projects.expenseCount")}</span><strong>{project.expenseCount}</strong></div>
          <div><Users size={20} aria-hidden="true" /><span>{t("projects.members")}</span><strong>{activeMembers.length}</strong></div>
        </section>
      </div>

      <section className="table-panel project-dashboard-panel">
        <div className="section-title"><span>{t("projects.memberBalances")}</span></div>
        <div className="responsive-table project-desktop-table">
          <table>
            <thead><tr><th>{t("projects.memberName")}</th><th>{t("projects.shareWeight")}</th><th>{t("projects.paid")}</th><th>{t("projects.expected")}</th><th>{t("projects.balance")}</th></tr></thead>
            <tbody>
              {project.memberBalances.map((member) => (
                <tr key={member.memberId}>
                  <td><span className="table-title"><Users size={15} aria-hidden="true" /><span>{member.memberName}</span></span></td>
                  <td>{member.shareWeight}</td>
                  <td>{formatCurrency(member.paid)}</td>
                  <td>{formatCurrency(member.expected)}</td>
                  <td><strong className={member.balance >= 0 ? "positive" : "negative"}>{formatCurrency(member.balance)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="project-mobile-member-list">
          {project.memberBalances.map((member) => (
            <article className="project-mobile-member-card" key={member.memberId}>
              <div className="project-mobile-card-heading"><strong><Users size={16} aria-hidden="true" /><span>{member.memberName}</span></strong><b className={member.balance >= 0 ? "positive" : "negative"}>{member.balance > 0 ? "+" : ""}{formatCurrency(member.balance)}</b></div>
              <div className="project-mobile-member-metrics"><div><span>{t("projects.paid")}</span><strong>{formatCurrency(member.paid)}</strong></div><div><span>{t("projects.expected")}</span><strong>{formatCurrency(member.expected)}</strong></div></div>
            </article>
          ))}
        </div>
      </section>

      {visibleCategoryTotals.length ? (
        <section className="project-dashboard-panel category-dashboard-panel">
          <div className="section-title"><span>{t("projects.categorySpending")}</span></div>
          <div className="project-category-totals">
            {visibleCategoryTotals.map((category) => (
              <div className="project-category-total" key={category.categoryId}>
                <div><strong>{category.categoryName}</strong><span>{formatCurrency(category.amount)}</span></div>
                <div className="project-category-track"><span style={{ width: `${(category.amount / maxCategoryAmount) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="table-panel project-dashboard-panel">
        <div className="section-title"><span>{t("projects.expenseHistory")}</span></div>
        <div className="responsive-table project-desktop-table">
          <table>
            <thead><tr><th>{t("projects.date")}</th><th>{t("projects.expenseDescription")}</th><th>{t("projects.category")}</th><th>{t("projects.paidBy")}</th><th>{t("projects.amount")}</th>{can("projects.expenses.edit") || can("projects.expenses.delete") ? <th>{t("common.actions")}</th> : null}</tr></thead>
            <tbody>
              {project.expenses.map((expense) => (
                <tr key={expense.id}>
                  <td>{formatDate(expense.date)}</td>
                  <td>{expense.description ?? ""}</td>
                  <td><span className="project-category-chip">{expense.categoryName}</span></td>
                  <td>{expense.paidByMemberName}</td>
                  <td><strong>{formatCurrency(expense.amount)}</strong></td>
                  {can("projects.expenses.edit") || can("projects.expenses.delete") ? <td><div className="table-actions">{can("projects.expenses.edit") ? <button className="icon-button" type="button" onClick={() => openEditExpense(expense)} aria-label={t("projects.editExpense")}><Pencil size={16} aria-hidden="true" /></button> : null}{can("projects.expenses.delete") ? <button className="icon-button danger" type="button" onClick={() => setDeletingExpense(expense)} aria-label={t("projects.deleteExpense")}><Trash2 size={16} aria-hidden="true" /></button> : null}</div></td> : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="project-mobile-expense-list">
          {project.expenses.map((expense) => (
            <article className="project-mobile-expense-card" key={expense.id}>
              <div className="project-mobile-card-heading"><span>{formatDate(expense.date)}</span><span className="project-category-chip">{expense.categoryName}</span></div>
              {expense.description ? <p>{expense.description}</p> : null}
              <div className="project-mobile-expense-footer">
                <div><span>{t("projects.paidBy")}</span><strong>{expense.paidByMemberName}</strong></div>
                <strong className="project-mobile-expense-amount">{formatCurrency(expense.amount)}</strong>
                {can("projects.expenses.edit") || can("projects.expenses.delete") ? <div className="table-actions">{can("projects.expenses.edit") ? <button className="icon-button" type="button" onClick={() => openEditExpense(expense)} aria-label={t("projects.editExpense")}><Pencil size={16} aria-hidden="true" /></button> : null}{can("projects.expenses.delete") ? <button className="icon-button danger" type="button" onClick={() => setDeletingExpense(expense)} aria-label={t("projects.deleteExpense")}><Trash2 size={16} aria-hidden="true" /></button> : null}</div> : null}
              </div>
            </article>
          ))}
        </div>
        {!project.expenses.length ? <p className="empty-table-text">{t("projects.noExpenses")}</p> : null}
      </section>

      {expenseForm ? (
        <ExpenseModal
          categories={activeCategories}
          form={expenseForm}
          isSaving={isSaving}
          members={activeMembers}
          onChange={setExpenseForm}
          onClose={() => { setExpenseForm(null); setEditingExpense(null); }}
          onSubmit={submitExpense}
          title={editingExpense ? t("projects.editExpense") : t("projects.addExpense")}
        />
      ) : null}

      {deletingExpense ? (
        <ConfirmModal
          isSaving={isSaving}
          onCancel={() => setDeletingExpense(null)}
          onConfirm={confirmDeleteExpense}
          text={`${deletingExpense.description || deletingExpense.categoryName} ${t("projects.deleteExpenseText")}`}
          title={t("projects.deleteExpenseTitle")}
        />
      ) : null}
    </>
  );
}

function ProjectModal({ form, isSaving, onChange, onClose, onSubmit, title }: {
  form: ProjectFormState;
  isSaving: boolean;
  onChange: (form: ProjectFormState) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  title: string;
}) {
  const { t } = useLanguage();
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-panel project-modal-panel" role="dialog" aria-modal="true" aria-labelledby="project-modal-title">
        <div className="modal-header"><div><span>{t("nav.projects")}</span><h2 id="project-modal-title">{title}</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label={t("common.closeDialog")}><X size={20} aria-hidden="true" /></button></div>
        <form className="modal-form" onSubmit={onSubmit}>
          <label><span>{t("expenses.title")}</span><input required value={form.title} onChange={(event) => onChange({ ...form, title: event.target.value })} /></label>
          <label><span>{t("projects.startDate")}</span><input required type="date" value={form.startDate} onChange={(event) => onChange({ ...form, startDate: event.target.value })} /></label>
          <label className="form-field-full"><span>{t("common.description")}</span><textarea value={form.description} onChange={(event) => onChange({ ...form, description: event.target.value })} placeholder={t("common.descriptionPlaceholder")} /></label>

          <fieldset className="project-form-section form-field-full">
            <legend>{t("projects.categories")}</legend>
            {form.categories.map((category, index) => (
              <div className="project-repeater-row" key={category.id ?? `category-${index}`}>
                <input required value={category.name} onChange={(event) => onChange({ ...form, categories: form.categories.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item) })} placeholder={t("projects.categoryName")} />
                <button className="icon-button danger" type="button" disabled={form.categories.length === 1} onClick={() => onChange({ ...form, categories: form.categories.filter((_, itemIndex) => itemIndex !== index) })} aria-label={t("projects.removeItem")}><X size={16} aria-hidden="true" /></button>
              </div>
            ))}
            <button className="button secondary compact-button" type="button" onClick={() => onChange({ ...form, categories: [...form.categories, { name: "" }] })}><Plus size={16} aria-hidden="true" />{t("projects.addCategory")}</button>
          </fieldset>

          <fieldset className="project-form-section form-field-full">
            <legend>{t("projects.members")}</legend>
            {form.members.map((member, index) => (
              <div className="project-repeater-row member-row" key={member.id ?? `member-${index}`}>
                <input required value={member.name} onChange={(event) => onChange({ ...form, members: form.members.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item) })} placeholder={t("projects.memberName")} />
                <label className="share-input"><span>{t("projects.shareWeight")}</span><input required min="0.01" step="0.01" type="number" value={member.shareWeight} onChange={(event) => onChange({ ...form, members: form.members.map((item, itemIndex) => itemIndex === index ? { ...item, shareWeight: event.target.value } : item) })} /></label>
                <button className="icon-button danger" type="button" disabled={form.members.length === 1} onClick={() => onChange({ ...form, members: form.members.filter((_, itemIndex) => itemIndex !== index) })} aria-label={t("projects.removeItem")}><X size={16} aria-hidden="true" /></button>
              </div>
            ))}
            <small className="form-hint">{t("projects.shareHint")}</small>
            <button className="button secondary compact-button" type="button" onClick={() => onChange({ ...form, members: [...form.members, { name: "", shareWeight: "1" }] })}><Plus size={16} aria-hidden="true" />{t("projects.addMember")}</button>
          </fieldset>

          <div className="modal-actions"><button className="button secondary" type="button" onClick={onClose}>{t("common.cancel")}</button><button className="button primary" type="submit" disabled={isSaving}><Save size={18} aria-hidden="true" />{isSaving ? t("common.saving") : t("common.save")}</button></div>
        </form>
      </section>
    </div>
  );
}

function ExpenseModal({ categories, form, isSaving, members, onChange, onClose, onSubmit, title }: {
  categories: ExpenseProjectDetail["categories"];
  form: ExpenseFormState;
  isSaving: boolean;
  members: ExpenseProjectDetail["members"];
  onChange: (form: ExpenseFormState) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  title: string;
}) {
  const { t } = useLanguage();
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="expense-project-modal-title">
        <div className="modal-header"><div><span>{t("nav.projects")}</span><h2 id="expense-project-modal-title">{title}</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label={t("common.closeDialog")}><X size={20} aria-hidden="true" /></button></div>
        <form className="modal-form" onSubmit={onSubmit}>
          <label><span>{t("projects.amount")}</span><input required min="0.01" step="0.01" type="number" value={form.amount} onChange={(event) => onChange({ ...form, amount: event.target.value })} /></label>
          <label><span>{t("projects.date")}</span><input required type="date" value={form.date} onChange={(event) => onChange({ ...form, date: event.target.value })} /></label>
          <label><span>{t("projects.category")}</span><select required value={form.categoryId} onChange={(event) => onChange({ ...form, categoryId: event.target.value })}>{categories.filter((category) => category.active).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <label><span>{t("projects.paidBy")}</span><select required value={form.paidByMemberId} onChange={(event) => onChange({ ...form, paidByMemberId: event.target.value })}>{members.filter((member) => member.active).map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label>
          <label className="form-field-full"><span>{t("projects.expenseDescription")}</span><textarea value={form.description} onChange={(event) => onChange({ ...form, description: event.target.value })} placeholder={t("projects.expenseDescriptionPlaceholder")} /></label>
          <div className="modal-actions"><button className="button secondary" type="button" onClick={onClose}>{t("common.cancel")}</button><button className="button primary" type="submit" disabled={isSaving}><Save size={18} aria-hidden="true" />{isSaving ? t("common.saving") : t("common.save")}</button></div>
        </form>
      </section>
    </div>
  );
}

function ConfirmModal({ isSaving, onCancel, onConfirm, text, title }: {
  isSaving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  text: string;
  title: string;
}) {
  const { t } = useLanguage();
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="confirm-panel" role="dialog" aria-modal="true">
        <div className="confirm-icon danger" aria-hidden="true"><Trash2 size={24} /></div>
        <div className="confirm-content"><h2>{title}</h2><p>{text}</p></div>
        <div className="modal-actions"><button className="button secondary" type="button" onClick={onCancel}>{t("common.cancel")}</button><button className="button danger" type="button" onClick={onConfirm} disabled={isSaving}><Trash2 size={18} aria-hidden="true" />{isSaving ? t("common.deleting") : t("common.delete")}</button></div>
      </section>
    </div>
  );
}
