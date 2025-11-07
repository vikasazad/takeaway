"use client";

import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Image from "next/image";
import { IndianRupee, ShoppingBag } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { RootState } from "@/lib/store";
import { addData } from "@/lib/features/addToOrderSlice";

export default function Component({ data = [] }: { data?: any[] }) {
  const dispatch = useDispatch();
  const sectionRefs = useRef<any[]>([]);
  const searchTerm = useSelector((state: RootState) => state.searchTerm.term);
  const addedItemIds = useSelector(
    (state: RootState) => state.addToOrderData.addedItemIds
  );
  const activeItem = useSelector(
    (state: RootState) => state.activeFooterItem.activeItem
  );
  useEffect(() => {
    if (activeItem !== null && sectionRefs.current[activeItem]) {
      sectionRefs.current[activeItem].scrollIntoView({ behavior: "smooth" });
    }
  }, [activeItem]);
  // const ordereditems = useSelector(
  //   (state: RootState) => state.addToOrderData.addToOrderData
  // );
  // console.log("AAAAAAAAAAAA", ordereditems);
  const [selectedPortions, setSelectedPortions] = useState<
    Record<string, string>
  >({});

  const dataToDisplay = data.reduce((acc: any[], item: any) => {
    const category = item.name;
    const existingCategory = acc.find((entry: any) => entry[category]);
    if (existingCategory) {
      existingCategory[category].push(...item.menuItems);
    } else {
      acc.push({ [category]: [...item.menuItems] });
    }
    return acc;
  }, []);

  const getPrice = (item: any, portion: string) => {
    return typeof item.price === "number" ? item.price : item.price[portion];
  };

  const handleAddToOrder = (item: any, selectedPortion: string) => {
    console.log("AAAAAAAAAAAA", item, selectedPortion);
    dispatch(addData({ data: item, selectedType: selectedPortion }));
  };

  const handlePortionChange = (itemId: string, portion: string) => {
    setSelectedPortions((prev) => ({ ...prev, [itemId]: portion }));
  };

  return (
    <div className="mb-[150px]">
      {dataToDisplay.map((category: any, id: number) => {
        const categoryName = Object.keys(category)[0];
        const menuItems = category[categoryName];

        const filteredMenuItems = menuItems.filter((item: any) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filteredMenuItems.length === 0) return null;

        return (
          <div
            key={id}
            id={categoryName}
            ref={(el: any) => (sectionRefs.current[id] = el)}
          >
            <div className="relative pt-4">
              <div className="flex justify-between items-center">
                <span className="h-[3px] w-[45px] bg-gradient-to-r from-blue-500 to-pink-500 rounded-[50%] blur-[0.5px]" />
                <h2 className="text-2xl font-semibold">{categoryName}</h2>
                <span className="h-[3px] w-[45px] bg-gradient-to-l from-blue-500 to-pink-500 rounded-[50%] blur-[0.5px]" />
              </div>
            </div>

            {filteredMenuItems.map((item: any) => {
              const selectedPortion =
                selectedPortions[item.id] ||
                (item.portion ? item.portion.split("/")[0] : "Single");

              return (
                <Card className="w-full max-w-2xl mx-auto my-5" key={item.id}>
                  <CardContent className="p-0">
                    <Carousel className="w-full [box-shadow:var(--shadow-s)] rounded-lg">
                      <CarouselContent>
                        {item.images.map((image: string, index: number) => (
                          <CarouselItem key={index}>
                            <div className="relative aspect-[6/3] w-full overflow-hidden rounded-lg">
                              <Image
                                src={image}
                                alt={item.name}
                                className="object-cover"
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                priority
                              />
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious className="left-2" />
                      <CarouselNext className="right-2" />
                    </Carousel>

                    <div className="p-3 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-2xl font-semibold tracking-tight">
                            {item.name}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="text-xs">{item.categoryName}</span>
                            <span className="w-1 h-1 rounded-full bg-red-500" />
                            <span className="text-xs">{item.cuisineName}</span>
                          </div>
                        </div>
                        <div className="flex items-center  text-xl font-medium">
                          <IndianRupee className="w-4 h-4" />
                          {getPrice(item, selectedPortion)}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <p className="text-sm">{item.description}</p>

                        {item.portion && item.portion !== "Single" && (
                          <ToggleGroup
                            type="single"
                            value={selectedPortion}
                            onValueChange={(value) =>
                              value && handlePortionChange(item.id, value)
                            }
                            className="justify-start"
                          >
                            {item.portion.split("/").map((size: string) => (
                              <ToggleGroupItem
                                key={size}
                                value={size}
                                className="px-2.5 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:[box-shadow:var(--shadow-m)] data-[state=off]:[box-shadow:var(--shadow-inset)]"
                              >
                                {size}
                              </ToggleGroupItem>
                            ))}
                          </ToggleGroup>
                        )}
                      </div>

                      <Button
                        className="w-full text-lg py-6 bg-[#FF8080] [box-shadow:var(--shadow-m)] hover:bg-[#FF8080]/80"
                        size="lg"
                        disabled={addedItemIds.includes(item.id)}
                        onClick={() => handleAddToOrder(item, selectedPortion)}
                      >
                        {addedItemIds.includes(item.id) ? (
                          "Added to Order"
                        ) : (
                          <>
                            Add to Order
                            <ShoppingBag className="ml-2 h-5 w-5" />
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        );
      })}
      {dataToDisplay.length === 0 && (
        <div>
          <p>Oops! Nothing found.</p>
        </div>
      )}
    </div>
  );
}
