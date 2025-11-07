"use client";

import { SignJWT, jwtVerify } from "jose";

// JWT Configuration Constants
export const TOKEN_EXPIRY_MINUTES = 10; // Customize token expiration time (in minutes)
export const REFRESH_BUFFER_MINUTES = 1; // Buffer time before expiry to refresh token (in minutes)
export const TOKEN_EXPIRY_SECONDS = TOKEN_EXPIRY_MINUTES * 60;
export const REFRESH_INTERVAL_SECONDS =
  (TOKEN_EXPIRY_MINUTES - REFRESH_BUFFER_MINUTES) * 60;
export const REFRESH_INTERVAL_MS = REFRESH_INTERVAL_SECONDS * 1000;

// JWT Secret Key
const JWT_SECRET = "Vikas@1234";
const encodedSecretKey = new TextEncoder().encode(JWT_SECRET);

// Storage keys
const JWT_TOKEN_KEY = "jwtToken";
const PHONE_KEY = "phone";

let refreshTimeoutId: NodeJS.Timeout | null = null;

/**
 * Creates a new JWT token for the given phone number
 */
export const createJWTToken = async (phone: string): Promise<string> => {
  const payload = {
    phone: phone,
  };

  const expirationTime = Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_SECONDS;
  const newToken = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expirationTime)
    .sign(encodedSecretKey);

  return newToken;
};

/**
 * Verifies and decodes a JWT token
 */
export const verifyJWTToken = async (token: string) => {
  try {
    const decoded = await jwtVerify(token, encodedSecretKey, {
      algorithms: ["HS256"],
    });
    return decoded;
  } catch (error) {
    console.error("Error verifying JWT token:", error);
    window.location.reload();
    throw error;
  }
};

/**
 * Refreshes the current JWT token
 */
export const refreshJWTToken = async (): Promise<void> => {
  try {
    const currentToken = localStorage.getItem(JWT_TOKEN_KEY);
    if (!currentToken) {
      console.error("No token found for refresh");
      return;
    }

    // Get phone from localStorage
    const phone = localStorage.getItem(PHONE_KEY);
    if (!phone) {
      console.error("No phone found for token refresh");
      return;
    }

    const newToken = await createJWTToken(phone);
    localStorage.setItem(JWT_TOKEN_KEY, newToken);

    // Schedule next refresh
    scheduleTokenRefresh();

    console.log("Token refreshed successfully");
  } catch (error) {
    console.error("Error refreshing token:", error);
  }
};

/**
 * Schedules the next token refresh
 */
export const scheduleTokenRefresh = (): void => {
  // Clear existing timeout
  if (refreshTimeoutId) {
    clearTimeout(refreshTimeoutId);
  }

  // Set new timeout for refresh
  refreshTimeoutId = setTimeout(refreshJWTToken, REFRESH_INTERVAL_MS);
  console.log(
    `Next token refresh scheduled in ${REFRESH_INTERVAL_MS / 1000} seconds`
  );
};

/**
 * Initializes JWT management - checks existing token and sets up refresh schedule
 */
export const initializeJWTManagement = async (): Promise<void> => {
  const existingToken = localStorage.getItem(JWT_TOKEN_KEY);
  const phone = localStorage.getItem(PHONE_KEY);

  if (existingToken && phone) {
    try {
      // Verify and decode token
      const decoded: any = await verifyJWTToken(existingToken);
      const currentTime = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = decoded.payload.exp - currentTime;

      if (timeUntilExpiry > 0) {
        // Token is still valid, set up refresh before expiry
        const refreshTime =
          Math.max(timeUntilExpiry - REFRESH_BUFFER_MINUTES * 60, 0) * 1000;
        refreshTimeoutId = setTimeout(refreshJWTToken, refreshTime);
        console.log(`Token refresh scheduled in ${refreshTime / 1000} seconds`);
      } else {
        // Token expired, create new one
        const newToken = await createJWTToken(phone);
        localStorage.setItem(JWT_TOKEN_KEY, newToken);
        scheduleTokenRefresh();
        console.log("Expired token refreshed");
      }
    } catch (error) {
      console.error("Error verifying existing token:", error);
      // If token is invalid or verification fails, create new one
      try {
        const newToken = await createJWTToken(phone);
        localStorage.setItem(JWT_TOKEN_KEY, newToken);
        scheduleTokenRefresh();
        console.log("Invalid token replaced with new one");
      } catch (createError) {
        console.error("Error creating new token:", createError);
      }
    }
  }
};

/**
 * Sets up JWT after successful login - creates token and starts refresh cycle
 */
export const setupJWTAfterLogin = async (phone: string): Promise<void> => {
  try {
    // Store phone number
    localStorage.setItem(PHONE_KEY, phone);

    // Create JWT token
    const jwtToken = await createJWTToken(phone);
    localStorage.setItem(JWT_TOKEN_KEY, jwtToken);

    // Set up automatic token refresh
    scheduleTokenRefresh();

    console.log("JWT setup completed after login");
  } catch (error) {
    console.error("Error setting up JWT after login:", error);
    throw error;
  }
};

/**
 * Clears JWT data and stops refresh cycle (for logout)
 */
export const clearJWTData = (): void => {
  // Clear tokens from localStorage
  localStorage.removeItem(JWT_TOKEN_KEY);
  localStorage.removeItem(PHONE_KEY);

  // Clear refresh timeout
  if (refreshTimeoutId) {
    clearTimeout(refreshTimeoutId);
    refreshTimeoutId = null;
  }

  console.log("JWT data cleared");
};

/**
 * Gets the current JWT token from localStorage
 */
export const getCurrentJWTToken = (): string | null => {
  return localStorage.getItem(JWT_TOKEN_KEY);
};

/**
 * Gets the current phone number from localStorage
 */
export const getCurrentPhone = (): string | null => {
  return localStorage.getItem(PHONE_KEY);
};

/**
 * Checks if user is currently logged in (has valid token and phone)
 */
export const isUserLoggedIn = (): boolean => {
  const token = getCurrentJWTToken();
  const phone = getCurrentPhone();
  return !!(token && phone);
};
