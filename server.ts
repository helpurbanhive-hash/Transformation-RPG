import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fs from "fs";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, addDoc, query, where, limit, orderBy, serverTimestamp } from "firebase/firestore/lite";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
if (!fs.existsSync(firebaseConfigPath)) {
  console.error("CRITICAL: firebase-applet-config.json NOT FOUND at", firebaseConfigPath);
  process.exit(1);
}
const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf8"));

if (!firebaseConfig.projectId) {
  console.error("CRITICAL: projectId missing in firebase-applet-config.json");
  process.exit(1);
}

console.log("Starting server initialization with Firebase Client SDK...");

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

console.log("Firestore initialized with database:", firebaseConfig.firestoreDatabaseId || "(default)");

const usersCol = collection(db, "users");
const dietLogsCol = collection(db, "diet_logs");
const fitnessLogsCol = collection(db, "fitness_logs");
const goalsCol = collection(db, "goals");

async function startServer() {
  console.log("Starting startServer...");
  const app = express();
  const PORT = 3000;

  console.log("Configuring middleware...");
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Health Check
  console.log("Configuring health check...");
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString(), databaseId: firebaseConfig.firestoreDatabaseId });
  });

  // API Routes
  console.log("Configuring API routes...");
  app.post("/api/auth/login", async (req, res) => {
    const { mobile_no, firebase_uid } = req.body;
    console.log(`Login attempt: mobile=${mobile_no}, uid=${firebase_uid}`);
    try {
      if (!mobile_no) {
        return res.status(400).json({ error: "mobile_no is required" });
      }

      let snapshot;
      snapshot = await getDocs(query(usersCol, where("mobile_no", "==", mobile_no), limit(1)));
      
      if (snapshot.empty && firebase_uid) {
        snapshot = await getDocs(query(usersCol, where("firebase_uid", "==", firebase_uid), limit(1)));
      }

      let user: any = null;
      if (snapshot.empty) {
        const id = firebase_uid || Math.random().toString(36).substring(7);
        user = { 
          id, 
          mobile_no, 
          firebase_uid: firebase_uid || null,
          name: "New User", 
          transformation_score: 0, 
          current_level: 1, 
          current_streak: 0, 
          badges: "[]",
          created_at: new Date().toISOString(),
          daily_quests: JSON.stringify([
            { id: "calories", title: "Log 1500 kcal", completed: false, target: 1500, current: 0 },
            { id: "workout", title: "30 min Workout", completed: false, target: 30, current: 0 },
            { id: "water", title: "Drink 3L Water", completed: false, target: 3000, current: 0 }
          ])
        };
        await setDoc(doc(usersCol, id), user);
      } else {
        user = snapshot.docs[0].data();
        if (firebase_uid && !user.firebase_uid) {
          await updateDoc(snapshot.docs[0].ref, { firebase_uid });
          user.firebase_uid = firebase_uid;
        }
      }
      res.json({ user });
    } catch (e: any) {
      console.error("Login Route Error:", e);
      res.status(500).json({ error: e.message || "Internal Server Error" });
    }
  });

  app.post("/api/users/profile", async (req, res) => {
    const { id, ...profileData } = req.body;
    try {
      const userRef = doc(usersCol, id);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) return res.status(404).json({ error: "User not found" });

      const currentUser = userDoc.data();
      const updatedData = { ...currentUser, ...profileData };
      await updateDoc(userRef, updatedData);
      
      res.json({ user: updatedData });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.get("/api/users/:id/quests", async (req, res) => {
    try {
      const userDoc = await getDoc(doc(usersCol, req.params.id));
      if (!userDoc.exists()) return res.status(404).json({ error: "User not found" });
      
      const userData = userDoc.data() as any;
      const quests = userData.daily_quests ? JSON.parse(userData.daily_quests) : [];
      res.json({ quests });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.post("/api/users/:id/quests/complete", async (req, res) => {
    const { questId } = req.body;
    try {
      const userRef = doc(usersCol, req.params.id);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) return res.status(404).json({ error: "User not found" });

      const userData = userDoc.data() as any;
      let quests = userData.daily_quests ? JSON.parse(userData.daily_quests) : [];
      
      quests = quests.map((q: any) => q.id === questId ? { ...q, completed: true } : q);
      
      await updateDoc(userRef, { daily_quests: JSON.stringify(quests) });
      res.json({ quests });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.post("/api/users/calorie-goal", async (req, res) => {
    const { id, daily_calorie_goal } = req.body;
    try {
      const userRef = doc(usersCol, id);
      await updateDoc(userRef, { daily_calorie_goal });
      const userDoc = await getDoc(userRef);
      res.json({ user: userDoc.data() });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.post("/api/diet/log", async (req, res) => {
    const { user_id, log_date, meals, total_calories, guilt_score, fomo_message } = req.body;
    try {
      await addDoc(dietLogsCol, {
        user_id,
        log_date,
        meals_json: JSON.stringify(meals),
        total_calories,
        guilt_score,
        fomo_message,
        created_at: serverTimestamp()
      });

      // Update User Score
      const score_delta = Math.max(0, 100 - guilt_score);
      const userRef = doc(usersCol, user_id);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data() as any;
      
      const newScore = (userData.transformation_score || 0) + score_delta;
      const newLevel = newScore <= 0 ? 1 : Math.max(1, Math.floor((-350 + Math.sqrt(122500 + 200 * (400 + newScore))) / 100));
      
      await updateDoc(userRef, {
        transformation_score: newScore,
        current_level: newLevel
      });

      const updatedUser = { ...userData, transformation_score: newScore, current_level: newLevel };
      res.json({ guilt_score, fomo_message, user: updatedUser });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.get("/api/rivals/nearby", async (req, res) => {
    const { id } = req.query;
    try {
      const snapshot = await getDocs(query(usersCol, orderBy("transformation_score", "desc"), limit(20)));
      const rivals = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() as any }))
        .filter(r => r.id !== id);
      
      res.json({ rivals });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.get("/api/leaderboard", async (req, res) => {
    try {
      const snapshot = await getDocs(query(usersCol, orderBy("transformation_score", "desc"), limit(20)));
      const leaderboard = snapshot.docs.map(doc => doc.data());
      res.json({ leaderboard });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.post("/api/goals", async (req, res) => {
    const { user_id, title, target_value, deadline, progress } = req.body;
    try {
      const snapshot = await getDocs(query(goalsCol, where("user_id", "==", user_id), limit(1)));
      let goal: any = null;
      if (snapshot.empty) {
        const goalData = { user_id, title, target_value, deadline, progress: progress || 0, created_at: serverTimestamp() };
        const docRef = await addDoc(goalsCol, goalData);
        goal = { id: docRef.id, ...goalData };
      } else {
        const goalDoc = snapshot.docs[0];
        const goalData = { title, target_value, deadline, progress: progress || 0 };
        await updateDoc(goalDoc.ref, goalData);
        goal = { id: goalDoc.id, ...goalDoc.data(), ...goalData };
      }
      res.json({ goal });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.get("/api/goals/:userId", async (req, res) => {
    try {
      const snapshot = await getDocs(query(goalsCol, where("user_id", "==", req.params.userId), limit(1)));
      res.json({ goal: snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.get("/api/logs/:userId", async (req, res) => {
    try {
      const dietSnapshot = await getDocs(query(dietLogsCol, where("user_id", "==", req.params.userId), orderBy("log_date", "desc"), limit(5)));
      const fitnessSnapshot = await getDocs(query(fitnessLogsCol, where("user_id", "==", req.params.userId), orderBy("log_date", "desc"), limit(5)));
      
      const dietLogs = dietSnapshot.docs.map(doc => doc.data());
      const fitnessLogs = fitnessSnapshot.docs.map(doc => doc.data());
      
      res.json({ dietLogs, fitnessLogs });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.post("/api/goals/checkin", async (req, res) => {
    const { user_id, progress_status } = req.body;
    try {
      const snapshot = await getDocs(query(goalsCol, where("user_id", "==", user_id), limit(1)));
      if (snapshot.empty) return res.status(404).json({ error: "No goal set" });

      const goalDoc = snapshot.docs[0];
      const todayStr = new Date().toISOString().split('T')[0];
      await updateDoc(goalDoc.ref, { last_check_in: todayStr });

      let message = "";
      let score_delta = 0;
      let type = "info";

      if (progress_status === 'done') {
        message = "Shabash! Aise hi laga reh, sapne sach hone wale hain.";
        score_delta = 50;
      } else if (progress_status === 'half') {
        message = "Bhai, aadha kaam karke khush mat ho. Poora kar tab maza aayega!";
        score_delta = 20;
        type = "warning";
      } else {
        message = "Bro jaag! Dekha de tu kya hai. Aaj tune kuch nahi kiya toh kal kuch nahi milega. Sharam kar!";
        score_delta = -20;
        type = "danger";
      }

      const userRef = doc(usersCol, user_id);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data() as any;
      const newScore = (userData.transformation_score || 0) + score_delta;
      await updateDoc(userRef, { transformation_score: newScore });

      const updatedUser = { ...userData, transformation_score: newScore };
      res.json({ message, type, user: updatedUser });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.post("/api/users/future-self", async (req, res) => {
    const { id, future_self_image_url } = req.body;
    try {
      const userRef = doc(usersCol, id);
      await updateDoc(userRef, { future_self_image_url });
      const userDoc = await getDoc(userRef);
      res.json({ user: userDoc.data() });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    try {
      console.log("Initializing Vite dev server...");
      const vite = await createViteServer({
        server: { 
          middlewareMode: true,
          hmr: { port: 0 } // Use random port to avoid conflicts
        },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("Vite middleware attached.");
    } catch (viteErr) {
      console.error("Vite Initialization Error:", viteErr);
    }
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  console.log(`Attempting to start server on port ${PORT}...`);
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });
}

startServer().catch(err => {
  console.error("CRITICAL SERVER ERROR:", err);
  process.exit(1);
});

