import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("transform_rpg.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    mobile_no TEXT UNIQUE,
    location_lat REAL,
    location_lng REAL,
    pincode TEXT,
    city TEXT,
    diet_goal TEXT,
    life_goal TEXT,
    body_image_url TEXT,
    future_self_image_url TEXT,
    transformation_score INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    current_streak INTEGER DEFAULT 0,
    last_active_date TEXT,
    daily_calorie_goal INTEGER DEFAULT 2000,
    badges TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS diet_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    log_date TEXT,
    meals_json TEXT,
    total_calories INTEGER,
    guilt_score INTEGER,
    fomo_message TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS fitness_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    log_date TEXT,
    workout_type TEXT,
    duration_mins INTEGER,
    calories_burned INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    title TEXT NOT NULL,
    target_value TEXT,
    deadline TEXT,
    progress INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_check_in TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Seed Sample Data
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as any;
if (userCount.count < 5) {
  const sampleUsers = [
    { id: "u1", name: "Rahul 'Beast' Sharma", mobile: "9876543210", lat: 28.6139, lng: 77.2090, score: 1250, level: 8, city: "New Delhi" },
    { id: "u2", name: "Priya Fitness", mobile: "9876543211", lat: 28.6150, lng: 77.2100, score: 3400, level: 15, city: "New Delhi" },
    { id: "u3", name: "Amit 'The Grinder' Gupta", mobile: "9876543212", lat: 28.6100, lng: 77.2050, score: 850, level: 5, city: "New Delhi" },
    { id: "u4", name: "Sneha Yoga", mobile: "9876543213", lat: 28.6200, lng: 77.2200, score: 2100, level: 12, city: "New Delhi" },
    { id: "u5", name: "Vikram 'Hustler' Singh", mobile: "9876543214", lat: 19.0760, lng: 72.8777, score: 4500, level: 22, city: "Mumbai" },
    { id: "u6", name: "Anjali 'God Mode' Rao", mobile: "9876543215", lat: 12.9716, lng: 77.5946, score: 9800, level: 45, city: "Bangalore" },
    { id: "u7", name: "Rajesh 'Iron' Kumar", mobile: "9876543216", lat: 28.6130, lng: 77.2080, score: 150, level: 2, city: "New Delhi" },
  ];

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, name, mobile_no, location_lat, location_lng, transformation_score, current_level, city)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  sampleUsers.forEach(u => {
    insertUser.run(u.id, u.name, u.mobile, u.lat, u.lng, u.score, u.level, u.city);
  });
}

// Migration: Add columns if they don't exist
const tableInfoUsers = db.prepare("PRAGMA table_info(users)").all() as any[];
if (!tableInfoUsers.some(col => col.name === 'daily_calorie_goal')) {
  db.exec("ALTER TABLE users ADD COLUMN daily_calorie_goal INTEGER DEFAULT 2000");
}
if (!tableInfoUsers.some(col => col.name === 'badges')) {
  db.exec("ALTER TABLE users ADD COLUMN badges TEXT DEFAULT '[]'");
}

const tableInfoGoals = db.prepare("PRAGMA table_info(goals)").all() as any[];
if (!tableInfoGoals.some(col => col.name === 'progress')) {
  db.exec("ALTER TABLE goals ADD COLUMN progress INTEGER DEFAULT 0");
}

