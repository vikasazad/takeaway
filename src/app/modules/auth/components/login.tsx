/*
"use client";

import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authPhoneOtp, resendOtp, verifyOtp } from "@/lib/auth/handleOtp";
import { toast } from "sonner";
import { Icons } from "@/components/ui/icons";
import { useRouter, useSearchParams } from "next/navigation";
import { jwtVerify } from "jose";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/lib/store";
import { addUser } from "@/lib/features/addToOrderSlice";
import { checkTableAvailability } from "../utils/serverApi";
import TableOccupiedMessage from "@/components/ui/table-occupied-message";
import Image from "next/image";
// Custom hook for countdown timer
const useCountdown = (initialCount: number) => {
  const [count, setCount] = useState(0);

  const startCountdown = () => setCount(initialCount);
  
  const stopCountdown = () => setCount(0);

  useEffect(() => {
    if (count > 0) {
      const timer = setTimeout(() => setCount(count - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [count]);

  return [count, startCountdown, stopCountdown] as const;
};

export default function Login() {
  const secretKey = "Vikas@1234";
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  // const [data, setData] = useState<any>({});
  const [fNumber, setFNumber] = useState("");
  const [verificationId, setVerificationId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidTable, setIsValidTable] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [info, setInfo] = useState("");
  const [stage, setStage] = useState<"phone" | "otp">("phone");
  const [count, startCountdown, stopCountdown] = useCountdown(30);
  const searchParams = useSearchParams();

  async function decodeUrl() {
    const token = searchParams.get("token");
    if (!token) {
      console.error("Token is missing in the URL");
      return null;
    }
    try {
      const key = new TextEncoder().encode(secretKey);
      const decoded: any = await jwtVerify(token, key, {
        algorithms: ["HS256"],
      });
      if (decoded?.payload?.tag === "restaurant") {
        console.log("decoded", decoded);
        const res = await checkTableAvailability(
          decoded?.payload.email,
          decoded?.payload.tableNo
        );
        console.log("res", res);
        setIsValidTable(res);
      }

      return decoded;
    } catch (error) {
      console.error("Invalid or expired token:", error);
      return null;
    }
  }
  const decodedData = decodeUrl();

  if (decodedData) {
    decodedData.then((data) => {
      console.log("Decoded Data:", data);
      if (data?.payload.tag === "hotel") {
        setInfo("hotel");
        dispatch(
          addUser({ ...data?.payload, phone: data?.payload?.phoneNumber })
        );
        router.push("/");
      } else {
        dispatch(addUser({ ...data?.payload, phone: phoneNumber }));
      }
    });
  } else {
    console.log("Failed to decode data.");
  }

  if (!isValidTable) {
    return <TableOccupiedMessage />;
  }
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    setIsLoading(true);
    e.preventDefault();
    try {
      const formattedNumber = `+${91}${phoneNumber}`;
      console.log("Formatted phone number:", formattedNumber);
      console.log("Sending OTPs to email and phone...");
      setFNumber(formattedNumber);
      const phoneOtpRes: any = await authPhoneOtp(formattedNumber);
      console.log("phoneOtpRes:", phoneOtpRes);
      setVerificationId(phoneOtpRes.verificationId);
      setStage("otp");
      startCountdown(); // Start countdown here

      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      toast.error("Something went wrong");
      console.error("Error in handleRegisterSubmit:", error);
    }
  };

  const handleOtpSubmit = async () => {
    setIsLoading(true); // Add loading state
    console.log("handleOtpSubmit called with values:", otp);

    try {
      console.log("Verifying phone OTP...");
      const phoneVerified = await verifyOtp(verificationId, otp);
      console.log("phoneVerified:", phoneVerified);

      if (!phoneVerified) {
        toast.error("Invalid phone OTP");
        console.log("Invalid phone OTP");
        setIsLoading(false);
        return;
      }

      // Set state and show toast before navigation
      toast.success("Verification successful!");
      console.log("User verification successful!");

      // Stop the countdown when OTP is successfully verified
      stopCountdown();

      // Use replace to prevent back navigation to login
      document.body.focus();
      router.push("/");
    } catch (error) {
      toast.error("Verification failed");
      console.error("Error in handleOtpSubmit:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      console.log("Resending OTPs...");
      const phoneOtpRes: any = await resendOtp(fNumber);
      console.log("phoneOtpRes:", phoneOtpRes);

      if (phoneOtpRes) {
        setVerificationId(phoneOtpRes.verificationId);
        startCountdown(); // Restart countdown
        toast.success("OTPs resent successfully");
        console.log(
          "OTPs resent successfully. Verification ID:",
          phoneOtpRes.verificationId
        );
      }
    } catch (error) {
      toast.error("Failed to resend OTPs");
      console.error("Error in handleResendOtp:", error);
    }
  };

  return (
    <>
      <Suspense fallback={<p>Loading...</p>}>
        {info === "hotel" ? (
          <div className="flex justify-center items-center h-screen">
            <Image
              src="/images/loader.svg"
              alt="Loading..."
              width={50}
              height={50}
              priority
            />
          </div>
        ) : (
          <>
            <div id="recaptcha-container" />

            <div className="grid min-h-screen place-items-center bg-gray-50">
              <Card className="w-[350px]">
                <CardHeader>
                  <CardTitle>Welcome to Food Order</CardTitle>
                  <CardDescription>
                    Please authenticate to continue
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {stage === "phone" ? (
                    <form onSubmit={handlePhoneSubmit}>
                      <div className="flex flex-col space-y-4">
                        <Input
                          type="tel"
                          placeholder="Enter your phone number"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          required
                          autoFocus
                        />
                        <Button type="submit">
                          {isLoading && (
                            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Send OTP
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-col space-y-4">
                      <Input
                        type="text"
                        placeholder="Enter OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                        autoFocus
                      />
                      <div className="text-sm text-gray-500">
                        {count > 0
                          ? `Resend OTP in ${count}s`
                          : "You can resend OTP now"}
                      </div>
                      <Button
                        onClick={() => handleOtpSubmit()}
                        disabled={isLoading}
                      >
                        {isLoading && (
                          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Verify OTP
                      </Button>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  {stage === "otp" && (
                    <Button
                      variant="outline"
                      onClick={handleResendOtp}
                      disabled={count > 0}
                    >
                      {isLoading && (
                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Resend OTP
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </div>
          </>
        )}
      </Suspense>
    </>
  );
}
// http://localhost:3001/login?token=eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6InZpa3VtYXIuYXphZEBnbWFpbC5jb20iLCJ0YWJsZU5vIjoiNiIsInRheCI6eyJnc3RQZXJjZW50YWdlIjoiIn19.Eq-sf6OZdlLUAmZHM3rP0Zxc5J6dFd7KaB3CzKFh8cA&__vercel_draft=1
// http://localhost:3001/login?token=eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6InZpa3VtYXIuYXphZEBnbWFpbC5jb20iLCJ0YWJsZU5vIjoiOCIsInRheCI6eyJnc3RQZXJjZW50YWdlIjoiIn19.DTiaFgsCRkNAV0ln4-ut322jwZM21wMhUE-YK2faCEk
*/

