# HabitBuddy Backend API

Base URL: `/api`

Notes
- All endpoints prefixed by section path (e.g., `/api/auth`, `/api/me`, `/api/habits`).
- Auth: Most endpoints require a valid session cookie `session` set by login. Admin endpoints require `role = admin`.
- Dates: Dates use `YYYY-MM-DD`.
- Errors: On failure, endpoints return `{ "error": string }` with appropriate HTTP status.

## Auth

### POST `/api/auth/signup`
Create a new account using email and password. Creates Supabase Auth user, profile row, and a default pet.

**Request Body**
```json
{
  "email": "alice@example.com",
  "password": "CorrectHorseBatteryStaple",
  "username": "alice",
  "displayName": "Alice Liddell"
}
```

**Response 201**
```json
{
  "user": {
    "id": "f7b9d6e8-421a-49df-a611-9608b4701e77",
    "email": "alice@example.com",
    "username": "alice",
    "displayName": "Alice Liddell",
    "createdAt": "2025-12-01T20:15:00.000Z"
  }
}
```

### POST `/api/auth/login`
Log in with email and password. Sets HttpOnly cookie `session`. Returns minimal user profile.

**Request Body**
```json
{
  "email": "alice@example.com",
  "password": "CorrectHorseBatteryStaple"
}
```

**Response 200**
```json
{
  "user": {
    "id": "f7b9d6e8-421a-49df-a611-9608b4701e77",
    "email": "alice@example.com",
    "username": "alice",
    "displayName": "Alice Liddell",
    "role": "user",
    "createdAt": "2025-12-01T20:15:00.000Z"
  }
}
```

### POST `/api/auth/logout`
Clears the session cookie.

**Response 200**
```json
{ "ok": true }
```

## Me

All endpoints require auth.

### GET `/api/me`
Return the authenticated user's profile and current pet.

**Response 200**
```json
{
  "user": {
    "id": "6a0c9ac4-5f4c-4f1f-9af0-3a3ddfbeb123",
    "username": "brian",
    "displayName": "Brian Badillo",
    "role": "user",
    "createdAt": "2025-11-27T03:10:00.000Z"
  },
  "pet": {
    "id": "e5b5a3b4-9e72-4ab3-9c8e-7dd1e4a9d111",
    "name": "Mocha",
    "level": 3,
    "xp": 260,
    "mood": "happy",
    "petType": { "id": 1, "name": "Cat", "baseSpriteUrl": "/sprites/cat-base.png" },
    "currentStage": { "id": 2, "stageNumber": 2, "name": "Teen Cat", "spriteUrl": "/sprites/cat-teen.png" }
  }
}
```

### PUT `/api/me`
Update `username` and/or `displayName`.

**Request Body**
```json
{ "username": "brianb", "displayName": "Brian B." }
```

**Response 200**
```json
{
  "id": "6a0c9ac4-5f4c-4f1f-9af0-3a3ddfbeb123",
  "username": "brianb",
  "displayName": "Brian B.",
  "role": "user",
  "createdAt": "2025-11-27T03:10:00.000Z"
}
```

### GET `/api/me/summary`
Summary stats for the user: habits, completions, best streak, pet level.

**Response 200**
```json
{
  "totalHabits": 5,
  "activeHabits": 4,
  "totalCompletions": 87,
  "bestStreak": 14,
  "currentLevel": 3
}
```

## Habits

All endpoints require auth.

### GET `/api/habits`
List habits for the authenticated user. Optional query `active=true|false`.

**Example**
```http
GET /api/habits?active=true HTTP/1.1
```

**Response 200**
```json
[
  {
    "id": "7f664e4a-64b6-42bb-bf51-91f44e6c1111",
    "name": "Study",
    "description": "1 hour of CS",
    "frequency": "daily",
    "isActive": true,
    "difficulty": "Medium",
    "createdAt": "2025-11-20T14:00:00.000Z"
  }
]
```

### GET `/api/habits/:habitId`
Get a single habit plus its streak.

