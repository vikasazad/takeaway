"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { onMessage, Unsubscribe } from "firebase/messaging";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { messaging } from "@/config/db/firebase";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/lib/store";
import { addToken } from "@/lib/features/addToOrderSlice";

interface NotificationContextType {
  token: string | null;
  notificationPermissionStatus: NotificationPermission | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a GlobalNotificationProvider"
    );
  }
  return context;
};

const getNotificationPermissionAndToken = async (): Promise<string | null> => {
  // if (!("Notification" in window)) {
  //   console.info("This browser does not support desktop notification");
  //   return null;
  // }

  // if (Notification.permission === "granted") {
  //   return await fetchToken();
  // }

  // if (Notification.permission !== "denied") {
  //   const permission = await Notification.requestPermission();
  //   if (permission === "granted") {
  //     return await fetchToken();
  //   }
  // }

  // console.info("Notification permission not granted.");
  return null;
};

const GlobalNotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [notificationPermissionStatus, setNotificationPermissionStatus] =
    useState<NotificationPermission | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const retryLoadToken = useRef(0);
  const isLoading = useRef(false);

  const loadToken = async () => {
    if (isLoading.current) return;

    isLoading.current = true;
    const fetchedToken = await getNotificationPermissionAndToken();

    if (Notification.permission === "denied") {
      setNotificationPermissionStatus("denied");
      // console.info(
      //   "%cPush Notifications issue - permission denied",
      //   "color: green; background: #c7c7c7; padding: 8px; font-size: 20px"
      // );
      isLoading.current = false;
      return;
    }

    if (!fetchedToken) {
      if (retryLoadToken.current >= 3) {
        // alert("Unable to load token, refresh the browser");
        // console.info(
        //   "%cPush Notifications issue - unable to load token after 3 retries",
        //   "color: green; background: #c7c7c7; padding: 8px; font-size: 20px"
        // );
        isLoading.current = false;
        return;
      }

      retryLoadToken.current += 1;
      console.log("An error occurred while retrieving token. Retrying...");
      isLoading.current = false;
      await loadToken();
      return;
    }

    setNotificationPermissionStatus(Notification.permission);
    setToken(fetchedToken);
    console.log("token", fetchedToken);
    dispatch(addToken(fetchedToken));
    isLoading.current = false;
  };

  const setupListener = async () => {
    const m = await messaging();
    if (!m) return;

    const unsubscribe = onMessage(m, (payload) => {
      if (Notification.permission !== "granted") return;

      console.log("Foreground push notification received:", payload);
      const link = payload.fcmOptions?.link || payload.data?.link;

      toast.info(
        `${payload.notification?.title}: ${payload.notification?.body}`,
        {
          action: link
            ? {
                label: "Visit",
                onClick: () => router.push(link),
              }
            : undefined,
        }
      );

      if (Notification.permission === "granted") {
        const n = new Notification(
          payload.notification?.title || "New Notification",
          {
            body: payload.notification?.body || "You have a new message",
            data: { url: link },
          }
        );

        n.onclick = (event) => {
          event.preventDefault();
          const link = (event.target as any)?.data?.url;
          if (link) {
            router.push(link);
          }
        };
      }
    });

    return unsubscribe;
  };

  // const requestPermission = async () => {
  //   if ("Notification" in window) {
  //     const permission = await Notification.requestPermission();
  //     setNotificationPermissionStatus(permission);
  //     if (permission === "granted") {
  //       const newToken = await fetchToken();
  //       setToken(newToken);
  //     }
  //   }
  //   closePopup();
  // };

  useEffect(() => {
    if ("Notification" in window) {
      loadToken();
    }
  }, []);

  useEffect(() => {
    let unsubscribe: Unsubscribe | null = null;

    setupListener().then((unsub) => {
      if (unsub) {
        unsubscribe = unsub;
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [token]);

  return (
    <NotificationContext.Provider
      value={{ token, notificationPermissionStatus }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default GlobalNotificationProvider;
