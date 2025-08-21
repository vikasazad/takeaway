import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  flag: false,
  type: "",
};

export const editAddressSlice = createSlice({
  name: "editAddress",
  initialState,
  reducers: {
    setEditAddress: (state, action) => {
      state.flag = action.payload.flag;
      state.type = action.payload.type;
    },
  },
});

export const { setEditAddress } = editAddressSlice.actions;
export default editAddressSlice.reducer;
