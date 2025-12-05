// src/app/friends/FriendsClient.tsx
'use client';

import { useState, FormEvent } from 'react';
import { FriendEntry, FriendSummary } from '@/types/api';
import { api } from '@/lib/apiClient';

interface Props {
  initialFriends: FriendEntry[];
  currentUserId: string;
}

export function FriendsClient({ initialFriends, currentUserId }: Props) {
  const [friends, setFriends] = useState<FriendEntry[]>(initialFriends);
  const [friendIdInput, setFriendIdInput] = useState('');
  const [loadingSend, setLoadingSend] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSummary, setSelectedSummary] = useState<FriendSummary | null>(
    null,
  );
  const [summaryLoadingId, setSummaryLoadingId] = useState<string | null>(null);

  async function handleSendRequest(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMsg(null);

    const friendId = friendIdInput.trim();
    if (!friendId) {
      setError('Friend ID is required.');
      return;
    }

    try {
      setLoadingSend(true);
      const entry = await api.sendFriendRequest(friendId);
      setFriends((prev) => [...prev, entry]);
      setFriendIdInput('');
      setMsg('Friend request sent.');
    } catch (err: any) {
      const message =
        err?.message?.includes('Friendship already exists') ||
        err?.message?.includes('400')
          ? 'Friendship already exists or is pending.'
          : err.message ?? 'Failed to send friend request.';
      setError(message);
    } finally {
      setLoadingSend(false);
    }
  }

  async function handleAccept(friendId: string) {
    setError(null);
    setMsg(null);

    try {
      await api.updateFriendStatus(friendId, 'accepted');
      setFriends((prev) =>
        prev.map((f) =>
          f.friend.id === friendId ? { ...f, status: 'accepted' } : f,
        ),
      );
      setMsg('Friend request accepted.');
    } catch (err: any) {
      setError(err.message ?? 'Failed to accept friend request.');
    }
  }

  async function handleReject(friendId: string) {
    setError(null);
    setMsg(null);

    const ok = window.confirm('Reject this friend request?');
    if (!ok) return;

    try {
      await api.updateFriendStatus(friendId, 'rejected');
      setFriends((prev) => prev.filter((f) => f.friend.id !== friendId));
      setMsg('Friend request rejected.');
    } catch (err: any) {
      setError(err.message ?? 'Failed to reject friend request.');
    }
  }

  async function handleRemove(friendId: string) {
    setError(null);
    setMsg(null);

    const ok = window.confirm('Remove this friend?');
    if (!ok) return;

    try {
      await api.updateFriendStatus(friendId, 'removed');
      setFriends((prev) => prev.filter((f) => f.friend.id !== friendId));
      setMsg('Friend removed.');
    } catch (err: any) {
      setError(err.message ?? 'Failed to remove friend.');
    }
  }

  async function handleToggleSummary(friendId: string) {
    setError(null);
    setMsg(null);

    // If this friend's summary is already open, close it
    if (selectedSummary && selectedSummary.friend.id === friendId) {
      setSelectedSummary(null);
      return;
    }

    setSelectedSummary(null);
    setSummaryLoadingId(friendId);

    try {
      const data = await api.getFriendSummary(friendId);
      setSelectedSummary(data);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load friend summary.');
    } finally {
      setSummaryLoadingId(null);
    }
  }

  const accepted = friends.filter((f) => f.status === 'accepted');
  const pending = friends.filter((f) => f.status === 'pending');
  const blocked = friends.filter((f) => f.status === 'blocked');

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleSendRequest}
        className="rounded-xl border bg-white text-slate-900 p-4 space-y-2"
      >
        <h2 className="font-semibold text-sm">Add a friend</h2>
        <p className="text-xs text-slate-600">
          Enter your friend&apos;s ID to send a request.
        </p>
        <div className="flex gap-2 text-sm">
          <input
            className="border rounded-md px-2 py-1 flex-1"
            placeholder="Friend ID"
            value={friendIdInput}
            onChange={(e) => setFriendIdInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={loadingSend}
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 text-white text-xs px-3 py-1.5 disabled:opacity-50"
          >
            {loadingSend ? 'Sending...' : 'Send request'}
          </button>
        </div>
      </form>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Pending</h2>
        {pending.length === 0 ? (
          <p className="text-xs text-slate-500">No pending requests.</p>
        ) : (
          <ul className="space-y-2">
            {pending.map((f) => {
              const isIncoming = f.addresseeId === currentUserId;
              const isOutgoing = f.requesterId === currentUserId;

              return (
                <li
                  key={f.id}
                  className="rounded-lg border bg-white text-slate-900 px-3 py-2 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium">
                      {f.friend.displayName || f.friend.username}
                    </div>
                    <div className="text-xs text-slate-500">
                      @{f.friend.username}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {isIncoming
                        ? 'Incoming request'
                        : isOutgoing
                        ? 'Outgoing request'
                        : 'Pending'}
                    </div>
                  </div>

                  <div className="flex gap-2 text-xs">
                    {isIncoming && (
                      <>
                        <button
                          className="px-2 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                          onClick={() => handleAccept(f.friend.id)}
                        >
                          Accept
                        </button>
                        <button
                          className="px-2 py-1 rounded-md bg-red-500 text-white hover:bg-red-600"
                          onClick={() => handleReject(f.friend.id)}
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {isOutgoing && (
                      <button
                        className="px-2 py-1 rounded-md bg-red-50 text-red-700 hover:bg-red-100"
                        onClick={() => handleRemove(f.friend.id)}
                      >
                        Cancel request
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Friends</h2>
        {accepted.length === 0 ? (
          <p className="text-xs text-slate-500">No accepted friends yet.</p>
        ) : (
          <ul className="space-y-2">
            {accepted.map((f) => {
              const isSelected =
                selectedSummary?.friend.id === f.friend.id;

              return (
                <li
                  key={f.id}
                  className="rounded-lg border bg-white text-slate-900 px-3 py-2 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium">
                      {f.friend.username}
                    </div>
                    <div className="text-xs text-slate-500">
                      @{f.friend.username}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 capitalize">
                      Status: {f.status}
                    </div>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <button
                      className="px-2 py-1 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50"
                      onClick={() => handleToggleSummary(f.friend.id)}
                      disabled={summaryLoadingId === f.friend.id}
                    >
                      {summaryLoadingId === f.friend.id
                        ? 'Loading...'
                        : isSelected
                        ? 'Hide summary'
                        : 'View summary'}
                    </button>
                    <button
                      className="px-2 py-1 rounded-md bg-red-500 text-white hover:bg-red-600"
                      onClick={() => handleRemove(f.friend.id)}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {blocked.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Blocked</h2>
          <ul className="space-y-2">
            {blocked.map((f) => (
              <li
                key={f.id}
                className="rounded-lg border bg-slate-50 text-slate-500 px-3 py-2 flex items-center justify-between"
              >
                <div>
                  <div className="font-medium">
                    {f.friend.username}
                  </div>
                  <div className="text-xs text-slate-400">
                    @{f.friend.username}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Status: blocked
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {selectedSummary && (
        <div className="rounded-xl border bg-white text-slate-900 p-4 text-sm">
          <div className="font-semibold mb-1">
            {selectedSummary.friend.displayName ||
              selectedSummary.friend.username}
          </div>
          <div className="text-xs text-slate-500 mb-2">
            @{selectedSummary.friend.username}
          </div>
          {selectedSummary.pet && (
            <div className="mb-2">
              <div className="font-semibold text-xs mb-1">Pet</div>
              <div className="text-xs text-slate-600">
                {selectedSummary.pet.name} · Level {selectedSummary.pet.level} ·
                XP {selectedSummary.pet.xp} · Mood {selectedSummary.pet.mood}
              </div>
            </div>
          )}
          <div className="text-xs text-slate-600">
            Total habits: {selectedSummary.totalHabits} · Best streak:{' '}
            {selectedSummary.bestStreak} days
          </div>
        </div>
      )}

      {msg && <p className="text-xs text-emerald-600">{msg}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
