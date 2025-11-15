import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDJTvsuY7g8t_Y6KlqTTEDL2Dd4FY805zU",
  authDomain: "portofolio-c3172.firebaseapp.com",
  databaseURL: "https://portofolio-c3172-default-rtdb.firebaseio.com",
  projectId: "portofolio-c3172",
  storageBucket: "portofolio-c3172.firebasestorage.app",
  messagingSenderId: "76660438100",
  appId: "1:76660438100:web:bf357beaf4d301b34d69c1",
  measurementId: "G-WL1CBL1S6P"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);