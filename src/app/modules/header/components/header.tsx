"use client";

import React, { useState, useEffect } from "react";
import {
  Bike,
  Clock,
  IndianRupee,
  LogOut,
  MapPin,
  Package,
  Phone,
  Search,
  User,
} from "lucide-react";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDispatch, useSelector } from "react-redux";
import { searchTerm } from "@/lib/features/searchSlice";
import { AppDispatch, RootState } from "@/lib/store";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// import { Checkbox } from "@/components/ui/checkbox";
import {
  getOrderData,
  getOrderDataHotel,
  findUser,
  findOrderData,
  registerUser,
} from "../../auth/utils/authApi";
import {
  initializeJWTManagement,
  setupJWTAfterLogin,
  clearJWTData,
  isUserLoggedIn,
  getCurrentPhone,
} from "@/lib/auth/jwtService";
import Script from "next/script";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { toast } from "sonner";
import { resendOtp, authPhoneOtp, verifyOtp } from "@/lib/auth/handleOtp";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Icons } from "@/components/ui/icons";
import {
  addInfo,
  addOrders,
  addUser,
  clearLogout,
} from "@/lib/features/addToOrderSlice";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { setDelivery } from "@/lib/features/deliverySlice";
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
export default function Header({ data }: { data: any }) {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user, orders } = useSelector(
    (state: RootState) => state.addToOrderData
  );
  console.log("HERETHEDATA", orders);

  // JWT Token Configuration

  const [expanded, setExpanded] = useState(false);
  const [loadScript, setLoadScript] = useState(false);
  const [open, setOpen] = useState(false);
  const [phoneDrawerOpen, setPhoneDrawerOpen] = useState(false);
  const [fNumber, setFNumber] = useState("");
  const [verificationId, setVerificationId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [stage, setStage] = useState<"phone" | "otp">("phone");
  const [count, startCountdown, stopCountdown] = useCountdown(30);
  const [userLogin, setUserLogin] = useState<boolean>(false);
  console.log("user", user, getCurrentPhone());

  // Initialize JWT management on component mount
  useEffect(() => {
    initializeJWTManagement();
  }, [user?.phone]);

  useEffect(() => {
    console.log("h0");
    const phone = getCurrentPhone() || user?.phone;
    if (!user?.email || !phone) {
      console.log("Email or phone is missing in table data.");
      return;
    }
    if (user?.tag === "concierge") {
      console.log("h1");
      const unsubscribe = getOrderDataHotel(
        user.email,
        phone,
        (result: any) => {
          if (result) {
            // setOrderData(result);
          } else {
            // setOrderData([]);
          }
        }
      );

      return () => {
        if (unsubscribe) unsubscribe(); // Ensure cleanup
      };
    } else {
      console.log("h1");
      if (user.email && phone) {
        console.log("h2");
        const unsubscribe = getOrderData(
          user.email,
          phone,

          (result: any) => {
            if (result) {
              // setOrderData(result);
              console.log("result", result);
            } else {
              // setOrderData([]);
            }
          }
        );

        return () => {
          if (unsubscribe) unsubscribe(); // Ensure cleanup
        };
      }
    }
  }, [user.email]);

  useEffect(() => {
    if (user?.phone.length > 0) {
      const unsubscribe = findOrderData(
        "vikumar.azad@gmail.com",
        user.phone,
        (result: any) => {
          if (result) {
            const orders: any[] = [];
            console.log("result", result);
            Object.entries(result?.current).forEach(([, value]) => {
              orders.push(value);
            });
            if (result?.prev.length > 0) {
              result?.prev.reverse().forEach((item: any) => {
                orders.push(item);
              });
            }

            console.log("orders", orders);
            dispatch(addOrders(orders));
          }
        }
      );
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [user]);

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

      // const newUser = { ...user, phone: fNumber };
      // dispatch(setUser(newUser));

      // Stop the countdown when OTP is successfully verified
      stopCountdown();

      handleAfterLogin();
      setUserLogin(true);
      setPhoneDrawerOpen(false);
      setStage("phone");
      setOtp("");
      setPhoneNumber("");
      setFNumber("");
      setIsLoading(false);
      setLoadScript(true);
      // here to be save user data
      // Use replace to prevent back navigation to login
      // document.body.focus();
      // router.push("/");
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

  const handleAfterLogin = async () => {
    console.log("userLogin", userLogin);

    const user = await findUser(phoneNumber, "vikumar.azad@gmail.com");
    if (!user) {
      const register = await registerUser(
        phoneNumber,
        "vikumar.azad@gmail.com"
      );
      if (!register) {
        toast.error("Something went wrong");
        return;
      }
    }
    // setUserLogin(true);
    // Phone will be stored by setupJWTAfterLogin
    dispatch(
      addUser({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        tax: user.tax || { gstPercentage: "18" },
        address: user.address || [],
      })
    );
    dispatch(addInfo(data));

    try {
      // Set up JWT after successful login
      await setupJWTAfterLogin(fNumber);
      console.log("User logged in and JWT token created");
    } catch (error) {
      console.error("Error setting up JWT after login:", error);
    }

    console.log("user", user);
  };

  const handleLogout = () => {
    // Clear JWT data and stop refresh cycle
    clearJWTData();

    // Reset user login state
    setUserLogin(false);

    // Clear user data from Redux store
    dispatch(clearLogout());

    // Close the sheet
    setOpen(false);

    // Reset other local states
    setOtp("");
    setPhoneNumber("");
    setFNumber("");
    setStage("phone");

    // Show success message
    toast.success("Logged out successfully");

    console.log("User logged out successfully");
  };

  // console.log("orderDAta", orderData[0]?.diningDetails?.orders.length);

  return (
    <>
      <div id="recaptcha-container" />
      {loadScript && (
        <Script
          type="text/javascript"
          src="https://checkout.razorpay.com/v1/checkout.js"
        />
      )}

      <header className="mx-auto max-w-2xl px-2 py-2">
        <div className="flex items-center justify-end">
          {isUserLoggedIn() ? (
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                asChild
                className="w-9 h-9  rounded-full p-2 border-2  border-green-500"
              >
                <User />
              </SheetTrigger>

              <SheetContent
                side="right"
                className="w-[330px] sm:w-[330px] flex flex-col overflow-y-auto  "
              >
                <SheetHeader className="space-y-0 pt-5">
                  <SheetTitle className="text-xl">
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-10 w-10 cursor-pointer">
                          <AvatarImage alt="Restaurant logo" src={data.logo} />
                        </Avatar>
                        <h1 className="text-lg font-semibold">
                          {data.name || "Restaurant Name"}
                        </h1>
                      </div>
                      <LogOut className="h-5 w-5" onClick={handleLogout} />
                    </div>
                  </SheetTitle>
                </SheetHeader>
                <SheetDescription></SheetDescription>
                <div>
                  {orders.length > 0 && (
                    <span className="text-sm font-semibold">Orders</span>
                  )}
                  <div className="space-y-2 py-2">
                    {orders.map((order: any, index: number) => (
                      <div key={index}>
                        <Accordion type="single" collapsible>
                          <AccordionItem value="item-1">
                            <AccordionTrigger>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div
                                    className={
                                      !order.timeOfFullfilment
                                        ? "w-12 h-12 bg-gradient-to-br from-blue-300 to-blue-500 rounded-xl flex items-center justify-center shadow-md"
                                        : "w-12 h-12 bg-gradient-to-br from-green-300 to-green-500 rounded-xl flex items-center justify-center shadow-md"
                                    }
                                  >
                                    {order.location === "Delivery" ? (
                                      <Bike className="h-6 w-6 text-white" />
                                    ) : (
                                      <>
                                        <Image
                                          src="/images/takeaway.svg"
                                          alt="takeaway"
                                          width={24}
                                          height={24}
                                        />
                                      </>
                                    )}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-mono text-sm font-bold text-gray-800">
                                        {order.orderId}
                                      </span>
                                      {!order.timeOfFullfilment && (
                                        <Badge variant="default">active</Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        {new Date(
                                          order.timeOfRequest
                                        ).toLocaleTimeString("en-US", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                          hour12: true,
                                        })}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Package className="h-4 w-4" />
                                        {order?.items?.length} Items
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              {order.location === "Delivery" &&
                                !order.timeOfFullfilment && (
                                  <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-1 mb-4">
                                    <Button
                                      variant="ghost"
                                      className="w-full text-orange-700 hover:text-orange-800 hover:bg-orange-200 font-medium"
                                      onClick={() => {
                                        dispatch(setDelivery(order));
                                        router.push("/tracking");
                                      }}
                                    >
                                      🚚 Track Your Order →
                                    </Button>
                                  </div>
                                )}
                              {order?.items?.map((itm: any, index: number) => (
                                <div className="space-y-4 mb-4" key={index}>
                                  <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <p className="font-semibold text-gray-800">
                                          {itm.name}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                          {itm.count}x {itm.quantity}
                                        </p>
                                      </div>
                                      <span className="flex items-center gap-1 font-bold text-lg">
                                        <IndianRupee className="h-3 w-3" />
                                        {itm.price}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}

                              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span>
                                      Subtotal ({order?.items?.length} items)
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <IndianRupee className="h-3 w-3" />
                                      {order?.payment?.subtotal}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-green-600">
                                    <span>Discount</span>
                                    <span className="flex items-center gap-1">
                                      <IndianRupee className="h-3 w-3" />
                                      {order?.payment?.discount?.amount}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Taxes (18%)</span>
                                    <span className="flex items-center gap-1">
                                      <IndianRupee className="h-3 w-3" />
                                      {order?.payment?.gst?.gstAmount}
                                    </span>
                                  </div>
                                  <Separator />
                                  <div className="flex justify-between font-bold text-base pt-2">
                                    <span>Total Paid</span>
                                    <div className="flex items-center gap-2">
                                      <Badge className="bg-green-500">
                                        ✓ Paid
                                      </Badge>
                                      <span className="flex items-center gap-1">
                                        <IndianRupee className="h-3 w-3" />
                                        {order?.payment?.price}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-3 text-sm bg-blue-50 rounded-lg p-4">
                                <h4 className="font-semibold text-gray-800 mb-2">
                                  {order?.location === "Delivery"
                                    ? "Delivery Details"
                                    : "Takeaway Details"}
                                </h4>
                                {order?.location === "Delivery" && (
                                  <div className="flex items-start gap-3">
                                    <MapPin className="h-4 w-4 text-blue-600 mt-0.5" />
                                    <div>
                                      <p className="font-medium text-gray-800">
                                        Delivery Address
                                      </p>
                                      <p className="text-gray-600">
                                        {order?.address?.address}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                <div className="flex items-center gap-3">
                                  <Phone className="h-4 w-4 text-blue-600" />
                                  <div>
                                    <span className="font-medium text-gray-800">
                                      Contact:{" "}
                                    </span>
                                    <span className="text-gray-600">
                                      {order?.customer?.phone}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    ))}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  if (!userLogin) {
                    setPhoneDrawerOpen(true);
                  }
                }}
              >
                Login
              </Button>
              <Drawer open={phoneDrawerOpen} onOpenChange={setPhoneDrawerOpen}>
                <DrawerContent className="rounded-t-3xl">
                  <DrawerDescription></DrawerDescription>

                  <DrawerHeader>
                    <DrawerTitle>
                      {stage === "phone"
                        ? "Enter your phone number"
                        : "Enter  OTP"}
                    </DrawerTitle>
                  </DrawerHeader>

                  <div className="space-y-4 px-3 py-2">
                    {stage === "phone" && (
                      <Input
                        placeholder="Enter your phone number"
                        value={phoneNumber}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Only allow numbers and limit to 10 digits
                          if (/^\d{0,10}$/.test(value)) {
                            setPhoneNumber(value);
                          }
                        }}
                        className="rounded-lg"
                        type="tel"
                        pattern="[0-9]*"
                        maxLength={10}
                        autoFocus
                      />
                    )}
                    {stage === "otp" && (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-center ">
                          <InputOTP
                            maxLength={6}
                            value={otp}
                            onChange={(value) => setOtp(value)}
                            onComplete={handleOtpSubmit}
                            autoFocus
                          >
                            <InputOTPGroup>
                              <InputOTPSlot index={0} />
                              <InputOTPSlot index={1} />
                              <InputOTPSlot index={2} />
                            </InputOTPGroup>
                            <InputOTPSeparator />
                            <InputOTPGroup>
                              <InputOTPSlot index={3} />
                              <InputOTPSlot index={4} />
                              <InputOTPSlot index={5} />
                            </InputOTPGroup>
                          </InputOTP>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          {count > 0 ? (
                            `Resend OTP in ${count}s`
                          ) : (
                            <Button
                              variant="ghost"
                              className="h-6 text-sm text-blue-500 py-0"
                              onClick={handleResendOtp}
                            >
                              Resend OTP
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <DrawerFooter className="px-3 py-2 bg-background rounded-2xl ">
                    <Button
                      className="flex-1 py-3 rounded-lg"
                      onClick={
                        stage === "phone" ? handlePhoneSubmit : handleOtpSubmit
                      }
                    >
                      {stage === "phone" ? "Continue" : "Verify"}
                      {isLoading && (
                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      )}
                    </Button>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
            </>
          )}
        </div>
      </header>
      <div className="px-2 pb-1">
        <div className="h-12  relative flex items-center rounded-xl border focus-within:ring-1 focus-within:ring-ring  pl-3 ">
          <Search
            className="h-5 w-5 text-muted-foreground"
            onClick={() => setExpanded(!expanded)}
            strokeWidth={3}
          />

          <Input
            className="h-12 shadow-none rounded-xl  border-none   pl-4 focus-visible:ring-0"
            placeholder="Search anything"
            type="search"
            onChange={(e) => dispatch(searchTerm(e.target.value))}
          />
        </div>
      </div>
    </>
  );
}
