"use client";

import { FormEvent, useEffect, useState } from "react";
import { Pencil, PlusCircle, Save, Trash2, UserRound, X } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { requestJson } from "@/lib/requestJson";
import type { AccessLevel, SharedUser } from "@/lib/types";

type MeResponse = {
  accessLevel: "owner" | "readonly" | "readwrite";
  ownerId: string;
  username: string;
};

type UserForm = {
  username: string;
  password: string;
  accessLevel: AccessLevel;
};

const emptyForm: UserForm = {
  accessLevel: "readonly",
  password: "",
  username: ""
};

export function AccessSettings() {
  const { t } = useLanguage();
  const [currentUser, setCurrentUser] = useState<MeResponse | null>(null);
  const [editForm, setEditForm] = useState<UserForm>(emptyForm);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [isOpen, setIsOpen] = useState(false);
  const [operationLabel, setOperationLabel] = useState("");
  const [userToDelete, setUserToDelete] = useState<SharedUser | null>(null);
  const [users, setUsers] = useState<SharedUser[]>([]);

  useEffect(() => {
    async function loadAccess() {
      const me = await requestJson<MeResponse>("/api/me");
      setCurrentUser(me);

      if (me.accessLevel === "owner") {
        const body = await requestJson<{ users: SharedUser[] }>("/api/users");
        setUsers(body.users);
      }
    }

    loadAccess().catch(() => undefined);
  }, []);

  if (currentUser?.accessLevel !== "owner") {
    return null;
  }

  const visibleUsers = users.filter((user) => user.username !== currentUser.username);

  function updateForm(field: keyof UserForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateEditForm(field: keyof UserForm, value: string) {
    setEditForm((current) => ({ ...current, [field]: value }));
  }

  function closeAddModal() {
    setIsOpen(false);
    setForm(emptyForm);
  }

  function openEditModal(user: SharedUser) {
    setEditingUserId(user.id);
    setEditForm({
      accessLevel: user.accessLevel,
      password: "",
      username: user.username
    });
  }

  function closeEditModal() {
    setEditingUserId(null);
    setEditForm(emptyForm);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOperationLabel("save-user");

    try {
      const body = await requestJson<{ user: SharedUser }>("/api/users", {
        body: JSON.stringify(form),
        method: "POST"
      });
      setUsers((current) => [body.user, ...current]);
      closeAddModal();
    } finally {
      setOperationLabel("");
    }
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOperationLabel("edit-user");

    try {
      const body = await requestJson<{ user: SharedUser }>(`/api/users/${editingUserId}`, {
        body: JSON.stringify({
          accessLevel: editForm.accessLevel,
          password: editForm.password || undefined,
          username: editForm.username
        }),
        method: "PUT"
      });
      setUsers((current) => current.map((user) => (user.id === editingUserId ? body.user : user)));
      closeEditModal();
    } finally {
      setOperationLabel("");
    }
  }

  async function confirmDeleteUser() {
    if (!userToDelete) {
      return;
    }

    setOperationLabel("delete-user");

    try {
      await requestJson(`/api/users/${userToDelete.id}`, { method: "DELETE" });
      setUsers((current) => current.filter((user) => user.id !== userToDelete.id));
      setUserToDelete(null);
    } finally {
      setOperationLabel("");
    }
  }

  return (
    <section className="settings-panel settings-panel-block access-settings-panel" aria-labelledby="access-title">
      <div className="settings-copy">
        <span>{t("settings.accessLabel")}</span>
        <h2 id="access-title">{t("settings.accessTitle")}</h2>
        <p>{t("settings.accessDescription")}</p>
      </div>

      <div className="action-row">
        <button className="button primary" type="button" onClick={() => setIsOpen(true)}>
          <PlusCircle size={18} aria-hidden="true" />
          {t("settings.addUser")}
        </button>
      </div>

      <div className="responsive-table access-table">
        <table>
          <thead>
            <tr>
              <th>{t("settings.username")}</th>
              <th>{t("settings.permission")}</th>
              <th>{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="owner-access-row">
              <td>
                <span className="table-title">
                  <UserRound size={16} aria-hidden="true" />
                  {currentUser.username}
                </span>
              </td>
              <td>{t("nav.owner")}</td>
              <td>
                <span className="table-muted">-</span>
              </td>
            </tr>
            {visibleUsers.map((user) => (
              <tr key={user.id}>
                <td>
                  <span className="table-title">
                    <UserRound size={16} aria-hidden="true" />
                    {user.username}
                  </span>
                </td>
                <td>{user.accessLevel === "readonly" ? t("settings.readonly") : t("settings.readwrite")}</td>
                <td>
                  <div className="table-actions">
                    <button
                      className="icon-button"
                      type="button"
                      onClick={() => openEditModal(user)}
                      aria-label={`${user.username} ${t("common.edit")}`}
                    >
                      <Pencil size={16} aria-hidden="true" />
                    </button>
                    <button
                      className="icon-button danger"
                      type="button"
                      onClick={() => setUserToDelete(user)}
                      aria-label={`${user.username} ${t("common.delete")}`}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {visibleUsers.length === 0 ? <p className="empty-table-text">{t("settings.noUsers")}</p> : null}

      {isOpen ? (
        <UserModal
          form={form}
          isEditing={false}
          isSubmitting={operationLabel === "save-user"}
          onClose={closeAddModal}
          onSubmit={handleSubmit}
          onUpdate={updateForm}
          title={t("settings.addUserTitle")}
        />
      ) : null}

      {editingUserId ? (
        <UserModal
          form={editForm}
          isEditing
          isSubmitting={operationLabel === "edit-user"}
          onClose={closeEditModal}
          onSubmit={handleEditSubmit}
          onUpdate={updateEditForm}
          title={t("settings.editUserTitle")}
        />
      ) : null}

      {userToDelete ? (
        <div className="modal-backdrop" role="presentation">
          <section className="confirm-panel" role="dialog" aria-modal="true" aria-labelledby="user-delete-modal-title">
            <div className="confirm-icon danger" aria-hidden="true">
              <Trash2 size={24} />
            </div>
            <div className="confirm-content">
              <span>{t("settings.deleteUserLabel")}</span>
              <h2 id="user-delete-modal-title">{t("settings.deleteUserTitle")}</h2>
              <p>
                <strong>{userToDelete.username}</strong> {t("settings.deleteUserText")}
              </p>
            </div>
            <div className="modal-actions">
              <button className="button secondary" type="button" onClick={() => setUserToDelete(null)}>
                {t("common.cancel")}
              </button>
              <button
                className="button danger"
                type="button"
                onClick={confirmDeleteUser}
                disabled={operationLabel === "delete-user"}
              >
                <Trash2 size={18} aria-hidden="true" />
                {operationLabel === "delete-user" ? t("common.deleting") : t("common.delete")}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function UserModal({
  form,
  isEditing,
  isSubmitting,
  onClose,
  onSubmit,
  onUpdate,
  title
}: {
  form: UserForm;
  isEditing: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUpdate: (field: keyof UserForm, value: string) => void;
  title: string;
}) {
  const { t } = useLanguage();

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="user-modal-title">
        <div className="modal-header">
          <div>
            <span>{t("settings.accessLabel")}</span>
            <h2 id="user-modal-title">{title}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label={t("common.closeDialog")}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <form autoComplete="off" className="modal-form" onSubmit={onSubmit}>
          <label>
            <span>{t("settings.username")}</span>
            <input
              autoComplete="off"
              required
              value={form.username}
              onChange={(event) => onUpdate("username", event.target.value)}
            />
          </label>
          <label>
            <span>{t("settings.password")}</span>
            <input
              autoComplete="new-password"
              minLength={6}
              required={!isEditing}
              type="password"
              value={form.password}
              onChange={(event) => onUpdate("password", event.target.value)}
              placeholder={isEditing ? t("settings.passwordUnchanged") : ""}
            />
          </label>
          <label>
            <span>{t("settings.permission")}</span>
            <select
              autoComplete="off"
              required
              value={form.accessLevel}
              onChange={(event) => onUpdate("accessLevel", event.target.value as AccessLevel)}
            >
              <option value="readonly">{t("settings.readonly")}</option>
              <option value="readwrite">{t("settings.readwrite")}</option>
            </select>
          </label>
          <div className="modal-actions">
            <button className="button secondary" type="button" onClick={onClose}>
              {t("common.cancel")}
            </button>
            <button className="button primary" type="submit" disabled={isSubmitting}>
              <Save size={18} aria-hidden="true" />
              {isSubmitting ? t("common.saving") : t("common.save")}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