**Response 200**
```json
{
  "habit": {
    "id": "7f664e4a-64b6-42bb-bf51-91f44e6c1111",
    "name": "Study",
    "description": "1 hour of CS",
    "frequency": "daily",
    "isActive": true,
    "difficulty": "Medium",
    "createdAt": "2025-11-20T14:00:00.000Z"
  },
  "streak": {
    "habitId": "7f664e4a-64b6-42bb-bf51-91f44e6c1111",
    "currentStreak": 5,
    "longestStreak": 12,
    "lastCompletedDate": "2025-11-26"
  }
}
```

### POST `/api/habits`
Create a new habit.

**Request Body**
```json
{
  "name": "Drink Water",
  "description": "8 cups a day",
  "frequency": "daily",
  "difficulty": "Easy"
}
```

**Response 201**
```json
{
  "id": "a2b0f7b0-5c49-4d9c-8741-1d2c744e3333",
  "name": "Drink Water",
  "description": "8 cups a day",
  "frequency": "daily",
  "isActive": true,
  "difficulty": "Easy",
  "createdAt": "2025-11-27T04:05:00.000Z"
}
```

### PUT `/api/habits/:habitId`
Update an existing habit. Any subset of fields allowed.

**Request Body**
```json
{
  "name": "Drink Water",
  "description": "8 cups per day",
  "frequency": "daily",
  "isActive": true,
  "difficulty": "Trivial"
}
```

**Response 200**
```json
{
  "id": "a2b0f7b0-5c49-4d9c-8741-1d2c744e3333",
  "name": "Drink Water",
  "description": "8 cups per day",
  "frequency": "daily",
  "isActive": true,
  "difficulty": "Trivial",
  "createdAt": "2025-11-27T04:05:00.000Z"
}
```

### DELETE `/api/habits/:habitId`
Delete a habit. Cascades related data.

**Response 200**
```json
{ "ok": true }
```

### POST `/api/habits/:habitId/check-in`
Mark a habit completed for `completedDate`. Updates streak and pet XP/mood; sets habit inactive.

**Request Body**
```json
{ "completedDate": "2025-11-27" }
```

**Response 200**
```json
{
  "habit": { "id": "7f...", "name": "Study", "frequency": "daily", "isActive": false, "difficulty": "Hard" },
  "streak": { "habitId": "7f...", "currentStreak": 6, "longestStreak": 12, "lastCompletedDate": "2025-11-27" },
  "pet": { "id": "e5...", "name": "Mocha", "level": 3, "xp": 280, "mood": "happy" }
}
```

### GET `/api/habits/:habitId/history`
Completion history for a habit within a date range.

**Example**
```http
GET /api/habits/7f.../history?from=2025-11-20&to=2025-11-27 HTTP/1.1
```

**Response 200**
```json
[
  { "completionId": 15, "completedDate": "2025-11-22" },
  { "completionId": 16, "completedDate": "2025-11-23" }
]
```

### GET `/api/habits/:habitId/streak`
Get the current streak for a habit.

**Response 200**
```json
{ "habitId": "7f...", "currentStreak": 6, "longestStreak": 12, "lastCompletedDate": "2025-11-27" }
```

### GET `/api/habits/me/streaks`
List all streaks for the authenticated user.

**Response 200**
```json
[
  { "habitId": "7f...", "currentStreak": 6, "longestStreak": 12, "lastCompletedDate": "2025-11-27" }
]
```

## Friends

All endpoints require auth.

### GET `/api/friends`
List friendships (pending and accepted) with friend profile appended.

**Response 200**
```json
[
  {
    "id": 10,
    "requesterId": "6a0c9ac4-...",
    "addresseeId": "7777...",
    "status": "accepted",
    "createdAt": "2025-11-25T18:00:00.000Z",
    "friend": { "id": "7777...", "username": "liam", "displayName": "Liam Messinger" }
  }
]
```

### POST `/api/friends/:friendId`
Send a friend request to `friendId`. If friendship exists/pending, returns 400.

**Response 201**
```json
{ "id": 11, "requesterId": "6a0c9ac4-...", "addresseeId": "7777...", "status": "pending", "createdAt": "2025-11-27T04:30:00.000Z" }
```

### PATCH `/api/friends/:friendId`
Accept, reject, or remove a friend relationship.

**Request Body**
```json
{ "status": "accepted" }
```

**Response 200 (accepted)**
```json
{ "id": 11, "requesterId": "6a0c9ac4-...", "addresseeId": "7777...", "status": "accepted", "createdAt": "2025-11-27T04:30:00.000Z" }
```

