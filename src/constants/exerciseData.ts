export interface Exercise {
  name: string;
  sets: string;
  reps: string;
  description: string;
  intensity: 'Low' | 'Medium' | 'High';
}

export interface WorkoutPlan {
  goal: string;
  title: string;
  description: string;
  exercises: Exercise[];
}

export const WORKOUT_PLANS: Record<string, WorkoutPlan> = {
  weight_loss: {
    goal: "Weight Loss",
    title: "Fat Burner Blitz",
    description: "High intensity, high heart rate to torch those extra calories. Focus on movement and minimal rest.",
    exercises: [
      { name: "Jumping Jacks", sets: "3", reps: "50", description: "Classic cardio to get the heart pumping.", intensity: "Medium" },
      { name: "Burpees", sets: "4", reps: "12-15", description: "Full body explosive movement.", intensity: "High" },
      { name: "Mountain Climbers", sets: "3", reps: "40 (20 per leg)", description: "Core and cardio combined.", intensity: "High" },
      { name: "Bodyweight Squats", sets: "4", reps: "20", description: "Build lower body endurance.", intensity: "Medium" },
      { name: "Plank", sets: "3", reps: "45-60 sec", description: "Solid core stability.", intensity: "Medium" },
      { name: "High Knees", sets: "3", reps: "60 sec", description: "Run in place with knees high.", intensity: "High" },
    ]
  },
  muscle_gain: {
    goal: "Muscle Gain",
    title: "Mass Monster Protocol",
    description: "Focus on hypertrophy and progressive overload. Slow, controlled movements with moderate weight.",
    exercises: [
      { name: "Push-ups", sets: "4", reps: "To Failure", description: "Chest, shoulders, and triceps builder.", intensity: "High" },
      { name: "Diamond Push-ups", sets: "3", reps: "10-12", description: "Targeting the triceps specifically.", intensity: "High" },
      { name: "Bulgarian Split Squats", sets: "3", reps: "12 per leg", description: "Unilateral leg strength and size.", intensity: "High" },
      { name: "Pull-ups / Chin-ups", sets: "4", reps: "8-10", description: "The king of back exercises.", intensity: "High" },
      { name: "Dips", sets: "3", reps: "12-15", description: "Great for chest and triceps mass.", intensity: "Medium" },
      { name: "Superman Holds", sets: "3", reps: "30 sec", description: "Lower back and posterior chain strength.", intensity: "Medium" },
    ]
  },
  maintain: {
    goal: "Maintain",
    title: "Warrior Maintenance",
    description: "Balance of strength and conditioning to keep your gains and stay athletic.",
    exercises: [
      { name: "Standard Push-ups", sets: "3", reps: "15-20", description: "Maintain upper body tone.", intensity: "Medium" },
      { name: "Walking Lunges", sets: "3", reps: "20 steps", description: "Functional leg strength.", intensity: "Medium" },
      { name: "Plank to Push-up", sets: "3", reps: "10-12", description: "Dynamic core and upper body.", intensity: "High" },
      { name: "Bird Dog", sets: "3", reps: "12 per side", description: "Core stability and balance.", intensity: "Low" },
      { name: "Glute Bridges", sets: "3", reps: "15", description: "Posterior chain activation.", intensity: "Low" },
      { name: "Shadow Boxing", sets: "3", reps: "2 min", description: "Light cardio and coordination.", intensity: "Medium" },
    ]
  }
};
