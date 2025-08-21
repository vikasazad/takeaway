import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  activeItem: null, // Add activeItem to the state
  scrollactiveItem: null,
};

export const activeFooterItem = createSlice({
  name: "addToOrder",
  initialState,
  reducers: {
    setActiveItem: (state, action) => {
      state.activeItem = action.payload;
    },
    setScrollActiveItem: (state, action) => {
      state.scrollactiveItem = action.payload;
    },
  },
});

export const { setActiveItem, setScrollActiveItem } = activeFooterItem.actions;
export default activeFooterItem.reducer;
