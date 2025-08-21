import { AlertTriangle } from "lucide-react";

export default function TableOccupiedMessage() {
  //   const handleScanAnotherTable = () => {
  //      if (window.close()) {
  //        console.log("Window closed successfully.");
  //      } else {
  //        // Fallback behavior if the tab cannot be closed
  //        alert("Unable to close the tab. Please close it manually.");
  //      }
  //   };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <AlertTriangle className="text-yellow-500 w-8 h-8" />
            {/* <Button
              variant="ghost"
              size="icon"
              className="text-gray-500 hover:text-gray-700"
              onClick={handleScanAnotherTable}
            >
              <X className="w-5 h-5" />
              <span className="sr-only">Close</span>
            </Button> */}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Table Already Occupied
          </h2>
          <p className="text-gray-600 mb-6">
            The QR code you scanned is for a table that is currently in use.
            Please scan a QR code from an available table.
          </p>
          {/* <div className="flex justify-center">
            <Button
              className="w-full sm:w-auto"
              onClick={handleScanAnotherTable}
            >
              Scan Another Table
            </Button>
          </div> */}
        </div>
      </div>
    </div>
  );
}
