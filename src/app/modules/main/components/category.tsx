"use client";

import * as React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/lib/store";
import { setActiveItem } from "@/lib/features/activeFooterCategory";

interface Category {
  id: number;
  name: string;
  categoryLogo: string;
}

export default function Category({ data }: { data: Category[] }) {
  const dispatch = useDispatch<AppDispatch>();
  const rows = React.useMemo(() => {
    return data.reduce((acc: Category[][], curr: Category, i: number) => {
      const rowIndex = Math.floor(i / 10);
      if (!acc[rowIndex]) {
        acc[rowIndex] = [];
      }
      acc[rowIndex].push(curr);
      return acc;
    }, [] as Category[][]);
  }, [data]);

  return (
    <div className="px-2 py-2">
      <div className="relative pb-4">
        <div className="flex justify-between items-center">
          <span className="h-[3px] w-[45px] bg-gradient-to-r from-blue-500 to-pink-500 rounded-[50%] blur-[0.5px]"></span>
          <h2 className="text-2xl font-semibold">What&apos;s on your mind</h2>
          <span className="h-[3px] w-[45px] bg-gradient-to-l from-blue-500 to-pink-500 rounded-[50%] blur-[0.5px]"></span>
        </div>
      </div>

      <div className="space-y-4">
        {rows.map((row: Category[], rowIndex: number) => (
          <div key={rowIndex} className="overflow-x-auto scrollbar-hide">
            <div className="flex space-x-4 min-w-max">
              {row.map((category: Category, columnIndex: number) => {
                // Calculate the global index
                const globalIndex = rowIndex * 10 + columnIndex;

                return (
                  <div
                    key={category.id}
                    className={cn(
                      "flex-shrink-0 cursor-pointer",
                      "rounded-lg transition-colors hover:bg-accent"
                    )}
                    onClick={() => {
                      dispatch(setActiveItem(globalIndex));
                    }}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <Avatar className="h-20 w-20">
                        <AvatarImage
                          src={category.categoryLogo}
                          alt={category.name}
                        />
                        <AvatarFallback>
                          {category.name.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="w-full text-center">
                        <span
                          className="text-sm font-normal line-clamp-2"
                          title={category.name}
                        >
                          {category.name}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
