import { db } from "@/config/db/firebase";
import {
  doc,
  onSnapshot,
  getDoc,
  updateDoc,
  deleteField,
  arrayUnion,
} from "firebase/firestore";
import { sendWhatsAppMessageDeliveryCompleted } from "../../order/utils/orderApi";

export interface DeliveryPersonLocation {
  lat: number;
  lng: number;
}

export interface DeliveryPersonInfo {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  rating: number;
  currentLocation: DeliveryPersonLocation;
  isOnline: boolean;
}

export interface OrderDeliveryData {
  orderId: string;
  status: "Order Placed" | "Preparing" | "Out for Delivery" | "Delivered";
  deliveryPerson: DeliveryPersonInfo;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  estimatedDeliveryTime: string;
  timeOfFullfilment?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Subscribe to real-time delivery person location updates
 * @param phone - The order ID to track
 * @param onLocationUpdate - Callback function when location updates
 * @returns Unsubscribe function
 */
export const subscribeToDeliveryLocation = (
  phone: string,
  orderId: string,
  onLocationUpdate: (location: DeliveryPersonLocation) => void
) => {
  const deliveryRef = doc(db, "vikumar.azad@gmail.com", "hotel");

  const unsubscribe = onSnapshot(
    deliveryRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data()?.delivery[phone]?.[orderId]
          ?.deliveryPerson as OrderDeliveryData;
        if (data.location) {
          onLocationUpdate(data.location);
        }
      } else {
        console.warn(`No delivery data found for order: ${phone}`);
      }
    },
    (error) => {
      console.error("Error listening to delivery location:", error);
    }
  );

  return unsubscribe;
};

/**
 * Get initial delivery data for an order
 * @param orderId - The order ID
 * @returns Promise with delivery data or null
 */
export const getDeliveryData = async (
  phone: string,
  orderId: string
): Promise<OrderDeliveryData | null> => {
  try {
    const deliveryRef = doc(db, "vikumar.azad@gmail.com", "hotel");
    const docSnap = await getDoc(deliveryRef);

    if (docSnap.exists()) {
      return docSnap.data()?.delivery[phone]?.[orderId]?.deliveryPerson;
    }

    console.warn(`No delivery data found for order: ${phone}`);
    return null;
  } catch (error) {
    console.error("Error fetching delivery data:", error);
    return null;
  }
};
export const getDeliveryStatus = (
  phone: string,
  orderId: string,
  callback: (data: any) => void
) => {
  const deliveryRef = doc(db, "vikumar.azad@gmail.com", "hotel");
  const unsubscribe = onSnapshot(
    deliveryRef,
    (docSnap) => {
      if (docSnap.exists()) {
        if (callback)
          callback({
            status: docSnap.data()?.delivery[phone]?.[orderId]?.status,
            name: docSnap.data()?.delivery[phone]?.[orderId]?.deliveryPerson
              .name,
            phone:
              docSnap.data()?.delivery[phone]?.[orderId]?.deliveryPerson.phone,
          });
      }
    },
    (error) => {
      console.error("Error fetching real-time data:", error);
    }
  );

  return unsubscribe;
};

/**
 * Update delivery person location (used by delivery person app)
 * @param orderId - The order ID
 * @param location - New location data
 * @returns Promise<boolean> - Success status
 */
export const updateDeliveryLocation = async (
  orderId: string,
  location: DeliveryPersonLocation
): Promise<boolean> => {
  try {
    const deliveryRef = doc(db, "deliveries", orderId);
    await updateDoc(deliveryRef, {
      "deliveryPerson.currentLocation": location,
      updatedAt: new Date().toISOString(),
    });

    console.log("Delivery location updated successfully");
    return true;
  } catch (error) {
    console.error("Error updating delivery location:", error);
    return false;
  }
};

/**
 * Update delivery status
 * @param orderId - The order ID
 * @param status - New status
 * @returns Promise<boolean> - Success status
 */
export const updateDeliveryStatus = async (
  orderId: string,
  status: OrderDeliveryData["status"]
): Promise<boolean> => {
  try {
    const deliveryRef = doc(db, "deliveries", orderId);
    const updateData: any = {
      status,
      updatedAt: new Date().toISOString(),
    };

    if (status === "Delivered") {
      updateData.timeOfFullfilment = new Date().toISOString();
    }

    await updateDoc(deliveryRef, updateData);
    console.log("Delivery status updated successfully");
    return true;
  } catch (error) {
    console.error("Error updating delivery status:", error);
    return false;
  }
};

