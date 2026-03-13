/**
 * Progression Service for Transform RPG
 * Handles XP distribution and Leveling logic
 */

export const XP_VALUES = {
  // Diet
  DIET_LOG_MEAL: 10,       // Per meal logged
  DIET_FULL_DAY: 20,       // Bonus for logging all meals
  DIET_HEALTHY_BONUS: 15,  // Bonus for no junk food in a meal
  DIET_JUNK_PENALTY: -20,  // Penalty for junk food
  
  // Fitness
  WORKOUT_COMPLETE: 100,
  STEPS_GOAL_MET: 50,
  EXERCISE_LOG: 20,
  
  // Mindset & English
  ENGLISH_SESSION: 50,
  GOAL_CHECK_IN: 20,
  QUEST_COMPLETE: 200,
};

/**
 * Calculates the streak multiplier
 * Starts at 1.0, increases by 0.05 per day, caps at 2.0 (20 days)
 */
export const calculateStreakMultiplier = (streak: number): number => {
  const multiplier = 1 + (Math.min(streak, 20) * 0.05);
  return Number(multiplier.toFixed(2));
};

/**
 * Calculates the level based on total XP
 * Formula: XP = 50L^2 + 350L - 400
 * Inverse: L = (-350 + sqrt(350^2 - 4 * 50 * (-400 - XP))) / (2 * 50)
 * Simplified: L = (-350 + sqrt(122500 + 200 * (400 + XP))) / 100
 */
export const calculateLevel = (xp: number): number => {
  if (xp <= 0) return 1;
  const level = Math.floor((-350 + Math.sqrt(122500 + 200 * (400 + xp))) / 100);
  return Math.max(1, level);
};

/**
 * Calculates XP required for a specific level
 */
export const xpForLevel = (level: number): number => {
  if (level <= 1) return 0;
  return 50 * Math.pow(level, 2) + 350 * level - 400;
};

/**
 * Returns progress percentage towards next level
 */
export const getLevelProgress = (xp: number) => {
  const currentLevel = calculateLevel(xp);
  const currentLevelXP = xpForLevel(currentLevel);
  const nextLevelXP = xpForLevel(currentLevel + 1);
  
  const progress = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
  return Math.min(100, Math.max(0, progress));
};

/**
 * Handles XP gain and checks for level up
 */
export const addXP = (currentXP: number, amount: number, streak: number = 0) => {
  const multiplier = calculateStreakMultiplier(streak);
  const multipliedAmount = Math.round(amount * multiplier);
  const newXP = Math.max(0, currentXP + multipliedAmount);
  
  const oldLevel = calculateLevel(currentXP);
  const newLevel = calculateLevel(newXP);
  
  return {
    newXP,
    newLevel,
    leveledUp: newLevel > oldLevel,
    gained: multipliedAmount
  };
};
