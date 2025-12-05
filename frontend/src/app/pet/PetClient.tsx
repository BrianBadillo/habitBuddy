// src/app/pet/PetClient.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Pet } from '@/types/api';
import { api } from '@/lib/apiClient';

const spriteFallbacks: Record<string, Record<number, string>> = {
  Fox: {
    1: '/pets/fox-stage-1.png',
    2: '/pets/fox-stage-2.png',
    3: '/pets/fox-stage-3.png',
  },
};

interface Props {
  initialPet: Pet | null;
}

export function PetClient({ initialPet }: Props) {
  const [pet, setPet] = useState<Pet | null>(initialPet);
  const [rename, setRename] = useState<string>('');   // 🔹 new name field
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function getPetSprite(current: Pet | null) {
    if (!current) return undefined;
    const stageNumber = current.currentStage?.stageNumber;
    const typeName = current.petType?.name;
    if (stageNumber && typeName && spriteFallbacks[typeName]?.[stageNumber]) {
      return (
        current.currentStage?.spriteUrl ??
        spriteFallbacks[typeName][stageNumber]
      );
    }
    if (typeName && spriteFallbacks[typeName]?.[1]) {
      return current.petType?.baseSpriteUrl ?? spriteFallbacks[typeName][1];
    }
    return current.currentStage?.spriteUrl || current.petType?.baseSpriteUrl;
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
            <div className="w-24 h-24 rounded-xl bg-slate-200 flex items-center justify-center overflow-hidden">
              {getPetSprite(pet) && (
                <img
                  src={getPetSprite(pet)}
                  alt={pet.petType?.name ?? 'Your pet'}
                  className="w-full h-full object-contain"
                />
              )}
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

          <div className="rounded-xl border p-4 bg-white space-y-2 text-sm">
            <h2 className="font-semibold text-sm">Want a different pet type?</h2>
            <p className="text-slate-600">
              Adopt a new pet to switch companions. Your pet will restart at level 1 with the new type.
            </p>
            <Link
              href="/pet/adopt"
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 text-white text-xs px-3 py-1.5"
            >
              Adopt a new pet
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border p-4 bg-white space-y-3">
          <h2 className="font-semibold text-sm">Adopt your first pet</h2>
          <p className="text-sm text-slate-600">
            Choose a companion to adventure with you. Head to the adoption
            page to pick your buddy and give them a name.
          </p>
          <Link
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 text-white text-sm px-3 py-1.5"
            href="/pet/adopt"
          >
            Go to adoption page
          </Link>
        </div>
      )}

      {msg && <p className="text-xs text-emerald-600">{msg}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