/**
 * Get order data for delivery person by phone number
 * @param customerPhone - Customer's phone number
 * @returns Promise with order data or null
 */
export const getOrderForDelivery = async (
  customerPhone: string
): Promise<any | null> => {
  try {
    const deliveryRef = doc(db, "vikumar.azad@gmail.com", "hotel");
    const docSnap = await getDoc(deliveryRef);

    if (docSnap.exists()) {
      const deliveryData = docSnap.data()?.delivery[customerPhone];
      if (deliveryData) {
        return deliveryData;
      }
    }

    console.warn(`No order data found for customer: ${customerPhone}`);
    return null;
  } catch (error) {
    console.error("Error fetching order data:", error);
    return null;
  }
};

/**
 * Update delivery person location in real-time (for delivery person app)
 * @param customerPhone - Customer's phone number to identify the order
 * @param location - New location data
 * @returns Promise<boolean> - Success status
 */
export const updateDeliveryPersonLocation = async (
  customerPhone: string,
  orderId: string,
  location: DeliveryPersonLocation
): Promise<boolean> => {
  try {
    const deliveryRef = doc(db, "vikumar.azad@gmail.com", "hotel");
    await updateDoc(deliveryRef, {
      [`delivery.${customerPhone}.${orderId}.deliveryPerson.location`]:
        location,
      [`delivery.${customerPhone}.${orderId}.updatedAt`]:
        new Date().toISOString(),
    });

    console.log("Delivery person location updated successfully");
    return true;
  } catch (error) {
    console.error("Error updating delivery person location:", error);
    return false;
  }
};

/**
 * Update delivery status (for delivery person app)
 * @param customerPhone - Customer's phone number to identify the order
 * @param status - New status
 * @returns Promise<boolean> - Success status
 */
export const updateDeliveryOrderStatus = async (
  customerPhone: string,
  orderId: string,
  status: string
): Promise<boolean> => {
  try {
    const deliveryRef = doc(db, "vikumar.azad@gmail.com", "hotel");
    const updateData: any = {
      [`delivery.${customerPhone}.${orderId}.status`]: status,
      [`delivery.${customerPhone}.${orderId}.updatedAt`]:
        new Date().toISOString(),
    };

    if (status === "Delivered") {
      updateData[`delivery.${customerPhone}.${orderId}.timeOfFullfilment`] =
        new Date().toISOString();
    }

    await updateDoc(deliveryRef, updateData);

    console.log("Delivery status updated successfully");
    return true;
  } catch (error) {
    console.error("Error updating delivery status:", error);
    return false;
  }
};

export const clearDelivery = async (
  customerPhone: string,
  orderId: string,
  address: string
) => {
  const deliveryRef = doc(db, "vikumar.azad@gmail.com", "hotel");
  const deliveryData = await getDoc(deliveryRef);
  if (deliveryData.exists()) {
    const data = deliveryData.data()?.delivery[customerPhone][orderId];
    await updateDoc(deliveryRef, {
      [`customers.${customerPhone}.orders`]: arrayUnion(data),
    });
  }
  await updateDoc(deliveryRef, {
    [`delivery.${customerPhone}.${orderId}`]: deleteField(),
  });

  await sendWhatsAppMessageDeliveryCompleted(customerPhone, [
    orderId,
    address,
    "Wah Bhai Wah",
  ]);
};

/**
 * Start delivery tracking (sets status to "Out for Delivery")
 * @param customerPhone - Customer's phone number
 * @param deliveryPersonLocation - Initial delivery person location
 * @returns Promise<boolean> - Success status
 */
export const startDeliveryTracking = async (
  customerPhone: string,
  orderId: string,
  deliveryPersonLocation: DeliveryPersonLocation
): Promise<boolean> => {
  try {
    const deliveryRef = doc(db, "vikumar.azad@gmail.com", "hotel");
    await updateDoc(deliveryRef, {
      [`delivery.${customerPhone}.${orderId}.status`]: "Out for Delivery",
      [`delivery.${customerPhone}.${orderId}.deliveryPerson.location`]:
        deliveryPersonLocation,
    });

    console.log("Delivery tracking started successfully");
    return true;
  } catch (error) {
    console.error("Error starting delivery tracking:", error);
    return false;
  }
};

