"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, MapPin, Navigation, CircleX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import Script from "next/script";
import Image from "next/image";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
// import { saveCustomerAddress } from "../utils/addressApi";
import { useDispatch, useSelector } from "react-redux";
import { addUser } from "@/lib/features/addToOrderSlice";
import { setEditAddress } from "@/lib/features/editAddressSlice";
import { saveCustomerAddress } from "../utils/addressApi";

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

// Restaurant location for delivery radius check
const RESTAURANT_LOCATION = {
  lat: 28.343747,
  lng: 77.336315,
  name: "Our Restaurant",
};

const DELIVERY_RADIUS_KM = 3;

export default function Address() {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch();
  const { user } = useSelector((state: any) => state.addToOrderData);
  console.log("user", user);
  const { flag, type } = useSelector((state: any) => state.editAddress);
  console.log("flag", flag);
  console.log("type", type);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [geocoder, setGeocoder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState({
    formatted: "",
    lat: 28.4595,
    lng: 77.0266,
  });
  const [addressDetails, setAddressDetails] = useState({
    house: "",
    floor: "",
    apartment: "",
    landmark: "",
    type: "Home",
    default: false,
  });
  console.log("addressDetails", addressDetails);
  const [isWithinDeliveryRadius, setIsWithinDeliveryRadius] = useState(true);
  const [isAddressDrawerOpen, setIsAddressDrawerOpen] = useState(false);
  const [errors, setErrors] = useState({
    house: "",
    apartment: "",
    address: "",
  });
  const types = ["Home", "Work", "Others"];

  // Auto-select the first available address type
  useEffect(() => {
    if (user?.address && addressDetails.type) {
      const currentTypeExists = user.address.some(
        (addr: any) => addr.type === addressDetails.type
      );

      if (currentTypeExists) {
        // Find the first available type that doesn't exist
        const availableType = types.find(
          (type) => !user.address.some((addr: any) => addr.type === type)
        );

        if (availableType) {
          setAddressDetails((prev) => ({
            ...prev,
            type: availableType,
          }));
        }
      }
    }
  }, [user?.address]); // Only run when user.address changes

  useEffect(() => {
    // Set up the global initMap function
    window.initMap = initializeMap;

    // Clean up function to reset states when component unmounts
    return () => {
      setIsMapLoaded(false);
      setMap(null);
      setMarker(null);
      setGeocoder(null);
      if (typeof window !== "undefined" && window.initMap) {
        window.initMap = undefined as any;
      }
      // Clear edit state on component unmount
      dispatch(setEditAddress({ flag: false, type: "" }));
    };
  }, [dispatch]);

  // Effect to prepopulate address data when editing
  useEffect(() => {
    if (flag && type && user?.address?.length > 0) {
      // Find the address to edit
      const addressToEdit = user.address.find(
        (addr: any) => addr.type === type
      );

      if (addressToEdit) {
        console.log("Prepopulating address for editing:", addressToEdit);

        // Prepopulate address details form
        setAddressDetails({
          house: addressToEdit.house || "",
          floor: addressToEdit.floor || "",
          apartment: addressToEdit.apartment || "",
          landmark: addressToEdit.landmark || "",
          type: addressToEdit.type || "Home",
          default: addressToEdit.default || false,
        });

        // Prepopulate selected address location if coordinates are available
        if (addressToEdit.lat && addressToEdit.lng) {
          setSelectedAddress({
            formatted: addressToEdit.address || "",
            lat: addressToEdit.lat,
            lng: addressToEdit.lng,
          });

          // Check delivery radius for the existing address
          checkDeliveryRadius(addressToEdit.lat, addressToEdit.lng);
        } else if (addressToEdit.address) {
          // If no coordinates but we have an address string, set it
          setSelectedAddress((prev) => ({
            ...prev,
            formatted: addressToEdit.address,
          }));
        }

        // Clear the edit state after prepopulation
        dispatch(setEditAddress({ flag: false, type: "" }));
      }
    }
  }, [flag, type, user?.address, dispatch]);

  useEffect(() => {
    // Initialize map when component mounts and Google Maps is loaded
    if (isMapLoaded && typeof window !== "undefined" && window.google) {
      initializeMap();
    }
  }, [isMapLoaded]);

  // Effect to update map when selectedAddress changes (for editing)
  useEffect(() => {
    if (map && marker && selectedAddress.lat && selectedAddress.lng) {
      // Update map center
      map.setCenter({ lat: selectedAddress.lat, lng: selectedAddress.lng });
      map.setZoom(16);

      // Update marker position
      marker.position = { lat: selectedAddress.lat, lng: selectedAddress.lng };
    }
  }, [selectedAddress, map, marker]);

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

  const checkDeliveryRadius = (lat: number, lng: number) => {
    const distance = calculateDistance(
      RESTAURANT_LOCATION.lat,
      RESTAURANT_LOCATION.lng,
      lat,
      lng
    );

    console.log(`Distance from restaurant: ${distance.toFixed(2)} km`);

    const withinRadius = distance <= DELIVERY_RADIUS_KM;
    setIsWithinDeliveryRadius(withinRadius);

    // if (!withinRadius) {
    //   toast.error(
    //     `Location is ${distance.toFixed(
    //       2
    //     )} km away. We only deliver within ${DELIVERY_RADIUS_KM} km radius.`
    //   );
    // }

    return withinRadius;
  };

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    try {
      const mapOptions = {
        center: { lat: selectedAddress.lat, lng: selectedAddress.lng },
        zoom: 15,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        mapId: "DEMO_MAP_ID", // Required for AdvancedMarkerElement
        // Remove styles property when using mapId - styles are controlled via cloud console
      };

      const newMap = new window.google.maps.Map(mapRef.current, mapOptions);
      setMap(newMap);

      // Initialize geocoder
      const newGeocoder = new window.google.maps.Geocoder();
      setGeocoder(newGeocoder);

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

      // Create custom marker element for delivery location
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

      // Use AdvancedMarkerElement instead of deprecated Marker
      const newMarker = new window.google.maps.marker.AdvancedMarkerElement({
        position: { lat: selectedAddress.lat, lng: selectedAddress.lng },
        map: newMap,
        content: markerElement,
        gmpDraggable: true,
      });
      setMarker(newMarker);

      // Add drag event listener
      newMarker.addListener("dragend", (event: any) => {
        const newLat = event.latLng.lat();
        const newLng = event.latLng.lng();
        checkDeliveryRadius(newLat, newLng);
        reverseGeocode(newLat, newLng);
      });

      // Add click event listener to map
      newMap.addListener("click", (event: any) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        newMarker.position = { lat, lng };
        checkDeliveryRadius(lat, lng);
        reverseGeocode(lat, lng);
      });

      // Get initial address and check radius
      checkDeliveryRadius(selectedAddress.lat, selectedAddress.lng);
      reverseGeocode(selectedAddress.lat, selectedAddress.lng);

      console.log("Map initialized successfully");
    } catch (error) {
      console.error("Error initializing map:", error);
      toast.error(
        "Failed to load map. Please check your API key configuration."
      );
    }
  };

  const reverseGeocode = (lat: number, lng: number) => {
    console.log("geocoder", geocoder);

    // Initialize geocoder if not available but Google Maps is loaded
    let currentGeocoder = geocoder;
    if (!currentGeocoder && window.google && window.google.maps) {
      console.log("Initializing geocoder directly in reverseGeocode");
      currentGeocoder = new window.google.maps.Geocoder();
      setGeocoder(currentGeocoder);
    }

    if (!currentGeocoder) {
      console.log("geocoder not found and Google Maps not available");
      return;
    }

    setIsLoading(true);
    currentGeocoder.geocode(
      { location: { lat, lng } },
      (results: any, status: any) => {
        setIsLoading(false);
        if (status === "OK" && results[0]) {
          const address = results[0].formatted_address;
          setSelectedAddress({
            formatted: address,
            lat,
            lng,
          });
          console.log("Selected address:", {
            formatted: address,
            lat,
            lng,
            components: results[0].address_components,
          });
        } else {
          console.error("Geocoding failed:", status);
          toast.error("Unable to get address for this location");
        }
      }
    );
  };

  // Search for places using Google Places API
  const searchPlaces = (query: string) => {
    if (
      !window.google ||
      !window.google.maps ||
      !window.google.maps.places ||
      !query.trim()
    ) {
      setSearchSuggestions([]);
      return;
    }

    const autocompleteService =
      new window.google.maps.places.AutocompleteService();
    const placesService = new window.google.maps.places.PlacesService(map);

    const request = {
      input: query,
      location: new window.google.maps.LatLng(
        RESTAURANT_LOCATION.lat,
        RESTAURANT_LOCATION.lng
      ),
      radius: 10000, // 10km radius for search
      types: ["establishment", "geocode"], // Include both places and addresses
    };

    autocompleteService.getPlacePredictions(
      request,
      (predictions: any, status: any) => {
        if (
          status === window.google.maps.places.PlacesServiceStatus.OK &&
          predictions
        ) {
          // Get detailed place info for each prediction
          const suggestions: any[] = [];
          let processedCount = 0;

          predictions.slice(0, 3).forEach((prediction: any) => {
            placesService.getDetails(
              {
                placeId: prediction.place_id,
                fields: ["name", "formatted_address", "geometry", "place_id"],
              },
              (place: any, detailStatus: any) => {
                processedCount++;
                if (
                  detailStatus ===
                    window.google.maps.places.PlacesServiceStatus.OK &&
                  place
                ) {
                  suggestions.push({
                    place_id: place.place_id,
                    name:
                      place.name || prediction.structured_formatting.main_text,
                    formatted_address:
                      place.formatted_address || prediction.description,
                    geometry: place.geometry,
                  });
                }

                // Update suggestions when all requests are complete
                if (processedCount === Math.min(predictions.length, 3)) {
                  setSearchSuggestions(suggestions);
                }
              }
            );
          });
        } else {
          setSearchSuggestions([]);
        }
      }
    );
  };

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setShowSuggestions(true);

    if (query.length > 2) {
      searchPlaces(query);
    } else {
      setSearchSuggestions([]);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: any) => {
    const lat = suggestion.geometry.location.lat();
    const lng = suggestion.geometry.location.lng();

    setSearchQuery(suggestion.name);
    setShowSuggestions(false);
    setSearchSuggestions([]);

    // Update map and marker
    if (map && marker) {
      map.setCenter({ lat, lng });
      map.setZoom(16);
      marker.position = { lat, lng };
    }

    // Check delivery radius
    checkDeliveryRadius(lat, lng);

    // Update address
    setSelectedAddress({
      formatted: suggestion.formatted_address,
      lat,
      lng,
    });
  };

  // Check geolocation permissions
  const checkGeolocationPermission = async () => {
    if (!navigator.permissions) {
      console.log("Permissions API not supported");
      return "unknown";
    }

    try {
      const permission = await navigator.permissions.query({
        name: "geolocation",
      });
      console.log("Geolocation permission status:", permission.state);
      return permission.state;
    } catch (error) {
      console.error("Error checking geolocation permission:", error);
      return "unknown";
    }
  };

  const getCurrentLocation = async () => {
    // Check if we're on HTTPS (required for high accuracy geolocation)
    if (location.protocol !== "https:" && location.hostname !== "localhost") {
      toast.error("Geolocation requires HTTPS for accurate results");
      tryIpGeolocation();
      return;
    }

    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser");
      // Fallback to IP-based geolocation
      tryIpGeolocation();
      return;
    }

    // Check permission status first
    const permissionStatus = await checkGeolocationPermission();
    if (permissionStatus === "denied") {
      toast.error("Location permission is denied. Using IP-based location...");
      tryIpGeolocation();
      return;
    }

    setIsLoading(true);
    console.log("Requesting current location...");

    // Use the W3C Geolocation standard with proper options for better accuracy
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        console.log("✅ Current position found:", pos);
        console.log("Position accuracy:", position.coords.accuracy, "meters");
        console.log(
          "Position timestamp:",
          new Date(position.timestamp).toLocaleString()
        );

        if (map && marker) {
          // Center map on current location
          map.setCenter(pos);
          map.setZoom(16); // Zoom in for better accuracy

          // Update marker position
          marker.position = pos;

          // Check delivery radius
          checkDeliveryRadius(pos.lat, pos.lng);

          // Get address for this location
          reverseGeocode(pos.lat, pos.lng);
        }

        setIsLoading(false);
        // toast.success("Current location found!");
      },
      (error) => {
        console.error("❌ Geolocation error:", error);

        // Handle different types of geolocation errors
        let errorMessage = "Unable to get your location";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              "Location access denied. Trying IP-based location...";
            console.log("User denied location permission");
            // Fallback to IP-based geolocation
            tryIpGeolocation();
            return;
          case error.POSITION_UNAVAILABLE:
            errorMessage =
              "Location information is unavailable. Trying IP-based location...";
            console.log("Location information unavailable");
            // Fallback to IP-based geolocation
            tryIpGeolocation();
            return;
          case error.TIMEOUT:
            errorMessage =
              "Location request timed out. Trying IP-based location...";
            console.log("Location request timeout");
            // Fallback to IP-based geolocation
            tryIpGeolocation();
            return;
          default:
            errorMessage =
              "An unknown error occurred while retrieving location";
            console.log("Unknown geolocation error");
            setIsLoading(false);
            toast.error(errorMessage);
            break;
        }

        toast.error(errorMessage);
      },
      {
        // Options for better accuracy and performance
        enableHighAccuracy: true, // Use GPS if available
        timeout: 15000, // Wait up to 15 seconds
        maximumAge: 0, // Don't use cached location
      }
    );
  };

  // IP-based geolocation fallback
  const tryIpGeolocation = () => {
    if (!map) {
      setIsLoading(false);
      return;
    }

    console.log("Trying IP-based geolocation...");

    // Use browser's built-in geolocation service
    fetch("https://ipapi.co/json/")
      .then((response) => response.json())
      .then((data) => {
        if (data.latitude && data.longitude) {
          const pos = {
            lat: data.latitude,
            lng: data.longitude,
          };

          console.log("IP-based position found:", pos);
          console.log(
            "IP-based location city:",
            data.city,
            data.region,
            data.country_name
          );

          if (map && marker) {
            map.setCenter(pos);
            map.setZoom(12); // Zoom out a bit for IP-based location
            marker.position = pos;
            checkDeliveryRadius(pos.lat, pos.lng);
            reverseGeocode(pos.lat, pos.lng);
          }

          setIsLoading(false);
          //   toast.success(`Location found: ${data.city}, ${data.region}`);
        } else {
          throw new Error("No location data available");
        }
      })
      .catch((error) => {
        console.error("IP geolocation failed:", error);
        setIsLoading(false);
        toast.error(
          "Unable to determine your location. Please manually select your location on the map."
        );
      });
  };

  // Validation function
  const validateFields = () => {
    const newErrors = {
      house: "",
      apartment: "",
      address: "",
    };

    if (!selectedAddress.formatted) {
      newErrors.address = "Please select an address";
    }

    if (!addressDetails.house.trim()) {
      newErrors.house = "Please enter house/flat number";
    }

    if (!addressDetails.apartment.trim()) {
      newErrors.apartment = "Please enter apartment/area details";
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === "");
  };

  // Check if form is valid for button state
  const isFormValid = () => {
    return (
      selectedAddress.formatted &&
      addressDetails.house.trim() &&
      addressDetails.apartment.trim() &&
      isWithinDeliveryRadius
    );
  };

  const handleSaveAddress = async () => {
    if (!validateFields()) {
      return;
    }

    if (!isWithinDeliveryRadius) {
      toast.error(
        `This location is outside our ${DELIVERY_RADIUS_KM} km delivery radius`
      );
      return;
    }

    const distance = calculateDistance(
      RESTAURANT_LOCATION.lat,
      RESTAURANT_LOCATION.lng,
      selectedAddress.lat,
      selectedAddress.lng
    );

    const fullAddress = {
      ...addressDetails,
      address: `${addressDetails.house}${
        addressDetails.floor ? `, Floor ${addressDetails.floor}` : ""
      }${addressDetails.apartment ? `, ${addressDetails.apartment}` : ""}${
        addressDetails.landmark ? `, Near ${addressDetails.landmark}` : ""
      }`,
      distanceFromRestaurant: distance.toFixed(2),
      withinDeliveryRadius: isWithinDeliveryRadius,
      lat: selectedAddress.lat,
      lng: selectedAddress.lng,
      name: user?.name,
      phone: user?.phone,
    };
    console.log("fullAddress", fullAddress);

    if (fullAddress && isWithinDeliveryRadius) {
      // const res = await saveCustomerAddress(
      //   fullAddress,
      //   user?.phone,
      //   "vikumar.azad@gmail.com"
      // );
      // console.log("res", res);
      // if (!res) return;

      // Check if we're editing an existing address or creating a new one
      const isEditing = user?.address?.some(
        (addr: any) => addr.type === addressDetails.type
      );

      if (isEditing) {
        // Update existing address
        const updatedAddresses = user.address.map((addr: any) =>
          addr.type === addressDetails.type ? fullAddress : addr
        );

        // Check if there are 2 or more addresses and one is set as default
        if (updatedAddresses.length >= 2 && fullAddress.default) {
          // Make all other addresses default: false
          const finalAddresses = updatedAddresses.map((addr: any) => ({
            ...addr,
            default: addr.type === addressDetails.type ? true : false,
          }));
          dispatch(addUser({ ...user, address: finalAddresses }));
          console.log("updatedAddresses", finalAddresses);
          console.log("here1");
          await saveCustomerAddress(
            finalAddresses,
            user?.phone,
            "vikumar.azad@gmail.com"
          );
        } else {
          dispatch(addUser({ ...user, address: updatedAddresses }));
          console.log("updatedAddresses", updatedAddresses);
          console.log("here2");
          await saveCustomerAddress(
            updatedAddresses,
            user?.phone,
            "vikumar.azad@gmail.com"
          );
        }
      } else {
        // Add new address
        const newAddresses = [...(user?.address || []), fullAddress];

        // Check if there are 2 or more addresses and one is set as default
        if (newAddresses.length >= 2 && fullAddress.default) {
          // Make all other addresses default: false
          const finalAddresses = newAddresses.map((addr: any) => ({
            ...addr,
            default: addr.type === addressDetails.type ? true : false,
          }));
          console.log("address", finalAddresses);
          dispatch(addUser({ ...user, address: finalAddresses }));
          console.log("here2");
          await saveCustomerAddress(
            finalAddresses,
            user?.phone,
            "vikumar.azad@gmail.com"
          );
        } else {
          console.log("address", newAddresses);
          dispatch(addUser({ ...user, address: newAddresses }));
          console.log("here2");
          await saveCustomerAddress(
            newAddresses,
            user?.phone,
            "vikumar.azad@gmail.com"
          );
        }
      }
    } else {
      toast.error("Address not saved");
    }

    console.log("Complete address details:", fullAddress);

    // Navigate back to the previous page
    router.push("/order");
  };

  const handleScriptLoad = () => {
    console.log("Google Maps script loaded");
    setIsMapLoaded(true);
  };

  const handleScriptError = () => {
    console.error("Failed to load Google Maps script");
    toast.error(
      "Failed to load Google Maps. Please check your internet connection and API key."
    );
  };

  // Check if Google Maps is already loaded (for navigation back scenarios)
  useEffect(() => {
    if (typeof window !== "undefined" && window.google && window.google.maps) {
      console.log("Google Maps already loaded, setting isMapLoaded to true");
      setIsMapLoaded(true);
    }
  }, []);

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&callback=initMap&libraries=marker,places`}
        strategy="afterInteractive"
        onLoad={handleScriptLoad}
        onError={handleScriptError}
      />

      <div className="min-h-screen ">
        {/* Header */}
        <div className="flex items-center justify-between  border-b border-[#f0f0f0] rounded-bl-3xl p-2 shadow-lg">
          <div className="flex items-center">
            <div
              className="ml-2 w-7 h-8 border-2 border-muted rounded-lg shadow-lg flex items-center justify-center"
              onClick={() => router.back()}
            >
              <ChevronLeft className="h-6 w-6 " strokeWidth={3} />
            </div>
            <h1 className="text-sm font-semibold ml-2">
              {user?.address?.some(
                (addr: any) => addr.type === addressDetails.type
              )
                ? "Edit address"
                : "Add address"}
            </h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={getCurrentLocation}
            disabled={isLoading || !isMapLoaded}
            className="mr-3 border-2 border-muted rounded-lg shadow-lg bg-blue-200"
          >
            <Navigation className="h-5 w-5" />
          </Button>
        </div>
        {/* <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="mr-2"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={getCurrentLocation}
            disabled={isLoading || !isMapLoaded}
          >
            <Navigation className="h-5 w-5" />
          </Button>
        </div> */}

        {/* Search Input */}
        <div className="absolute top-[10%] left-4 right-4 z-10">
          <div className="relative">
            <Image
              src="/images/googlemap.svg"
              alt="search"
              width={25}
              height={25}
              className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500  z-40"
            />
            <Input
              ref={searchInputRef}
              placeholder="Search for area, street name..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="h-[2.5rem] pl-10 bg-white/80 backdrop-blur-md border-none shadow-xl rounded-full text-gray-700 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:bg-white/90 transition-all duration-200"
              onFocus={() => setShowSuggestions(true)}
            />

            {/* Search Suggestions */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white/95 backdrop-blur-md border-none rounded-2xl shadow-xl z-20 max-h-60 overflow-y-auto mt-2">
                {searchSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.place_id}
                    className="px-4 py-3 hover:bg-gray-100/60 cursor-pointer border-b border-gray-200/40 last:border-b-0 first:rounded-t-2xl last:rounded-b-2xl"
                    onClick={() => handleSuggestionSelect(suggestion)}
                  >
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {suggestion.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {suggestion.formatted_address}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Delivery Radius Warning */}
        {/* {!isWithinDeliveryRadius && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 mt-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">
                  <strong>Delivery Not Available</strong>
                </p>
                <p className="text-sm text-red-700 mt-1">
                  This location is outside our {DELIVERY_RADIUS_KM} km delivery
                  radius. Please choose a location closer to our restaurant.
                </p>
              </div>
            </div>
          </div>
        )} */}

        {/* Map Container */}
        <div className="relative" style={{ height: "calc(100vh - 100px)" }}>
          {!isMapLoaded && (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading map...</p>
              </div>
            </div>
          )}

          <div ref={mapRef} className="w-full h-full" />

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
              <div className="bg-white px-4 py-2 rounded-lg shadow-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">Getting address...</span>
                </div>
              </div>
            </div>
          )}

          {/* Address display */}
        </div>

        {/* Save Button */}
        <div className="relative">
          <div className="absolute bottom-[8rem] left-4 right-4 ">
            <Card className=" bg-white shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  {isWithinDeliveryRadius ? (
                    <MapPin className="h-5 w-5 text-green-500 mt-1" />
                  ) : (
                    <CircleX className="h-5 w-5 text-red-500 mt-1" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {isWithinDeliveryRadius
                        ? "Your order will be delivered here"
                        : "Oops! We can't deliver to this location"}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {selectedAddress.formatted ||
                        "Move pin to select address"}
                    </p>
                    {selectedAddress.formatted && (
                      <p className="text-xs text-green-600 mt-1">
                        📍{" "}
                        {calculateDistance(
                          RESTAURANT_LOCATION.lat,
                          RESTAURANT_LOCATION.lng,
                          selectedAddress.lat,
                          selectedAddress.lng
                        ).toFixed(2)}{" "}
                        km from restaurant
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 rounded-t-2xl px-3">
            <Button
              onClick={() => setIsAddressDrawerOpen(true)}
              className="w-full py-6 text-base font-medium rounded-2xl"
              disabled={!isWithinDeliveryRadius}
            >
              {isWithinDeliveryRadius
                ? "Confirm Location"
                : "Location Outside Delivery Area"}
            </Button>
          </div>
        </div>
        <Drawer
          open={isAddressDrawerOpen}
          onOpenChange={setIsAddressDrawerOpen}
        >
          <DrawerContent className="rounded-t-3xl p-0">
            <DrawerDescription></DrawerDescription>
            <DrawerHeader className="px-4 py-0">
              <DrawerTitle className=" py-2 text-left text-sm font-medium ">
                {selectedAddress.formatted.split(",").splice(0, 2).join(",")}
              </DrawerTitle>
            </DrawerHeader>
            <div className="px-4">
              <span className="text-xs text-gray-500 ">
                {selectedAddress.formatted}
              </span>
              {/* Address Details Form */}
              <div className=" space-y-4 mt-2">
                {/* Address Selection Error */}
                {errors.address && (
                  <div className="text-red-500 text-xs mt-1">
                    {errors.address}
                  </div>
                )}

                <div>
                  <Input
                    id="house"
                    placeholder="House / Flat / Block no.*"
                    value={addressDetails.house}
                    onChange={(e) => {
                      setAddressDetails({
                        ...addressDetails,
                        house: e.target.value,
                      });
                      // Clear error when user starts typing
                      if (errors.house) {
                        setErrors({
                          ...errors,
                          house: "",
                        });
                      }
                    }}
                    className={`mt-1 text-sm font-normal py-5 rounded-xl placeholder:text-xs ${
                      errors.house ? "border-red-500" : ""
                    }`}
                  />
                  {errors.house && (
                    <div className="text-red-500 text-xs mt-1">
                      {errors.house}
                    </div>
                  )}
                </div>

                <div>
                  <Input
                    id="floor"
                    placeholder="Floor"
                    value={addressDetails.floor}
                    onChange={(e) =>
                      setAddressDetails({
                        ...addressDetails,
                        floor: e.target.value,
                      })
                    }
                    className="mt-1 text-sm font-normal py-5 rounded-xl placeholder:text-xs"
                  />
                </div>

                <div>
                  <Input
                    id="apartment"
                    placeholder="Apartment / Road / Area *"
                    value={addressDetails.apartment}
                    onChange={(e) => {
                      setAddressDetails({
                        ...addressDetails,
                        apartment: e.target.value,
                      });
                      // Clear error when user starts typing
                      if (errors.apartment) {
                        setErrors({
                          ...errors,
                          apartment: "",
                        });
                      }
                    }}
                    className={`mt-1 text-sm font-normal py-5 rounded-xl placeholder:text-xs ${
                      errors.apartment ? "border-red-500" : ""
                    }`}
                  />
                  {errors.apartment && (
                    <div className="text-red-500 text-xs mt-1">
                      {errors.apartment}
                    </div>
                  )}
                </div>

                <div>
                  <Input
                    id="landmark"
                    placeholder="Landmark (Optional)"
                    value={addressDetails.landmark}
                    onChange={(e) =>
                      setAddressDetails({
                        ...addressDetails,
                        landmark: e.target.value,
                      })
                    }
                    className="mt-1 text-sm font-normal py-5 rounded-xl placeholder:text-xs"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium ">
                    Save this address as *
                  </Label>
                  <div className="flex space-x-2 mt-2">
                    {types.map((type) => {
                      const isExistingAddress = user?.address?.some(
                        (addr: any) => addr.type === type
                      );

                      console.log("isExistingAddress", isExistingAddress);
                      return (
                        <Button
                          key={type}
                          variant={
                            addressDetails.type === type ? "default" : "outline"
                          }
                          size="sm"
                          disabled={isExistingAddress}
                          onClick={() =>
                            setAddressDetails({
                              ...addressDetails,
                              type,
                            })
                          }
                        >
                          {type}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center space-x-2 mt-4">
                  <Checkbox
                    id="defaultAddress"
                    checked={addressDetails.default}
                    onCheckedChange={(checked) => {
                      setAddressDetails({
                        ...addressDetails,
                        default: checked === "indeterminate" ? false : checked,
                      });
                    }}
                  />
                  <Label
                    htmlFor="defaultAddress"
                    className="text-sm font-medium"
                  >
                    Set this address as default
                  </Label>
                </div>
              </div>
            </div>
            <DrawerFooter>
              <Button
                className="w-full py-6 rounded-2xl"
                onClick={handleSaveAddress}
                disabled={!isFormValid()}
              >
                {user?.address?.some(
                  (addr: any) => addr.type === addressDetails.type
                )
                  ? "Update Address and Proceed"
                  : "Save Address and Proceed"}
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
}
