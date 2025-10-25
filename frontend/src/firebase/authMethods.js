// src/firebase/authMethods.js
import { getAdditionalUserInfo, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signOut, setPersistence, browserLocalPersistence, getAuth, RecaptchaVerifier, signInWithPhoneNumber, updatePhoneNumber,  signInWithCredential,    PhoneAuthProvider } from "firebase/auth";

import { getFirestore, doc, setDoc } from "firebase/firestore"; // For Firestore
import { getDatabase, ref, set } from "firebase/database"; // For Firebase Realtime Database
import { auth } from "./firebaseConfig"; // Import Firebase auth instance
import emailjs from '@emailjs/browser';
import bcrypt from "bcryptjs"; // Import bcrypt for hashing

import { otpAuth } from "./firebaseConfig";


// Sign Up with Email and Password
export const signUpWithEmail = async (email, password) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;
    console.log("Email Signed Up User:", user);
    await sendWelcomeEmail(email);
    return user;
  } catch (error) {
    console.error("Error during Email Sign-up:", error.message);
    throw error;
  }
};
//Send Email on Sign Up
  const sendWelcomeEmail = async (userEmail) => {
    // console.log(userEmail)
    const templateParams = {
      to_name: userEmail, // This should match the placeholder in your EmailJS template
    };
  
    emailjs
      .send(
        process.env.REACT_APP_EMAILJS_SERVICE_ID,
        process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
        templateParams,
        process.env.REACT_APP_EMAILJS_PUBLIC_KEY  // Replace with your EmailJS public key
      )
      .then((response) => {
        console.log('Email sent successfully:', response);
      })
      .catch((error) => {
        console.error('Error sending email:', error);
      });
  };
// Sign In with Email and Password
export const signInWithEmail = async (email, password) => {
  try {
    await setPersistence(auth, browserLocalPersistence)

    const result = await signInWithEmailAndPassword(auth, email, password);
    const user = result.user;
    // console.log("Email Signed in User:", user);
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
    const additionalInfo = getAdditionalUserInfo(result);
    if (additionalInfo.isNewUser) {
      // console.log("User is signing up for the first time!");
      sendWelcomeEmail(user.email);
      // Handle new user (e.g., save to database, send welcome email, etc.)
    } else {
      // console.log("User is signing in.");
      // Handle returning user
    }
    // console.log("Google Signed in User:", user);
    return user;
  } catch (error) {
    if (error.code === "auth/popup-closed-by-user") {
      // console.log("User closed the popup. Signup process stopped.");
      return "closed"; // Don't show an error to the user, just exit
    }
    console.error("Firebase Authentication Error:", error);
    return "error"
    //throw error;
  }
};

// Reset Password
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    // console.log("Password Reset Email Sent!");
  } catch (error) {
    console.error("Error during password reset:", error.message);
    throw error;
  }
};

export const logOut = async () => {
  return signOut(auth)
    .then(() => {
      // console.log("User signed out successfully");
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
    // console.log("User Info: ", user);
    return user;
  } else {
    // console.log("No user is signed in.");
    return null;
  }
};



// Initialize reCAPTCHA
export const setupRecaptcha = () => {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
      callback: () => console.log("reCAPTCHA verified"),
      "expired-callback": () => {
        console.error("reCAPTCHA expired. Please try again.");
      },
    });
  }
};

// Send OTP
export const sendOTP = async (phoneNumber) => {
  try {
    setupRecaptcha(); // Ensure reCAPTCHA is ready

    const appVerifier = window.recaptchaVerifier;
    const confirmationResult = await signInWithPhoneNumber(
      otpAuth,
      phoneNumber,
      appVerifier
    );

    // Save confirmationResult temporarily (for later verification)
    window.confirmationResult = confirmationResult;

    console.log("OTP sent successfully");
    return true;
  } catch (error) {
    console.error("Error sending OTP:", error);
    throw error;
  }
};

// Verify OTP (without signing in the user)
export const verifyOTP = async (otp) => {
  try {
    if (!window.confirmationResult) {
      throw new Error("No OTP session found. Please request a new code.");
    }

    // This confirms the OTP with Firebase
    const result = await window.confirmationResult.confirm(otp);
    const tempUser = result.user;

    // Immediately delete that temporary Firebase user
    await tempUser.delete();
    await otpAuth.signOut();

    console.log("OTP verified successfully");
    return true;
  } catch (error) {
    console.error("Error verifying OTP:", error);
    throw error
    // if (error.code === "auth/invalid-verification-code") {
    //   throw new Error("Invalid OTP. Please try again.");
    // } else if (error.code === "auth/code-expired") {
    //   throw new Error("OTP expired. Please resend.");
    // } else {
    //   throw new Error("Failed to verify OTP. Try again later.");
    // }
  }
};
