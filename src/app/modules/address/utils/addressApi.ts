import { db } from "@/config/db/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export async function saveCustomerAddress(
  address: any,
  phone: string,
  email: string
) {
  if (!address || !phone || !email) {
    console.log("Address, phone, email are required");
    return false;
  }

  try {
    const docRef = doc(db, email, "hotel");
    // const docSnap = await getDoc(docRef);
    // if (docSnap.exists()) {
    //   const data = docSnap.data().customers?.[phone];
    // if (data?.address?.length > 0) {
    //   const addressData = data.address;
    //   console.log("addressData", addressData);
    //   const isAddressTypeExists = addressData.find(
    //     (item: any) => item.type === address.type
    //   );
    //   console.log("address", address);
    //   console.log("isAddressTypeExists", isAddressTypeExists);
    //   if (isAddressTypeExists) {
    //     const removedAddress = addressData.filter(
    //       (item: any) => item.type !== address.type
    //     );
    //     const updatedAddressData = [...removedAddress, address];
    //     await updateDoc(docRef, {
    //       [`customers.${phone}.address`]: updatedAddressData,
    //     });
    //   } else {
    //     const updatedAddressData = [...addressData, address];
    //     console.log("updatedAddressData", updatedAddressData);
    //     await updateDoc(docRef, {
    //       [`customers.${phone}.address`]: updatedAddressData,
    //     });
    //   }
    // } else {
    await updateDoc(docRef, {
      [`customers.${phone}.address`]: address,
    });
    // }
    return true;
    // }
  } catch (error) {
    console.log(error);
    return false;
  }
}

export async function deleteAddress(
  phone: string,
  type: string,
  email: string
) {
  if (!phone || !type || !email) {
    console.log("Phone,  and type are required");
    return false;
  }
  console.log(phone, type, email);

  try {
    const docRef = doc(db, email, "hotel");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data().customers?.[phone];
      if (data?.address?.length > 0) {
        const addressData = data.address;
        const updatedAddressData = addressData.filter(
          (item: any) => item.type !== type
        );
        await updateDoc(docRef, {
          [`customers.${phone}.address`]: updatedAddressData,
        });
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  } catch (error) {
    console.log(error);
    return false;
  }
}
