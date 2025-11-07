"use client";

import { motion } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import React from "react";
import { clearCart, clearFinalOrder } from "@/lib/features/addToOrderSlice";
import { setDelivery } from "@/lib/features/deliverySlice";
import { IndianRupee } from "lucide-react";

export default function OrderConfirmation() {
  const router = useRouter();
  const finalItem = useSelector(
    (state: RootState) => state.addToOrderData.finalOrder
  );
  console.log("DATA", finalItem);

  const { user } = useSelector((state: RootState) => state.addToOrderData);
  const dispatch = useDispatch();
  const delivery: any = useSelector(
    (state: RootState) => state.delivery?.delivery
  );
  console.log("delivery in order confirmation:", delivery);
  // Add useEffect to handle auto-close
  React.useEffect(() => {
    if (finalItem && user?.tag === "concierge") {
      toast.success("Order Placed Successfully!");
      setTimeout(() => {
        window.close();
      }, 5000);
    } else {
      if (finalItem?.orderType === "Takeaway") {
        toast.success("Order Placed Successfully!");
        setTimeout(() => {
          router.push("/");
          dispatch(clearCart());
        }, 5000);
      }
    }
  }, [finalItem, user]);

  // const copyToClipboard = (text: string, label: string) => {
  //   navigator.clipboard.writeText(text).then(() => {
  //     toast.success(`${label} copied to clipboard`);
  //   });
  // };

  const handleTrackOrder = () => {
    const data = {
      address: finalItem.address,
      customer: {
        name: finalItem.name,
        email: finalItem.email,
        phone: finalItem.contact,
      },
      deliveryPerson: finalItem.deliveryPerson || {},
      items: finalItem.orderedItem,
      location: {},
      orderId: finalItem.orderId,
      orderType: finalItem.orderType,
      payment: {
        subtotal: finalItem.subtotal,
        price: finalItem.subtotal,
        totalAmount: finalItem.orderAmount,
        timeofOrder: finalItem.timeOfOrder,
        gst: {
          gstAmount: finalItem.gstAmount,
          gstPercentage: finalItem.gstPercentage,
          cgstAmount: finalItem.cgstAmount,
          cgstPercentage: finalItem.cgstPercentage,
          sgstAmount: finalItem.sgstAmount,
          sgstPercentage: finalItem.sgstPercentage,
        },
        discount: {
          type: finalItem.discountType,
          amount: finalItem.discountAmount,
          code: finalItem.discountCode,
          discount: finalItem.discountDiscount,
        },
      },
      specialRequirement: finalItem.specialrequirements,
    };
    console.log("data", data);
    dispatch(setDelivery({ order: data, from: "delivery" }));

    localStorage.setItem("tracking-id", finalItem.orderId);
    router.push("/tracking");
    dispatch(clearFinalOrder());
  };

  if (!finalItem?.orderId) {
    setTimeout(() => {
      router.push("/");
    }, 3000);
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <h1>No order found</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header Section */}
          <div className="bg-[#FF8080] p-6 text-center">
            <motion.h2
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-3xl font-bold text-white mb-2"
            >
              Order Placed Successfully!
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-green-50 text-sm"
            >
              Thank you for your order. Your food is being prepared.
            </motion.p>
          </div>

          {/* Order Details Section */}
          {finalItem && (
            <div className="p-6">
              {/* Order Info Cards */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-2 gap-4 mb-6"
              >
                {/* Order ID Card */}
                <div className="  rounded-xl p-4 [box-shadow:var(--shadow-s)] text-white bg-[#FF8080]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold ">Order ID</span>
                  </div>
                  <p className="font-bold text-base  break-all">
                    {finalItem.orderId}
                  </p>
                </div>

                {/* Order Type Card */}
                <div className="  rounded-xl p-4 [box-shadow:var(--shadow-s)] text-white bg-[#FF8080]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold ">Order Type</span>
                  </div>
                  <p className="font-bold text-base">{finalItem.orderType}</p>
                </div>

                {/* Total Amount Card */}
                <div className="  rounded-xl p-4 [box-shadow:var(--shadow-s)] text-white bg-[#FF8080]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold ">Total Amount</span>
                  </div>
                  <p className="flex items-center  font-bold text-base">
                    <IndianRupee className="h-3 w-3" />
                    {finalItem.orderAmount}
                  </p>
                </div>

                {/* Estimated Time Card */}
                <div className="  rounded-xl p-4 [box-shadow:var(--shadow-s)] text-white bg-[#FF8080]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold ">Est. Time</span>
                  </div>
                  <p className="font-bold text-base">
                    {finalItem.orderType === "Delivery"
                      ? "25-30 mins"
                      : "15-20 mins"}
                  </p>
                </div>
              </motion.div>

              {/* Divider */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-6"
              />

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="space-y-3"
              >
                {finalItem.orderType === "Delivery" && (
                  <motion.button
                    whileHover={{
                      scale: 1.02,
                      boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.5)",
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      console.log("finalItem", finalItem);
                      handleTrackOrder();
                    }}
                    className="w-full [box-shadow:var(--shadow-m)] bg-[#FF8080] text-white hover:bg-[#FF8080]/80 font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>Track Your Order</span>
                  </motion.button>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    router.push("/");
                    dispatch(clearCart());
                  }}
                  className="w-full bg-white border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  <span>Return to Menu</span>
                </motion.button>
              </motion.div>
            </div>
          )}
        </motion.div>

        {/* Footer Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-6"
        >
          <p className="text-sm text-gray-600">
            Need help? Contact us at{" "}
            <a
              href="tel:support"
              className="text-blue-600 font-medium hover:underline"
            >
              support@restaurant.com
            </a>
          </p>
        </motion.div>
      </motion.div>

      {/* <Card className="w-full max-w-md mx-auto mt-4">
        <CardHeader className="text-center space-y-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="flex justify-center"
          >
            <CheckCircle2
              className="w-16 h-16 text-green-500"
              strokeWidth={1.5}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl font-semibold text-green-600">
              Order Placed Successfully!
            </h2>
            <p className="text-muted-foreground mt-1">
              Thank you for your order. Your food is being prepared.
            </p>
          </motion.div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Order Number</p>
              <div className="flex items-center gap-2">
                <p className="font-mono font-medium">{finalItem.orderId}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() =>
                    copyToClipboard(finalItem.orderId, "Order number")
                  }
                >
                  <Copy className="h-4 w-4" />
                  <span className="sr-only">Copy order number</span>
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Payment ID</p>
              <div className="flex items-center gap-2">
                <p className="font-mono font-medium truncate">
                  {finalItem.razorpayPaymentId}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0"
                  onClick={() =>
                    copyToClipboard(finalItem.razorpayPaymentId, "Payment ID")
                  }
                >
                  <Copy className="h-4 w-4" />
                  <span className="sr-only">Copy payment ID</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-muted/50 p-3 rounded-lg">
              <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Estimated Delivery Time</p>
                <p className="text-sm text-muted-foreground">25-30 minutes</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-muted/50 p-3 rounded-lg">
              <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Table</p>
                <p className="text-sm text-muted-foreground">
                  {finalItem.tableNo}
                </p>
              </div>
            </div>
          </div>

          <div>
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="w-5 h-5" />
            <h3 className="font-semibold">Order Summary</h3>
          </div>

          <div className="space-y-3">
            {finalItem.orderedItem &&
              finalItem.orderedItem.map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">
                      {item.count}x {item.name}
                    </p>
                  </div>
                  <p className="font-medium">₹{item.price * item.count}</p>
                </div>
              ))}

            <div className="flex justify-between items-center pt-4 border-t">
              <span className="text-lg font-semibold">Subtotal</span>
              <span className="text-lg font-semibold">
                ₹{finalItem.subtotal}
              </span>
            </div>
            {finalItem.gstAmount && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tax</span>
                <span className="text-sm font-medium">
                  ₹{finalItem.gstAmount}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t">
              <span className="text-lg font-semibold">Grand Total</span>
              <span className="text-lg font-semibold">
                ₹{finalItem.orderAmount}
              </span>
            </div>
          </div>
        </div>
        </CardContent>

        <CardFooter className="flex gap-3">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            dispatch(clearCart());
            router.push("/");
          }}
        >
          View Order
        </Button>
        <Button
          className="w-full"
          onClick={() => {
            dispatch(clearCart());
            router.push("/");
          }}
        >
          Return to Menu
        </Button>
      </CardFooter>
      </Card> */}
    </div>
  );
}
