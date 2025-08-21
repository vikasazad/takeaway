import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { authentication } from "@/config/db/firebase";
import { toast } from "sonner";
import { PhoneOtpResponse } from "@/types/auth/typesAuth";
declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}
let appVerifier;
const setupRecaptcha = () => {
  if (window.recaptchaVerifier) {
    window.recaptchaVerifier.clear();
  }
  window.recaptchaVerifier = new RecaptchaVerifier(
    authentication,
    "recaptcha-container",
    {
      size: "invisible",
      callback: () => {
        console.log("Recaptcha Resolved");
      },
      "expired-callback": () => {
        console.log("Recaptcha Expired");
        window.recaptchaVerifier.reset();
      },
    }
  );
};

export const authPhoneOtp = (
  formattedNumber: string
): Promise<PhoneOtpResponse> => {
  return new Promise((resolve, reject) => {
    setupRecaptcha();
    appVerifier = window.recaptchaVerifier;

    signInWithPhoneNumber(authentication, formattedNumber, appVerifier)
      .then((confirmationResult) => {
        toast.success("Otp sent successfully");
        resolve({
          verificationProcess: null,
          verificationId: confirmationResult.verificationId,
        });
      })
      .catch((err) => {
        console.log("error in authPhoneOtp", err);
        toast.error("Error during OTP request");
        if (err.code === "auth/invalid-phone-number") {
          toast.error("Invalid phone number. Please check the number.");
        } else if (err.code === "auth/too-many-requests") {
          toast.error("Too many requests. Please try again later.");
        } else {
          toast.error("Failed to send OTP. Please try again.");
        }
        reject(new Error(err.message));
      });
  });
};

export const resendOtp = (
  formattedNumber: string
): Promise<PhoneOtpResponse> => {
  return new Promise((resolve, reject) => {
    appVerifier = window.recaptchaVerifier;

    signInWithPhoneNumber(authentication, formattedNumber, appVerifier)
      .then((confirmationResult) => {
        toast.success("Otp sent successfully");
        resolve({
          verificationProcess: null,
          verificationId: confirmationResult.verificationId,
        });
      })
      .catch((err) => {
        console.log(err);
        toast.error("Error during OTP request");
        if (err.code === "auth/invalid-phone-number") {
          toast.error("Invalid phone number. Please check the number.");
        } else if (err.code === "auth/too-many-requests") {
          toast.error("Too many requests. Please try again later.");
        } else {
          toast.error("Failed to send OTP. Please try again.");
        }
        reject(new Error(err.message));
      });
  });
};

export const verifyOtp = (verificationId: string, phoneOtp: string) => {
  return new Promise((resolve, reject) => {
    const credential = PhoneAuthProvider.credential(verificationId, phoneOtp);

    signInWithCredential(authentication, credential)
      .then(() => {
        toast.success("Phone number verified!");
        // console.log(result.user);
        resolve(true);
      })
      .catch((err) => {
        console.error("Error during OTP verification", err);
        if (err.code === "auth/invalid-verification-code") {
          toast.error("Incorrect OTP");
        } else if (
          err.code === "auth/account-exists-with-different-credential"
        ) {
          toast.error("Phone number already associated with another account.");
        } else {
          toast.error("Error during OTP verification");
        }
        reject(false);
      });
  });
};
