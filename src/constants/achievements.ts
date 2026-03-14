import { Trophy, Flame, Zap, Target, Heart, Star } from "lucide-react";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: (user: any) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "consistent_warrior",
    title: "Consistent Warrior",
    description: "Maintain a 3-day login streak",
    icon: "Flame",
    condition: (user) => (user.current_streak || 0) >= 3
  },
  {
    id: "dedicated_warrior",
    title: "Dedicated Warrior",
    description: "Maintain a 7-day login streak",
    icon: "Zap",
    condition: (user) => (user.current_streak || 0) >= 7
  },
  {
    id: "rising_star",
    title: "Rising Star",
    description: "Reach Level 5",
    icon: "Star",
    condition: (user) => (user.current_level || 1) >= 5
  },
  {
    id: "transformation_master",
    title: "Transformation Master",
    description: "Reach a score of 1000",
    icon: "Trophy",
    condition: (user) => (user.transformation_score || 0) >= 1000
  },
  {
    id: "goal_setter",
    title: "Goal Setter",
    description: "Set a life goal in your profile",
    icon: "Target",
    condition: (user) => !!user.life_goal && user.life_goal.length > 5
  }
];
