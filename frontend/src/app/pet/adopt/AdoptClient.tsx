// src/app/pet/adopt/AdoptClient.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/apiClient';
import { Pet, PetType } from '@/types/api';

const spriteFallbacks: Record<string, string> = {
  Fox: '/pets/fox-stage-1.png',
};

interface Props {
  petTypes: PetType[];
  existingPet?: Pet | null;
}

export function AdoptClient({ petTypes, existingPet }: Props) {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<number | null>(
    petTypes[0]?.id ?? null
  );
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedPet = petTypes.find((pet) => pet.id === selectedType);

  async function handleAdopt(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMsg(null);

    if (!selectedType) {
      setError('Pick a pet to adopt.');
      return;
    }
    if (!name.trim()) {
      setError('Give your buddy a name.');
      return;
    }

    const replacing = Boolean(existingPet);
    if (replacing) {
      const confirmed = window.confirm(
        'Adopting a new pet will replace your current pet and reset its progress to level 1. Continue?'
      );
      if (!confirmed) return;
    }

    try {
      setLoading(true);
      await api.createPet({
        petTypeId: selectedType,
        name: name.trim(),
        replaceExisting: replacing,
      });
      setMsg('Pet adopted! Taking you to your new buddy...');
      setTimeout(() => {
        router.replace('/pet');
      }, 400);
    } catch (err: any) {
      setError(err.message ?? 'Failed to adopt pet.');
    } finally {
      setLoading(false);
    }
  }

  if (!petTypes.length) {
    return (
      <div className="rounded-xl border bg-white p-4 text-sm text-slate-700">
        No pet types are available yet. Try again later.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {existingPet && (
        <div className="rounded-xl border bg-amber-50 p-4 text-sm text-amber-800">
          <div className="font-semibold">You already have {existingPet.name}</div>
          <p>
            Adopting a new pet will replace your current companion and reset level/xp.
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {petTypes.map((pet) => {
          const active = pet.id === selectedType;
          return (
            <button
              key={pet.id}
              type="button"
              onClick={() => setSelectedType(pet.id)}
              className={`rounded-xl border bg-white p-4 text-left transition shadow-sm hover:shadow ${
                active ? 'border-indigo-500 ring-2 ring-indigo-200' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                  {pet.baseSpriteUrl || spriteFallbacks[pet.name] ? (
                    <img
                      src={pet.baseSpriteUrl || spriteFallbacks[pet.name]}
                      alt={pet.name}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="text-xl">🐾</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{pet.name}</h3>
                    {active && (
                      <span className="rounded-full bg-indigo-50 px-2 py-1 text-xs text-indigo-700">
                        Selected
                      </span>
                    )}
                  </div>
                  {pet.description && (
                    <p className="text-sm text-slate-600">{pet.description}</p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <form
        onSubmit={handleAdopt}
        className="space-y-3 rounded-xl border bg-white p-4"
      >
        <div className="text-sm">
          <div className="font-semibold">
            Name your {selectedPet?.name?.toLowerCase() ?? 'pet'}
          </div>
          <p className="text-slate-600">
            This is how your buddy will show up across HabitBuddy.
          </p>
        </div>
        <input
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="Mocha"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? 'Adopting...' : 'Adopt this pet'}
        </button>
        {msg && <p className="text-xs text-emerald-600">{msg}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </form>
    </div>
  );
}
