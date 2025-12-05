// src/components/pet/PetSummaryCard.tsx

import Link from 'next/link';
import { Pet } from '@/types/api';

interface Props {
  pet?: Pet | null;
}

export function PetSummaryCard({ pet }: Props) {
  // If user has no pet yet, show CTA card
  if (!pet) {
    return (
      <div className="rounded-xl border p-4 bg-white text-slate-900">
        <h2 className="font-semibold mb-1">Your Pet</h2>
        <p className="text-sm text-slate-600">
          You don't have a pet yet. Pick a buddy to start leveling up.
        </p>
        <Link
          href="/pet/adopt"
          className="mt-3 inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white"
        >
          Adopt a pet
        </Link>
      </div>
    );
  }

  const spriteSrc = pet.currentStage?.spriteUrl; // 🔹 no fallback, just the image if present

  return (
    <div className="rounded-xl border p-4 bg-white text-slate-900 flex gap-4">
      <div className="w-28 h-28 md:w-32 md:h-32 rounded-xl bg-slate-200 flex items-center justify-center text-3xl overflow-hidden">
        {spriteSrc && (
          <img
            src={spriteSrc}
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
              Level {pet.level} · XP {pet.xp}
            </p>
            <p className="text-xs mt-1 text-slate-500 capitalize">
              Mood: {pet.mood}
            </p>
          </div>
          {pet.currentStage && (
            <span className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-700">
              {pet.currentStage.name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
