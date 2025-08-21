"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Minus,
  Plus,
  ChevronLeft,
  HandPlatter,
  Pencil,
  Trash2,
  Dot,
  ChevronRight,
  Info,
  IndianRupee,
  Ellipsis,
} from "lucide-react";
import { PiMapPinFill } from "react-icons/pi";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import {
  addData,
  addInfo,
  addUser,
  clearCart,
  clearSpecific,
  decrement,
  increment,
  setFinalOrder,
} from "@/lib/features/addToOrderSlice";
import { useRouter } from "next/navigation";
import Script from "next/script";
import {
  addKitchenOrder,
  calculateTax,
  calculateTotal,
  findCoupon,
  getOnlineStaffFromFirestore,
  saveUserContactDetails,
  sendHotelDeliveryOrder,
  // sendStaffAssignmentRequest,
  sendTakeawayOrder,
  sendWhatsAppMessageDeliveryConfirmation,
  sendWhatsAppMessageTakeawayConfirmation,
} from "../utils/orderApi";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ToggleGroupItem } from "@/components/ui/toggle-group";
import { ToggleGroup } from "@/components/ui/toggle-group";
import Image from "next/image";
import { deleteAddress } from "../../address/utils/addressApi";
import { setEditAddress } from "@/lib/features/editAddressSlice";
import { Icons } from "@/components/ui/icons";
import { authPhoneOtp, resendOtp, verifyOtp } from "@/lib/auth/handleOtp";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { registerUser } from "../../auth/utils/authApi";
import { findUser } from "../../auth/utils/authApi";
import { setupJWTAfterLogin } from "@/lib/auth/jwtService";
import { getRestaurantInfo } from "../../main/utils/mainRestaurantApi";

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

