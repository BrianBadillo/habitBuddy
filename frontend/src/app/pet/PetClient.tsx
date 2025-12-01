// src/app/pet/PetClient.tsx
'use client';

import { useState } from 'react';
import { Pet } from '@/types/api';
import { api } from '@/lib/apiClient';

interface Props {
  initialPet: Pet | null;
}

export function PetClient({ initialPet }: Props) {
  const [pet, setPet] = useState<Pet | null>(initialPet);
  const [petTypeId, setPetTypeId] = useState<number>(1);
  const [name, setName] = useState<string>('');
  const [rename, setRename] = useState<string>('');   // 🔹 new name field
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreatePet(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMsg(null);

    if (!name.trim()) {
      setError('Pet name is required.');
      return;
    }

    try {
      setLoading(true);
      const created = await api.createPet({
        petTypeId,
        name: name.trim(),
      });
      setPet(created);
      setMsg('Pet adopted!');
      setName('');
    } catch (err: any) {
      setError(err.message ?? 'Failed to create pet.');
    } finally {
      setLoading(false);
    }
  }

  async function handlePing() {
    if (!pet) return;
    setError(null);
    setMsg(null);
    try {
      setLoading(true);
      const updated = await api.pingPet('pet');
      setPet(updated);
      setMsg('Your pet is happy you visited!');
    } catch (err: any) {
      setError(err.message ?? 'Failed to interact with pet.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    if (!pet) return;

    setError(null);
    setMsg(null);

    const newName = rename.trim();
    if (!newName) {
      setError('New pet name is required.');
      return;
    }

    const ok = window.confirm(`Change your pet's name to "${newName}"?`);
    if (!ok) return;

    try {
      setLoading(true);
      const updated = await api.updatePet({ name: newName });
      setPet(updated);
      setRename('');
      setMsg('Pet name updated!');
    } catch (err: any) {
      setError(err.message ?? 'Failed to rename pet.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">My Pet</h1>

      {pet ? (
        <div className="space-y-4">
          <div className="rounded-xl border p-4 bg-white flex gap-4">
            <div className="w-24 h-24 rounded-xl bg-slate-200 flex items-center justify-center text-4xl">
              🐾
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-semibold text-lg">{pet.name}</h2>
                  <p className="text-sm text-slate-600">
                    Type: {pet.petType?.name ?? 'Unknown'}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    Level {pet.level} · XP {pet.xp}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 capitalize">
                    Mood: {pet.mood}
                  </p>
                </div>
                {pet.currentStage && (
                  <span className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-700">
                    {pet.currentStage.name}
                  </span>
                )}
              </div>

              {pet.lastInteractionDate && (
                <p className="text-xs text-slate-500 mt-2">
                  Last interaction: {pet.lastInteractionDate}
                </p>
              )}

              <button
                className="mt-3 inline-flex items-center justify-center rounded-md bg-indigo-600 text-white text-sm px-3 py-1.5 disabled:opacity-60"
                disabled={loading}
                onClick={handlePing}
              >
                {loading ? 'Interacting...' : 'Pet your buddy'}
              </button>
            </div>
          </div>

          {/* Rename form */}
          <form
            onSubmit={handleRename}
            className="rounded-xl border p-4 bg-white space-y-2 text-sm"
          >
            <h2 className="font-semibold text-sm">Rename your pet</h2>
            <div className="flex flex-wrap gap-2 items-center">
              <input
                className="border rounded-md px-2 py-1 text-sm"
                placeholder="New name"
                value={rename}
                onChange={(e) => setRename(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-md bg-slate-800 text-white text-xs px-3 py-1.5 disabled:opacity-60"
              >
                {loading ? 'Renaming...' : 'Change name'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <form
          onSubmit={handleCreatePet}
          className="rounded-xl border p-4 bg-white space-y-3"
        >
          <h2 className="font-semibold text-sm">Adopt your first pet</h2>

          <label className="flex flex-col gap-1 text-sm">
            <span>Pet name</span>
            <input
              className="border rounded-md px-2 py-1 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mocha"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span>Pet type ID (temp)</span>
            <input
              type="number"
              min={1}
              className="border rounded-md px-2 py-1 text-sm w-24"
              value={petTypeId}
              onChange={(e) =>
                setPetTypeId(parseInt(e.target.value || '1', 10))
              }
            />
            <span className="text-xs text-slate-500">
              Later this can be a dropdown of pet types.
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 text-white text-sm px-3 py-1.5 disabled:opacity-60"
          >
            {loading ? 'Adopting...' : 'Adopt pet'}
          </button>
        </form>
      )}

      {msg && <p className="text-xs text-emerald-600">{msg}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
