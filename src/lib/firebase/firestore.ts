// "use server";
// import { doc, getDoc, setDoc } from "firebase/firestore";
// import { db } from "@/config/db/firebase";
// import { NewUser } from "@/types/auth/typesAuth";
// // import { auth } from "@/auth";

import { db } from "@/config/db/firebase";
import { doc, setDoc } from "firebase/firestore";

// export async function registerUser(email: string, newUser: NewUser) {
//   try {
//     await setDoc(doc(db, email, "info"), {
//       //setdoc is to create if not or if exists then overwrite // to add new sub-collection this function can be used
//       ...newUser,
//     });
//     return "User registered Successfully";
//   } catch (error) {
//     console.log("eror");
//     console.log(error);
//     return false;
//   }
// }
// export async function add(email: string, newUser: any, field: string) {
//   try {
//     await setDoc(doc(db, email, field), {
//       //setdoc is to create if not or if exists then overwrite // to add new sub-collection this function can be used
//       ...newUser,
//     });
//     return "User registered Successfully";
//   } catch (error) {
//     console.log("eror");
//     console.log(error);
//     return false;
//   }
// }

// export async function findIfStaffLogin(
//   primaryEmail: string,
//   staffEmail: string
// ) {
//   try {
//     const docRef = doc(db, primaryEmail, "info");
//     const docSnap = await getDoc(docRef);
//     if (docSnap.exists()) {
//       const staffArr = docSnap.data().staff;
//       const isUserExists = staffArr.findIndex(
//         (val: any) => val.email === staffEmail
//       );
//       if (staffArr[isUserExists]) {
//         return staffArr[isUserExists];
//       } else {
//         return false;
//       }
//     } else {
//       return false;
//     }
//   } catch {
//     return false;
//   }
// }

// export async function findUserByEmail(email: string) {
//   try {
//     const docRef = doc(db, email, "info");
//     const docSnap = await getDoc(docRef);
//     if (docSnap.exists()) {
//       return docSnap.data();
//     } else {
//       return false;
//     }
//   } catch {
//     return false;
//   }
// }

// export async function get7daysDataFromAll(
//   email: string,
//   subCollection: string
// ) {
//   try {
//     const docRef = doc(db, email, subCollection);
//     const docSnap = await getDoc(docRef);

//     if (docSnap.exists()) {
//       const data = docSnap.data();
//       const today: any = new Date();
//       const start: any = new Date(today.getFullYear(), 0, 0);
//       const diff = today - start;
//       const oneDay = 1000 * 60 * 60 * 24;
//       const currentDayOfYear = Math.floor(diff / oneDay);

//       const result: any = {
//         days: [], // Track the days for all categories
//       };

//       // Loop through all types (rooms, food, services, issues)
//       for (const type in data) {
//         const categories = data[type]?.categories || {};

//         // Create a result entry for each type (rooms, food, etc.)
//         result[type] = {};

//         for (const categoryName in categories) {
//           const categoryData = categories[categoryName];
//           const totalEarnings = new Array(7).fill(0); // Initialize array for last 7 days of earnings
//           const totalBookings = new Array(7).fill(0); // Initialize array for last 7 days of bookings

//           for (let i = 0; i < 7; i++) {
//             const day = currentDayOfYear - i;
//             if (categoryData.days?.[day]?.totalEarnings) {
//               totalEarnings[6 - i] = categoryData.days[day].totalEarnings;
//               totalBookings[6 - i] = categoryData.days[day].totalBookings;
//               // Track the days globally for all categories
//               if (!result.days.includes(day)) {
//                 result.days.unshift(day);
//               }
//             }
//           }

//           // Store the earnings for each category under the respective type
//           result[type][categoryName] = totalEarnings;
//           result[type][`${categoryName} Bookings`] = totalBookings;
//         }
//       }

//       return result;
//     } else {
//       return false;
//     }
//   } catch (error) {
//     console.error("Error fetching 7 days data from all categories:", error);
//     return false;
//   }
// }

// export async function get7daysData(
//   email: string,
//   subCollection: string,
//   type: string
// ) {
//   try {
//     const docRef = doc(db, email, subCollection);
//     const docSnap = await getDoc(docRef);

//     if (docSnap.exists()) {
//       const data = docSnap.data();
//       const today: any = new Date();
//       const start: any = new Date(today.getFullYear(), 0, 0);
//       const diff = today - start;
//       const oneDay = 1000 * 60 * 60 * 24;
//       const currentDayOfYear = Math.floor(diff / oneDay);
//       const result: any = {
//         [type]: {
//           days: [],
//         },
//       };
//       const categories = data[type]?.categories || {};
//       for (const categoryName in categories) {
//         const categoryData = categories[categoryName];
//         const totalEarnings = new Array(7).fill(0);
//         const totalBookings = new Array(7).fill(0); // Initialize array for last 7 days of earnings

//         for (let i = 0; i < 7; i++) {
//           const day = currentDayOfYear - i;
//           if (categoryData.days?.[day]?.totalEarnings) {
//             totalEarnings[6 - i] = categoryData.days[day].totalEarnings;
//             totalBookings[6 - i] = categoryData.days[day].totalBookings;

//             if (!result[type].days.includes(day)) {
//               result[type].days.unshift(day);
//             }
//           }
//         }

//         result[type][categoryName] = totalEarnings;
//         result[type][`${categoryName} Bookings`] = totalBookings;
//       }

//       return result;
//     } else {
//       return false;
//     }
//   } catch (error) {
//     console.error("Error fetching total earnings data:", error);
//     return false;
//   }
// }

// export async function getLiveData(email: string) {
//   try {
//     const docRefHotel = doc(db, email, "hotel");
//     const docRefRestaurant = doc(db, email, "restaurant");

//     const [docSnapHotel, docSnapRestaurant] = await Promise.all([
//       getDoc(docRefHotel),
//       getDoc(docRefRestaurant),
//     ]);

//     const result: any = {};

//     if (docSnapHotel.exists()) {
//       result.hotel = docSnapHotel.data()?.live || null;
//     }

//     if (docSnapRestaurant.exists()) {
//       result.restaurant = docSnapRestaurant.data()?.live || null;
//     }

//     // Return false if neither document exists or if both 'live' fields are null
//     if (
//       Object.keys(result).length === 0 ||
//       (result.hotel === null && result.restaurant === null)
//     ) {
//       return false;
//     }

//     return result;
//   } catch (error) {
//     console.error("Error in getLiveData:", error);
//     return false;
//   }
// }
export async function add(email: string, newUser: any, field: string) {
  try {
    await setDoc(doc(db, email, field), {
      //setdoc is to create if not or if exists then overwrite // to add new sub-collection this function can be used
      ...newUser,
    });
    return "User registered Successfully";
  } catch (error) {
    console.log("eror");
    console.log(error);
    return false;
  }
}
