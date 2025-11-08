"use client";

import React, { useEffect } from "react";
// import { useSelector } from "react-redux";
// import { RootState } from "@/lib/store";
import Header from "../../header/components/header";
import { getRestaurantData } from "../utils/mainRestaurantApi";
import Category from "./category";
import ItemCard from "./itemCard";
import Footer from "../../footer/components/footer";
import { addTax } from "@/lib/features/addToOrderSlice";
import { useDispatch } from "react-redux";

const Main = () => {
  const dispatch = useDispatch();
  // const { isAuthenticated, token } = useSelector(
  //   (state: RootState) => state.auth
  // );
  const [data, setData] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    // Check if user is authenticated
    // if (!localStorage.getItem("token")) {
    //   console.log("No authentication token found, redirecting to login");
    //   router.push("/login");
    //   return;
    // }

    // Fetch restaurant data if authenticated
    const fetchData = async () => {
      try {
        const restaurantData = await getRestaurantData();
        console.log("restaurantData", restaurantData);
        setData(restaurantData);
        dispatch(addTax(restaurantData?.tax));
      } catch (error) {
        console.error("Error fetching restaurant data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Show loading while checking authentication or fetching data
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="text-lg font-medium">Loading...</div>
          <div className="text-sm text-gray-500 mt-2">
            {/* {!localStorage.getItem("token")
              ? "Checking authentication..."
              : "Loading menu..."} */}
            Loading menu...
          </div>
        </div>
      </div>
    );
  }

  // Show error if data failed to load
  if (!data || !data.menu || !data.info) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="text-lg font-medium">Error</div>
          <div className="text-sm text-gray-500 mt-2">Failed to load menu</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <Header data={data.info} />
      <Category data={data.menu.categories} />
      <ItemCard data={data.menu.categories} />
      <Footer data={data.menu.categories} />
    </div>
  );
};

export default Main;
