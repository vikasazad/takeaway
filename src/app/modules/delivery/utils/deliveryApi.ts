import { db } from "@/config/db/firebase";
import { doc, getDoc } from "firebase/firestore";

export const getDeliveryOrders = async (email: string) => {
  if (!email) return false;
  try {
    const deliveryRef = doc(db, email, "hotel");
    const docSnap = await getDoc(deliveryRef);
    if (docSnap.exists()) {
      return docSnap.data()?.delivery;
    }
    return false;
  } catch (error) {
    console.error("Error fetching delivery orders:", error);
    return false;
  }
};
