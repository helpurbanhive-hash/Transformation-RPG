export interface Quote {
  text: string;
  vibe: "aggressive" | "motivational" | "taunting";
}

export const HINGLISH_QUOTES: Record<string, Quote[]> = {
  morning: [
    { text: "Uth ja bhadve! Suraj nikal gaya hai aur tu abhi tak bistar mein hai? Tera rival cardio khatam kar chuka hai!", vibe: "aggressive" },
    { text: "Subah subah aalas mat dikha. Ek cup kaali coffee pee aur kaam pe lag ja. Level up tera intezar kar raha hai!", vibe: "motivational" },
    { text: "Aaj ka din tera hai, ya phir tu wahi purana loser rehna chahta hai? Choice teri hai, bhai.", vibe: "taunting" },
    { text: "Bhai, sapne bade hain toh neend kam karni padegi. Uth aur workout kar!", vibe: "motivational" },
    { text: "Duniya jaag gayi hai, tu kab jaagega? Aaj ka quest abhi shuru kar!", vibe: "aggressive" },
  ],
  afternoon: [
    { text: "Dopehar ho gayi hai. Lunch mein junk mat pel dena, varna saari mehnat paani mein chali jayegi!", vibe: "taunting" },
    { text: "Energy kam ho rahi hai? Thoda paani pee aur focus kar. Consistency hi asli power hai.", vibe: "motivational" },
    { text: "Bhai, lunch ke baad neend aa rahi hai? Tera rival abhi bhi grind kar raha hai. Sharam kar!", vibe: "aggressive" },
    { text: "Samosa dekh ke pighal mat jana. Yaad rakh, tu transformation kar raha hai, weight gain nahi!", vibe: "taunting" },
    { text: "Din aadha nikal gaya hai. Tune abhi tak kitne goals poore kiye? Speed badha!", vibe: "motivational" },
  ],
  evening: [
    { text: "Shaam ho gayi hai. Aaj tune kya ukhada? Agar kuch nahi kiya toh abhi bhi waqt hai, lag ja!", vibe: "aggressive" },
    { text: "Din khatam hone wala hai. Finish strong, mere dost. Aaj ka log bhar de aur sukoon se so.", vibe: "motivational" },
    { text: "Raat ko heavy mat khana, varna kal subah pet nikal ayega. Discipline dikha!", vibe: "taunting" },
    { text: "Aaj ka aalas kal ka pachtawa banega. Raat hone se pehle apna workout poora kar!", vibe: "motivational" },
    { text: "Bhai, sone se pehle apne goals check kar. Kya tu aaj kal se behtar bana?", vibe: "motivational" },
  ],
};

export const getQuoteByTime = () => {
  const hour = new Date().getHours();
  let category = "morning";
  
  if (hour >= 4 && hour < 11) category = "morning";
  else if (hour >= 11 && hour < 17) category = "afternoon";
  else category = "evening";

  const quotes = HINGLISH_QUOTES[category];
  return quotes[Math.floor(Math.random() * quotes.length)];
};