**Response 204 (rejected/removed)**
No content.

### GET `/api/friends/:friendId/pet`
View a friend’s pet if friendship is accepted.

**Response 200**
```json
{
  "friend": { "id": "7777...", "username": "liam", "displayName": "Liam Messinger" },
  "pet": { "id": "9999...", "name": "Neko", "level": 4, "xp": 420, "mood": "happy" }
}
```

### GET `/api/friends/:friendId/summary`
Friend’s summary stats; requires accepted friendship.

**Response 200**
```json
{
  "friend": { "id": "7777...", "username": "liam", "displayName": "Liam Messinger" },
  "pet": { "id": "9999...", "name": "Neko", "level": 4, "xp": 420, "mood": "happy" },
  "totalHabits": 6,
  "bestStreak": 21
}
```

## Leaderboard

All endpoints require auth.

### GET `/api/leaderboard/xp`
Leaderboard of friends (plus self) ordered by pet XP.

**Response 200**
```json
[
  { "rank": 1, "user": { "id": "7777...", "username": "liam" }, "pet": { "name": "Neko", "level": 4, "xp": 420 } },
  { "rank": 2, "user": { "id": "6a0c9ac4-...", "username": "brian" }, "pet": { "name": "Professor Mocha", "level": 3, "xp": 280 } }
]
```

### GET `/api/leaderboard/streaks`
Leaderboard of friends (plus self) ordered by longest streak.

**Response 200**
```json
[
  { "rank": 1, "user": { "id": "aaaa...", "username": "amelia" }, "longest_streak": 30 },
  { "rank": 2, "user": { "id": "7777...", "username": "liam" }, "longest_streak": 21 }
]
```

## Pet

All endpoints require auth.

### GET `/api/pet`
Get full pet state for the logged-in user.

**Response 200**
```json
{
  "id": "e5...",
  "name": "Mocha",
  "xp": 280,
  "level": 3,
  "mood": "happy",
  "petType": { "id": 1, "name": "Cat", "baseSpriteUrl": "/sprites/cat-base.png" },
  "currentStage": { "id": 2, "stageNumber": 2, "name": "Teen Cat", "spriteUrl": "/sprites/cat-teen.png" },
  "lastInteractionDate": "2025-11-27"
}
```

### PATCH `/api/pet`
Update pet properties.

**Request Body**
```json
{ "name": "Professor Mocha" }
```

**Response 200**
```json
{ "id": "e5...", "name": "Professor Mocha", "xp": 280, "level": 3, "mood": "happy", "petType": { "id": 1, "name": "Cat", "baseSpriteUrl": "/sprites/cat-base.png" }, "currentStage": { "id": 2, "stageNumber": 2, "name": "Teen Cat", "spriteUrl": "/sprites/cat-teen.png" }, "lastInteractionDate": "2025-11-27" }
```

### POST `/api/pet/ping`
Record a non-habit interaction; refreshes mood and last interaction date.

**Request Body**
```json
{ "interactionType": "pet" }
```

**Response 200**
```json
{ "id": "e5...", "name": "Professor Mocha", "xp": 280, "level": 3, "mood": "happy", "petType": { "id": 1, "name": "Cat", "baseSpriteUrl": "/sprites/cat-base.png" }, "currentStage": { "id": 2, "stageNumber": 2, "name": "Teen Cat", "spriteUrl": "/sprites/cat-teen.png" }, "lastInteractionDate": "2025-11-27" }
```

## Quote

All endpoints require auth.

### GET `/api/quote`
Fetch a motivational quote from ZenQuotes. Returns a fallback if external API fails.

**Response 200**
```json
{ "text": "The secret of getting ahead is getting started.", "author": "Mark Twain" }
```

## Admin

Admin-only endpoints (require `role=admin`).

### GET `/api/admin`
Simple access check.

**Response 200**
```json
{ "ok": true }
```

### GET `/api/admin/pet-types`
List all pet types.

**Response 200**
```json
[
  { "id": 1, "name": "Cat", "description": "Curious and lazy", "base_sprite_url": "/sprites/cat-base.png" }
]
```

### POST `/api/admin/pet-types`
Create a new pet type.

