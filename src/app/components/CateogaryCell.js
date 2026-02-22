import { TableCell, Popover } from "@mui/material";
import { Dot, SeparatorHorizontal } from "lucide-react";
import { useState } from "react";

const CategoryCell = ({ row, visibleColumns }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleCategoryClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? "category-popover" : undefined;

  const categories = row.categories || [];

  // Get only last segment of the path for preview
  const getLastSegment = (path) =>
    path?.includes("/") ? path.split("/").filter(Boolean).pop() : path;

  return visibleColumns.categories ? (
    <>
      <TableCell
        align="center"
        sx={{
          p: "5px 16px",
          minWidth: "150px",
          cursor: "pointer",
          
          "&:hover": { backgroundColor: "#f5f5f5" },
        }}
        onClick={handleCategoryClick}
      >
        <div className="text-[13px] font-normal font-sans text-center">
          {categories.length > 0 ? (
            categories.length > 1 ? (
                <span className="text-[13px] font-normal font-sans text-wrap text-gray-800 leading-[2px]">
                  <span>
                    {categories
                      .slice(0, 1)
                      .map((c) => getLastSegment(c.name))
                      .join(", ")}
                  </span>{" "}
                  {categories.length > 1 && (
                    <span className="text-[10px] font-normal font-sans text-nowrap text-gray-500">
                      +{categories.length - 1} more
                    </span>
                  )}
                </span>
            ) : (
              categories.map((c) => getLastSegment(c.name)).join(", ")
            )
          ) : (
            "-"
          )}
        </div>
      </TableCell>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ mt: 1 }}
      >
        <div className="w-[250px] max-w-[300px] min-h-[180px] bg-white rounded-lg shadow-md p-3 flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-[14px] font-semibold font-sans text-center">
              Categories
            </span>
            <SeparatorHorizontal className="w-full h-[0.5px] bg-gray-400" />
          </div>
          {categories.length > 0 ? (
            <div className="flex flex-col gap-1">
              {categories.map((cat) => (
                <span className="flex items-start gap-[2px]">
                  <Dot size={20} className="shrink-0" />
                  <span className="text-[12px] break-words">{cat.name}</span>
                </span>
              ))}
            </div>
          ) : (
            <span className="text-[12px] text-gray-500 text-center font-sans">
              No categories available
            </span>
          )}
        </div>
      </Popover>
    </>
  ) : null;
};

export default CategoryCell;
