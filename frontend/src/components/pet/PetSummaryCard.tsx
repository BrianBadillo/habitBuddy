// src/components/pet/PetSummaryCard.tsx

import Link from 'next/link';
import { Pet } from '@/types/api';

const spriteFallbacks: Record<string, Record<number, string>> = {
  Fox: {
    1: '/pets/fox-stage-1.png',
    2: '/pets/fox-stage-2.png',
    3: '/pets/fox-stage-3.png',
  },
};

function getPetSprite(pet: Pet | null | undefined) {
  if (!pet) return undefined;
  const stageNumber = pet.currentStage?.stageNumber;
  const typeName = pet.petType?.name;
  if (stageNumber && typeName && spriteFallbacks[typeName]?.[stageNumber]) {
    return pet.currentStage?.spriteUrl ?? spriteFallbacks[typeName][stageNumber];
  }
  if (typeName && spriteFallbacks[typeName]?.[1]) {
    return pet.petType?.baseSpriteUrl ?? spriteFallbacks[typeName][1];
  }
  return pet.currentStage?.spriteUrl || pet.petType?.baseSpriteUrl;
}

interface Props {
  pet?: Pet | null;
}

export function PetSummaryCard({ pet }: Props) {
  if (!pet) {
    return (
      <div className="rounded-xl border p-4 bg-white text-slate-900">
        <h2 className="font-semibold mb-1">Your Pet</h2>
        <p className="text-sm text-slate-600">
          You don&apos;t have a pet yet. Pick a buddy to start leveling up.
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

  return (
    <div className="rounded-xl border p-4 bg-white text-slate-900 flex gap-4">
      {/* Placeholder avatar */}
      <div className="w-20 h-20 rounded-xl bg-slate-200 flex items-center justify-center text-3xl">
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