export default function OrderCard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, info } = useSelector(
    (state: RootState) => state.addToOrderData
  );

  console.log("user", user);

  const ordereditems = useSelector(
    (state: RootState) => state.addToOrderData.addToOrderData
  );
  // console.log("ordereditems", ordereditems);
  // const token = useSelector((state: RootState) => state.addToOrderData.token);

  const [selectedPortion, setSelectedPortion] = useState("");
  const [activeItem, setActiveItem] = useState<any | null>(null);
  const [specialRequirements, setSpecialRequirements] = useState("");
  const [tempSpecialRequirements, setTempSpecialRequirements] = useState("");
  const [isSpecialRequestsOpen, setIsSpecialRequestsOpen] = useState(false);
  const [finalPrice, setfinalPrice] = useState(0);
  const [loadScript, setLoadScript] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [phoneDrawerOpen, setPhoneDrawerOpen] = useState(false);
  const [fNumber, setFNumber] = useState("");
  const [verificationId, setVerificationId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [stage, setStage] = useState<"phone" | "otp">("phone");
  const [count, startCountdown, stopCountdown] = useCountdown(30);
  const [coupon, setCoupon] = useState<{
    code: string;
    discount: number;
    type: string;
  } | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [isCouponDrawerOpen, setIsCouponDrawerOpen] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [isPaymentDetailsOpen, setIsPaymentDetailsOpen] = useState(false);

  const [selectedToggle, setSelectedToggle] = useState("Delivery");
  const [contactDetailsDrawerOpen, setContactDetailsDrawerOpen] =
    useState(false);
  const [contactDetails, setContactDetails] = useState({
    name: user?.name || "User",
    phone: user?.phone || "",
    email: user?.email || "",
    address:
      user?.address?.length > 0
        ? user?.address?.find((item: any) => item.default)?.address
        : "",
    type:
      user?.address?.length > 0
        ? user?.address?.find((item: any) => item.default)?.type
        : "",
  });
  const [addressDrawerOpen, setAddressDrawerOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string>("");

  // console.log("coupon", coupon);

  const handleCouponApply = async () => {
    if (couponInput.trim()) {
      // Mock coupon validation - in real app, this would be an API call
      const couponCode = couponInput.trim().toUpperCase();
      const couponResult = await findCoupon(couponCode);
      console.log("couponResult", couponResult);
      if (couponResult) {
        // console.log("couponResult", couponResult);
        setCoupon({
          code: couponResult.code,
          discount: couponResult.amount,
          type: couponResult.type,
        });
        const total = ordereditems.reduce((total, item) => {
          const price = item.item.price[item.selectedType];
          return total + price * item.count;
        }, 0);
        // console.log("total", total);
        if (couponResult.type === "percentage") {
          setDiscount(total * (couponResult.amount.replace("%", "") / 100));
        } else {
          setDiscount(couponResult.amount);
        }
        setCouponInput("");
      } else {
        toast.error("Invalid coupon code");
      }
    }
    setIsCouponDrawerOpen(false);
  };

  const handleContactDetailsSave = async () => {
    if (
      user?.name === contactDetails.name &&
      user?.phone === contactDetails.phone
    ) {
      toast.success("Contact details saved successfully");
      setContactDetailsDrawerOpen(false);
      return;
    } else {
      const res = await saveUserContactDetails(user?.phone, contactDetails);
      console.log("res", res);
      if (!res) toast.error("Failed to save contact details");
      setContactDetailsDrawerOpen(false);
    }
  };

  const handleAddressSelect = (address: any) => {
    setContactDetails({
      ...contactDetails,
      address: address.address,
      type: address.type,
    });
    setAddressDrawerOpen(false);
    // toast.success("Address updated successfully");
  };

  const handleDeleteAddress = async (type: string) => {
    console.log("type", type);
    const res = await deleteAddress(
      user?.phone,
      type,
      "vikumar.azad@gmail.com"
    );
    console.log("res", res);
    if (!res) toast.error("Failed to delete address");
    dispatch(
      addUser({
        ...user,
        address: user?.address?.filter((item: any) => item.type !== type),
      })
    );
    setAddressDrawerOpen(false);
  };
  // console.log("discount", discount);
  useEffect(() => {
    const total =
      ordereditems.reduce((total, item) => {
        const price = item.item.price[item.selectedType];
        return total + price * item.count;
      }, 0) - discount;
    // console.log("total", total);
    const digit = Number(user?.tax.gstPercentage) || 0;
    // console.log(digit);
    const tax = Math.round((total * digit) / 100);

    setfinalPrice(total + tax);
  }, [ordereditems, user, coupon]);

  const removeAfterZero = (item: any, id: any) => {
    if (ordereditems.length === 1) {
      if (ordereditems[0].count <= 1) {
        router.back();
        dispatch(clearCart());
      }
    }
    // console.log("dfhdfhdfgh", id.count);
    if (item.count <= 1) {
      dispatch(clearSpecific(id));
    }
  };
  const handlePortionSelect = (item: any) => {
    if (item.selectedType !== "Single") {
      setActiveItem(item);
    } else {
      dispatch(increment({ id: item.item.id }));
    }
  };

  const addItemWithPortion = (item: any) => {
    console.log("item", item);
    if (activeItem && selectedPortion) {
      dispatch(
        addData({
          data: item.item,
          selectedType: selectedPortion,
        })
      );
      setActiveItem(null);
      setSelectedPortion("");
    }
  };

  const handleSpecialRequestsOpen = () => {
    console.log("specialRequirements");
    setTempSpecialRequirements(specialRequirements);
    setIsSpecialRequestsOpen(true);
  };

  const handleSpecialRequestsAdd = () => {
    setSpecialRequirements(tempSpecialRequirements);
    setIsSpecialRequestsOpen(false);
  };

  const handleSpecialRequestsClear = () => {
    setTempSpecialRequirements("");
    setSpecialRequirements("");
  };

  // console.log(finalPrice);
  function generateOrderId(restaurantCode: string, orderType: string) {
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    const orderId = `${restaurantCode}:${orderType}:${randomNumber}`;
    return orderId;
  }
  const createOrderData = (data: any) => {
    // console.log("kjjkjjhjhjhjhjh", data);
    const object = {
      id: data.item.id,
      name: data.item.name,
      quantity: data.selectedType,
      price: data.item.price[data.selectedType],
      count: data.count,
    };
    return object;
  };
  const handlePlaceOrder = async () => {
    setIsLoading(true);
    if (user?.address?.length === 0 && selectedToggle === "Delivery") {
      router.push("/address");
      return;
    } else {
      if (contactDetails.phone === "") {
        setIsLoading(false);
        setPhoneDrawerOpen(true);
        return;
      }
    }
    setLoadScript(true);
    createOrder();
    setIsLoading(false);

    // createOrder();
    // router.push("/Detail");
  };
  // console.log("type", contactDetails.type);

  const createOrder = async () => {
    const res = await fetch("/api/createOrder", {
      method: "POST",
      body: JSON.stringify({ amount: finalPrice * 100 }),
    });
    const data = await res.json();

    // console.log("asdfasd", process.env.RAZORPAY_API_KEY);
    // console.log("asdfasd", process.env.NEXT_PUBLIC_RAZORPAY_API_KEY);

    const paymentData = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_API_KEY,
      order_id: data.id,
      name: "Rosier",
      description: "Thank you",
      image: "",
      prefill: {
        name: user?.name || "Guest",
        contact: localStorage.getItem("phone") || "",
      },
      notes: {
        address: "Razorpay Corporate Office",
      },
      theme: {
        color: "#121212",
      },
      handler: async function (response: any) {
        const res = await fetch("/api/verifyOrder", {
          method: "POST",
          body: JSON.stringify({
            orderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          }),
        });
        const data = await res.json();

        if (data.isOk) {
          startTransition(async () => {
            const orderId =
              selectedToggle === "Delivery"
                ? generateOrderId("RES", "DEL")
                : generateOrderId("RES", "TY");
            const orderData: any = {
              orderId: orderId,
              orderedItem: [],
              orderAmount: finalPrice,
              subtotal: calculateTotal(ordereditems),
              gstPercentage: user?.tax.gstPercentage || "",
              gstAmount: user?.tax.gstPercentage
                ? calculateTax(
                    ordereditems,
                    discount || 0,
                    user?.tax.gstPercentage
                  )
                : "",
              contact: contactDetails.phone || "",
              name: contactDetails.name || "",
              email: contactDetails.email || "",
              timeOfOrder: new Date().toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              }),
              timeOfService: "",
              estimatedDeliveryTime: "",
              specialrequirements: specialRequirements,
              discountCode: coupon?.code || "",
              discountAmount: discount || 0,
              discountType: coupon?.type || "",
              orderType: selectedToggle,
              address:
                selectedToggle === "Delivery"
                  ? user?.address?.find(
                      (item: any) => item.type === contactDetails.type
                    )
                  : "",
            };
            console.log("orderData", orderData);

            ordereditems.map((er: any) => {
              return orderData.orderedItem.push(createOrderData(er));
            });

            dispatch(setFinalOrder(orderData));
            const attendant: any = await getOnlineStaffFromFirestore(
              "vikumar.azad@gmail.com"
            );
            console.log("attendant", attendant);

            if (selectedToggle === "Delivery") {
              await sendHotelDeliveryOrder(orderData, attendant);
              await addKitchenOrder(
                "vikumar.azad@gmail.com",
                generateOrderId("RES", "DEL"),
                user?.name || "Delivery",
                ordereditems.map((er: any) => {
                  return createOrderData(er);
                }),
                finalPrice
              );

              if (localStorage.getItem("phone")) {
                console.log("user?.phone", localStorage.getItem("phone"));
                await sendWhatsAppMessageDeliveryConfirmation(
                  localStorage.getItem("phone") || "",
                  [orderId, "Wah Bhai Wah"]
                );
              }

              //  await sendStaffAssignmentRequest(
              //    attendant?.name,
              //    attendant?.contact,
              //    orderId,
              //    user?.name || "Guest",
              //    user?.tableNo || "Takeaway",
              //    "table"
              //  );
            } else {
              const newOrder = await sendTakeawayOrder(orderData);
              console.log("newOrder", newOrder);
              await addKitchenOrder(
                "vikumar.azad@gmail.com",
                generateOrderId("RES", "TY"),
                user?.name || "Takeaway",
                ordereditems.map((er: any) => {
                  return createOrderData(er);
                }),
                finalPrice
              );
              if (localStorage.getItem("phone")) {
                console.log("user?.phone", localStorage.getItem("phone"));
                await sendWhatsAppMessageTakeawayConfirmation(
                  localStorage.getItem("phone") || "",
                  [orderId, "Wah Bhai Wah"]
                );
              }

              // await sendStaffAssignmentRequest(
              //   attendant?.name,
              //   attendant?.contact,
              //   orderId,
              //   user?.name || "Guest",
              //   user?.tableNo || "Takeaway",
              //   "table"
              // );
            }

            router.push("/orderConfirmation");
          });
        } else {
          const orderId =
            selectedToggle === "Delivery"
              ? generateOrderId("RES", "DEL")
              : generateOrderId("RES", "TY");
          console.log("New Order ID:", orderId);
          console.log("first", ordereditems);
          const orderData: any = {
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            orderId: orderId,
            orderSuccess: false,
            orderedItem: [],
            orderAmount: finalPrice,
            subtotal: calculateTotal(ordereditems),
            gstPercentage: user?.tax.gstPercentage || "",
            gstAmount: "",
            contactNo: "",
            name: "",
            email: "",
            problemFood: "",
            problemService: "",
            timeOfOrder: new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }),
            timeOfService: "",
            tableNo: "T-8",
            estimatedDeliveryTime: "",
            deliveryAddress: "",
            specialrequirements: specialRequirements,
          };
          ordereditems.map((er: any) => {
            return orderData.orderedItem.push(createOrderData(er));
          });
          dispatch(setFinalOrder(orderData));
          console.log(orderData);
          router.push("/orderConfirmation");
          alert("Payment failed");
        }
      },
    };

    const payment = new (window as any).Razorpay(paymentData);
    payment.open();
  };

  // console.log("selectedAddress", selectedAddress);

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
      // setUserLogin(true);
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
    setContactDetails({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      type:
        user?.address?.length > 0
          ? user?.address?.find((item: any) => item.default)?.type
          : "",
      address:
        user?.address?.length > 0
          ? user?.address?.find((item: any) => item.default)?.address
          : "",
    });
    const data = await getRestaurantInfo();
    if (!data) {
      toast.error("Something went wrong");
      return;
    }
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

  return (
    <>
      <div id="recaptcha-container" />
      <div className=" border-b border-[#f0f0f0] rounded-bl-3xl px-2 py-3 box-shadow-lg">
        <div className="flex items-center gap-2">
          <div
            className="ml-2 w-7 h-8  border-2 border-muted rounded-lg box-shadow-lg flex items-center justify-center"
            onClick={() => router.back()}
          >
            <ChevronLeft className="h-6 w-6 " strokeWidth={3} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{info?.name}</span>
            <span className="text-xs text-muted-foreground">
              {info?.address}
            </span>
          </div>
        </div>
      </div>
      <div className="w-full max-w-md mx-auto p-4">
        {isPending && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">
                Processing your order...
              </p>
            </div>
          </div>
        )}
        {loadScript && (
          <Script
            type="text/javascript"
            src="https://checkout.razorpay.com/v1/checkout.js"
          />
        )}

        <Card className="relative rounded-3xl">
          <CardHeader className="p-4">
            <div className="flex items-center justify-between">
              <h1 className="text-md font-bold">{selectedToggle} Order</h1>

              <HandPlatter className="h-6 w-6" />
            </div>
          </CardHeader>
          <CardContent className="px-3 py-3 space-y-4">
            {ordereditems.map((item, id) => (
              <div key={id} className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="w-4 h-4 mt-1">
                    <div
                      className={cn(
                        "w-full h-full border rounded-sm",
                        item.item.nature === "Veg"
                          ? "border-green-500"
                          : "border-red-500"
                      )}
                    >
                      <div
                        className={cn(
                          "w-2 h-2 m-0.5 rounded-full",
                          item.item.nature === "Veg"
                            ? "bg-green-500"
                            : "bg-red-500"
                        )}
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">{item.item.name}</h3>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">
                        {item.selectedType}
                      </p>
                      <Dot className="h-2 w-2 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        ₹{item.item.price[item.selectedType]}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right ">
                  <div className="inline-flex items-center rounded-md bg-white border border-grey">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        dispatch(decrement({ id: id }));
                        removeAfterZero(item, id);
                      }}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center">{item.count}</span>
                    <Drawer>
                      <DrawerTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handlePortionSelect(item)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </DrawerTrigger>
                      {activeItem &&
                        typeof activeItem.item.price === "object" && (
                          <DrawerContent className="h-[250px]">
                            <DrawerHeader>
                              <DrawerTitle>{activeItem.item.name}</DrawerTitle>
                            </DrawerHeader>
                            <DrawerDescription></DrawerDescription>
                            <div className="py-6 px-4">
                              <RadioGroup
                                value={selectedPortion}
                                onValueChange={setSelectedPortion}
                              >
                                {Object.entries(activeItem.item.price).map(
                                  ([size, price]: any) => (
                                    <div
                                      key={size}
                                      className="flex items-center justify-between py-2"
                                    >
                                      <Label htmlFor={size}>{size}</Label>
                                      <div className="flex items-center space-x-4">
                                        <span className="text-green-500">
                                          + {price}
                                        </span>
                                        <RadioGroupItem
                                          value={size}
                                          id={size}
                                        />
                                      </div>
                                    </div>
                                  )
                                )}
                              </RadioGroup>
                              <div className="flex gap-4 mt-6">
                                <Button
                                  variant="outline"
                                  className="w-full"
                                  onClick={() => setActiveItem(null)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  className="w-full"
                                  onClick={() => addItemWithPortion(activeItem)}
                                >
                                  Add
                                </Button>
                              </div>
                            </div>
                          </DrawerContent>
                        )}
                    </Drawer>
                  </div>
                  <p className="mt-1 font-medium">
                    ₹ {item.item.price[item.selectedType]}
                  </p>
                </div>
              </div>
            ))}

            <hr
              className="w-full mt-4 border-t-2 border-dashed border-transparent"
              style={{
                borderImageSource:
                  "repeating-linear-gradient(to right, #f0f0f0 0, #f0f0f0 8px, transparent 10px, transparent 15px)",
                borderImageSlice: 1,
              }}
            />

            <div className="">
              <div
                className=" flex items-center justify-between w-full p-3 border border-input bg-[#f0f0f0] rounded-xl cursor-pointer "
                onClick={() => {
                  handleSpecialRequestsOpen();
                }}
              >
                <span
                  className={
                    specialRequirements
                      ? "text-foreground text-xs"
                      : "text-muted-foreground text-xs"
                  }
                >
                  {specialRequirements || "Add special requests"}
                </span>
                <Pencil className="h-4 w-4 text-muted-foreground" />
              </div>

              <Drawer
                open={isSpecialRequestsOpen}
                onOpenChange={setIsSpecialRequestsOpen}
              >
                <DrawerContent className="h-auto max-h-[80vh] p-0 bg-slate-50">
                  <DrawerDescription></DrawerDescription>
                  <div className="flex flex-col h-full">
                    <DrawerHeader className="px-3 py-0 ">
                      <div className="flex items-center justify-between">
                        <DrawerTitle className="text-md font-semibold">
                          Add special instructions
                        </DrawerTitle>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleSpecialRequestsClear}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </DrawerHeader>

                    <div className="flex-1 px-3 py-2">
                      <div className="space-y-4">
                        <div className="relative">
                          <Textarea
                            placeholder="Start typing instructions"
                            value={tempSpecialRequirements}
                            onChange={(e) =>
                              setTempSpecialRequirements(e.target.value)
                            }
                            className="min-h-[80px] resize-none rounded-xl text-xs"
                            maxLength={200}
                          />
                          <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
                            {tempSpecialRequirements.length}/200
                          </div>
                        </div>

                        <p className="text-xs text-red-500">
                          Order instructions are provided for convenience, but
                          merchant adherence cannot be guaranteed. No
                          refunds/cancellations is possible.
                        </p>
                      </div>
                    </div>

                    <DrawerFooter className="px-3 py-4  bg-background rounded-2xl">
                      <div className="flex gap-3">
                        <Button
                          onClick={handleSpecialRequestsAdd}
                          className="flex-1 bg-green-200 hover:bg-green-300 text-green-800"
                        >
                          ADD
                        </Button>
                      </div>
                    </DrawerFooter>
                  </div>
                </DrawerContent>
              </Drawer>
            </div>
            {/* <div className="space-y-2 pt-4">
              <div className="flex justify-between">
                <span>MRP Total</span>
                <span>₹{calculateTotal(ordereditems)}</span>
              </div>
              {user?.tax?.gstPercentage ? (
                <div className="flex justify-between">
                  <span>Taxes</span>
                  <span>
                    ₹{calculateTax(ordereditems, user?.tax?.gstPercentage)}
                  </span>
                </div>
              ) : (
                ""
              )}

              <div className="flex justify-between font-medium pt-2 border-t">
                <span>Total Amount</span>
                <span>₹{calculateTotal(ordereditems)}</span>
                <span>
                  {user?.tax?.gstPercentage
                    ? `₹${
                        calculateTotal(ordereditems) +
                        calculateTax(ordereditems, user?.tax?.gstPercentage)
                      }`
                    : `₹${calculateTotal(ordereditems)}`}
                </span>
              </div>
            </div> */}
          </CardContent>
        </Card>

        <Card className="mt-4 rounded-3xl mb-4">
          <CardHeader className="px-4 py-2">
            <div className="flex items-center justify-between">
              <h1 className="text-md font-bold">Payment Details</h1>

              <ChevronRight
                className="self-right h-4 w-4 cursor-pointer"
                strokeWidth={3}
                onClick={() => setIsPaymentDetailsOpen(true)}
              />
            </div>
          </CardHeader>
          <CardContent className="pt-2 pb-4 px-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between w-full">
                <p className="text-xs font-semibold">To Pay</p>
                <p className="text-xs flex items-center ">
                  <IndianRupee className="h-3 w-3" /> {finalPrice}
                </p>
                {/* I can minus the discount amount here */}
              </div>
              <div className="flex items-center justify-between w-full">
                <p className="text-xs font-semibold">
                  Total savings with discount
                </p>
                <p className="text-xs text-green-500 font-medium">
                  -₹{discount || 0}
                </p>
              </div>
              {coupon ? (
                <div className="h-5 flex items-center justify-between w-full px-2 py-0 rounded-xl bg-pink-200/50 ">
                  <div className="text-xs ">
                    You saved {""}
                    <span className="text-green-500 text-md font-semibold">
                      ₹{discount}
                    </span>{" "}
                    with{" "}
                    <span className="text-blue-500 text-md font-semibold">
                      {coupon.code}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    className="p-0 text-xs text-blue-500 underline"
                    onClick={() => {
                      setCoupon(null);
                      setDiscount(0);
                    }}
                  >
                    remove
                  </Button>
                </div>
              ) : (
                <div
                  className="text-xs text-muted-foreground"
                  onClick={() => setIsCouponDrawerOpen(true)}
                >
                  Apply Coupon
                </div>
              )}

              <Drawer
                open={isCouponDrawerOpen}
                onOpenChange={setIsCouponDrawerOpen}
              >
                <DrawerContent className="rounded-t-2xl">
                  <DrawerDescription></DrawerDescription>
                  <DrawerHeader className="text-left">
                    <DrawerTitle className="text-sm font-semibold">
                      Add Coupon for extra savings
                    </DrawerTitle>
                  </DrawerHeader>

                  <div className="px-4">
                    <Input
                      placeholder="Enter code"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="rounded-lg mb-2"
                    />
                  </div>
                  <DrawerFooter className="px-3 py-4  bg-background rounded-2xl">
                    <Button className="flex-1" onClick={handleCouponApply}>
                      Apply
                    </Button>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>

              <Drawer
                open={isPaymentDetailsOpen}
                onOpenChange={setIsPaymentDetailsOpen}
              >
                <DrawerContent className="rounded-t-2xl bg-[#f0f0f0]">
                  <DrawerDescription></DrawerDescription>
                  <DrawerHeader className="text-left pb-2 pt-1">
                    <DrawerTitle className="text-sm font-semibold">
                      Payment Details
                    </DrawerTitle>
                  </DrawerHeader>

                  <div className="mx-3 px-4 pb-4 py-3 space-y-4 bg-white rounded-2xl">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-light">
                        Item amount({ordereditems.length})
                      </span>
                      <span className="text-xs font-semibold">
                        ₹ {calculateTotal(ordereditems)}
                      </span>
                    </div>

                    {coupon && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-green-600">
                          Savings with {coupon.code}
                        </span>
                        <span className="text-xs text-green-600">
                          - ₹{discount}
                        </span>
                      </div>
                    )}

                    {coupon && (
                      <div className="flex justify-between items-center bg-pink-50 p-2 rounded-lg">
                        <span className="text-xs">{coupon.code} Applied</span>
                        <Trash2
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => {
                            setCoupon(null);
                            setDiscount(0);
                          }}
                        />
                      </div>
                    )}

                    <div className="flex justify-between items-center font-medium">
                      <span className="text-xs">Sub Total</span>
                      <span className="text-xs">
                        ₹{calculateTotal(ordereditems) - (discount || 0)}
                      </span>
                    </div>
                    <Popover>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <span className="text-xs">Taxes and charges</span>
                          <PopoverTrigger>
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </PopoverTrigger>
                        </div>
                        <span className="text-sm">
                          ₹
                          {user?.tax?.gstPercentage
                            ? calculateTax(
                                ordereditems,
                                discount || 0,
                                user?.tax?.gstPercentage
                              )
                            : 0}
                        </span>
                      </div>

                      <PopoverContent
                        className="w-60 p-0 bg-purple-50 rounded-xl"
                        side="bottom"
                        align="center"
                      >
                        <div className="px-6 py-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs">Taxes</span>
                            <span className="text-xs flex items-center gap-1">
                              <IndianRupee
                                className="h-3 w-3"
                                strokeWidth={3}
                              />
                              {user?.tax?.gstPercentage
                                ? calculateTax(
                                    ordereditems,
                                    discount || 0,
                                    user?.tax?.gstPercentage
                                  )
                                : 0}
                            </span>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>

                    <Separator />

                    <div className="flex justify-between items-center font-semibold text-xs">
                      <span>To Pay</span>
                      <span>₹{finalPrice}</span>
                    </div>
                  </div>
                </DrawerContent>
              </Drawer>
            </div>
          </CardContent>
        </Card>

        {contactDetails?.phone ? (
          <Card className=" rounded-3xl mb-4">
            <CardHeader className="px-4 pt-2 pb-0">
              <div className="flex items-center justify-between">
                <h1 className="text-md font-bold">Contact Details</h1>

                <Button
                  variant="ghost"
                  className="p-0 self-right text-xs  cursor-pointer text-purple-500 underline"
                  onClick={() => setContactDetailsDrawerOpen(true)}
                >
                  Change
                </Button>
              </div>
            </CardHeader>
            <CardContent className=" pb-2 px-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">
                  {contactDetails?.name
                    ? `${contactDetails?.name}, ${contactDetails?.phone}`
                    : contactDetails?.phone}
                  {/* vikas, +919876543210 */}
                </span>
              </div>
            </CardContent>
          </Card>
        ) : (
          ""
        )}

        <Card className=" rounded-3xl mb-[200px]">
          <CardHeader className="px-4 pt-2 pb-0">
            <h1 className="text-md font-bold">Cancellation Policy</h1>
          </CardHeader>
          <CardContent className=" pb-2 px-4 py-2">
            <p className="text-xs text-muted-foreground  leading-none">
              {/* {user?.name}, {user?.phone} */}
              Cancellation leads to food wastage. A 100% fee will be charged if
              orders are cancelled any time after we have accepted. However, in
              case of unsual delays, you will not be charged any fee.
            </p>
          </CardContent>
        </Card>

        <Drawer
          open={contactDetailsDrawerOpen}
          onOpenChange={setContactDetailsDrawerOpen}
        >
          <DrawerContent className="rounded-t-2xl">
            <DrawerDescription></DrawerDescription>
            <DrawerHeader className="text-left">
              <DrawerTitle className="text-sm font-semibold">
                Contact Details
              </DrawerTitle>
            </DrawerHeader>

            <div className="px-4">
              <Input
                placeholder="Enter name"
                value={contactDetails.name}
                onChange={(e) =>
                  setContactDetails({ ...contactDetails, name: e.target.value })
                }
                className="rounded-lg mb-2"
              />
              <Input
                placeholder="Enter phone number"
                value={contactDetails.phone}
                onChange={(e) =>
                  setContactDetails({
                    ...contactDetails,
                    phone: e.target.value,
                  })
                }
                className="rounded-lg mb-2"
              />
            </div>
            <DrawerFooter className="px-3 py-4  bg-background rounded-2xl">
              <Button className="flex-1" onClick={handleContactDetailsSave}>
                Save
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        <div className="fixed bottom-0 left-0 right-0 bg-[#FEEBF6]   rounded-t-2xl border-t ">
          {user?.address.length > 0 && (
            <div className="px-3 py-2 left-0 right-0 flex items-center justify-between  ">
              <div className=" flex items-center gap-1">
                <PiMapPinFill className="h-6 w-6 text-red-500  " />
                <span className="text-xs  truncate max-w-[250px]">
                  {selectedToggle === "Delivery"
                    ? contactDetails.address
                    : info?.address}
                </span>
              </div>
              {selectedToggle === "Delivery" && (
                <Button
                  variant="link"
                  className="p-0 h-0 text-xs  cursor-pointer text-purple-500 "
                  onClick={() => {
                    setSelectedAddress(contactDetails.type);
                    setAddressDrawerOpen(true);
                  }}
                >
                  change
                </Button>
              )}
            </div>
          )}

          <div className="flex items-center justify-between  rounded-t-2xl left-0 right-0 bg-white border-t px-2 py-2  ">
            {/* <div className="flex items-center">
            <span className="text-sm text-muted-foreground">TOTAL</span>
            <span className="text-xl font-semibold ml-3">
              {user?.tax?.gstPercentage
                ? `₹${
                    calculateTotal(ordereditems) +
                    calculateTax(ordereditems, user?.tax?.gstPercentage) -
                    (coupon?.discount || 0)
                  }`
                : `₹${calculateTotal(ordereditems) - (coupon?.discount || 0)}`}
            </span>
          </div> */}

            <ToggleGroup
              type="single"
              value={selectedToggle}
              onValueChange={setSelectedToggle}
              className="w-1/2 p-1 border-2 border-gray-200 rounded-xl mr-1"
            >
              <ToggleGroupItem
                value="Delivery"
                aria-label="Toggle delivery"
                className={`p-6 flex flex-col items-center gap-0.5 rounded-lg  ${
                  selectedToggle === "Delivery" ? "text-white" : "text-gray-600"
                }`}
                style={{
                  backgroundColor:
                    selectedToggle === "Delivery" ? "#cdb4f9" : "transparent",
                  color: selectedToggle === "Delivery" ? "white" : "black",
                }}
              >
                <Image
                  src="/images/delivery.svg"
                  alt="fast-delivery"
                  width={24}
                  height={24}
                  className={`${
                    selectedToggle === "Delivery" ? "brightness-0 invert" : ""
                  }`}
                />
                <span className="text-xs font-semibold tracking-wider">
                  Delivery
                </span>
              </ToggleGroupItem>
              <ToggleGroupItem
                value="Takeaway"
                aria-label="Toggle takeaway"
                className={`p-6 flex flex-col items-center gap-0.5 rounded-lg `}
                style={{
                  backgroundColor:
                    selectedToggle === "Takeaway" ? "#cdb4f9" : "transparent",
                  color: selectedToggle === "Takeaway" ? "white" : "black",
                }}
              >
                <Image
                  src="/images/takeaway.svg"
                  alt="take-away"
                  width={20}
                  height={20}
                  style={{ height: "auto" }}
                  className=""
                />
                <span className="text-xs font-semibold tracking-wider">
                  Takeaway
                </span>
              </ToggleGroupItem>
            </ToggleGroup>

            <Button
              className="w-full  font-semibold py-7 rounded-xl"
              onClick={() => handlePlaceOrder()}
            >
              Pay
              {user?.tax?.gstPercentage ? (
                <>
                  <span className="flex items-center text-sm">
                    <IndianRupee className="h-2 w-2" strokeWidth={3} />
                    {calculateTotal(ordereditems) +
                      calculateTax(
                        ordereditems,
                        discount || 0,
                        user?.tax?.gstPercentage
                      ) -
                      (discount || 0)}
                  </span>
                  {isLoading && (
                    <Icons.spinner className="h-4 w-4 animate-spin" />
                  )}
                </>
              ) : (
                <>
                  <span className="flex items-center">
                    <IndianRupee className="h-2 w-2" strokeWidth={3} />
                    {calculateTotal(ordereditems) - (discount || 0)}
                  </span>
                  {isLoading && (
                    <Icons.spinner className="h-4 w-4 animate-spin" />
                  )}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      <Drawer open={addressDrawerOpen} onOpenChange={setAddressDrawerOpen}>
        <DrawerDescription></DrawerDescription>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-left text-sm font-semibold">
              Select delivery address
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4">
            <RadioGroup
              value={selectedAddress}
              onValueChange={(value) => {
                const address = user?.address.find(
                  (addr: any) => addr.type === value
                );
                if (address) {
                  setSelectedAddress(value);
                  handleAddressSelect(address);
                }
              }}
              className="space-y-2"
            >
              {user?.address?.length > 0 &&
                user?.address.map((address: any, index: number) => (
                  <div className="py-2" key={index}>
                    <Popover>
                      <div
                        className="w-full flex items-center
                       justify-between"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <RadioGroupItem
                            value={address.type}
                            id={address.type}
                            className=" text-indigo-500 border-indigo-500 [&_svg]:fill-indigo-500 self-start"
                          />

                          <div className="flex flex-col">
                            <span className="text-sm font-semibold px-1">
                              {address.type}
                            </span>

                            <Label
                              htmlFor={address.type}
                              className="text-xs font-light px-1"
                            >
                              {address.address}
                            </Label>
                          </div>
                        </div>
                        <PopoverTrigger>
                          <Ellipsis className="h-5 w-5" strokeWidth={3} />
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-25 p-0 bg-purple-50 rounded-xl"
                          side="left"
                          align="start"
                        >
                          <div className="flex flex-col p-1 space-y-2">
                            <Button
                              variant="ghost"
                              className="text-sm border-b"
                              onClick={() => {
                                dispatch(
                                  setEditAddress({
                                    flag: true,
                                    type: address.type,
                                  })
                                );
                                setAddressDrawerOpen(false);
                                router.push("/address");
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              className="text-sm bg-red-500 text-white"
                              onClick={() => {
                                handleDeleteAddress(address.type);
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </PopoverContent>
                      </div>
                    </Popover>
                  </div>
                ))}
            </RadioGroup>
          </div>
          <Separator className="mt-2" />
          <DrawerFooter className="py-2 ">
            <Button
              variant="ghost"
              className="flex items-center justify-center text-green-500"
              onClick={() => router.push("/address")}
              disabled={user?.address?.length === 3}
            >
              <Plus className="h-4 w-4" strokeWidth={3} />
              <span className="text-xs ">Add a new address</span>
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer open={phoneDrawerOpen} onOpenChange={setPhoneDrawerOpen}>
        <DrawerContent className="rounded-t-3xl">
          <DrawerDescription></DrawerDescription>

          <DrawerHeader>
            <DrawerTitle>
              {stage === "phone" ? "Enter your phone number" : "Enter  OTP"}
            </DrawerTitle>
          </DrawerHeader>

          <div className="space-y-4 px-3 py-2">
            {stage === "phone" && (
              <>
                <Input
                  placeholder="Enter your phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="rounded-lg"
                />
              </>
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
              onClick={stage === "phone" ? handlePhoneSubmit : handleOtpSubmit}
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
  );
}

// {
/* <Drawer open={isSpecialRequestsOpen} onOpenChange={setIsSpecialRequestsOpen}>
  <DrawerContent className="h-auto max-h-[80vh] p-0">
    <div className="flex flex-col h-full">
      <DrawerHeader className="px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <DrawerTitle className="text-lg font-semibold">
            Add special instructions
          </DrawerTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSpecialRequestsClear}
            className="h-8 w-8"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </DrawerHeader>

      <div className="flex-1 px-6 py-4">
        <div className="space-y-4">
          <div className="relative">
            <Textarea
              placeholder="Start typing instructions"
              value={tempSpecialRequirements}
              onChange={(e) => setTempSpecialRequirements(e.target.value)}
              className="min-h-[120px] resize-none"
              maxLength={200}
            />
            <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
              {tempSpecialRequirements.length}/200
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Order instructions are provided for convenience, but merchant
            adherence cannot be guaranteed. No refunds/cancellations is
            possible.
          </p>
        </div>
      </div>

      <DrawerFooter className="px-6 py-4 border-t bg-background">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleSpecialRequestsCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSpecialRequestsAdd}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800"
          >
            ADD
          </Button>
        </div>
      </DrawerFooter>
    </div>
  </DrawerContent>
</Drawer>; */
// }
