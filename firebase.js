const firebaseConfig = {
  apiKey: "AIzaSyCU8pG8fYk-DI2nzStf8tM35pkDrCSHIwo",
  authDomain: "workflow-sustainability-engine.firebaseapp.com",
  projectId: "workflow-sustainability-engine",
  storageBucket: "workflow-sustainability-engine.firebasestorage.app",
  messagingSenderId: "220305817375",
  appId: "1:220305817375:web:5a79a2c0ad5bb816f47a2a",
  measurementId: "G-Z2B606ZHR7"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Services
const auth = firebase.auth();
const db = firebase.firestore();
