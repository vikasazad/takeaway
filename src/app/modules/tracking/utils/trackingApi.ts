import { db } from "@/config/db/firebase";
import { doc, onSnapshot, updateDoc, getDoc } from "firebase/firestore";

export interface DeliveryLocation {
  lat: number;
  lng: number;
  timestamp: number;
}

export interface DeliveryPerson {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  rating: number;
  currentLocation: DeliveryLocation;
  isOnline: boolean;
}

export interface OrderTracking {
  orderId: string;
  status: "Order Placed" | "Preparing" | "Out for Delivery" | "Delivered";
  estimatedDeliveryTime: string;
  timeOfFullfilment?: string;
  deliveryPerson?: DeliveryPerson;
  route?: Array<{ lat: number; lng: number }>;
}

// Subscribe to real-time delivery person location updates
export const subscribeToDeliveryLocation = (
  phone: string,
  orderId: string,
  callback: (location: DeliveryLocation) => void
) => {
  const trackingRef = doc(
    db,
    "vikumar.azad@gmail.com",
    "hotel",
    phone,
    orderId
  );

  const unsubscribe = onSnapshot(trackingRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data() as OrderTracking;
      if (data.deliveryPerson?.currentLocation) {
        callback(data.deliveryPerson.currentLocation);
      }
    }
  });

  return unsubscribe;
};

// Subscribe to order status updates
export const subscribeToOrderStatus = (
  orderId: string,
  callback: (tracking: OrderTracking) => void
) => {
  const trackingRef = doc(db, "deliveries", orderId);

  const unsubscribe = onSnapshot(trackingRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data() as OrderTracking;
      callback(data);
    }
  });

  return unsubscribe;
};

// Get initial order tracking data
export const getOrderTracking = async (
  orderId: string
): Promise<OrderTracking | null> => {
  try {
    const trackingRef = doc(db, "deliveries", orderId);
    const docSnap = await getDoc(trackingRef);

    if (docSnap.exists()) {
      return docSnap.data() as OrderTracking;
    }
    return null;
  } catch (error) {
    console.error("Error fetching order tracking:", error);
    return null;
  }
};

// Update delivery person location (would be called by delivery person's app)
export const updateDeliveryLocation = async (
  orderId: string,
  location: DeliveryLocation
): Promise<boolean> => {
  try {
    const trackingRef = doc(db, "deliveries", orderId);
    await updateDoc(trackingRef, {
      "deliveryPerson.currentLocation": location,
    });
    return true;
  } catch (error) {
    console.error("Error updating delivery location:", error);
    return false;
  }
};

// Update order status
export const updateOrderStatus = async (
  orderId: string,
  status: OrderTracking["status"],
  estimatedDeliveryTime?: string
): Promise<boolean> => {
  try {
    const trackingRef = doc(db, "deliveries", orderId);
    const updateData: Partial<OrderTracking> = { status };

    if (estimatedDeliveryTime) {
      updateData.estimatedDeliveryTime = estimatedDeliveryTime;
    }

    if (status === "Delivered") {
      updateData.timeOfFullfilment = new Date().toISOString();
    }

    await updateDoc(trackingRef, updateData);
    return true;
  } catch (error) {
    console.error("Error updating order status:", error);
    return false;
  }
};

// Calculate ETA based on current location and destination
export const calculateETA = (
  currentLocation: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  averageSpeed: number = 25 // km/h average speed for delivery
): string => {
  const distance = calculateDistance(
    currentLocation.lat,
    currentLocation.lng,
    destination.lat,
    destination.lng
  );

  const timeInHours = distance / averageSpeed;
  const timeInMinutes = Math.ceil(timeInHours * 60);

  if (timeInMinutes < 60) {
    return `${timeInMinutes} mins`;
  } else {
    const hours = Math.floor(timeInMinutes / 60);
    const minutes = timeInMinutes % 60;
    return `${hours}h ${minutes}m`;
  }
};

// Calculate distance between two coordinates using Haversine formula
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Mock functions for demo purposes (remove in production)
export const createMockTrackingData = (orderId: string): OrderTracking => {
  return {
    orderId,
    status: "Out for Delivery",
    estimatedDeliveryTime: "25 mins",
    deliveryPerson: {
      id: "delivery_001",
      name: "Raj Kumar",
      phone: "+91 98765 43210",
      vehicle: "Bike",
      rating: 4.8,
      isOnline: true,
      currentLocation: {
        lat: 28.346524,
        lng: 77.340891,
        timestamp: Date.now(),
      },
    },
    route: [
      { lat: 28.346524, lng: 77.340891 }, // Starting point
      { lat: 28.35, lng: 77.345 }, // Waypoint 1
      { lat: 28.355, lng: 77.35 }, // Waypoint 2
      { lat: 28.4595, lng: 77.0266 }, // Destination
    ],
  };
};

// Simulate delivery person movement (for demo)
export const simulateDeliveryMovement = (
  currentLocation: DeliveryLocation,
  destination: { lat: number; lng: number },
  stepSize: number = 0.0005 // Degrees per step
): DeliveryLocation => {
  const latDiff = destination.lat - currentLocation.lat;
  const lngDiff = destination.lng - currentLocation.lng;

  // Normalize the direction
  const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

  if (distance < stepSize) {
    // Arrived at destination
    return {
      lat: destination.lat,
      lng: destination.lng,
      timestamp: Date.now(),
    };
  }

  // Move towards destination
  const stepLat = (latDiff / distance) * stepSize;
  const stepLng = (lngDiff / distance) * stepSize;

  // Add some randomness for realistic movement
  const randomLat = (Math.random() - 0.5) * stepSize * 0.3;
  const randomLng = (Math.random() - 0.5) * stepSize * 0.3;

  return {
    lat: currentLocation.lat + stepLat + randomLat,
    lng: currentLocation.lng + stepLng + randomLng,
    timestamp: Date.now(),
  };
};

// Format time remaining for display
export const formatTimeRemaining = (minutes: number): string => {
  if (minutes < 1) {
    return "Arriving now";
  } else if (minutes < 60) {
    return `${Math.round(minutes)} mins`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  }
};
