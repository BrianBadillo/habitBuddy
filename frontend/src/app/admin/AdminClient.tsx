// src/app/admin/AdminClient.tsx
'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/apiClient';
import {
  AdminMetrics,
  AdminUserSummary,
  AdminStage,
  PetType,
  Role,
} from '@/types/api';

interface Props {
  initialPetTypes: PetType[];
  initialMetrics: AdminMetrics;
  initialUsers: AdminUserSummary[];
}

export function AdminClient({
  initialPetTypes,
  initialMetrics,
  initialUsers,
}: Props) {
  const [petTypes, setPetTypes] = useState<PetType[]>(initialPetTypes);
  const [metrics, setMetrics] = useState<AdminMetrics>(initialMetrics);
  const [users, setUsers] = useState<AdminUserSummary[]>(initialUsers);

  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(
    initialPetTypes[0]?.id ?? null
  );
  const [selectedDetail, setSelectedDetail] = useState<{
    petType: PetType;
    stages: AdminStage[];
  } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [creatingType, setCreatingType] = useState(false);
  const [creatingStage, setCreatingStage] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const [editTypeName, setEditTypeName] = useState('');
  const [editTypeDesc, setEditTypeDesc] = useState('');
  const [editTypeSprite, setEditTypeSprite] = useState('');

  const [typeName, setTypeName] = useState('');
  const [typeDesc, setTypeDesc] = useState('');
  const [typeSprite, setTypeSprite] = useState('');

  const [stagePetTypeId, setStagePetTypeId] = useState<number | null>(
    initialPetTypes[0]?.id ?? null
  );
  const [stageNumber, setStageNumber] = useState<number | ''>('');
  const [stageName, setStageName] = useState('');
  const [stageSprite, setStageSprite] = useState('');
  const [stageDesc, setStageDesc] = useState('');

  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refreshMetrics() {
    try {
      const next = await api.adminGetMetrics();
      setMetrics(next);
    } catch (err: any) {
      setError(err.message ?? 'Failed to refresh metrics');
    }
  }

  async function handleCreatePetType(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setError(null);

    if (!typeName.trim() || !typeDesc.trim() || !typeSprite.trim()) {
      setError('Name, description, and base sprite URL are required.');
      return;
    }

    try {
      setCreatingType(true);
      const created = await api.adminCreatePetType({
        name: typeName.trim(),
        description: typeDesc.trim(),
        baseSpriteUrl: typeSprite.trim(),
      });
      setPetTypes((prev) => [...prev, created]);
      setSelectedTypeId(created.id);
      setStagePetTypeId(created.id);
      setTypeName('');
      setTypeDesc('');
      setTypeSprite('');
      setMsg('Pet type created.');
    } catch (err: any) {
      setError(err.message ?? 'Failed to create pet type');
    } finally {
      setCreatingType(false);
    }
  }

  async function handleCreateStage(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setError(null);

    if (!stagePetTypeId) {
      setError('Choose a pet type.');
      return;
    }
    if (!stageNumber || !stageName.trim() || !stageSprite.trim()) {
      setError('Stage number, name, and sprite are required.');
      return;
    }

    try {
      setCreatingStage(true);
      await api.adminCreateStage(stagePetTypeId, {
        stageNumber: Number(stageNumber),
        name: stageName.trim(),
        spriteUrl: stageSprite.trim(),
        description: stageDesc.trim() || undefined,
      });
      setMsg('Stage added.');
      if (selectedTypeId === stagePetTypeId) {
        loadDetail(stagePetTypeId);
      }
      setStageNumber('');
      setStageName('');
      setStageSprite('');
      setStageDesc('');
    } catch (err: any) {
      setError(err.message ?? 'Failed to add stage');
    } finally {
      setCreatingStage(false);
    }
  }

  async function handleRoleChange(userId: string, role: Role) {
    setMsg(null);
    setError(null);

    try {
      setUpdatingUserId(userId);
      const updated = await api.adminUpdateUserRole(userId, role);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: updated.role } : u))
      );
      setMsg(`Updated ${updated.username} to ${updated.role}.`);
    } catch (err: any) {
      setError(err.message ?? 'Failed to update role');
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function loadDetail(petTypeId: number) {
    try {
      setLoadingDetail(true);
      const detail = await api.adminGetPetTypeDetail(petTypeId);
      setSelectedDetail(detail);
      setEditTypeName(detail.petType.name ?? '');
      setEditTypeDesc(detail.petType.description ?? '');
      setEditTypeSprite(detail.petType.baseSpriteUrl ?? '');
      setStagePetTypeId(petTypeId);
      setStageNumber('');
      setStageName('');
      setStageSprite('');
      setStageDesc('');
    } catch (err: any) {
      setError(err.message ?? 'Failed to load pet type detail');
      setSelectedDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }

  useEffect(() => {
    if (selectedTypeId) {
      loadDetail(selectedTypeId);
    } else {
      setSelectedDetail(null);
    }
  }, [selectedTypeId]);

  async function handleUpdatePetType(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTypeId) return;
    setMsg(null);
    setError(null);

    try {
      const updated = await api.adminUpdatePetType(selectedTypeId, {
        name: editTypeName || undefined,
        description: editTypeDesc,
        baseSpriteUrl: editTypeSprite,
      });
      setPetTypes((prev) =>
        prev.map((t) => (t.id === selectedTypeId ? updated : t))
      );
      await loadDetail(selectedTypeId);
      setMsg('Pet type updated.');
    } catch (err: any) {
      setError(err.message ?? 'Failed to update pet type');
    }
  }

  async function handleDeletePetType() {
    if (!selectedTypeId) return;
    const ok = window.confirm(
      'Delete this pet type? This cannot be undone and may orphan pets.'
    );
    if (!ok) return;
    setMsg(null);
    setError(null);
    try {
      await api.adminDeletePetType(selectedTypeId);
      setPetTypes((prev) => prev.filter((t) => t.id !== selectedTypeId));
      const nextId = petTypes.find((t) => t.id !== selectedTypeId)?.id ?? null;
      setSelectedTypeId(nextId);
      setStagePetTypeId(nextId);
      if (nextId) {
        loadDetail(nextId);
      } else {
        setSelectedDetail(null);
      }
      setMsg('Pet type deleted.');
    } catch (err: any) {
      setError(err.message ?? 'Failed to delete pet type');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-indigo-600">
            Admin
          </p>
          <h1 className="text-2xl font-bold">Control Center</h1>
        </div>
        <button
          onClick={refreshMetrics}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
        >
          Refresh metrics
        </button>
      </div>

      {msg && <div className="text-sm text-emerald-700">{msg}</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            Users
          </div>
          <div className="text-2xl font-bold">{metrics.totalUsers ?? 0}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            Habits
          </div>
          <div className="text-2xl font-bold">{metrics.totalHabits ?? 0}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            Active (30d)
          </div>
          <div className="text-2xl font-bold">{metrics.activeUsers ?? 0}</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-xl border bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Pet Types</h2>
            <span className="text-xs text-slate-500">
              {petTypes.length} total
            </span>
          </div>
          <div className="space-y-2 max-h-96 overflow-auto pr-1">
            {petTypes.map((type) => {
              const active = type.id === selectedTypeId;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedTypeId(type.id)}
                  className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                    active
                      ? 'border-indigo-500 ring-2 ring-indigo-200'
                      : 'hover:border-slate-300'
                  }`}
                >
                  <div className="font-semibold">{type.name}</div>
                  <div className="text-xs text-slate-600">
                    {type.description}
                  </div>
                  <div className="text-[11px] text-slate-500 break-all">
                    {type.baseSpriteUrl}
                  </div>
                  <div className="text-[11px] text-slate-500">ID: {type.id}</div>
                </button>
              );
            })}
            {!petTypes.length && (
              <div className="text-sm text-slate-500">No pet types yet.</div>
            )}
          </div>
        </div>

        <div className="space-y-3 rounded-xl border bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Pet Type Detail</h2>
            {selectedDetail?.petType?.id && (
              <button
                onClick={handleDeletePetType}
                className="text-xs text-red-600 underline"
              >
                Delete type
              </button>
            )}
          </div>
          {loadingDetail && (
            <div className="text-sm text-slate-500">Loading detail...</div>
          )}
          {!loadingDetail && !selectedDetail && (
            <div className="text-sm text-slate-500">
              Select a pet type to view details.
            </div>
          )}
          {selectedDetail && (
            <div className="space-y-3">
              <form className="space-y-2 text-sm" onSubmit={handleUpdatePetType}>
                <div className="grid gap-2">
                  <label className="space-y-1">
                    <span className="text-xs text-slate-600">Name</span>
                    <input
                      className="w-full rounded-md border px-3 py-2"
                      value={editTypeName}
                      onChange={(e) => setEditTypeName(e.target.value)}
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs text-slate-600">Description</span>
                    <input
                      className="w-full rounded-md border px-3 py-2"
                      value={editTypeDesc}
                      onChange={(e) => setEditTypeDesc(e.target.value)}
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs text-slate-600">Base sprite URL</span>
                    <input
                      className="w-full rounded-md border px-3 py-2"
                      value={editTypeSprite}
                      onChange={(e) => setEditTypeSprite(e.target.value)}
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  className="rounded-md bg-indigo-600 px-3 py-2 text-white"
                  disabled={!selectedTypeId}
                >
                  Save changes
                </button>
              </form>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Stages</h3>
                  <span className="text-xs text-slate-500">
                    {selectedDetail.stages.length} total
                  </span>
                </div>
                <div className="space-y-2 max-h-60 overflow-auto pr-1">
                  {selectedDetail.stages.map((stage) => (
                    <div
                      key={stage.id}
                      className="rounded-lg border px-3 py-2 text-sm flex justify-between"
                    >
                      <div>
                        <div className="font-semibold">
                          Stage {stage.stageNumber}: {stage.name}
                        </div>
                        <div className="text-xs text-slate-600">
                          {stage.description || 'No description'}
                        </div>
                        <div className="text-[11px] text-slate-500 break-all">
                          {stage.spriteUrl}
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        ID: {stage.id}
                      </span>
                    </div>
                  ))}
                  {!selectedDetail.stages.length && (
                    <div className="text-sm text-slate-500">
                      No stages yet. Add one below.
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Add stage</h3>
                <form
                  className="grid gap-2 md:grid-cols-2 text-sm"
                  onSubmit={handleCreateStage}
                >
                  <label className="space-y-1">
                    <span className="text-xs text-slate-600">Stage number</span>
                    <input
                      type="number"
                      min={1}
                      className="w-full rounded-md border px-3 py-2"
                      value={stageNumber}
                      onChange={(e) =>
                        setStageNumber(e.target.value ? Number(e.target.value) : '')
                      }
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs text-slate-600">Stage name</span>
                    <input
                      className="w-full rounded-md border px-3 py-2"
                      value={stageName}
                      onChange={(e) => setStageName(e.target.value)}
                      placeholder="Adult Fox"
                    />
                  </label>
                  <label className="space-y-1 md:col-span-2">
                    <span className="text-xs text-slate-600">Sprite URL</span>
                    <input
                      className="w-full rounded-md border px-3 py-2"
                      value={stageSprite}
                      onChange={(e) => setStageSprite(e.target.value)}
                      placeholder="/pets/fox-stage-3.png"
                    />
                  </label>
                  <label className="md:col-span-2 space-y-1">
                    <span className="text-xs text-slate-600">Description (optional)</span>
                    <input
                      className="w-full rounded-md border px-3 py-2"
                      value={stageDesc}
                      onChange={(e) => setStageDesc(e.target.value)}
                      placeholder="Evolves after level 3"
                    />
                  </label>
                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={creatingStage || !selectedTypeId}
                      className="rounded-md bg-slate-900 px-3 py-2 text-white disabled:opacity-60"
                    >
                      {creatingStage ? 'Saving...' : 'Add stage'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 rounded-xl border bg-white p-4">
        <h2 className="text-lg font-semibold">Create Pet Type</h2>
        <form className="space-y-2 text-sm" onSubmit={handleCreatePetType}>
          <input
            className="w-full rounded-md border px-3 py-2"
            placeholder="Name"
            value={typeName}
            onChange={(e) => setTypeName(e.target.value)}
          />
          <input
            className="w-full rounded-md border px-3 py-2"
            placeholder="Description"
            value={typeDesc}
            onChange={(e) => setTypeDesc(e.target.value)}
          />
          <input
            className="w-full rounded-md border px-3 py-2"
            placeholder="Base sprite URL"
            value={typeSprite}
            onChange={(e) => setTypeSprite(e.target.value)}
          />
          <button
            type="submit"
            disabled={creatingType}
            className="rounded-md bg-indigo-600 px-3 py-2 text-white disabled:opacity-60"
          >
            {creatingType ? 'Creating...' : 'Create'}
          </button>
        </form>
      </div>

      <div className="rounded-xl border bg-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Users</h2>
          <span className="text-xs text-slate-500">Set roles</span>
        </div>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-600">
                <th className="px-2 py-1">User</th>
                <th className="px-2 py-1">Role</th>
                <th className="px-2 py-1">Created</th>
                <th className="px-2 py-1">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t">
                  <td className="px-2 py-2">
                    <div className="font-medium">{user.username}</div>
                    <div className="text-xs text-slate-500">
                      {user.displayName || '—'}
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <select
                      value={user.role}
                      onChange={(e) =>
                        handleRoleChange(user.id, e.target.value as Role)
                      }
                      className="rounded-md border px-2 py-1 text-sm"
                      disabled={updatingUserId === user.id}
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="px-2 py-2 text-xs text-slate-600">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-2 py-2 text-xs text-slate-500">
                    {updatingUserId === user.id ? 'Saving...' : '—'}
                  </td>
                </tr>
              ))}
              {!users.length && (
                <tr>
                  <td colSpan={4} className="px-2 py-3 text-slate-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
