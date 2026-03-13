export interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  isJunk: boolean;
}

export const INDIAN_FOOD_DATA: FoodItem[] = [
  { name: "Samosa (1 pc)", calories: 260, protein: 4, carbs: 24, fat: 17, isJunk: true },
  { name: "Paneer Tikka (100g)", calories: 280, protein: 18, carbs: 6, fat: 20, isJunk: false },
  { name: "Butter Chicken (1 bowl)", calories: 450, protein: 30, carbs: 12, fat: 32, isJunk: true },
  { name: "Dal Tadka (1 bowl)", calories: 150, protein: 8, carbs: 20, fat: 5, isJunk: false },
  { name: "Roti (1 pc)", calories: 85, protein: 3, carbs: 18, fat: 0.5, isJunk: false },
  { name: "Naan (1 pc)", calories: 260, protein: 8, carbs: 45, fat: 6, isJunk: true },
  { name: "Rice (1 bowl)", calories: 200, protein: 4, carbs: 45, fat: 0.5, isJunk: false },
  { name: "Chole Bhature (2 pcs)", calories: 600, protein: 15, carbs: 70, fat: 30, isJunk: true },
  { name: "Masala Dosa (1 pc)", calories: 350, protein: 6, carbs: 50, fat: 14, isJunk: false },
  { name: "Idli (2 pcs)", calories: 120, protein: 4, carbs: 25, fat: 0.5, isJunk: false },
  { name: "Vada Pav (1 pc)", calories: 300, protein: 6, carbs: 40, fat: 12, isJunk: true },
  { name: "Pani Puri (6 pcs)", calories: 180, protein: 2, carbs: 30, fat: 6, isJunk: true },
  { name: "Gulab Jamun (1 pc)", calories: 150, protein: 2, carbs: 25, fat: 6, isJunk: true },
  { name: "Jalebi (100g)", calories: 450, protein: 2, carbs: 80, fat: 15, isJunk: true },
  { name: "Chicken Biryani (1 bowl)", calories: 400, protein: 25, carbs: 50, fat: 12, isJunk: false },
  { name: "Aloo Paratha (1 pc)", calories: 250, protein: 5, carbs: 40, fat: 8, isJunk: false },
  { name: "Poha (1 bowl)", calories: 250, protein: 6, carbs: 45, fat: 6, isJunk: false },
  { name: "Pav Bhaji (1 plate)", calories: 400, protein: 8, carbs: 60, fat: 15, isJunk: true },
  { name: "Momos (6 pcs)", calories: 250, protein: 8, carbs: 40, fat: 6, isJunk: true },
  { name: "Maggi (1 pack)", calories: 310, protein: 7, carbs: 45, fat: 12, isJunk: true },
  { name: "Burger (Veg)", calories: 350, protein: 10, carbs: 45, fat: 15, isJunk: true },
  { name: "Pizza (1 slice)", calories: 280, protein: 12, carbs: 30, fat: 12, isJunk: true },
  { name: "Dhokla (2 pcs)", calories: 160, protein: 6, carbs: 25, fat: 4, isJunk: false },
  { name: "Upma (1 bowl)", calories: 200, protein: 5, carbs: 35, fat: 5, isJunk: false },
  { name: "Lassi (1 glass)", calories: 250, protein: 8, carbs: 30, fat: 10, isJunk: true },
  { name: "Chai (1 cup)", calories: 60, protein: 2, carbs: 10, fat: 2, isJunk: false },
  { name: "Coffee (1 cup)", calories: 80, protein: 2, carbs: 12, fat: 3, isJunk: false },
  { name: "Fruit Salad (1 bowl)", calories: 100, protein: 1, carbs: 25, fat: 0.5, isJunk: false },
  { name: "Egg Curry (2 eggs)", calories: 250, protein: 14, carbs: 6, fat: 18, isJunk: false },
  { name: "Fish Fry (100g)", calories: 220, protein: 20, carbs: 5, fat: 14, isJunk: false },
];

export const HINGLISH_MOTIVATION = [
  "Bhai, transformation ke liye mehnat lagti hai, bahane nahi!",
  "Kal se nahi, aaj se shuru kar. Level up tera intezar kar raha hai.",
  "Body aisi banao ki log puchein, 'Bhai, kya khata hai?'",
  "Discipline hi asli power hai. Aaj ka quest complete kar!",
  "Padosi tujhse aage nikal raha hai, uth aur workout kar!",
  "Samosa dekh ke pighal mat jana, goal yaad rakh!",
  "Jeetne ka maza tabhi aata hai jab sab tere haarne ka intezar karein.",
  "Consistency is key, mere dost. Aaj ka log bhar de!",
];

export const HINGLISH_TAUNTS = [
  "Oho! Samosa pel diya? Kal extra cardio karna padega, varna pet nikal ayega!",
  "Bhai, itna junk khaoge toh 'Rookie' hi rahoge, transform kab hoge?",
  "Pizza khane se muscles nahi bante, sirf aalas badhta hai. Sharam kar!",
  "Aaj toh tune calories ki baarish kar di. Tera padosi has raha hai tujhpe!",
  "Diet plan ka mazaak bana diya tune aaj. Aise hi chalta raha toh level 1 pe hi sadoge.",
  "Bhai, ye junk food tujhe kamzor bana raha hai. Jaag ja!",
  "Ek aur junk item? Bhai, tu transformation kar raha hai ya weight gain competition?",
  "Tere padosi workout kar rahe hain, aur tu yahan junk pel raha hai. Wah!",
];

export const HINGLISH_GOAL_QUOTES = [
  "Bro jaag! Dekha de tu kya hai. Aaj tune kuch nahi kiya toh kal kuch nahi milega.",
  "Sapne bade hain toh neend kam karni padegi. Uth aur kaam kar!",
  "Bhai, 12 lakh kamane hain na? Toh ye aalas kyun?",
  "Kal ka intezar mat kar, kal kabhi nahi aata. Aaj hi kar!",
  "Sharam kar, tera padosi tujhse aage nikal raha hai. Tu bas baitha reh!",
  "Mehnat aisi karo ki log kahein, 'Bhai, tune toh karke dikha diya!'",
  "Aaj ka aalas kal ka pachtawa banega. Choice teri hai.",
  "Uth, jaag aur tab tak mat ruko jab tak goal poora na ho jaye!",
];