**Request Body**
```json
{ "name": "Dog", "description": "Loyal and energetic", "baseSpriteUrl": "https://i.imgur.com/UGueBBX.png" }
```

**Response 201**
```json
{ "id": 3, "name": "Dog", "description": "Loyal and energetic", "baseSpriteUrl": "https://i.imgur.com/UGueBBX.png", "createdAt": "2025-11-27T05:00:00.000Z" }
```

### GET `/api/admin/pet-types/:petTypeId`
Get details of a pet type and its stages.

**Response 200**
```json
{
  "petType": { "id": 1, "name": "Cat", "description": "Curious and lazy", "baseSpriteUrl": "/sprites/cat-base.png" },
  "stages": [ { "id": 1, "stageNumber": 1, "name": "Kitten", "spriteUrl": "/sprites/cat-baby.png" } ]
}
```

### PUT `/api/admin/pet-types/:petTypeId`
Update a pet type.

**Request Body**
```json
{ "name": "Cat", "description": "Curious but chill", "baseSpriteUrl": "/sprites/cat-base-v2.png" }
```

**Response 200**
```json
{ "id": 1, "name": "Cat", "description": "Curious but chill", "baseSpriteUrl": "/sprites/cat-base-v2.png" }
```

### DELETE `/api/admin/pet-types/:petTypeId`
Delete a pet type.

**Response 204**
No content.

### GET `/api/admin/pet-types/:petTypeId/stages`
List all stages for a pet type.

**Response 200**
```json
[
  { "id": 1, "petTypeId": 1, "stageNumber": 1, "name": "Kitten", "spriteUrl": "/sprites/cat-baby.png" }
]
```

### POST `/api/admin/pet-types/:petTypeId/stages`
Create a new evolution stage.

**Request Body**
```json
{ "stageNumber": 3, "name": "Adult Cat", "spriteUrl": "/sprites/cat-adult.png", "description": "Wise and sleepy" }
```

**Response 201**
```json
{ "id": 3, "petTypeId": 1, "stageNumber": 3, "name": "Adult Cat", "spriteUrl": "/sprites/cat-adult.png", "description": "Wise and sleepy" }
```

### GET `/api/admin/evolution-stages/:stageId`
Get details for a specific evolution stage.

**Response 200**
```json
{ "id": 3, "petTypeId": 1, "stageNumber": 3, "name": "Adult Cat", "spriteUrl": "/sprites/cat-adult.png", "description": "Wise and sleepy" }
```

### PUT `/api/admin/evolution-stages/:stageId`
Update an evolution stage.

**Request Body**
```json
{ "stageNumber": 3, "name": "Adult Cat", "spriteUrl": "/sprites/cat-adult-v2.png", "description": "Evolved at level 5 now" }
```

**Response 200**
```json
{ "id": 3, "petTypeId": 1, "stageNumber": 3, "name": "Adult Cat", "spriteUrl": "/sprites/cat-adult-v2.png", "description": "Evolved at level 5 now" }
```

### DELETE `/api/admin/evolution-stages/:stageId`
Delete an evolution stage.

**Response 204**
No content.

### GET `/api/admin/users`
List all users.

**Response 200**
```json
[
  { "id": "6a0c9ac4-...", "username": "brian", "displayName": "Brian Badillo", "role": "user", "createdAt": "2025-11-27T03:10:00.000Z" }
]
```

### GET `/api/admin/users/:userId`
Get user details, habits, and pet.

**Response 200**
```json
{
  "user": { "id": "6a0c9ac4-...", "username": "brian", "displayName": "Brian Badillo", "role": "user" },
  "habits": [ { "id": "7f...", "name": "Study", "frequency": "daily" } ],
  "pet": { "id": "e5...", "name": "Professor Mocha", "level": 3, "xp": 280, "mood": "happy" }
}
```

### PATCH `/api/admin/users/:userId/role`
Update a user's role.

**Request Body**
```json
{ "role": "admin" }
```

**Response 200**
```json
{ "id": "6a0c9ac4-...", "username": "brian", "displayName": "Brian Badillo", "role": "admin" }
```

### GET `/api/admin/metrics/overview`
App-wide metrics overview.

**Response 200**
```json
{ "totalUsers": 42, "totalHabits": 180, "totalCompletions": 1260, "activeUsers": 29 }
```
