// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCthS-vz2Q1_GZy5Jj1_Zdj-HMckjNmbK0",
  authDomain: "moviemu-d2029.firebaseapp.com",
  projectId: "moviemu-d2029",
  storageBucket: "moviemu-d2029.appspot.com",
  messagingSenderId: "1084439998582",
  appId: "1:1084439998582:web:b99efe700aa27c25006f57",
  measurementId: "G-C1WMKDLWC3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export { getAuth };
