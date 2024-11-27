// src/firebase/authMethods.js
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signOut, setPersistence, browserLocalPersistence } from "firebase/auth";
import { auth } from "./firebaseConfig"; // Import Firebase auth instance



// Sign Up with Email and Password
export const signUpWithEmail = async (email, password) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;
    console.log("Email Signed Up User:", user);
    return user;
  } catch (error) {
    console.error("Error during Email Sign-up:", error.message);
    throw error;
  }
};

// Sign In with Email and Password
export const signInWithEmail = async (email, password) => {
  try {
    await setPersistence(auth, browserLocalPersistence)

    const result = await signInWithEmailAndPassword(auth, email, password);
    const user = result.user;
    console.log("Email Signed in User:", user);
    return user;
  } catch (error) {
    console.error("Error during Email Sign-in:", error.message);
    throw error;
  }
};

// Sign In with Google
export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    await setPersistence(auth, browserLocalPersistence)
    
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    console.log("Google Signed in User:", user);
    return user;
  } catch (error) {
    console.error("Error during Google Sign-in:", error.message);
    throw error;
  }
};

// Reset Password
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log("Password Reset Email Sent!");
  } catch (error) {
    console.error("Error during password reset:", error.message);
    throw error;
  }
};

export const logOut = async () => {
  return signOut(auth)
    .then(() => {
      console.log("User signed out successfully");
    })
    .catch((error) => {
      console.error("Error signing out: ", error);
    });
};

// Function to get the currently signed-in user info
export const getCurrentUser = async () => {
  const user = auth.currentUser;

  if (user) {
    // User is signed in, return the user object
    console.log("User Info: ", user);
    return user;
  } else {
    console.log("No user is signed in.");
    return null;
  }
};