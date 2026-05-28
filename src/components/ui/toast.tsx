import * as React from "react";
import toast from "sonner";

const ToastContainer: React.FC = () => {
  return (
    <div>
      {/* Sonner will automatically render toasts here when used via toast() function */}
      {/* This component is just a placeholder to satisfy the import */ }
      <div data-portal-target>Sonner Toast Container</div>
    </div>
  );
};

export { ToastContainer };
