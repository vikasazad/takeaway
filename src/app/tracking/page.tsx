"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Phone,
  MapPin,
  RefreshCw,
  IndianRupee,
  Package,
  Utensils,
  Navigation,
  Home,
  Bike,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Script from "next/script";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/lib/store";
import { clearCart } from "@/lib/features/addToOrderSlice";
import { cn } from "@/lib/utils";
import {
  subscribeToDeliveryLocation,
  getDeliveryData,
  calculateETA,
  type DeliveryPersonLocation,
  getDeliveryStatus,
  // submitLatLng,
} from "../modules/tracking/utils/deliveryLocationApi";

declare global {
  interface Window {
    google: any;
    initTrackingMap: () => void;
  }
}

// Restaurant location for delivery radius check
const RESTAURANT_LOCATION = {
  lat: 28.343747,
  lng: 77.336315,
  name: "Our Restaurant",
};

const DELIVERY_RADIUS_KM = 3;

// Mock delivery person data - in real app, this would come from your backend
// const MOCK_DELIVERY_PERSON = {
//   name: "Raj Kumar",
//   phone: "+91 98765 43210",
//   vehicle: "Bike",
//   rating: 4.8,
//   // Current location (this would be updated in real-time)
//   currentLocation: {
//     lat: 28.34379,
//     lng: 77.336295,
//   },
//   // Destination (customer address)
//   destination: {
//     lat: 28.348396,
//     lng: 77.332896,
//   },
// };

const ORDER_STATUSES = [
  {
    id: 1,
    title: "Order Placed",
    icon: Package,
  },
  {
    id: 2,
    title: "Preparing",
    icon: Utensils,
  },
  {
    id: 3,
    title: "Out for Delivery",
    icon: Navigation,
  },

  {
    id: 5,
    title: "Delivered",
    icon: Home,
  },
];

