import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  term: "", // Add activeItem to the state
};

export const searchItem = createSlice({
  name: "searchItem",
  initialState,
  reducers: {
    searchTerm: (state, action) => {
      state.term = action.payload;
    },
  },
});

export const { searchTerm } = searchItem.actions;
export default searchItem.reducer;
