"use server";

import admin from "firebase-admin";
import { Message } from "firebase-admin/messaging";

import * as dotenv from "dotenv";

dotenv.config();
// console.log(":::::::::::::::::::::", process.env.FIREBASE_ADMIN_CREDENTIALS);
// Initialize Firebase Admin SDK
if (process.env.FIREBASE_ADMIN_CREDENTIALS) {
  if (!admin.apps.length) {
    const serviceAccount: any = JSON.parse(
      process.env.FIREBASE_ADMIN_CREDENTIALS
    );

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
}

export async function sendNotification(
  token: string,
  title: string,
  message: string
) {
  // console.log(":::::::::::::::::::::", process.env.FIREBASE_ADMIN_CREDENTIALS);
  // console.log(":::::::::::::::::::::", token, title, message);
  const payload: Message = {
    token,
    notification: {
      title: title,
      body: message,
    },
    // webpush: link && {
    //   fcmOptions: {
    //     link,
    //   },
    // },
  };
  // console.log(":::::::::::::::::::::", payload);
  try {
    await admin.messaging().send(payload);
    // console.log("++++++++++++++++++", result);
    return { success: true, message: "Notification sent!" };
  } catch (error) {
    return { success: false, error };
  }
}
