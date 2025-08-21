"use server";
import { db } from "@/config/db/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function getRestaurantData() {
  try {
    const docRefMenu = doc(db, "vikumar.azad@gmail.com", "restaurant");
    const docRefInfo = doc(db, "vikumar.azad@gmail.com", "info");

    const [docSnapMenu, docSnapInfo] = await Promise.all([
      getDoc(docRefMenu),
      getDoc(docRefInfo),
    ]);

    if (docSnapMenu.exists() && docSnapInfo.exists()) {
      return {
        menu: docSnapMenu.data().menu,
        info: docSnapInfo.data().restaurant,
      };
    }
  } catch (error) {
    console.error("Error fetching Firestore data:", error);
    return {
      menu: false,
      info: false,
    };
  }
}
export async function getRestaurantInfo() {
  try {
    const docRefInfo = doc(db, "vikumar.azad@gmail.com", "info");

    const docSnapInfo = await getDoc(docRefInfo);

    if (docSnapInfo.exists()) {
      return docSnapInfo.data().restaurant;
    }
  } catch (error) {
    console.error("Error fetching Firestore data:", error);
    return false;
  }
}
