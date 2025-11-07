import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  delivery: [] as any,
};

const deliverySlice = createSlice({
  name: "delivery",
  initialState,
  reducers: {
    setDelivery: (state, action) => {
      console.log("action.payload", action.payload);
      if (state.delivery.length > 0) {
        if (action.payload.from === "tracking") {
          const existingOrder = state.delivery?.some(
            (item: any) => item.orderId === action.payload.order.orderId
          );
          console.log("existingOrder", existingOrder);
          if (!existingOrder) {
            console.log("gefefe");
            state.delivery.push(action.payload.order);
          }
        }
        if (action.payload.from === "delivery") {
          const existingOrder = state.delivery?.findIndex(
            (item: any) => item.orderId === action.payload.order.orderId
          );
          console.log("existingOrder", existingOrder);
          if (existingOrder === -1) {
            state.delivery.push(action.payload.order);
          } else {
            console.log("gefefe3");
            state.delivery[existingOrder] = action.payload.order;
          }
        }
        //
        // state.delivery.push(action.payload);
      } else {
        console.log("gefefe2");
        state.delivery.push(action.payload.order);
      }
    },
    clearDeliveryRedux: (state) => {
      state.delivery = [];
    },
  },
});

export const { setDelivery, clearDeliveryRedux } = deliverySlice.actions;
export const selectDeliveryById = (state: any, orderId: string) => {
  const delivery = state.delivery.delivery; // Adjust path based on your store structure
  return delivery?.find((item: any) => item.orderId === orderId) || null;
};
export default deliverySlice.reducer;
