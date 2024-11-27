// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCf9SrtX38h3-90X48c_jm9BwRfcKKYpf4",
  authDomain: "betting-site-1fd0c.firebaseapp.com",
  projectId: "betting-site-1fd0c",
  storageBucket: "betting-site-1fd0c.appspot.com",
  messagingSenderId: "411445943688",
  appId: "1:411445943688:web:bbaf9c1302a5a380706e3d",
  measurementId: "G-V7D0GFXJ5Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };