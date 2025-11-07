"use client";
import * as React from "react";
import Link from "next/link";
import { IndianRupee, MoveRight, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useDispatch, useSelector } from "react-redux";
import { setActiveItem } from "@/lib/features/activeFooterCategory";
import { AppDispatch, RootState } from "@/lib/store";

export default function Footer({ data }: { data: any }) {
  // console.log("FOOTER", data);
  const dispatch = useDispatch<AppDispatch>();
  const ordereditems = useSelector(
    (state: RootState) => state.addToOrderData.addToOrderData
  );
  const [activeCategory, setActiveCategory] = React.useState<number>(0);
  const [popoverOpen, setPopoverOpen] = React.useState(false);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background z-50 md:w-[430px] md:m-auto">
      <div className="relative">
        <div className="flex overflow-x-auto hide-scrollbar py-2 px-3 bg-white rounded-t-lg shadow-lg">
          {data.map((category: any, index: number) => (
            <button
              key={index}
              onClick={() => {
                setActiveCategory(index);
                dispatch(setActiveItem(index));
              }}
              className={cn(
                "px-4 py-2 text-sm whitespace-nowrap transition-colors",
                activeCategory === index &&
                  "bg-[#FF8080] rounded-md text-white [box-shadow:var(--shadow-s)]"
              )}
            >
              {category.name}
              <span className="ml-2 text-xs ">{category.menuItems.length}</span>
            </button>
          ))}
          <div className="sticky right-[-19px] ml-auto pl-4 bg-gradient-to-l from-white via-white">
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="default"
                  className="rounded-[15% 150% 150% 15% / 50% 0% 0% 50%] rounded-r-none [box-shadow:var(--shadow-m)]"
                >
                  <Utensils className="mr-1 h-4 w-4" />
                  Menu
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[calc(100vw-2rem)] max-h-[400px] overflow-y-auto p-0"
                align="end"
              >
                <div className="grid">
                  {data.map((category: any, id: number) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setActiveCategory(category.id - 1);
                        dispatch(setActiveItem(id));
                        setPopoverOpen(false); // Close the popover
                      }}
                      className="flex items-center justify-between px-4 py-2 hover:bg-muted text-sm"
                    >
                      {category.name}
                      <span className="text-xs text-red-500">
                        {category.menuItems.length}
                      </span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {ordereditems.length > 0 && (
        <div className="bg-gradient-to-r from-red-300 to-[#FF8080] text-white px-4 py-3 animate-in fade-in slide-in-from-bottom duration-500">
          <div className="flex items-center justify-center gap-2">
            <div className="text-lg font-medium">
              {ordereditems.length} Item added
            </div>
            <Link href="/order">
              <Button
                variant="ghost"
                size="icon"
                className="text-white bg-white/40 hover:text-white hover:bg-white/20"
              >
                <MoveRight className="h-6 w-6" />
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-center text-sm text-center mt-1 text-white/90">
            Add items worth <IndianRupee className="w-4 h-4" />
            100 to unlock a free discount
          </div>
        </div>
      )}

      <style jsx global>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
