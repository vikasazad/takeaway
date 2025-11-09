import { db } from "@/config/db/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function getCouponData() {
  try {
    const docRefInfo = doc(db, "vikumar.azad@gmail.com", "info");

    const docSnapInfo = await getDoc(docRefInfo);

    if (docSnapInfo.exists()) {
      if (!docSnapInfo.data().hotel.hotelDiscount) {
        return {
          info: {},
          status: false,
        };
      }
      return {
        info: docSnapInfo.data().hotel.hotelDiscount,
        status: true,
      };
    }
  } catch (error) {
    console.error("Error fetching Firestore data:", error);
    return {
      info: {},
      status: false,
    };
  }
}
