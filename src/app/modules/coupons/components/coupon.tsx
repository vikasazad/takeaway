"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Copy, IndianRupee, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getCouponData } from "../utils/coupon";

export default function Coupon() {
  const router = useRouter();
  const [couponCode, setCouponCode] = useState("");
  const [couponData, setCouponData] = useState<any>({});

  useEffect(() => {
    getCouponData().then((data) => {
      console.log(data);
      if (!data?.status) {
        return <p>Oops Somthing went wrong....</p>;
      }
      setCouponData(data);
    });
  }, []);

  const handleApply = () => {
    toast.success("Coupon applied successfully!");
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Coupon code copied to clipboard!");
  };

  return (
    <>
      {couponData.info ? (
        <div className="w-full max-w-md mx-auto p-4">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Card className="border-2">
            <CardHeader className="space-y-2 p-4">
              <div className="flex items-center gap-2">
                {/* <Tag className="h-5 w-5 text-primary" /> */}
                <CardTitle className="text-xl">Apply Coupon</CardTitle>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleApply}>Apply</Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Best Available Offers
                  </h3>
                </div>
                {couponData.info.map((data: any, i: number) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    key={i}
                  >
                    <Card className="relative overflow-hidden">
                      <div className="w-14 absolute left-0 top-0 bottom-0 bg-primary flex items-center justify-center">
                        <div
                          className="text-primary-foreground font-bold text-xl"
                          style={{
                            writingMode: "vertical-rl",
                            transform: "rotate(180deg)",
                          }}
                        >
                          {data.type === "percentage" ? (
                            data.discount + "%"
                          ) : (
                            <div className="flex items-center ">
                              <IndianRupee className="w-4 h-4 rotate-90" />
                              {data.discount}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="ml-[3rem] p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-lg">
                              {data.code}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleCopy(data.code)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleApply}
                          >
                            Apply
                          </Button>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-green-600">
                            {data.type === "percentage"
                              ? `Save ${data.discount} on the Order`
                              : `Save ₹${data.discount} on the Order`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Use code TRYNEW & get 30% off on orders above ₹159.
                            Maximum discount: ₹70
                          </p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          <div className="w-full max-w-md mx-auto p-4">
            <Button
              variant="ghost"
              size="sm"
              className="mb-4"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <p>Loading.....</p>
          </div>
        </>
      )}
    </>
  );
}
