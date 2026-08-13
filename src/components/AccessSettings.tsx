"use client";

import { FormEvent, useEffect, useState } from "react";
import { KeyRound, Pencil, PlusCircle, Save, Trash2, UserRound, X } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { requestJson } from "@/lib/requestJson";
import type { SharedUser } from "@/lib/types";
import { ACTION_PERMISSION_GROUPS, ALL_ACTION_PERMISSIONS, permissionActionName, type ActionPermission } from "@/lib/actionPermissions";

type UserForm = {
  username: string;
  password: string;
};

const emptyForm: UserForm = {
  password: "",
  username: ""
};

export function AccessSettings() {
  const { user: currentUser } = useAuth();
  const { t } = useLanguage();
  const [editForm, setEditForm] = useState<UserForm>(emptyForm);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [isOpen, setIsOpen] = useState(false);
  const [operationLabel, setOperationLabel] = useState("");
  const [permissionsUser, setPermissionsUser] = useState<SharedUser | null>(null);
  const [permissionDraft, setPermissionDraft] = useState<ActionPermission[]>([]);
  const [userToDelete, setUserToDelete] = useState<SharedUser | null>(null);
  const [users, setUsers] = useState<SharedUser[]>([]);

  useEffect(() => {
    if (currentUser?.accessLevel !== "owner") {
      return;
    }

    requestJson<{ users: SharedUser[] }>("/api/users")
      .then((body) => setUsers(body.users))
      .catch(() => undefined);
  }, [currentUser?.accessLevel]);

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

  function openPermissionsModal(user: SharedUser) {
    setPermissionsUser(user);
    setPermissionDraft(user.permissions);
  }

  function togglePermission(permission: ActionPermission) {
    setPermissionDraft((current) => current.includes(permission)
      ? current.filter((item) => item !== permission)
      : [...current, permission]
    );
  }

  async function savePermissions() {
    if (!permissionsUser) return;
    setOperationLabel("save-permissions");
    try {
      const body = await requestJson<{ user: SharedUser }>(`/api/users/${permissionsUser.id}/permissions`, {
        body: JSON.stringify({ permissions: permissionDraft }),
        method: "PUT"
      });
      setUsers((current) => current.map((user) => user.id === body.user.id ? body.user : user));
      setPermissionsUser(null);
    } finally {
      setOperationLabel("");
    }
  }

  return (
    <section className="settings-panel settings-panel-block access-settings-panel" aria-labelledby="access-title">
      <div className="settings-copy">
        <span>{t("settings.accessLabel")}</span>
        <h2 id="access-title">{t("settings.accessTitle")}</h2>
      </div>

      <div className="action-row">
        <button className="button primary" type="button" onClick={() => setIsOpen(true)}>
          <PlusCircle size={18} aria-hidden="true" />
          {t("settings.addUser")}
        </button>
      </div>

      <div className="responsive-table access-table desktop-data-table">
        <table>
          <thead>
            <tr>
              <th>{t("settings.username")}</th>
              <th>{t("settings.allowedActions")}</th>
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
              <td className="access-permission-cell">{t("settings.allActions")}</td>
              <td className="access-actions-cell">
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
                <td className="access-permission-cell">{user.permissions.length} {t("settings.actionsAllowed")}</td>
                <td className="access-actions-cell">
                  <div className="table-actions">
                    <button
                      className="icon-button"
                      type="button"
                      onClick={() => openPermissionsModal(user)}
                      aria-label={`${user.username} ${t("settings.managePermissions")}`}
                    >
                      <KeyRound size={16} aria-hidden="true" />
                    </button>
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
      <div className="mobile-data-list access-mobile-list">
        <article className="mobile-data-card owner-mobile-card">
          <div className="mobile-data-card-heading"><span className="mobile-data-title"><UserRound size={17} aria-hidden="true" /><strong>{currentUser.username}</strong></span><span className="mobile-data-chip">{t("nav.owner")}</span></div>
          <div className="mobile-data-card-footer"><span>{t("settings.allowedActions")}</span><strong>{t("settings.allActions")}</strong></div>
        </article>
        {visibleUsers.map((user) => (
          <article className="mobile-data-card" key={user.id}>
            <div className="mobile-data-card-heading"><span className="mobile-data-title"><UserRound size={17} aria-hidden="true" /><strong>{user.username}</strong></span><strong>{user.permissions.length} {t("settings.actionsAllowed")}</strong></div>
            <div className="mobile-data-card-footer actions-only"><div className="table-actions"><button className="icon-button" type="button" onClick={() => openPermissionsModal(user)} aria-label={`${user.username} ${t("settings.managePermissions")}`}><KeyRound size={16} aria-hidden="true" /></button><button className="icon-button" type="button" onClick={() => openEditModal(user)} aria-label={`${user.username} ${t("common.edit")}`}><Pencil size={16} aria-hidden="true" /></button><button className="icon-button danger" type="button" onClick={() => setUserToDelete(user)} aria-label={`${user.username} ${t("common.delete")}`}><Trash2 size={16} aria-hidden="true" /></button></div></div>
          </article>
        ))}
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

      {permissionsUser ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel permissions-modal" role="dialog" aria-modal="true" aria-labelledby="permissions-modal-title">
            <div className="modal-header">
              <div><span>{permissionsUser.username}</span><h2 id="permissions-modal-title">{t("settings.managePermissions")}</h2></div>
              <button className="icon-button" type="button" onClick={() => setPermissionsUser(null)} aria-label={t("common.closeDialog")}><X size={20} aria-hidden="true" /></button>
            </div>
            <div className="permissions-toolbar">
              <p>{t("settings.permissionsDescription")}</p>
              <div className="table-actions">
                <button className="button secondary" type="button" onClick={() => setPermissionDraft(ALL_ACTION_PERMISSIONS)}>{t("settings.selectAll")}</button>
                <button className="button secondary" type="button" onClick={() => setPermissionDraft([])}>{t("settings.clearAll")}</button>
              </div>
            </div>
            <div className="permissions-grid">
              {ACTION_PERMISSION_GROUPS.map((group) => (
                <fieldset className="permission-group" key={group.section}>
                  <legend>{t(`settings.permissionSections.${group.section}`)}</legend>
                  {group.actions.map((permission) => (
                    <label className="permission-option" key={permission}>
                      <input type="checkbox" checked={permissionDraft.includes(permission)} onChange={() => togglePermission(permission)} />
                      <span>{t(`settings.permissionActions.${permissionActionName(permission)}`)}</span>
                    </label>
                  ))}
                </fieldset>
              ))}
            </div>
            <div className="modal-actions permissions-actions">
              <button className="button secondary" type="button" onClick={() => setPermissionsUser(null)}>{t("common.cancel")}</button>
              <button className="button primary" type="button" onClick={savePermissions} disabled={operationLabel === "save-permissions"}><Save size={18} aria-hidden="true" />{operationLabel === "save-permissions" ? t("common.saving") : t("common.save")}</button>
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
