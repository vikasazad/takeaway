"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Phone,
  Bike,
  CheckCircle,
  AlertCircle,
  Copy,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import Script from "next/script";
import {
  calculateETA,
  updateDeliveryPersonLocation,
  updateDeliveryOrderStatus,
  startDeliveryTracking,
  clearDelivery,
} from "../../tracking/utils/deliveryLocationApi";
import { useSelector } from "react-redux";

declare global {
  interface Window {
    google: any;
    initDeliveryMap: () => void;
  }
}

export default function DeliveryPage() {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const deliveryMarkerRef = useRef<any>(null);
  const customerMarkerRef = useRef<any>(null);

  // Get delivery data from Redux
  const delivery = useSelector((state: any) => state.delivery.delivery);
  console.log("Delivery data from Redux:", delivery);

  // Restaurant coordinates from Redux
  const restaurantCoords = delivery?.restaurantCoords || {
    lat: 28.343747,
    lng: 77.336315,
  };

  const DELIVERY_RADIUS_KM = 10;

  // State management
  const [hasStarted, setHasStarted] = useState(false);
  const [hasGeolocationPermission, setHasGeolocationPermission] = useState<
    boolean | null
  >(null);
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [map, setMap] = useState<any>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<any>(null);
  const [directionsService, setDirectionsService] = useState<any>(null);
  const [estimatedTime, setEstimatedTime] = useState("--");
  const [distance, setDistance] = useState("--");
  // const [isDelivered, setIsDelivered] = useState(false);
  const [isWatchingLocation, setIsWatchingLocation] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(true);
  const [isCameraLocked, setIsCameraLocked] = useState(true);
  const animationFrame = useRef<number>();

  // Check if delivery data is available
  const isDeliveryAvailable = delivery && Object.keys(delivery).length > 0;

  // Load order data on mount only if delivery is available
  useEffect(() => {
    if (isDeliveryAvailable) {
      loadOrderData();
    } else {
      setIsLoadingOrder(false);
    }
  }, [isDeliveryAvailable]);

  // Check geolocation permission on component mount only if delivery is available
  useEffect(() => {
    if (isDeliveryAvailable) {
      checkInitialGeolocationPermission();
    }
  }, [isDeliveryAvailable]);

  // Auto-start delivery when order data is loaded
  useEffect(() => {
    if (orderData && !hasStarted && isDeliveryAvailable) {
      handleStartDelivery();
    }
  }, [orderData, hasStarted, isDeliveryAvailable]);

  // Set up global map initialization function only if delivery is available
  useEffect(() => {
    if (isDeliveryAvailable) {
      window.initDeliveryMap = initializeMap;

      return () => {
        if (typeof window !== "undefined" && window.initDeliveryMap) {
          window.initDeliveryMap = undefined as any;
        }
        // Stop watching location on unmount
        if (watchId) {
          navigator.geolocation.clearWatch(watchId);
        }
        if (animationFrame.current) {
          cancelAnimationFrame(animationFrame.current);
        }
      };
    }
  }, [watchId, isDeliveryAvailable]);

  // Initialize map when Google Maps is loaded only if delivery is available
  useEffect(() => {
    if (
      isDeliveryAvailable &&
      isMapLoaded &&
      currentLocation &&
      !isMapInitialized &&
      typeof window !== "undefined" &&
      window.google
    ) {
      initializeMap();
      setIsMapInitialized(true);
    }
  }, [isMapLoaded, currentLocation, isDeliveryAvailable, isMapInitialized]);

  const loadOrderData = async () => {
    try {
      setIsLoadingOrder(true);

      if (delivery) {
        // Transform the delivery data to match our component structure
        const transformedOrder = {
          orderId: delivery?.orderId,
          customer: {
            name: delivery?.customer?.name || "Customer",
            phone: delivery?.customer?.phone,
            address: delivery?.address, // Use the address from delivery data
          },

          orderedItems: delivery?.items || [],
          orderType: "Delivery",
          status: delivery?.payment,
          createdAt: new Date().toISOString(),
        };

        setOrderData(transformedOrder);

        // Check if delivery is already started
        if (delivery?.status === "Out for Delivery") {
          setHasStarted(true);
        }
      }
    } catch (error) {
      console.error("Error loading order data:", error);
      toast.error("Failed to load order data");
    } finally {
      setIsLoadingOrder(false);
    }
  };

  const checkInitialGeolocationPermission = async () => {
    if (!navigator.geolocation) {
      setHasGeolocationPermission(false);
      toast.error("Geolocation is not supported by this browser");
      return;
    }

    // Check permission status
    if (navigator.permissions) {
      try {
        const permission = await navigator.permissions.query({
          name: "geolocation",
        });
        if (permission.state === "granted") {
          setHasGeolocationPermission(true);
        } else if (permission.state === "denied") {
          setHasGeolocationPermission(false);
        } else {
          // Permission is "prompt" - we'll ask when user clicks start
          setHasGeolocationPermission(null);
        }
      } catch (error) {
        console.error("Error checking geolocation permission:", error);
        setHasGeolocationPermission(null);
      }
    }
  };

  const requestGeolocationPermission = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setHasGeolocationPermission(true);
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          toast.success("Location permission granted!");
          resolve(true);
        },
        (error) => {
          setHasGeolocationPermission(false);

          let errorMessage = "Location permission denied";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage =
                "Location permission denied. Please enable location access to continue.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out.";
              break;
          }

          toast.error(errorMessage);
          resolve(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  const handleStartDelivery = async () => {
    // Check geolocation permission first
    if (hasGeolocationPermission === false) {
      toast.error("Location permission is required to start delivery");
      return;
    }

    if (hasGeolocationPermission === null) {
      const granted = await requestGeolocationPermission();
      if (!granted) {
        return;
      }
    } else if (hasGeolocationPermission === true && !currentLocation) {
      // Get initial location if we have permission but no location yet
      const success = await getCurrentLocation();
      if (!success) return;
    }

    try {
      // Start delivery tracking in Firestore
      const success = await startDeliveryTracking(
        delivery?.customer?.phone,
        delivery?.orderId,
        currentLocation!
      );

      if (success) {
        setHasStarted(true);
        toast.success("Delivery started! Your location is being tracked.");
      } else {
        toast.error("Failed to start delivery tracking");
      }
    } catch (error) {
      console.error("Error starting delivery:", error);
      toast.error("Failed to start delivery");
    }
  };

  console.log(orderData);

  const getCurrentLocation = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });

          resolve(true);
        },
        (error) => {
          console.error("Error getting current location:", error);
          toast.error("Failed to get current location");
          resolve(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  // This effect hook now manages the geolocation watcher lifecycle.
  // It starts watching only when the delivery has started and the map is initialized.
  useEffect(() => {
    if (!hasStarted || !isMapInitialized) {
      return;
    }

    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser.");
      return;
    }

    setIsWatchingLocation(true);

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setCurrentLocation(newLocation);
        updateDeliveryLocationInFirestore(newLocation);
        updateMapLocation(newLocation);

        if (orderData?.customer?.address) {
          const eta = calculateETA(newLocation, {
            lat: orderData.customer.address.lat,
            lng: orderData.customer.address.lng,
          });
          setEstimatedTime(eta);
        }
      },
      (error) => {
        console.error("Error watching location:", error);
        toast.error("Error tracking location");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000, // Update every 5 seconds
      }
    );

    setWatchId(id);

    return () => {
      if (id) {
        navigator.geolocation.clearWatch(id);
      }
      setIsWatchingLocation(false);
    };
  }, [
    hasStarted,
    isMapInitialized,
    orderData,
    directionsService,
    directionsRenderer,
  ]);

  const updateDeliveryLocationInFirestore = async (location: {
    lat: number;
    lng: number;
  }) => {
    try {
      await updateDeliveryPersonLocation(
        delivery?.customer?.phone,
        delivery?.orderId,
        location
      );
      console.log("Location updated in Firestore:", location);
    } catch (error) {
      console.error("Error updating location in Firestore:", error);
    }
  };

  const updateMapLocation = (location: { lat: number; lng: number }) => {
    const marker = deliveryMarkerRef.current;
    if (!marker || !map) return;

    const fromPosition = marker.position;
    if (!fromPosition) {
      marker.position = location;
      if (isCameraLocked) {
        map.panTo(location);
      }
      return;
    }

    const from = {
      lat: fromPosition.lat,
      lng: fromPosition.lng,
    };
    const to = location;

    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }

    const duration = 1500; // ms
    const start = performance.now();

    const animate = () => {
      const elapsed = performance.now() - start;
      const fraction = Math.min(elapsed / duration, 1);

      const newLat = from.lat + (to.lat - from.lat) * fraction;
      const newLng = from.lng + (to.lng - from.lng) * fraction;
      const newPosition = { lat: newLat, lng: newLng };

      if (marker) {
        marker.position = newPosition;
      }
      if (isCameraLocked) {
        map.panTo(newPosition);
      }

      if (fraction < 1) {
        animationFrame.current = requestAnimationFrame(animate);
      }
    };

    animationFrame.current = requestAnimationFrame(animate);

    // Recalculate route
    if (
      directionsService &&
      directionsRenderer &&
      orderData?.customer?.address
    ) {
      calculateRoute(location, {
        lat: orderData.customer.address.lat,
        lng: orderData.customer.address.lng,
      });
    }
  };

  function createRestaurantMarker(
    map: any,
    location: { lat: number; lng: number }
  ) {
    const markerElement = document.createElement("div");
    markerElement.innerHTML = `
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
      position: location,
      map: map,
      content: markerElement,
      title: "Restaurant Location",
    });
  }

  const initializeMap = () => {
    if (!mapRef.current || !window.google || !currentLocation) return;

    try {
      const mapOptions = {
        center: currentLocation,
        zoom: 16,
        disableDefaultUI: true,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        mapId: "DEMO_MAP_ID",
      };

      const newMap = new window.google.maps.Map(mapRef.current, mapOptions);
      setMap(newMap);

      newMap.addListener("dragstart", () => {
        setIsCameraLocked(false);
      });

      // Initialize directions
      const newDirectionsService = new window.google.maps.DirectionsService();
      const newDirectionsRenderer = new window.google.maps.DirectionsRenderer({
        suppressMarkers: true,
        preserveViewport: true,
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

      // Add delivery radius circle around restaurant
      new window.google.maps.Circle({
        strokeColor: "#22c55e",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#22c55e",
        fillOpacity: 0.1,
        map: newMap,
        center: restaurantCoords,
        radius: DELIVERY_RADIUS_KM * 1000, // Convert km to meters
      });

      // Add restaurant marker
      createRestaurantMarker(newMap, restaurantCoords);

      // Create delivery person marker
      createDeliveryMarker(newMap, currentLocation);

      // Create customer marker
      if (orderData?.customer?.address) {
        createCustomerMarker(newMap, {
          lat: orderData.customer.address.lat,
          lng: orderData.customer.address.lng,
        });

        // Calculate initial route from driver position to customer
        calculateRoute(
          currentLocation,
          {
            lat: orderData.customer.address.lat,
            lng: orderData.customer.address.lng,
          },
          newDirectionsService,
          newDirectionsRenderer
        );
      }

      console.log("Delivery map initialized successfully");
    } catch (error) {
      console.error("Error initializing map:", error);
      toast.error("Failed to initialize map");
    }
  };

  const createDeliveryMarker = (
    map: any,
    location: { lat: number; lng: number }
  ) => {
    const markerElement = document.createElement("div");
    markerElement.innerHTML = `
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
      </div>
    `;

    const marker = new window.google.maps.marker.AdvancedMarkerElement({
      position: location,
      map: map,
      content: markerElement,
      title: "Your Location (Delivery Person)",
    });

    deliveryMarkerRef.current = marker;
  };

  const createCustomerMarker = (
    map: any,
    location: { lat: number; lng: number }
  ) => {
    const markerElement = document.createElement("div");
    markerElement.innerHTML = `
      <div style="
        width: 40px;
        height: 40px;
        background-color: #ef4444;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
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

    const marker = new window.google.maps.marker.AdvancedMarkerElement({
      position: location,
      map: map,
      content: markerElement,
      title: "Customer Location",
    });

    customerMarkerRef.current = marker;
  };

  const calculateRoute = (
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    newDirectionsService?: any,
    newDirectionsRenderer?: any
  ) => {
    const service = newDirectionsService || directionsService;
    const renderer = newDirectionsRenderer || directionsRenderer;

    if (!service || !renderer) return;

    service.route(
      {
        origin: origin,
        destination: destination,
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
        }
      }
    );
  };

  const handleCallCustomer = () => {
    if (orderData?.customer?.phone) {
      window.open(`tel:${orderData.customer.phone}`);
    }
  };

  const handleMarkDelivered = async () => {
    try {
      // Update status in Firestore
      const success = await updateDeliveryOrderStatus(
        delivery?.customer?.phone,
        delivery?.orderId,
        "Delivered"
      );

      if (success) {
        // Stop location tracking
        await clearDelivery(
          delivery?.customer?.phone,
          delivery?.orderId,
          delivery?.customer?.address?.address
        );
        if (watchId) {
          navigator.geolocation.clearWatch(watchId);
          setWatchId(null);
        }
        setIsWatchingLocation(false);
        router.push("/dashboard");
        // setIsDelivered(true);
        toast.success("Order marked as delivered!");
      } else {
        toast.error("Failed to mark order as delivered");
      }
    } catch (error) {
      console.error("Error marking as delivered:", error);
      toast.error("Failed to mark order as delivered");
    }
  };

  const handleScriptLoad = () => {
    setIsMapLoaded(true);
  };

  const handleScriptError = () => {
    console.error("Failed to load Google Maps script");
    toast.error("Failed to load Google Maps");
  };

  // Check if Google Maps is already loaded
  useEffect(() => {
    if (typeof window !== "undefined" && window.google && window.google.maps) {
      setIsMapLoaded(true);
    }
  }, []);

  if (isLoadingOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading delivery data...</p>
        </div>
      </div>
    );
  }

  if (!isDeliveryAvailable) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No delivery data available. Please start a delivery from the
                delivery dashboard first.
              </AlertDescription>
            </Alert>
            <p className="text-sm text-gray-600 mb-4">
              Delivery information needs to be set in Redux before accessing
              this page.
            </p>
            <Button
              onClick={() => router.push("/dashboard")}
              className="w-full"
            >
              Go to Delivery Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // if (isDelivered) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-green-50">
  //       <Card className="w-full max-w-md mx-4">
  //         <CardContent className="p-6 text-center">
  //           <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
  //           <h2 className="text-2xl font-bold text-green-700 mb-2">
  //             Delivery Completed!
  //           </h2>
  //           <p className="text-gray-600 mb-6">
  //             Order #{orderData.orderId} has been successfully delivered.
  //           </p>
  //           <Button
  //             onClick={() => router.push("/dashboard")}
  //             className="w-full"
  //           >
  //             Back to Deliveries
  //           </Button>
  //         </CardContent>
  //       </Card>
  //     </div>
  //   );
  // }

  return (
    <>
      {/* Only load Google Maps script when delivery data is available */}
      {isDeliveryAvailable && (
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&callback=initDeliveryMap&libraries=marker,places`}
          strategy="afterInteractive"
          onLoad={handleScriptLoad}
          onError={handleScriptError}
        />
      )}

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className=" border-b border-[#f0f0f0] rounded-bl-3xl p-2 box-shadow-lg">
          <div className="flex items-center gap-2">
            <div
              className="ml-2 w-7 h-8 border-2 border-muted rounded-lg box-shadow-lg flex items-center justify-center"
              onClick={() => router.back()}
            >
              <ChevronLeft className="h-6 w-6 " strokeWidth={3} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">Delivery</span>
              <span className="text-xs text-muted-foreground">
                Order #{orderData?.orderId}
              </span>
            </div>
          </div>
        </div>

        {/* Delivery Interface */}
        <>
          {/* Map Container */}
          <div className="relative h-[70vh] bg-gray-200">
            {!isMapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Loading map...</p>
                </div>
              </div>
            )}
            <div ref={mapRef} className="w-full h-full" />

            {/* Map Overlay Info */}
            <div className="absolute top-4 left-4 right-4">
              <Card className="bg-white/90 backdrop-blur-sm">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Bike className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Route</p>
                        <p className="text-xs text-gray-500">
                          {distance} • ETA: {estimatedTime}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800"
                    >
                      {isWatchingLocation ? "Tracking" : "Paused"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* Recenter button */}
            {hasStarted && (
              <div className="absolute bottom-4 right-4 z-10">
                <Button
                  size="icon"
                  variant="secondary"
                  className="rounded-full w-12 h-12 shadow-lg"
                  onClick={() => {
                    if (map && currentLocation) {
                      map.panTo(currentLocation);
                      map.setZoom(16);
                      setIsCameraLocked(true);
                    }
                  }}
                >
                  <MapPin className="h-6 w-6" />
                </Button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="p-4 space-y-3">
            <div className="flex gap-3">
              <Button
                onClick={handleCallCustomer}
                variant="outline"
                className="flex-1"
              >
                <Phone className="h-4 w-4 mr-2" />
                Call Customer
              </Button>
              <Button
                onClick={handleMarkDelivered}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Delivered
              </Button>
            </div>

            {/* Customer Info Card */}
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900">
                    {orderData?.customer?.name}
                  </h3>
                  <Badge>{orderData?.status}</Badge>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {orderData?.customer?.phone}
                    <Copy
                      className="h-4 w-4"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          orderData?.customer?.phone
                        );
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {orderData?.customer?.address?.address}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      Order ID: {orderData?.orderId}
                    </span>
                  </div>
                </div>

                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Items:{" "}
                    {orderData?.orderedItems
                      ?.map((item: any) => `${item.name} (${item.count})`)
                      .join(", ")}
                  </p>
                </div>

                {/* <div className="flex  items-center justify-between gap-3 mt-4">
                  <div>
                    <p className="font-semibold text-lg flex items-center text-blue-600">
                      <IndianRupee className="h-4 w-4" />
                      {orderData?.payment}
                    </p>
                    <p className="text-xs text-gray-500">Total Amount</p>
                  </div>
                </div> */}
              </CardContent>
            </Card>
          </div>
        </>
      </div>
    </>
  );
}
