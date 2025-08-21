"use client";
import { db } from "@/config/db/firebase";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";

export function getOrderData(
  email: string,
  phone: string,
  callback: (data: any) => void
) {
  if (!email || !phone) {
    console.error("Email or phone is missing.");
    return;
  }

  const docRef = doc(db, email, "restaurant");

  const unsubscribe = onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data().live.tables;

        const updatedData = data.filter(
          (item: any) => item.diningDetails?.customer?.phone === phone
        );

        console.log("Updated data:", updatedData);
        if (callback) callback(updatedData);
      } else {
        console.error("Document does not exist.");
      }
    },
    (error) => {
      console.error("Error fetching real-time data:", error);
    }
  );

  return unsubscribe;
}
export function getOrderDataHotel(
  email: string,
  phone: string,
  callback: (data: any) => void
) {
  if (!email || !phone) {
    console.error("Email or phone is missing.");
    return;
  }

  const docRef = doc(db, email, "hotel");

  const unsubscribe = onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data().live.rooms;

        const updatedData = data.filter(
          (item: any) => item.bookingDetails?.customer?.phone === phone
        );

        console.log("Updated data:", updatedData);
        if (callback) callback(updatedData);
      } else {
        console.error("Document does not exist.");
      }
    },
    (error) => {
      console.error("Error fetching real-time data:", error);
    }
  );

  return unsubscribe;
}

export async function createOrder(
  email: string,
  phone: string,
  tag: string,
  tableNo: string,
  orderData: any,
  amount: number,
  status: string,
  orderIds: any,
  gstAmount: number,
  gstPercentage: string
) {
  const res = await fetch("/api/createOrder", {
    method: "POST",
    body: JSON.stringify({ amount: amount * 100 }),
  });
  const data = await res.json();

  const paymentData = {
    key: process.env.RAZORPAY_API_KEY,
    order_id: data.id,
    name: "Rosier",
    description: "Thank you",
    image: "",
    prefill: {
      name: phone,
      contact: phone,
    },
    notes: {
      address: "Razorpay Corporate Office",
    },
    theme: {
      color: "#121212",
    },
    handler: async function (response: any) {
      // verify payment
      const res = await fetch("/api/verifyOrder", {
        method: "POST",
        body: JSON.stringify({
          orderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        }),
      });
      const data = await res.json();
      console.log("HERE", data, {
        orderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
      });
      if (data.isOk) {
        const info: any = {
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          email,
          amount,
          orderIds,
          gstAmount,
          gstPercentage,
          attendent: orderData[0].diningDetails.attendant,
          tableNo: tableNo,
        };
        if (tag === "hotel") {
          saveHotelDiningInfo(info);
        } else {
          saveInfo(info);
        }
        console.log(info);

        // sendOrder(orderData, token, "Justin");
        // sendNotification(
        //   "f5WtuYAa4fi-Gbg8VSCVub:APA91bEh6W51Od84BARGVCh6Dc475Hqw3nefZncWNFPoT92yaJ4ouaorlliinGnaJu3v202sYHmegcSxURwxOpbbHyaWouYOUuDyLaZ5wlpPSDBl02me5Hs",
        //   "New Order Received",
        //   "Hi [Waiter Name], a new order has been placed at Table [Table Number]. Please review the details and ensure prompt service. Thank you!"
        // );
      } else {
        alert("Payment failed");
      }
    },
  };

  const payment = new (window as any).Razorpay(paymentData);
  payment.open();
}

