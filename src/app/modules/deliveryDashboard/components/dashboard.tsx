"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Truck,
  Phone,
  MapPin,
  Clock,
  IndianRupee,
  Copy,
  AlertCircle,
  HandPlatter,
  Check,
} from "lucide-react";
import { getDeliveryOrders } from "../../tracking/utils/deliveryLocationApi";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { setDelivery } from "@/lib/features/deliverySlice";
import { useDispatch } from "react-redux";
import { toast } from "sonner";

export default function Dashboard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [orderId, setOrderId] = useState("");
  const [orders, setOrders] = useState(null);
  const [copied, setCopied] = useState<Record<string, boolean>>({});
  const [geolocationStatus, setGeolocationStatus] = useState<
    "checking" | "granted" | "denied" | "prompt"
  >("checking");

  useEffect(() => {
    // Check geolocation permission on page load
    checkGeolocationPermission();

    const unsubscribe = getDeliveryOrders(
      "vikumar.azad@gmail.com",
      (result: any) => {
        if (result) {
          console.log("result", result);
          setOrders(result);
        }
      }
    );
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const checkOrderId = (orderId: string) => {
    const regex = /^RES:(DEL|TY):(?!0000)\d{4}$/;
    return regex.test(orderId);
  };

  const checkGeolocationPermission = async () => {
    try {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        setGeolocationStatus("denied");
        return;
      }

      // Check permission status
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({
          name: "geolocation",
        });
        setGeolocationStatus(permission.state);

        // Listen for permission changes
        permission.onchange = () => {
          setGeolocationStatus(permission.state);
        };
      } else {
        // Fallback: try to get current position to check permission
        navigator.geolocation.getCurrentPosition(
          () => setGeolocationStatus("granted"),
          (error) => {
            if (error.code === error.PERMISSION_DENIED) {
              setGeolocationStatus("denied");
            } else {
              setGeolocationStatus("prompt");
            }
          }
        );
      }
    } catch (error) {
      console.error("Error checking geolocation permission:", error);
      setGeolocationStatus("denied");
    }
  };

  const handleCopyWithTick = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopied((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopied((prev) => ({ ...prev, [key]: false }));
    }, 1500);
  };

  const requestGeolocationPermission = () => {
    navigator.geolocation.getCurrentPosition(
      () => {
        setGeolocationStatus("granted");
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setGeolocationStatus("denied");
        } else {
          setGeolocationStatus("prompt");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const handleStartDelivery = (data: any | string) => {
    if (geolocationStatus !== "granted") {
      alert("Please enable geolocation permission to start delivery");
      return;
    }
    if (Object.keys(orders || {}).length === 0) {
      toast.error("No orders found");
      return;
    }
    if (localStorage.getItem("delivery-id")) {
      toast.error(
        "Please complete the current delivery before starting a new one"
      );
      router.push("/delivery");
      return;
    }
    if (typeof data === "string") {
      if (!checkOrderId(data)) {
        toast.error("Invalid order id");
        return;
      }
      const _order: any = Object.values(orders || {})
        .flatMap((phoneOrders: any) => Object.values(phoneOrders))
        .find((order: any) => order.orderId === data);
      console.log(_order);
      const deliveryData = {
        orderId: _order.orderId,
        customer: _order.customer,
        address: _order.address,
        items: _order.items,
        payment: _order.payment.paymentStatus,
        restaurantCoords: {
          lat: 28.343747,
          lng: 77.336315,
        },
      };
      console.log(deliveryData);
      dispatch(setDelivery({ order: deliveryData, from: "delivery" }));
      localStorage.setItem("delivery-id", _order.orderId);
      router.push("/delivery");
    } else {
      const deliveryData = {
        orderId: data.orderId,
        customer: data.customer,
        address: data.address,
        items: data.items,
        payment: data.payment.paymentStatus,
        restaurantCoords: {
          lat: 28.343747,
          lng: 77.336315,
        },
      };
      console.log(deliveryData);
      dispatch(setDelivery({ order: deliveryData, from: "delivery" }));
      localStorage.setItem("delivery-id", data.orderId);
      router.push("/delivery");
    }
  };

  // const handleCustomDelivery = () => {
  //   if (geolocationStatus !== "granted") {
  //     alert("Please enable geolocation permission to start delivery");
  //     return;
  //   }
  //   if (customPhone.trim()) {
  //     router.push(`/delivery?phone=${customPhone}`);
  //   }
  // };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ready":
        return "bg-blue-100 text-blue-800";
      case "Out for Delivery":
        return "bg-green-100 text-green-800";
      case "Delivered":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  if (Object.keys(orders || {}).length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg font-semibold">No order for delivery</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Delivery Dashboard
          </h1>
          <p className="text-gray-600">Manage and start delivery orders</p>
        </div>

        {/* Geolocation Status Alert */}
        {geolocationStatus === "checking" && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Checking geolocation permission...
            </AlertDescription>
          </Alert>
        )}

        {geolocationStatus === "denied" && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Geolocation permission is required for delivery tracking. Please
              enable location access in your browser settings.
            </AlertDescription>
          </Alert>
        )}

        {geolocationStatus === "prompt" && (
          <Alert className="mb-6 border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Geolocation permission is required for delivery tracking.
              <Button
                onClick={requestGeolocationPermission}
                className="ml-2 bg-yellow-600 hover:bg-yellow-700 text-white"
                size="sm"
              >
                Enable Location Access
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* {geolocationStatus === "granted" && (
          <Alert className="hidden mb-6 border-green-200 bg-green-50">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Geolocation permission granted. You can start deliveries.
            </AlertDescription>
          </Alert>
        )} */}

        {/* Start delivery manually with Customer Phone */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Enter order id to start delivery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Input
                id="orderId"
                type="text"
                placeholder="Enter order id"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value.toUpperCase())}
              />

              <Button
                onClick={() => handleStartDelivery(orderId)}
                disabled={!orderId.trim() || geolocationStatus !== "granted"}
                className="bg-[#FF8080] hover:bg-[#FF8080]/80 text-white [box-shadow:var(--shadow-m)]"
              >
                Start Delivery
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Available Orders
          </h2>

          {orders &&
            Object.entries(orders)?.map(([, phoneOrders]: [string, any]) => {
              return Object.entries(phoneOrders)?.map(
                ([, order]: [string, any], index: number) => {
                  return (
                    <Card
                      key={index}
                      className="hover:shadow-md transition-shadow [box-shadow:var(--shadow-s)]"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg text-gray-900">
                            {order.customer?.name}
                          </h3>
                          <Badge
                            className={`${getStatusColor(
                              order.status
                            )} [box-shadow:var(--shadow-m)]`}
                          >
                            {order.status}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <HandPlatter className="h-4 w-4 text-[#FF8080]" />
                            {order.orderId}
                            {copied[`orderId-${order.orderId}`] ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy
                                className="h-4 w-4 cursor-pointer text-[#FF8080]"
                                onClick={() =>
                                  handleCopyWithTick(
                                    `orderId-${order.orderId}`,
                                    order.orderId
                                  )
                                }
                              />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-[#FF8080]" />
                            {order.customer?.phone}
                            {copied[`phone-${order.orderId}`] ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy
                                className="h-4 w-4 cursor-pointer text-[#FF8080]"
                                onClick={() =>
                                  handleCopyWithTick(
                                    `phone-${order.orderId}`,
                                    order.customer?.phone
                                  )
                                }
                              />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-[#FF8080]" />
                            {order.address?.address}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-[#FF8080]" />
                            Order Time:{" "}
                            {new Date(order.timeOfRequest).toLocaleTimeString(
                              "en-US",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </div>
                        </div>

                        <div className="mt-4 border-t pt-3">
                          <p className="text-sm font-semibold text-gray-700 mb-2">
                            Order Items:
                          </p>
                          <div className="space-y-2">
                            {order.items?.map((item: any, id: number) => (
                              <div
                                key={id}
                                className="bg-gray-50 p-2 rounded-md space-y-1"
                              >
                                <div className="flex items-center justify-between ">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                      {item.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {item.quantity}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-600">
                                      Qty:{" "}
                                      <span className="font-medium">
                                        {item.count}
                                      </span>
                                    </span>
                                    <span className="text-sm font-semibold text-gray-900 flex items-center">
                                      <IndianRupee className="h-3 w-3" />
                                      {item.price}
                                    </span>
                                  </div>
                                </div>
                                {order?.payment?.discount?.[0]?.discountAmount >
                                  0 &&
                                  order?.payment?.discount?.length > 0 &&
                                  order?.payment?.discount?.map(
                                    (itm: any, index: number) => (
                                      <div
                                        key={index}
                                        className="flex items-center justify-between gap-2"
                                      >
                                        <span className="text-xs text-gray-600">
                                          Discount:
                                        </span>
                                        <span className="text-sm font-semibold text-gray-900 flex items-center">
                                          <IndianRupee className="h-3 w-3" />
                                          {itm.discountAmount}
                                        </span>
                                      </div>
                                    )
                                  )}
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs text-gray-600">
                                    Taxes:
                                  </span>
                                  <span className="text-sm font-semibold text-gray-900 flex items-center">
                                    <IndianRupee className="h-3 w-3" />
                                    {order.payment.gst.gstAmount}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex  items-center justify-between gap-3 mt-4">
                          <div>
                            <p className="font-bold text-lg flex items-center ">
                              <IndianRupee className="h-4 w-4" />
                              {order.payment?.price}
                            </p>
                            <p className="text-xs text-gray-500">
                              Total Amount
                            </p>
                          </div>

                          <Button
                            onClick={() => handleStartDelivery(order)}
                            className="bg-[#FF8080] hover:bg-[#FF8080]/80 text-white py-5 [box-shadow:var(--shadow-m)]"
                            disabled={order.status === "Delivered"}
                          >
                            <Truck className="h-4 w-4 mr-2" />
                            Start Delivery
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
              );
            })}
        </div>

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                <strong>1.</strong> Click Start Delivery to begin a delivery for
                any order
              </p>
              <p>
                <strong>2.</strong> The system will check for geolocation
                permission before starting
              </p>
              <p>
                <strong>3.</strong> Once started, your location will be tracked
                in real-time
              </p>
              <p>
                <strong>4.</strong> Use the map to navigate to the customer
                location
              </p>
              <p>
                <strong>5.</strong> Call the customer if needed and mark as
                delivered when done
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
