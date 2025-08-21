"use server";

import { db } from "@/config/db/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function checkTableAvailability(email: string, tableNo: string) {
  console.log("checkTableAvailability", email, tableNo);
  const docRef = doc(db, email, "restaurant");
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const tableDetails = docSnap.data().live.tablesData.tableDetails;

    // Check if the table number exists in any category
    const tableExists = Object.values(tableDetails).some((category: any) =>
      category.some((table: any) => table.location === tableNo)
    );

    if (tableExists) {
      console.log(`Table ${tableNo} exists.`);
      return true; // Table found
    } else {
      console.log(`Table ${tableNo} does not exist.`);
      return false; // Table not found
    }
  } else {
    console.log("Document does not exist.");
    return false;
  }
}
