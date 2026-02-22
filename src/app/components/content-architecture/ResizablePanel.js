"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { GripVertical } from "lucide-react";

export default function ResizablePanel({
  children,
  minWidth = 200,
  maxWidth = 600,
  initialWidth = 350,
}) {
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const resizeHandleRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, minWidth, maxWidth]);

  const startResizing = () => {
    setIsResizing(true);
  };

  return (
    <motion.div
      className="relative bg-white h-full flex flex-col"
      style={{ width: `${width}px` }}
      animate={{ width: `${width}px` }}
      transition={{ type: "spring", stiffness: 600, damping: 40 }}
    >
      {children}
      <div
        ref={resizeHandleRef}
        className={`absolute right-0 top-0 bottom-0 w-4 cursor-col-resize flex items-center justify-center z-10 hover:bg-gray-100 ${
          isResizing ? "bg-gray-200" : ""
        }`}
        onMouseDown={startResizing}
      >
        <GripVertical className="h-5 w-5 text-gray-400" />
      </div>
    </motion.div>
  );
}
