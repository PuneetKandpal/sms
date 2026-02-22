import { TableCell, Popover } from "@mui/material";
import { Dot, SeparatorHorizontal } from "lucide-react";
import { useState } from "react";

const LinkedProductsCell = ({ row, visibleColumns }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleProductClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? "linked-products-popover" : undefined;

  const linkedProducts = row.linked_products || [];

  return visibleColumns.linked_products ? (
    <>
      <TableCell
        align="center"
        sx={{
          p: "5px 16px",
          minWidth: "150px",
          cursor: "pointer",
          "&:hover": { backgroundColor: "#f5f5f5" },
        }}
        onClick={handleProductClick}
      >
        <div className="text-[13px] font-normal font-sans text-center">
          {linkedProducts.length > 0 ? (
            linkedProducts.length > 1 ? (
              <span className="text-[13px] font-normal font-sans text-wrap text-gray-800 leading-[2px]">
                <span>
                  {linkedProducts
                    .slice(0, 1)
                    .map((p) => p.name)
                    .join(", ")}
                </span>{" "}
                {linkedProducts.length > 1 && (
                  <span className="text-[10px] font-normal font-sans text-nowrap text-gray-500">
                    +{linkedProducts.length - 1} more
                  </span>
                )}
              </span>
            ) : (
              linkedProducts.map((p) => p.name).join(", ")
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
              Linked Products
            </span>
            <SeparatorHorizontal className="w-full h-[0.5px] bg-gray-400" />
          </div>
          {linkedProducts.length > 0 ? (
            <div className="flex flex-col gap-1">
              {linkedProducts.map((product) => (
                <span key={product._id} className="flex items-start gap-[2px]">
                  <Dot size={20} className="shrink-0" />
                  <span className="text-[12px] break-words">
                    {product.name}
                  </span>
                </span>
              ))}
            </div>
          ) : (
            <span className="text-[12px] text-gray-500 text-center font-sans">
              No linked products
            </span>
          )}
        </div>
      </Popover>
    </>
  ) : null;
};

export default LinkedProductsCell;