const tableInfoUsersMigrate = db.prepare("PRAGMA table_info(users)").all() as any[];
if (!tableInfoUsersMigrate.some(col => col.name === 'future_self_image_url')) {
  db.exec("ALTER TABLE users ADD COLUMN future_self_image_url TEXT");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // API Routes
  app.post("/api/auth/login", (req, res) => {
    const { mobile_no } = req.body;
    // Mock login: find or create user
    let user = db.prepare("SELECT * FROM users WHERE mobile_no = ?").get(mobile_no) as any;
    if (!user) {
      const id = Math.random().toString(36).substring(7);
      db.prepare("INSERT INTO users (id, mobile_no, name) VALUES (?, ?, ?)").run(id, mobile_no, "New User");
      user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
    }
    res.json({ user });
  });

  app.post("/api/users/profile", (req, res) => {
    const { id, name, diet_goal, life_goal, pincode, city, lat, lng, body_image_url, transformation_score, current_level, current_streak, last_active_date, badges } = req.body;
    
    const currentUser = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as any;
    if (!currentUser) return res.status(404).json({ error: "User not found" });

    db.prepare(`
      UPDATE users 
      SET name = ?, diet_goal = ?, life_goal = ?, pincode = ?, city = ?, location_lat = ?, location_lng = ?, body_image_url = ?,
          transformation_score = ?, current_level = ?, current_streak = ?, last_active_date = ?, badges = ?
      WHERE id = ?
    `).run(
      name || currentUser.name,
      diet_goal || currentUser.diet_goal,
      life_goal || currentUser.life_goal,
      pincode || currentUser.pincode,
      city || currentUser.city,
      lat !== undefined ? lat : currentUser.location_lat,
      lng !== undefined ? lng : currentUser.location_lng,
      body_image_url || currentUser.body_image_url,
      transformation_score !== undefined ? transformation_score : currentUser.transformation_score,
      current_level !== undefined ? current_level : currentUser.current_level,
      current_streak !== undefined ? current_streak : currentUser.current_streak,
      last_active_date || currentUser.last_active_date,
      badges || currentUser.badges,
      id
    );
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
    res.json({ user });
  });

  app.get("/api/users/:id", (req, res) => {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
    res.json({ user });
  });

  app.post("/api/users/calorie-goal", (req, res) => {
    const { id, daily_calorie_goal } = req.body;
    db.prepare("UPDATE users SET daily_calorie_goal = ? WHERE id = ?").run(daily_calorie_goal, id);
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
    res.json({ user });
  });

  app.post("/api/diet/log", async (req, res) => {
    const { user_id, log_date, meals, total_calories, guilt_score, fomo_message } = req.body;
    
    db.prepare(`
      INSERT INTO diet_logs (user_id, log_date, meals_json, total_calories, guilt_score, fomo_message)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(user_id, log_date, JSON.stringify(meals), total_calories, guilt_score, fomo_message);

    // Update User Score
    const score_delta = Math.max(0, 100 - guilt_score);
    db.prepare("UPDATE users SET transformation_score = transformation_score + ? WHERE id = ?").run(score_delta, user_id);
    
    // Update Level
    const updatedUser = db.prepare("SELECT * FROM users WHERE id = ?").get(user_id) as any;
    // Sync with progressionService.ts formula: XP = 50L^2 + 350L - 400
    // L = (-350 + sqrt(122500 + 200 * (400 + XP))) / 100
    const xp = updatedUser.transformation_score;
    const newLevel = xp <= 0 ? 1 : Math.max(1, Math.floor((-350 + Math.sqrt(122500 + 200 * (400 + xp))) / 100));
    db.prepare("UPDATE users SET current_level = ? WHERE id = ?").run(newLevel, user_id);

    res.json({ guilt_score, fomo_message, user: updatedUser });
  });

  app.get("/api/rivals/nearby", (req, res) => {
    const { lat, lng, id } = req.query;
    
    if (!lat || !lng) {
      // Fallback if location not provided
      const rivals = db.prepare(`
        SELECT id, name, current_level, transformation_score, city
        FROM users 
        WHERE id != ?
        LIMIT 10
      `).all(id);
      return res.json({ rivals });
    }

    const userLat = parseFloat(lat as string);
    const userLng = parseFloat(lng as string);
    
    // 2km radius approximation (0.02 degrees)
    const delta = 0.02;

    const rivals = db.prepare(`
      SELECT id, name, current_level, transformation_score, city, location_lat, location_lng
      FROM users 
      WHERE id != ? 
      AND location_lat BETWEEN ? AND ?
      AND location_lng BETWEEN ? AND ?
      ORDER BY transformation_score DESC
      LIMIT 15
    `).all(id, userLat - delta, userLat + delta, userLng - delta, userLng + delta);
    
    res.json({ rivals });
  });

  app.get("/api/leaderboard", (req, res) => {
    const leaderboard = db.prepare(`
      SELECT name, current_level, transformation_score, city
      FROM users 
      ORDER BY transformation_score DESC 
      LIMIT 20
    `).all();
    res.json({ leaderboard });
  });

  app.post("/api/goals", (req, res) => {
    const { user_id, title, target_value, deadline, progress } = req.body;
    // Check if goal exists
    const existing = db.prepare("SELECT * FROM goals WHERE user_id = ?").get(user_id);
    if (existing) {
      db.prepare("UPDATE goals SET title = ?, target_value = ?, deadline = ?, progress = ? WHERE user_id = ?")
        .run(title, target_value, deadline, progress || 0, user_id);
    } else {
      db.prepare("INSERT INTO goals (user_id, title, target_value, deadline, progress) VALUES (?, ?, ?, ?, ?)")
        .run(user_id, title, target_value, deadline, progress || 0);
    }
    const goal = db.prepare("SELECT * FROM goals WHERE user_id = ?").get(user_id);
    res.json({ goal });
  });

  app.get("/api/goals/:userId", (req, res) => {
    const goal = db.prepare("SELECT * FROM goals WHERE user_id = ?").get(req.params.userId);
    res.json({ goal });
  });

  app.get("/api/logs/:userId", (req, res) => {
    const dietLogs = db.prepare("SELECT * FROM diet_logs WHERE user_id = ? ORDER BY log_date DESC LIMIT 5").all(req.params.userId);
    const fitnessLogs = db.prepare("SELECT * FROM fitness_logs WHERE user_id = ? ORDER BY log_date DESC LIMIT 5").all(req.params.userId);
    res.json({ dietLogs, fitnessLogs });
  });

  app.post("/api/goals/checkin", (req, res) => {
    const { user_id, progress_status } = req.body; // 'done', 'half', 'none'
    const goal = db.prepare("SELECT * FROM goals WHERE user_id = ?").get(user_id) as any;
    
    if (!goal) return res.status(404).json({ error: "No goal set" });

    db.prepare("UPDATE goals SET last_check_in = ? WHERE user_id = ?")
      .run(new Date().toISOString().split('T')[0], user_id);

    // Logic for Hinglish messages based on progress
    let message = "";
    let score_delta = 0;
    let type = "info";

    if (progress_status === 'done') {
      message = "Shabash! Aise hi laga reh, sapne sach hone wale hain.";
      score_delta = 50;
      type = "info";
    } else if (progress_status === 'half') {
      message = "Bhai, aadha kaam karke khush mat ho. Poora kar tab maza aayega!";
      score_delta = 20;
      type = "warning";
    } else {
      message = "Bro jaag! Dekha de tu kya hai. Aaj tune kuch nahi kiya toh kal kuch nahi milega. Sharam kar!";
      score_delta = -20;
      type = "danger";
    }

    db.prepare("UPDATE users SET transformation_score = transformation_score + ? WHERE id = ?")
      .run(score_delta, user_id);

    const updatedUser = db.prepare("SELECT * FROM users WHERE id = ?").get(user_id);
    res.json({ message, type, user: updatedUser });
  });

  app.post("/api/users/future-self", (req, res) => {
    const { id, future_self_image_url } = req.body;
    db.prepare("UPDATE users SET future_self_image_url = ? WHERE id = ?").run(future_self_image_url, id);
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
    res.json({ user });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
