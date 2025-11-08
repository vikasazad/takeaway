"use client";

import React, { useState, useEffect } from "react";
import {
  Bike,
  Clock,
  IndianRupee,
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
  addTax,
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
import { clearDeliveryRedux, setDelivery } from "@/lib/features/deliverySlice";
import { getRestaurantTax } from "../../main/utils/mainRestaurantApi";
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
  const delivery: any = useSelector(
    (state: RootState) => state.delivery?.delivery
  );
  console.log("delivery in header:", delivery);
  // JWT Token Configuration

  const [expanded, setExpanded] = useState(false);
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
    if (user?.phone && user?.phone?.length > 0) {
      const unsubscribe = findOrderData(
        "vikumar.azad@gmail.com",
        user.phone,
        (result: any) => {
          if (result) {
            const orders: any[] = [];
            // console.log("result", result);
            Object.entries(result?.current).forEach(([, value]) => {
              orders.push(value);
            });
            if (result?.prev?.length > 0) {
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

      const res = await handleAfterLogin();
      if (!res) toast.error("Something went wrong. Please try again.");
      setUserLogin(true);
      setPhoneDrawerOpen(false);
      setStage("phone");
      setOtp("");
      setPhoneNumber("");
      setFNumber("");
      setIsLoading(false);
      // setLoadScript(true);
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
    console.log("userLoginnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn", userLogin);

    const user = await findUser(phoneNumber, "vikumar.azad@gmail.com");
    if (!user) {
      const register = await registerUser(
        phoneNumber,
        "vikumar.azad@gmail.com"
      );
      const tax = await getRestaurantTax();
      if (!tax) {
        toast.error("Something went wrong");
        return false;
      }
      if (!register) {
        toast.error("Something went wrong");
        return false;
      }
    }

    const tax = await getRestaurantTax();
    console.log("taxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", tax);
    if (!tax) {
      toast.error("Something went wrong");
      return false;
    }
    // setUserLogin(true);
    // Phone will be stored by setupJWTAfterLogin
    dispatch(
      addUser({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || [],
      })
    );

    dispatch(addInfo(data));
    dispatch(addTax(tax));
    try {
      // Set up JWT after successful login
      await setupJWTAfterLogin(fNumber);
      console.log("User logged in and JWT token created");
      return true;
    } catch (error) {
      console.error("Error setting up JWT after login:", error);
      return false;
    }
  };

  const handleLogout = () => {
    // Clear JWT data and stop refresh cycle
    clearJWTData();

    // Reset user login state
    setUserLogin(false);

    // Clear user data from Redux store
    dispatch(clearLogout());
    dispatch(clearDeliveryRedux());

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

      <header className="mx-auto max-w-2xl px-2 py-2">
        <div className="flex items-center justify-end">
          {isUserLoggedIn() ? (
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                asChild
                className="w-9 h-9  rounded-full p-2 border-2   [box-shadow:var(--shadow-m)]"
              >
                <User className="bg-[#FF8080] text-white " />
              </SheetTrigger>

              <SheetContent
                side="right"
                className="w-[330px] sm:w-[330px] flex flex-col overflow-y-auto  py-6 px-2 gap-1"
              >
                <SheetHeader className="space-y-0 pt-5 ">
                  <SheetTitle className="text-xl py-2 px-3 bg-[#FF8080] rounded-lg text-white [box-shadow:var(--shadow-s)]">
                    <div className="flex items-center justify-between   ">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8 cursor-pointer [box-shadow:var(--shadow-m)]">
                          <AvatarImage alt="Restaurant logo" src={data.logo} />
                        </Avatar>
                        <h1 className="text-lg font-semibold text-left">
                          {data.name || "Restaurant Name"}
                        </h1>
                      </div>
                      <Button
                        className="text-white bg-transparent [box-shadow:var(--shadow-m)] hover:bg-transparent hover:text-white"
                        onClick={handleLogout}
                        variant="outline"
                        size="sm"
                      >
                        Logout
                      </Button>
                    </div>
                  </SheetTitle>
                </SheetHeader>
                <SheetDescription></SheetDescription>
                <div>
                  {orders.length > 0 && (
                    <span className="text-lg font-bold px-4 text-muted-foreground">
                      Orders
                    </span>
                  )}
                  <div className="space-y-2 py-2 px-4">
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
                                        ? "w-12 h-12 bg-gradient-to-br from-[#FF8080]/55 to-[#FF8080] rounded-xl flex items-center justify-center [box-shadow:var(--shadow-m)]"
                                        : "w-12 h-12 bg-gradient-to-br from-green-300 to-green-500 rounded-xl flex items-center justify-center [box-shadow:var(--shadow-m)]"
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
                                      <span className=" text-base font-bold text-gray-800">
                                        {order.orderId}
                                      </span>
                                      {!order.timeOfFullfilment && (
                                        <Badge
                                          variant="default"
                                          className="bg-[#FF8080] text-white [box-shadow:var(--shadow-m)] hover:bg-[#FF8080]/80 border-none"
                                        >
                                          active
                                        </Badge>
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
                                  <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-1 mb-4 [box-shadow:var(--shadow-s)]">
                                    <Button
                                      variant="ghost"
                                      className="w-full text-orange-700 hover:text-orange-800 hover:bg-orange-200 font-medium"
                                      onClick={() => {
                                        // console.log(order);
                                        dispatch(
                                          setDelivery({
                                            order,
                                            from: "tracking",
                                          })
                                        );
                                        localStorage.setItem(
                                          "tracking-id",
                                          order.orderId
                                        );
                                        // dispatch(clearDeliveryRedux());
                                        router.push("/tracking");
                                      }}
                                    >
                                      🚚 Track Your Order →
                                    </Button>
                                  </div>
                                )}
                              {order?.items?.map((itm: any, index: number) => (
                                <div className="space-y-4 mb-4" key={index}>
                                  <div className=" rounded-lg p-3 [box-shadow:var(--shadow-inset)]">
                                    <div className="flex justify-between items-center ">
                                      <div>
                                        <p className="font-bold text-gray-800 text-base ">
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

                              <div className=" rounded-lg p-4 mb-4 [box-shadow:var(--shadow-m)]">
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-xs font-semibold text-muted-foreground">
                                      Subtotal ({order?.items?.length} items)
                                    </span>
                                    <span className="flex items-center gap-1 text-xs font-bold">
                                      <IndianRupee className="h-3 w-3" />
                                      {order?.payment?.subtotal}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-green-600">
                                    <span className="text-xs font-semibold text-muted-foreground">
                                      Discount
                                    </span>
                                    <span className="flex items-center gap-1 text-xs font-bold">
                                      <IndianRupee className="h-3 w-3" />
                                      {order?.payment?.discount?.amount || 0}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-xs font-semibold text-muted-foreground">
                                      Taxes (
                                      {order?.payment?.gst?.gstPercentage}%)
                                    </span>
                                    <span className="flex items-center gap-1 text-xs font-bold">
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

                              <div className="space-y-3 text-sm  rounded-lg p-4 [box-shadow:var(--shadow-m)]">
                                <h4 className="font-semibold text-gray-800 mb-2 text-base">
                                  {order?.location === "Delivery"
                                    ? "Delivery Details"
                                    : "Takeaway Details"}
                                </h4>
                                {order?.location === "Delivery" && (
                                  <div className="flex items-start gap-3">
                                    <MapPin className="h-4 w-4 text-[#FF8080] mt-0.5" />
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
                                  <Phone className="h-4 w-4 text-[#FF8080]" />
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
                variant="default"
                onClick={() => {
                  if (!userLogin) {
                    setPhoneDrawerOpen(true);
                  }
                }}
                className="bg-[#FF8080] text-white [box-shadow:var(--shadow-m)] hover:bg-[#FF8080]/80"
              >
                Login
              </Button>

              <Drawer open={phoneDrawerOpen} onOpenChange={setPhoneDrawerOpen}>
                <DrawerContent className="rounded-t-3xl">
                  <DrawerDescription></DrawerDescription>

                  <DrawerHeader>
                    <DrawerTitle>
                      {stage === "phone" ? (
                        "Enter your phone number"
                      ) : (
                        <div className="flex flex-col gap-1 ">
                          <span className="text-md font-bold">
                            Verify with OTP
                          </span>
                          <span className="text-xs text-muted-foreground tracking-wide">
                            Sent via SMS to {phoneNumber}
                          </span>
                          {user?.tag === "restaurant" && (
                            <span
                              className="text-xs text-[#FF8080] tracking-wide "
                              onClick={() => {
                                setStage("phone");
                                setPhoneNumber("");
                                stopCountdown();
                                setOtp("");
                              }}
                            >
                              Change number?
                            </span>
                          )}
                        </div>
                      )}
                    </DrawerTitle>
                  </DrawerHeader>

                  <div className="space-y-4 px-3 py-2">
                    {stage === "phone" && (
                      <Input
                        placeholder="Enter your phone number"
                        value={phoneNumber}
                        onChange={(e) => {
                          if (/^\d{0,10}$/.test(e.target.value)) {
                            setPhoneNumber(e.target.value);
                          }
                        }}
                        className="rounded-lg"
                        type="tel"
                        pattern="[0-9]*"
                        maxLength={10}
                        minLength={10}
                        inputMode="numeric"
                        required
                        aria-invalid={false}
                        aria-describedby="phone-error"
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
                      className="flex-1 py-3 rounded-lg bg-[#FF8080] text-white [box-shadow:var(--shadow-m)] hover:bg-[#FF8080]/80"
                      onClick={
                        stage === "phone" ? handlePhoneSubmit : handleOtpSubmit
                      }
                      disabled={
                        isLoading ||
                        phoneNumber.length !== 10 ||
                        (stage === "otp" && otp.length !== 6)
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
        <div className="h-12  relative flex items-center rounded-xl border focus-within:ring-1 focus-within:ring-ring  pl-3 [box-shadow:var(--shadow-s)]">
          <Search
            className="h-5 w-5 text-muted-foreground text-[#FF8080]"
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
