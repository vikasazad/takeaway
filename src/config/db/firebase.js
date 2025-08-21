import { initializeApp, getApp, getApps } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
// Your web app's Firebase configuration
console.log("first", process.env.API_KEY);
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
  authDomain: "bottest-2bb43.firebaseapp.com",
  projectId: "bottest-2bb43",
  storageBucket: "bottest-2bb43.appspot.com",
  messagingSenderId: "868396881763",
  appId: "1:868396881763:web:53f1464fbf89a834e3a556",
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const messaging = async () => {
  const supported = await isSupported();
  return supported ? getMessaging(app) : null;
};
export const fetchToken = async () => {
  try {
    const fcmMessaging = await messaging();
    if (fcmMessaging) {
      const token = await getToken(fcmMessaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_FCM_VAPID_KEY,
      });
      return token;
    }
    return null;
  } catch (err) {
    console.error("An error occurred while fetching the token:", err);
    return null;
  }
};
const authentication = getAuth(app);
authentication.useDeviceLanguage();
export { authentication, messaging };
export const db = getFirestore(app);
export const storage = getStorage(app);