// NEW TOKEN HANDLING FUNCTIONALITY
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { jwtVerify } from "jose";
import { AppDispatch } from "@/lib/store";
import { addUser } from "@/lib/features/addToOrderSlice";
import { checkTableAvailability } from "../utils/serverApi";
import { Progress } from "@/components/ui/progress";

function TokenHandler() {
  const secretKey = "Vikas@1234";
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [tokenProcessed, setTokenProcessed] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [isValidTable, setIsValidTable] = useState(true);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState(
    "Processing authentication token"
  );

  useEffect(() => {
    const processToken = async () => {
      const token = searchParams.get("token");

      // Start progress
      setProgress(10);

      if (!token) {
        console.log("No token found in URL");
        setProgressText("No authentication token found");
        setProgress(100);
        setIsLoading(false);
        setTokenProcessed(true);
        setHasToken(false);
        return;
      }

      try {
        console.log("Token found, processing...");
        setProgress(30);

        const key = new TextEncoder().encode(secretKey);
        setProgress(50);

        const decoded: any = await jwtVerify(token, key, {
          algorithms: ["HS256"],
        });

        setProgress(70);

        if (decoded?.payload) {
          console.log("Token decoded successfully:", decoded.payload);
          setProgress(80);

          // Check table availability for restaurant tokens
          if (decoded.payload.tag === "restaurant") {
            console.log("Checking table availability...");
            setProgressText("Checking table availability...");
            const tableAvailable = await checkTableAvailability(
              decoded.payload.email,
              decoded.payload.tableNo
            );
            console.log("Table availability check result:", tableAvailable);
            setIsValidTable(tableAvailable);

            if (!tableAvailable) {
              setHasToken(false);
              setProgress(100);
              return;
            }
          }

          dispatch(addUser(decoded.payload));
          localStorage.setItem("token", token);
          console.log("User data and token saved to Redux");
          setProgressText("Authentication complete");
          setHasToken(true);
          setProgress(100);

          // Navigate to home page after successful processing
          setTimeout(() => {
            router.push("/");
          }, 1000);
        }
      } catch (error) {
        console.log("Invalid or expired token:", error);
        setProgressText("Invalid or expired token");
        setHasToken(false);
        setProgress(100);
      } finally {
        setIsLoading(false);
        setTokenProcessed(true);
      }
    };

    processToken();
  }, [searchParams, dispatch, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="text-lg font-medium">Loading...</div>
          <div className="text-sm text-gray-500 mt-2">{progressText}</div>
          <Progress value={progress} className="w-64 mt-4" />
        </div>
      </div>
    );
  }

  if (tokenProcessed && !hasToken) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="text-lg font-medium text-red-600">
            {!isValidTable ? "Table is occupied" : "Something went wrong"}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            {!isValidTable
              ? "This table is currently occupied. Please contact staff for assistance."
              : "Please contact staff"}
          </div>
        </div>
      </div>
    );
  }

  if (tokenProcessed && hasToken) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="text-lg font-medium text-green-600">Success!</div>
          <div className="text-sm text-gray-500 mt-2">
            Redirecting to home page...
          </div>
          <Progress value={100} className="w-64 mt-4" />
        </div>
      </div>
    );
  }

  return null;
}

export default function Login() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-screen">
          <div className="text-center">
            <div className="text-lg font-medium">Loading...</div>
            <div className="text-sm text-gray-500 mt-2">
              Initializing authentication
            </div>
            <Progress value={50} className="w-64 mt-4" />
          </div>
        </div>
      }
    >
      <TokenHandler />
    </Suspense>
  );
}
