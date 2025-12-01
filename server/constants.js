// Frequency constants for habits
export const FREQUENCY = {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly'
}

// Difficulty levels for habits
export const DIFFICULTY = {
    TRIVIAL: 'Trivial',
    EASY: 'Easy',
    MEDIUM: 'Medium',
    HARD: 'Hard'
}

// Mood states for virtual pets
export const PET_MOOD = {
    DEPRESSED: 'Depressed',
    SAD: 'Sad',
    NEUTRAL: 'Neutral',
    HAPPY: 'Happy',
    DELIGHTED: 'Delighted'
}

// Difficulty to exp points mapping
export const XP_MAP = {
    [DIFFICULTY.TRIVIAL]: 5,
    [DIFFICULTY.EASY]: 10,
    [DIFFICULTY.MEDIUM]: 20,
    [DIFFICULTY.HARD]: 40
}

// Mood up mapping (mood to mood)
export const PET_MOOD_UP = {
    [PET_MOOD.DEPRESSED]: PET_MOOD.SAD,
    [PET_MOOD.SAD]: PET_MOOD.NEUTRAL,
    [PET_MOOD.NEUTRAL]: PET_MOOD.HAPPY,
    [PET_MOOD.HAPPY]: PET_MOOD.DELIGHTED,
    [PET_MOOD.DELIGHTED]: PET_MOOD.DELIGHTED // max mood
}

// Mood down mapping (mood to mood)
export const PET_MOOD_DOWN = {
    [PET_MOOD.DELIGHTED]: PET_MOOD.HAPPY,
    [PET_MOOD.HAPPY]: PET_MOOD.NEUTRAL,
    [PET_MOOD.NEUTRAL]: PET_MOOD.SAD,
    [PET_MOOD.SAD]: PET_MOOD.DEPRESSED,
    [PET_MOOD.DEPRESSED]: PET_MOOD.DEPRESSED // min mood
}

// Pet leveling thresholds
export const PET_LEVELS = {
    1: 0,
    2: 100,
    3: 250
}