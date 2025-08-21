import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import { combineReducers } from "@reduxjs/toolkit";
import searchReducer from "./features/searchSlice";
import addToOrderReducer from "./features/addToOrderSlice";
import activeFooterItemReducer from "./features/activeFooterCategory";
import editAddressReducer from "./features/editAddressSlice";
import deliveryReducer from "./features/deliverySlice";
// Create a custom storage that works with SSR
const createNoopStorage = () => {
  return {
    getItem() {
      return Promise.resolve(null);
    },
    setItem(_: string, value: any) {
      return Promise.resolve(value);
    },
    removeItem() {
      return Promise.resolve();
    },
  };
};

// Use localStorage if available, otherwise use noop storage
const storage =
  typeof window !== "undefined"
    ? require("redux-persist/lib/storage").default
    : createNoopStorage();

// Persist configuration for addToOrder slice
const addToOrderPersistConfig = {
  key: "addToOrderData",
  storage,
  whitelist: [
    "addToOrderData",
    "addedItemIds",
    "finalOrder",
    "token",
    "user",
    "info",
    "orders",
  ], // Only persist these fields
};

// Persist configuration for delivery slice
const deliveryPersistConfig = {
  key: "deliveryData",
  storage,
  whitelist: ["delivery"], // Only persist the delivery field
};

// Combine all reducers
const rootReducer = combineReducers({
  searchTerm: searchReducer,
  addToOrderData: persistReducer(addToOrderPersistConfig, addToOrderReducer),
  activeFooterItem: activeFooterItemReducer,
  editAddress: editAddressReducer,
  delivery: persistReducer(deliveryPersistConfig, deliveryReducer),
});

const store = () => {
  const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
        },
      }),
  });

  const persistor = persistStore(store);
  return { store, persistor };
};

export type AppStore = ReturnType<typeof store>["store"];
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

export default store;
// const store = () => {
//   return configureStore({
//     reducer: {
//       searchTerm: searchReducer,
//       addToOrderData: addToOrderReducer,
//       activeFooterItem: activeFooterItemReducer,
//       // firebaseManagementData: firebaseManagementDataReducer,
//       //     // firestoreMultipleData: firestoreMultipleDataReducer,
//       //     // firebaseData: firebaseDataReducer,
//       //     // listData: listReducer,
//       //     // activeFooterItem: activeFooterItemReducer,
//       //     // botToOrderData: botToOrderReducer,
//       //     // botChat: botChatReducer,
//       //     // afterOrderData: afterOrderReducer,
//       //     // adminRestaurantInfo: adminRestaurantInfoReducer,
//     },