export default function OrderTracking() {
  const router = useRouter();
  const dispatch = useDispatch();
  const mapRef = useRef<HTMLDivElement>(null);
  const deliveryMarkerRef = useRef<any>(null);
  const { finalOrder, info } = useSelector(
    (state: RootState) => state.addToOrderData
  );
  const delivery: any = useSelector(
    (state: RootState) => state.delivery?.delivery
  );
  const items = finalOrder?.orderedItem || delivery?.items;
  console.log("delivery in tracking:", delivery);

  const [map, setMap] = useState<any>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<any>(null);
  const [directionsService, setDirectionsService] = useState<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCameraLocked, setIsCameraLocked] = useState(true);
  const [deliveryPerson, setDeliveryPerson] = useState({
    name: "",
    phone: "",
  });
  const [estimatedTime, setEstimatedTime] = useState("20-25 mins");
  const [distance, setDistance] = useState("3.2 km");
  const [deliveryLocation, setDeliveryLocation] = useState({
    lat: RESTAURANT_LOCATION.lat,
    lng: RESTAURANT_LOCATION.lng,
  });
  const [status, setStatus] = useState("");

  // Memoize customer location to prevent unnecessary re-renders
  const customerLocation = useMemo(() => {
    if (!finalOrder?.address && !delivery?.address) return null;
    return {
      lat: finalOrder.address ? finalOrder.address.lat : delivery.address.lat,
      lng: finalOrder.address ? finalOrder.address.lng : delivery.address.lng,
    };
  }, [
    finalOrder?.address?.lat,
    finalOrder?.address?.lng,
    delivery?.address?.lat,
    delivery?.address?.lng,
  ]);

  // Get customer address from finalOrder
  const customerAddress = finalOrder?.address;

  const cleanupDeliveryMarker = () => {
    if (deliveryMarkerRef.current) {
      deliveryMarkerRef.current.map = null;
      deliveryMarkerRef.current = null;
    }
  };

  useEffect(() => {
    if (!finalOrder.contact && !delivery?.customer?.phone) return;
    const unsubscribe = getDeliveryStatus(
      finalOrder?.contact ? finalOrder.contact : delivery?.customer?.phone,
      finalOrder?.contact ? finalOrder.orderId : delivery?.orderId,
      (result: any) => {
        if (result) {
          setStatus(result.status);
          setDeliveryPerson({
            name: result.name,
            phone: result.phone,
          });
        }
      }
    );

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [finalOrder.contact, delivery?.customer?.phone]);

  // Handle delivered status - remove route, driver pin, redirect to home, and clear Redux data
  useEffect(() => {
    if (status === "Delivered") {
      // Remove delivery marker
      if (deliveryMarkerRef.current) {
        deliveryMarkerRef.current.map = null;
        deliveryMarkerRef.current = null;
      }

      // Clear directions
      if (directionsRenderer) {
        directionsRenderer.setDirections({ routes: [] });
      }

      // Show success message and redirect after delay
      toast.success("Order delivered successfully! Thank you for your order.");

      setTimeout(() => {
        dispatch(clearCart());
        router.push("/");
      }, 3000);
    }
  }, [status, directionsRenderer, dispatch, router]);

  useEffect(() => {
    // Set up the global initTrackingMap function
    window.initTrackingMap = initializeMap;

    // Clean up function
    return () => {
      setIsMapLoaded(false);
      setIsMapInitialized(false);
      setMap(null);
      cleanupDeliveryMarker();
      setDirectionsRenderer(null);
      setDirectionsService(null);
      if (typeof window !== "undefined" && window.initTrackingMap) {
        window.initTrackingMap = undefined as any;
      }
    };
  }, []);

  useEffect(() => {
    // Initialize map only once when component mounts and Google Maps is loaded
    if (
      isMapLoaded &&
      !isMapInitialized &&
      typeof window !== "undefined" &&
      window.google
    ) {
      if (status === "Out for Delivery") {
        // Only initialize map if we have actual driver location data (not restaurant location)
        const hasDriverLocation =
          deliveryLocation.lat !== RESTAURANT_LOCATION.lat ||
          deliveryLocation.lng !== RESTAURANT_LOCATION.lng;

        if (hasDriverLocation) {
          initializeMap();
          setIsMapInitialized(true);
        }
      } else {
        initializeMap();
        setIsMapInitialized(true);
      }
    }
  }, [isMapLoaded, status, isMapInitialized, deliveryLocation]);

  useEffect(() => {
    if (
      isMapInitialized &&
      status === "Out for Delivery" &&
      map &&
      !deliveryMarkerRef.current &&
      window.google
    ) {
      const hasDriverLocation =
        deliveryLocation.lat !== RESTAURANT_LOCATION.lat ||
        deliveryLocation.lng !== RESTAURANT_LOCATION.lng;

      if (hasDriverLocation) {
        createDeliveryMarker();
      }
    }
  }, [isMapInitialized, status, map, deliveryLocation]);
  console.log("DELIVERY PERSON", deliveryPerson);
  useEffect(() => {
    if (
      (!finalOrder?.contact && !delivery?.customer?.phone) ||
      status !== "Out for Delivery" ||
      !customerLocation
    ) {
      return;
    }

    let unsubscribe: (() => void) | null = null;

    // Get initial delivery data
    const initializeTracking = async () => {
      try {
        const deliveryData: any = await getDeliveryData(
          finalOrder?.contact ? finalOrder.contact : delivery?.customer?.phone,
          finalOrder?.contact ? finalOrder.orderId : delivery?.orderId
          // finalOrder.contact,
          // finalOrder.orderId
        );
        console.log("DELIVERY DATA", deliveryData);
        if (deliveryData?.location) {
          const location = deliveryData.location;
          const driverLocation = {
            lat: location.lat,
            lng: location.lng,
          };
          setDeliveryLocation(driverLocation);

          if (customerLocation) {
            const distance = calculateDistance(
              location.lat,
              location.lng,
              customerLocation.lat,
              customerLocation.lng
            );

            const eta = calculateETA(
              { lat: location.lat, lng: location.lng },
              customerLocation
            );

            setDistance(`${distance.toFixed(1)} km`);
            setEstimatedTime(eta);
          }
        }

        // Subscribe to real-time location updates
        unsubscribe = subscribeToDeliveryLocation(
          finalOrder?.contact ? finalOrder.contact : delivery?.customer?.phone,
          finalOrder?.contact ? finalOrder.orderId : delivery?.orderId,
          (location: DeliveryPersonLocation) => {
            console.log(
              "Driver location updated (lat, lng):",
              location.lat,
              location.lng
            );

            // Update delivery location state immediately
            const newLocation = {
              lat: location.lat,
              lng: location.lng,
            };
            setDeliveryLocation(newLocation);

            const currentMarker = deliveryMarkerRef.current;

            if (currentMarker && window.google) {
              try {
                // For AdvancedMarkerElement, we need to set position as a plain object
                const newPosition = {
                  lat: location.lat,
                  lng: location.lng,
                };
                currentMarker.position = newPosition;
                console.log(
                  "✅ Driver marker position smoothly updated to:",
                  location.lat,
                  location.lng
                );

                if (map && isCameraLocked) {
                  // map.panTo(newPosition);
                  // console.log("Map center updated to follow driver");
                }
              } catch (error) {
                console.error("Error updating marker position:", error);
                // Try alternative method if the first fails
                try {
                  currentMarker.position = new window.google.maps.LatLng(
                    location.lat,
                    location.lng
                  );
                } catch (fallbackError) {
                  console.error(
                    "Fallback marker update failed:",
                    fallbackError
                  );
                }
              }
            }
            // Update ETA and distance with new location data
            if (customerLocation) {
              const distance = calculateDistance(
                location.lat,
                location.lng,
                customerLocation.lat,
                customerLocation.lng
              );

              const eta = calculateETA(
                { lat: location.lat, lng: location.lng },
                customerLocation
              );

              setDistance(`${distance.toFixed(1)} km`);
              setEstimatedTime(eta);
            }

            // Smoothly recalculate route with new location - use the actual location data
            if (directionsService && directionsRenderer && customerLocation) {
              console.log(
                "Smoothly recalculating route with new driver location:",
                newLocation
              );

              directionsService.route(
                {
                  origin: newLocation,
                  destination: customerLocation,
                  travelMode: window.google.maps.TravelMode.DRIVING,
                  unitSystem: window.google.maps.UnitSystem.METRIC,
                },
                (result: any, status: any) => {
                  if (status === "OK" && result) {
                    // Smoothly update the route without jarring animations
                    directionsRenderer.setDirections(result);
                    const route = result.routes[0];
                    const leg = route.legs[0];
                    setDistance(leg.distance.text);
                    setEstimatedTime(leg.duration.text);
                    console.log(
                      `Route smoothly updated: ${leg.distance.text} in ${leg.duration.text}`
                    );
                  } else {
                    console.error("Route recalculation failed:", status);
                  }
                }
              );
            }
          }
        );
      } catch (error) {
        console.error("Error initializing tracking:", error);
        toast.error("Failed to load delivery tracking data");
      }
    };

    initializeTracking();

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [
    finalOrder?.contact,
    delivery?.customer?.phone,
    status,
    customerLocation?.lat,
    customerLocation?.lng,
    map,
    directionsService,
    directionsRenderer,
  ]);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (
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

  const createDeliveryMarker = () => {
    if (!map || !window.google) return;

    const deliveryMarkerElement = document.createElement("div");
    deliveryMarkerElement.innerHTML = `
      <div style="
        position: relative;
        width: 40px;
        height: 40px;
        background-color: #10B981;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        color: white;
      ">
        🛵
        <div style="
          position: absolute;
          bottom: -5px;
          left: 50%;
          transform: translateX(-50%);
          width: 8px;
          height: 8px;
          background-color: #10B981;
          border-radius: 50%;
          animation: pulse 2s infinite;
        "></div>
      </div>
      <style>
        @keyframes pulse {
          0% { transform: translateX(-50%) scale(1); opacity: 1; }
          50% { transform: translateX(-50%) scale(1.5); opacity: 0.5; }
          100% { transform: translateX(-50%) scale(1); opacity: 1; }
        }
      </style>
    `;

    try {
      const newDeliveryMarker =
        new window.google.maps.marker.AdvancedMarkerElement({
          position: deliveryLocation,
          map: map,
          content: deliveryMarkerElement,
          title: `${deliveryPerson.name} - Delivery Partner`,
        });

      deliveryMarkerRef.current = newDeliveryMarker;
    } catch (error) {
      console.error("Error creating delivery person marker:", error);
    }
  };

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    try {
      const mapOptions = {
        center:
          status === "Out for Delivery"
            ? deliveryLocation
            : RESTAURANT_LOCATION,
        disableDefaultUI: true,
        zoom: 14,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        rotateControl: false,
        mapId: "DEMO_MAP_ID", // Required for AdvancedMarkerElement
      };

      const newMap = new window.google.maps.Map(mapRef.current, mapOptions);
      setMap(newMap);

      newMap.addListener("dragstart", () => {
        setIsCameraLocked(false);
      });

      // Initialize directions service and renderer
      const newDirectionsService = new window.google.maps.DirectionsService();
      const newDirectionsRenderer = new window.google.maps.DirectionsRenderer({
        suppressMarkers: true, // We'll use custom markers
        preserveViewport: true, // Prevent map from zooming to fit route
        polylineOptions: {
          strokeColor: "#10B981",
          strokeWeight: 4,
          strokeOpacity: 0.8,
          zIndex: 2,
        },
      });

      newDirectionsRenderer.setMap(newMap);
      setDirectionsService(newDirectionsService);
      setDirectionsRenderer(newDirectionsRenderer);

      // Add delivery radius circle
      new window.google.maps.Circle({
        strokeColor: "#22c55e",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#22c55e",
        fillOpacity: 0.1,
        map: newMap,
        center: { lat: RESTAURANT_LOCATION.lat, lng: RESTAURANT_LOCATION.lng },
        radius: DELIVERY_RADIUS_KM * 1000, // Convert km to meters
      });

      // Add restaurant marker
      const restaurantMarkerElement = document.createElement("div");
      restaurantMarkerElement.innerHTML = `
        <div style="
          width: 30px;
          height: 30px;
          background-color: #22c55e;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          color: white;
        ">🏪</div>
      `;

      new window.google.maps.marker.AdvancedMarkerElement({
        position: {
          lat: RESTAURANT_LOCATION.lat,
          lng: RESTAURANT_LOCATION.lng,
        },
        map: newMap,
        content: restaurantMarkerElement,
        title: RESTAURANT_LOCATION.name,
      });

      // Only create delivery person marker when status is "out for delivery"
      if (status === "Out for Delivery") {
        createDeliveryMarker();
      }

      if (customerLocation) {
        const customerMarkerElement = document.createElement("div");
        customerMarkerElement.innerHTML = `
          <div style="
            width: 40px;
            height: 40px;
            background-color: #ef4444;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            cursor: pointer;
            position: relative;
          ">
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(45deg);
              width: 8px;
              height: 8px;
              background-color: white;
              border-radius: 50%;
            "></div>
          </div>
        `;

        new window.google.maps.marker.AdvancedMarkerElement({
          position: customerLocation,
          map: newMap,
          content: customerMarkerElement,
          title: "Your Location",
        });
      }

      // Calculate and display route after map initialization only if status is "out for delivery"
      if (status === "Out for Delivery" && customerLocation) {
        calculateDirectRoute(
          newDirectionsService,
          newDirectionsRenderer,
          newMap
        );
      }

      console.log("Tracking map initialized successfully");
    } catch (error) {
      console.error("Error initializing tracking map:", error);
      toast.error("Failed to load tracking map. Please refresh the page.");
    }
  };

  // Optimized route calculation function - now called immediately on location updates
  const calculateDirectRoute = (
    newDirectionsService?: any,
    newDirectionsRenderer?: any,
    map?: any
  ) => {
    // Early return if customerLocation is not available
    if (!customerLocation) {
      console.error("Customer location not available for route calculation");
      return;
    }

    const service =
      newDirectionsService ||
      directionsService ||
      (window.google?.maps && new window.google.maps.DirectionsService());
    const renderer =
      newDirectionsRenderer ||
      directionsRenderer ||
      (window.google?.maps &&
        new window.google.maps.DirectionsRenderer({
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: "#3B82F6",
            strokeWeight: 4,
            strokeOpacity: 0.8,
          },
        }));

    if (!service || !renderer) {
      console.error("Directions service or renderer not available");
      return;
    }

    if (!directionsRenderer && map) {
      renderer.setMap(map);
      setDirectionsRenderer(renderer);
    }

    if (!directionsService) {
      setDirectionsService(service);
    }

    console.log(
      "Calculating route from:",
      deliveryLocation,
      "to:",
      customerLocation
    );

    service.route(
      {
        origin: deliveryLocation,
        destination: customerLocation,
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.METRIC,
      },
      (result: any, status: any) => {
        if (status === "OK" && result) {
          renderer.setDirections(result);
          const route = result.routes[0];
          const leg = route.legs[0];
          setDistance(leg.distance.text);
          setEstimatedTime(leg.duration.text);
        } else {
          console.error("Directions request failed:", status);
          toast.error("Failed to calculate route");
        }
      }
    );
  };

  const handleRefreshLocation = () => {
    if (status !== "Out for Delivery") {
      toast.info("Driver location only available when out for delivery");
      return;
    }

    setIsRefreshing(true);

    if (deliveryMarkerRef.current && map) {
      calculateDirectRoute();
    }

    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Location refreshed");
    }, 1000);
  };

  const handleCallDeliveryPerson = () => {
    window.open(`tel:${deliveryPerson.phone}`);
  };

  const handleScriptLoad = () => {
    setIsMapLoaded(true);
  };

  const handleScriptError = () => {
    console.error("Failed to load Google Maps script for tracking");
    toast.error("Failed to load tracking map");
  };

  // Check if Google Maps is already loaded
  useEffect(() => {
    if (typeof window !== "undefined" && window.google && window.google.maps) {
      setIsMapLoaded(true);
    }
  }, []);

  if (!finalOrder && !delivery?.customer?.phone) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg font-semibold">No order to track</p>
          <Button onClick={() => router.push("/")} className="mt-4">
            Return to Menu
          </Button>
        </div>
      </div>
    );
  }

  // const handleSubmitLatLng = async () => {
  //   const coords = [
  //     {
  //       lat: 28.343813,
  //       lng: 77.335195,
  //     },
  //     {
  //       lat: 28.343823,
  //       lng: 77.33461,
  //     },
  //     {
  //       lat: 28.344351,
  //       lng: 77.334562,
  //     },
  //     {
  //       lat: 28.344788,
  //       lng: 77.334558,
  //     },
  //     {
  //       lat: 28.345242,
  //       lng: 77.334567,
  //     },
  //     {
  //       lat: 28.346124,
  //       lng: 77.334575,
  //     },
  //     {
  //       lat: 28.346416,
  //       lng: 77.33441,
  //     },
  //     {
  //       lat: 28.34692,
  //       lng: 77.335312,
  //     },
  //     {
  //       lat: 28.347989,
  //       lng: 77.334779,
  //     },
  //     {
  //       lat: 28.349115,
  //       lng: 77.334253,
  //     },
  //     { lat: 28.348961, lng: 77.333597 },
  //     {
  //       lat: 28.348568,
  //       lng: 77.333324,
  //     },
  //     {
  //       lat: 28.348403,
  //       lng: 77.332925,
  //     },
  //   ];

  //   let currentIndex = 0;

  //   const updateLocation = async () => {
  //     if (currentIndex < coords.length) {
  //       const currentCoord = coords[currentIndex];
  //       await submitLatLng(currentCoord); // Pass single coordinate object instead of array
  //       currentIndex++;
  //       setTimeout(updateLocation, 1000);
  //     }
  //   };

  //   updateLocation();
  // };
  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&callback=initTrackingMap&libraries=marker,places`}
        strategy="afterInteractive"
        onLoad={handleScriptLoad}
        onError={handleScriptError}
      />

      <div className="min-h-screen">
        {/* Header */}
        <div className="bg-white border-b border-[#f0f0f0] rounded-bl-3xl  px-2 py-3 box-shadow-lg flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div
              className="ml-2 w-7 h-8 border-2 border-muted rounded-lg box-shadow-lg flex items-center justify-center"
              onClick={() => router.back()}
            >
              <ChevronLeft className="h-6 w-6 " strokeWidth={3} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Track Order</h1>
              <p className="text-xs text-gray-500">
                Order #
                {finalOrder?.orderId ? finalOrder.orderId : delivery?.orderId} •{" "}
                {info.name}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefreshLocation}
            disabled={isRefreshing}
            className="border border-gray-200"
          >
            <RefreshCw
              className={cn("h-4 w-4", isRefreshing && "animate-spin")}
            />
          </Button>
        </div>

        {/* Map Container */}
        <div className="relative h-[65vh] bg-gray-200">
          {!isMapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading map...</p>
              </div>
            </div>
          )}
          <div ref={mapRef} className="w-full h-full" />

          {/* Recenter button */}
          <div className="absolute bottom-4 right-4 z-10">
            <Button
              size="icon"
              variant="secondary"
              className={cn(
                "rounded-full w-12 h-12 shadow-lg",
                !isCameraLocked && "animate-pulse"
              )}
              onClick={() => {
                if (map && deliveryLocation) {
                  map.panTo(deliveryLocation);
                  map.setZoom(16);
                  setIsCameraLocked(true);
                }
              }}
            >
              <MapPin className="h-6 w-6" />
            </Button>
          </div>

          {/* Map Overlay Info */}
          <div className="absolute top-4 left-4 right-4">
            <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      {ORDER_STATUSES.map((order) => (
                        <div key={order.id}>
                          {order.title === status && (
                            <order.icon className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {status === "Delivered"
                          ? "Thank you for your order"
                          : status}
                      </p>
                      {status === "Out for Delivery" && (
                        <p className="text-xs text-gray-500">
                          {distance} • ETA: {estimatedTime}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800"
                    >
                      {status === "Delivered" ? "Delivered" : "In Progress"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* <Button onClick={() => handleSubmitLatLng()}>Submit LatLng</Button> */}

        <div className="px-4 py-2 space-y-4">
          {/* Delivery Partner Info - Only show when out for delivery */}
          {status === "Out for Delivery" && (
            <Card>
              <CardHeader className="px-4 py-3">
                <CardTitle className="text-base flex items-center">
                  Your Delivery Partner
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 ">
                <div className="flex items-center justify-between   rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Bike className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {deliveryPerson.name}
                      </p>
                      {/* <p className="text-xs text-gray-500">
                        Updated{" "}
                        {Math.floor((Date.now() - new Date().getTime()) / 1000)}
                        s ago
                      </p> */}
                      {/* <div className="flex items-center text-sm text-gray-500">
                        <span>⭐ {deliveryPerson.rating}</span>
                        <span className="mx-2">•</span>
                        <span>{deliveryPerson.vehicle}</span>
                      </div> */}
                    </div>
                  </div>
                  <div className=" flex flex-col ">
                    <p className="text-center font-medium text-sm">ETA</p>
                    <p className="text-xs text-gray-500">{estimatedTime}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCallDeliveryPerson}
                    className="p-2"
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Progress */}
          {/* <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Order Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {ORDER_STATUSES.map((status, index) => (
                  <div key={status.id} className="flex items-center space-x-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                          status.completed
                            ? "bg-green-500 border-green-500"
                            : index === currentStatus
                            ? "bg-blue-500 border-blue-500 animate-pulse"
                            : "border-gray-300"
                        )}
                      >
                        {status.completed && (
                          <CheckCircle2 className="h-3 w-3 text-white" />
                        )}
                        {index === currentStatus && !status.completed && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      {index < ORDER_STATUSES.length - 1 && (
                        <div
                          className={cn(
                            "w-0.5 h-6 mt-1",
                            status.completed ? "bg-green-500" : "bg-gray-300"
                          )}
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <p
                        className={cn(
                          "font-medium text-sm",
                          status.completed ? "text-green-700" : "text-gray-700"
                        )}
                      >
                        {status.title}
                      </p>
                      <p className="text-xs text-gray-500">{status.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card> */}

          {/* Route Legend */}
          {/* <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center">
                <div className="w-4 h-4 bg-gray-400 rounded mr-2"></div>
                Route Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-1 bg-gray-400 opacity-50 rounded"></div>
                  <span className="text-xs text-gray-600">
                    Complete delivery route (Restaurant → You)
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-1 bg-green-500 rounded"></div>
                  <span className="text-xs text-gray-600">
                    Remaining route (Delivery person → You)
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow flex items-center justify-center text-xs">
                    🛵
                  </div>
                  <span className="text-xs text-gray-600">
                    Live delivery person location
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-green-600 rounded-full border-2 border-white shadow flex items-center justify-center text-xs">
                    🏪
                  </div>
                  <span className="text-xs text-gray-600">
                    Restaurant location
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow transform rotate-45"></div>
                  <span className="text-xs text-gray-600">
                    Your delivery address
                  </span>
                </div>
              </div>
            </CardContent>
          </Card> */}

          {/* Order Summary */}

          <div className=" pb-4">
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Order Details</h3>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  {items?.map((item: any, index: number) => (
                    <div className="flex justify-between" key={index}>
                      <div className="flex flex-col">
                        <span className="text-gray-600">
                          {item.count}x {item.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {item.quantity}
                        </span>
                      </div>
                      <span className="font-medium flex items-center ">
                        <IndianRupee className="w-3 h-3" />
                        {item.price * item.count}
                      </span>
                    </div>
                  ))}

                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Taxes and charges</span>
                    <span className="flex items-center  ">
                      <IndianRupee className="w-3 h-3" />
                      {finalOrder.gstAmount ||
                        delivery?.payment?.gst?.gstAmount}
                    </span>
                  </div>

                  {finalOrder?.discountAmount > 0 && (
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>
                        Savings with{" "}
                        <span>
                          {finalOrder.discountCode ||
                            delivery?.payment?.discount?.discountCode}
                        </span>
                      </span>
                      <span className="flex items-center text-green-600 ">
                        - <IndianRupee className="w-3 h-3" />
                        {finalOrder.discountAmount ||
                          delivery?.payment?.discount?.discountAmount}
                      </span>
                    </div>
                  )}
                </div>

                <div className="border-t pt-3 flex justify-between font-semibold">
                  <span>Total Paid</span>
                  <span className="text-blue-600 flex items-center">
                    <IndianRupee className="w-3 h-3" />
                    {finalOrder.orderAmount || delivery?.payment?.price}
                  </span>
                </div>

                {finalOrder.orderType === "Delivery" ||
                  (delivery?.orderType === "Delivery" && (
                    <div className="mt-4 pt-3 border-t">
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {customerAddress?.house || "Address not available"}
                          </div>
                          <div className="text-gray-600">
                            {customerAddress?.floor &&
                              `Floor ${customerAddress.floor}, `}
                            {customerAddress?.apartment &&
                              ` ${customerAddress.apartment}`}
                            {customerAddress?.landmark &&
                              ` , Near ${customerAddress.landmark} `}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Special instructions: Ring doorbell twice
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