/**
 * Subscribe to delivery order updates for delivery person
 * @param customerPhone - Customer's phone number
 * @param onUpdate - Callback function when order updates
 * @returns Unsubscribe function
 */
export const subscribeToDeliveryOrder = (
  customerPhone: string,
  onUpdate: (orderData: any) => void
) => {
  const deliveryRef = doc(db, "vikumar.azad@gmail.com", "hotel");

  const unsubscribe = onSnapshot(
    deliveryRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const orderData = docSnap.data()?.delivery[customerPhone];
        if (orderData) {
          onUpdate(orderData);
        }
      } else {
        console.warn(`No order data found for customer: ${customerPhone}`);
      }
    },
    (error) => {
      console.error("Error listening to order updates:", error);
    }
  );

  return unsubscribe;
};
export const getDeliveryOrders = (
  email: string,
  onUpdate: (orderData: any) => void
) => {
  const deliveryRef = doc(db, email, "hotel");

  const unsubscribe = onSnapshot(
    deliveryRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const orderData = docSnap.data()?.delivery;
        if (orderData) {
          onUpdate(orderData);
        }
      } else {
        console.warn(`No order data found for customer: ${email}`);
      }
    },
    (error) => {
      console.error("Error listening to order updates:", error);
    }
  );

  return unsubscribe;
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 - Latitude of first point
 * @param lng1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lng2 - Longitude of second point
 * @returns Distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Calculate estimated time of arrival
 * @param deliveryLocation - Current delivery person location
 * @param customerLocation - Customer location
 * @param averageSpeed - Average speed in km/h (default: 25)
 * @returns Estimated time string
 */
export const calculateETA = (
  deliveryLocation: { lat: number; lng: number },
  customerLocation: { lat: number; lng: number },
  averageSpeed: number = 25
): string => {
  const distance = calculateDistance(
    deliveryLocation.lat,
    deliveryLocation.lng,
    customerLocation.lat,
    customerLocation.lng
  );

  const timeInHours = distance / averageSpeed;
  const timeInMinutes = Math.ceil(timeInHours * 60);

  if (timeInMinutes < 1) {
    return "Arriving now";
  } else if (timeInMinutes < 60) {
    return `${timeInMinutes} mins`;
  } else {
    const hours = Math.floor(timeInMinutes / 60);
    const minutes = timeInMinutes % 60;
    return `${hours}h ${minutes}m`;
  }
};

export const submitLatLng = async (coords: any) => {
  const deliveryRef = doc(db, "vikumar.azad@gmail.com", "hotel");
  const location = {
    lat: coords.lat,
    lng: coords.lng,
  };
  // lat: 28.350763,lng: 77.333466,
  // lat: 28.34856, lng: 77.334521,
  // lat: 28.346896, lng: 77.335305,
  await updateDoc(deliveryRef, {
    "delivery.8851280284.deliveryPerson.location": location,
  });
};

/* 
Example Firestore Document Structure for deliveries collection:

{
  "deliveries": {
    "RES:DEL:1234": {
      "orderId": "RES:DEL:1234",
      "status": "out_for_delivery",
      "deliveryPerson": {
        "id": "delivery_001",
        "name": "Raj Kumar",
        "phone": "+91 98765 43210",
        "vehicle": "Bike",
        "rating": 4.8,
        "isOnline": true,
        "currentLocation": {
          "lat": 28.346524,
          "lng": 77.340891,
          "timestamp": 1640995200000,
          "speed": 15,
          "heading": 45
        }
      },
      "customerLocation": {
        "lat": 28.4595,
        "lng": 77.0266,
        "address": "123 Customer Address, Delhi"
      },
      "estimatedDeliveryTime": "25 mins",
      "createdAt": "2024-01-01T10:00:00Z",
      "updatedAt": "2024-01-01T10:15:00Z"
    }
  }
}

Usage Example:

// Subscribe to location updates
const unsubscribe = subscribeToDeliveryLocation(orderId, (location) => {
  console.log('New location:', location);
  updateMapMarker(location);
});

// Get initial data
const deliveryData = await getDeliveryData(orderId);

// Clean up subscription
unsubscribe();

// For delivery person app:
// Start delivery
await startDeliveryTracking(customerPhone, deliveryPersonLocation);

// Update location
await updateDeliveryPersonLocation(customerPhone, newLocation);

// Update status
await updateDeliveryOrderStatus(customerPhone, "delivered");

*/
