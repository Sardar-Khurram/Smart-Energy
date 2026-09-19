import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDbuBrzQ-EBpzoQs3x8P0e7UAmSXQ8GHpI",
  authDomain: "energy-monitoring-app-61add.firebaseapp.com",
  databaseURL: "https://energy-monitoring-app-61add-default-rtdb.firebaseio.com",
  projectId: "energy-monitoring-app-61add",
  storageBucket: "energy-monitoring-app-61add.firebasestorage.app",
  messagingSenderId: "726819895262",
  appId: "1:726819895262:web:923e858b0f05e525d6cf4f",
  measurementId: "G-80BF4QD5VQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database
export const database = getDatabase(app);

export default app;
