"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import React from "react";
import { clearCart } from "@/lib/features/addToOrderSlice";

export default function OrderConfirmation() {
  const router = useRouter();
  const finalItem = useSelector(
    (state: RootState) => state.addToOrderData.finalOrder
  );
  console.log("DATA", finalItem);
  const { user } = useSelector((state: RootState) => state.addToOrderData);
  const dispatch = useDispatch();
  // Add useEffect to handle auto-close
  React.useEffect(() => {
    if (finalItem && user?.tag === "concierge") {
      const timer = setTimeout(() => {
        window.close();
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      // Only show success toast, don't redirect immediately for delivery orders
      toast.success("Order Placed Successfully!");

      // For takeaway orders, redirect to home after delay
      if (finalItem?.orderType === "Takeaway") {
        setTimeout(() => {
          router.push("/");
          dispatch(clearCart());
        }, 3000);
      }
    }
  }, [finalItem, user]);

  // const copyToClipboard = (text: string, label: string) => {
  //   navigator.clipboard.writeText(text).then(() => {
  //     toast.success(`${label} copied to clipboard`);
  //   });
  // };

  return (
    <div className="flex flex-col items-center justify-center h-screen p-4">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="flex justify-center"
      >
        <CheckCircle2 className="w-16 h-16 text-green-500" strokeWidth={1.5} />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <h2 className="text-2xl font-semibold text-green-600 mb-2">
          Order Placed Successfully!
        </h2>
        <p className="text-muted-foreground mb-4">
          Thank you for your order. Your food is being prepared.
        </p>

        {/* Order Details */}
        {finalItem && (
          <div className="bg-white rounded-lg shadow-lg p-6 mt-6 max-w-md mx-auto">
            <div className="text-left space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Order ID:</span>
                <span className="font-mono font-medium">
                  {finalItem.orderId}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Order Type:</span>
                <span className="font-medium">{finalItem.orderType}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Total Amount:</span>
                <span className="font-semibold">₹{finalItem.orderAmount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Estimated Time:</span>
                <span className="font-medium">
                  {finalItem.orderType === "Delivery"
                    ? "25-30 mins"
                    : "15-20 mins"}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              {finalItem.orderType === "Delivery" && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  onClick={() => router.push("/tracking")}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: finalItem.orderType === "Delivery" ? 0.5 : 0.4,
                }}
                onClick={() => {
                  router.push("/");
                  dispatch(clearCart());
                }}
                className="w-full border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
              >
                Return to Menu
              </motion.button>
            </div>
          </div>
        )}
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