export async function saveInfo(info: any) {
  console.log(info);

  const {
    razorpayOrderId,
    razorpayPaymentId,
    email,
    amount,
    orderIds,
    gstAmount,
    gstPercentage,
    attendent,
    tableNo,
  } = info;
  console.log(
    "EEEEEEEEE",
    razorpayOrderId,
    razorpayPaymentId,
    email,
    amount,
    orderIds,
    gstAmount,
    gstPercentage,
    attendent,
    tableNo
  );
  const paymentType = orderIds.length === 1 ? "single" : "combined";
  const docRef = doc(db, email, "restaurant"); // Reference to the document
  try {
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const tables = data.live.tables;

      // Step 1: Update orders in diningDetails
      const updatedTables = tables.map((table: any) => {
        if (table.diningDetails && table.diningDetails.orders) {
          const updatedOrders = table.diningDetails.orders.map((order: any) => {
            const matchedOrder = orderIds.find(
              (o: any) => o.id === order.orderId
            );

            // Update the payment details if orderId matches
            if (matchedOrder) {
              return {
                ...order,
                payment: {
                  ...order.payment,
                  mode: "online",
                  paymentType: paymentType,
                  paymentId: razorpayPaymentId,
                  paymentStatus: "paid",
                  timeOfTransaction: new Date().toISOString(),
                  transctionId: razorpayOrderId,
                },
              };
            }
            return order;
          });

          return {
            ...table,
            diningDetails: {
              ...table.diningDetails,
              orders: updatedOrders,
            },
          };
        }
        return table;
      });

      // Step 2: Add new transaction object
      const combinedOrderIds = orderIds.map((o: any) => o.id).join(","); // Combine all orderIds
      const newTransaction = {
        location: tableNo,
        against: combinedOrderIds,
        attendant: attendent,
        bookingId: "",
        payment: {
          paymentStatus: "paid",
          mode: "online",
          paymentType: paymentType,
          paymentId: razorpayPaymentId || "",
          timeOfTransaction: new Date().toISOString(),
          price: amount || 0,
          priceAfterDiscount: "",
          gst: {
            gstAmount: gstAmount,
            gstPercentage: gstPercentage,
            cgstAmount: "",
            cgstPercentage: "",
            sgstAmount: "",
            sgstPercentage: "",
          },
          discount: {
            type: "",
            amount: "",
            code: "",
          },
        },
      };

      console.log("newTransaction", newTransaction);

      const updatedTablesWithTransactions = updatedTables.map((table: any) => {
        if (table.diningDetails.location === tableNo) {
          const existingTransactions = table.transctions || [];
          return {
            ...table,
            transctions: [...existingTransactions, newTransaction],
          };
        }
        return table;
      });

      console.log(updatedTablesWithTransactions);

      // Step 3: Update Firestore with modified data
      await updateDoc(docRef, {
        "live.tables": updatedTablesWithTransactions,
      });

      console.log("Orders and transactions updated successfully.");
    } else {
      console.error("Document does not exist.");
    }
  } catch (error) {
    console.error("Error updating orders and transactions:", error);
  }
}
export async function saveHotelDiningInfo(info: any) {
  console.log(info);

  const {
    razorpayOrderId,
    razorpayPaymentId,
    email,
    amount,
    orderIds,
    gstAmount,
    gstPercentage,
    attendent,
    tableNo,
  } = info;
  console.log(
    "EEEEEEEEE",
    razorpayOrderId,
    razorpayPaymentId,
    email,
    amount,
    orderIds,
    gstAmount,
    gstPercentage,
    attendent,
    tableNo
  );
  const paymentType = orderIds.length === 1 ? "single" : "combined";
  const docRef = doc(db, email, "hotel"); // Reference to the document
  try {
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const tables = data.live.rooms;

      // Step 1: Update orders in diningDetails
      const updatedTables = tables.map((table: any) => {
        if (table.diningDetails && table.diningDetails.orders) {
          const updatedOrders = table.diningDetails.orders.map((order: any) => {
            const matchedOrder = orderIds.find(
              (o: any) => o.id === order.orderId
            );

            // Update the payment details if orderId matches
            if (matchedOrder) {
              return {
                ...order,
                payment: {
                  ...order.payment,
                  mode: "online",
                  paymentType: paymentType,
                  paymentId: razorpayPaymentId,
                  paymentStatus: "paid",
                  timeOfTransaction: new Date().toISOString(),
                  transctionId: razorpayOrderId,
                },
              };
            }
            return order;
          });

          return {
            ...table,
            diningDetails: {
              ...table.diningDetails,
              orders: updatedOrders,
            },
          };
        }
        return table;
      });

      // Step 2: Add new transaction object
      const combinedOrderIds = orderIds.map((o: any) => o.id).join(","); // Combine all orderIds
      const newTransaction = {
        location: tableNo,
        against: combinedOrderIds,
        attendant: attendent,
        bookingId: "",
        payment: {
          paymentStatus: "paid",
          mode: "online",
          paymentType: paymentType,
          paymentId: razorpayPaymentId || "",
          timeOfTransaction: new Date().toISOString(),
          price: amount || 0,
          priceAfterDiscount: "",
          gst: {
            gstAmount: gstAmount,
            gstPercentage: gstPercentage,
            cgstAmount: "",
            cgstPercentage: "",
            sgstAmount: "",
            sgstPercentage: "",
          },
          discount: {
            type: "",
            amount: "",
            code: "",
          },
        },
      };

      console.log("newTransaction", newTransaction);

      const updatedTablesWithTransactions = updatedTables.map((table: any) => {
        if (table.bookingDetails.location === tableNo) {
          const existingTransactions = table.transctions || [];
          return {
            ...table,
            transctions: [...existingTransactions, newTransaction],
          };
        }
        return table;
      });

      console.log(updatedTablesWithTransactions);

      // Step 3: Update Firestore with modified data
      await updateDoc(docRef, {
        "live.rooms": updatedTablesWithTransactions,
      });

      console.log("Orders and transactions updated successfully.");
    } else {
      console.error("Document does not exist.");
    }
  } catch (error) {
    console.error("Error updating orders and transactions:", error);
  }
}

export async function findUser(phone: string, email: string) {
  if (!phone) {
    console.error("Phone is missing.");
    return;
  }
  const docRef = doc(db, email, "hotel");
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data().customers;
    const customer = Object.keys(data).find(
      (key: any) => data[key].phone === phone
    );
    if (!customer) {
      return false;
    }
    return data[customer];
  }
}

export async function registerUser(phone: string, email: string) {
  if (!phone || !email) {
    console.error("Phone or email is missing.");
    return false;
  }
  const docRef = doc(db, email, "hotel");
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data()?.customers;

      await updateDoc(docRef, {
        customers: {
          ...data,
          [phone]: {
            name: "",
            phone: phone,
            orders: [],
            address: [],
          },
        },
      });

      return true;
    }
  } catch (error) {
    console.error("Error registering user:", error);
    return false;
  }
}

export function findOrderData(
  email: string,
  phone: string,
  callback: (data: any) => void
) {
  if (!email || !phone) {
    console.error("Email or phone is missing.");
    return;
  }
  const docRef = doc(db, email, "hotel");
  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const prev = docSnap.data()?.customers?.[phone].orders;
      const currentDelivery = docSnap.data()?.delivery?.[phone];
      const currentTakeaway = docSnap.data()?.takeaway?.[phone];
      const current = {
        ...currentDelivery,
        ...currentTakeaway,
      };
      const data = {
        prev: prev || null,
        current: current || null,
      };
      if (callback) callback(data);
    } else {
      return;
    }
  });
  return unsubscribe;
}
