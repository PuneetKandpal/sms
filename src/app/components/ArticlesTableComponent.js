"use client";
import React, { useState, useMemo, forwardRef } from "react";
import { formatLocalDateTime } from "../../utils/dateUtils";
import { TableVirtuoso } from "react-virtuoso";
import Table from "@mui/material/Table";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import Paper from "@mui/material/Paper";
import Checkbox from "@mui/material/Checkbox";
import Typography from "@mui/material/Typography";
import { Box, IconButton, Button } from "@mui/material";
import { MdKeyboardArrowDown, MdOutlineMoreVert } from "react-icons/md";
import { CheckIcon, Eye, EyeIcon, View, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

const TableComponents = {
  Scroller: forwardRef((props, ref) => (
    <TableContainer
      component={Paper}
      elevation={1}
      ref={ref}
      sx={{
        borderRadius: "8px",
        border: "1px solid black",
        maxHeight: "calc(100vh - 300px)",
        overflowY: "auto",
      }}
      {...props}
    />
  )),
  Table: (props) => (
    <Table
      {...props}
      size="small"
      sx={{ borderCollapse: "separate", width: "100%" }}
    />
  ),
  TableHead: forwardRef((props, ref) => (
    <TableHead
      {...props}
      ref={ref}
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 1,
        boxShadow: "0px 0.2px 0px 0px black",
        backgroundColor: "white",
      }}
    />
  )),
  TableRow: forwardRef(({ item: row, ...props }, ref) => (
    <TableRow
      ref={ref}
      hover
      {...props}
      id={`article-row-${row.id}`}
      sx={{
        backgroundColor:
          row?.status?.toLowerCase() === "review" ? "#e5e7eb" : "",
        "&:last-child td, &:last-child th": { border: 0 },
      }}
    />
  )),
  TableBody: forwardRef((props, ref) => <TableBody {...props} ref={ref} />),
};

export default function ArticlesTableComponent({
  columns,
  sortedData,
  visibleColumns,
  isAllSelected,
  selectedRowIds,
  handleSelectAll,
  handleCheckboxToggle,
  openColumnMenu,
  getContentTypeColor,
  getStatusColor,
  getStatusLabel,
  getStageColor,
  getStageLabel,
  onActionClick,
  ArrayCell,
  OverviewCell,
  onOpenContentArchitecture,
}) {
  const data = useMemo(() => sortedData, [sortedData]);

  return (
    <Box sx={{ width: "100%" }}>
      <TableVirtuoso
        data={data}
        components={TableComponents}
        style={{ width: "100%", height: "calc(100vh - 300px)", border: "1px solid black" }}
        fixedHeaderContent={() => (
          <TableRow>
            {columns
              .filter((c) => visibleColumns[c.key])
              .map((column) => (
                <TableCell
                  key={column.key}
                  align={column.key === "title" ? "left" : "center"}
                  sx={{
                    cursor:
                      column.sortable || column.filterable
                        ? "pointer"
                        : "default",
                    fontWeight: 500,
                    fontSize: "10px",
                    p: "5px 8px",
                    ...column.sx,
                  }}
                  onClick={(e) => openColumnMenu(e, column.key)}
                >
                  <Box
                    display="flex"
                    alignItems="center"
                    gap={0.5}
                    justifyContent={
                      column.key === "title" ? "flex-start" : "center"
                    }
                  >
                    {column.key === "title" && (
                      <Checkbox
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                        onClick={(e) => e.stopPropagation()}
                        size="small"
                        disableRipple
                        icon={
                          <Box
                            sx={{
                              width: 18,
                              height: 18,
                              borderRadius: "6px",
                              backgroundColor: "#e5e7eb",
                              border: "0.5px solid #d1d5dc",
                            }}
                          />
                        }
                        checkedIcon={
                          <Box
                            sx={{
                              width: 18,
                              height: 18,
                              borderRadius: "6px",
                              backgroundColor: "#9810fa",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <CheckIcon width={14} height={14} color="white" />
                          </Box>
                        }
                      />
                    )}
                    <span className="text-[13px] font-medium">
                      {column.label}
                    </span>
                    {(column.sortable || column.filterable) && (
                      <MdKeyboardArrowDown
                        style={{
                          cursor: "pointer",
                          width: 18,
                          height: 18,
                        }}
                      />
                    )}
                  </Box>
                </TableCell>
              ))}
          </TableRow>
        )}
        itemContent={(index, row) =>
          columns
            .filter((c) => visibleColumns[c.key])
            .map((column) => {
              const key = column.key;
              const commonProps = {
                key,
                align: ["title", "description"].includes(key)
                  ? "left"
                  : "center",
                sx: {
                  p: key === "title" ? "5px 8px" : "5px 16px",
                  whiteSpace: key === "title" ? "normal" : undefined,
                  wordBreak: key === "title" ? "break-word" : undefined,
                },
              };

              switch (key) {
                case "title":
                  return (
                    <TableCell
                      align="left"
                      sx={{
                        p: "5px 8px",
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1}>
                        <Checkbox
                          checked={selectedRowIds.has(row.id)}
                          onChange={() => handleCheckboxToggle(row)}
                          size="small"
                          disableRipple
                          icon={
                            <Box
                              className="border-1 border-gray-400"
                              sx={{
                                width: 18,
                                height: 18,
                                borderRadius: "6px",
                                backgroundColor: "#e5e7eb",
                                border: "0.5px solid #d1d5dc",
                              }}
                            />
                          }
                          checkedIcon={
                            <Box
                              sx={{
                                width: 18,
                                height: 18,
                                borderRadius: "6px",
                                backgroundColor: "#9810fa",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <CheckIcon
                                style={{
                                  width: 14,
                                  height: 14,
                                  color: "white",
                                }}
                              />
                            </Box>
                          }
                        />
                        <span className="text-[13px] font-[500] font-sans">
                          {row.title}
                        </span>
                      </Box>
                    </TableCell>
                  );
                case "description":
                  return <OverviewCell key={key} text={row.description} />;
                case "content_architecture":
                  return (
                    <TableCell align="center" sx={{ p: "5px 16px" }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenContentArchitecture?.(row);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-800 hover:underline cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        disabled={!row.page_id || !onOpenContentArchitecture}
                      >
                        Open Page
                        <ExternalLink size={14} />
                      </button>
                    </TableCell>
                  );
                case "type":
                  return (
                    <TableCell align="center" sx={{ p: "5px 16px" }}>
                      {row.type ? (
                        <span
                          className={`inline-flex px-2 pt-[2.5px] pb-[1.5px] text-xs font-medium rounded-lg ${getContentTypeColor(
                            row.type
                          )}`}
                        >
                          {row.type}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  );
                case "company_name":
                  return (
                    <TableCell align="center" sx={{ p: "5px 16px" }}>
                      <span className="text-[13px] font-normal font-sans">
                        {row.company_name || "-"}
                      </span>
                    </TableCell>
                  );
                case "target_customers":
                  return (
                    <ArrayCell
                      key={key}
                      items={row.target_customers}
                      title="Target Customers"
                    />
                  );
                case "target_markets":
                  return (
                    <ArrayCell
                      key={key}
                      items={row.target_markets}
                      title="Target Markets"
                    />
                  );
                case "key_differentiators":
                  return (
                    <ArrayCell
                      key={key}
                      items={row.key_differentiators}
                      title="Key Differentiators"
                    />
                  );
                case "additional_keywords":
                  return (
                    <ArrayCell
                      key={key}
                      items={row.additional_keywords}
                      title="Additional Keywords"
                    />
                  );
                case "status":
                  return (
                    <TableCell align="center" sx={{ p: "5px 16px" }}>
                      {row?.status ? (
                        <span
                          className={` text-nowrap px-2 py-[3px] text-xs font-medium rounded-lg text-center min-w-10 justify-center ${getStatusColor(
                            row.status
                          )}`}
                        >
                          {getStatusLabel(row.status)}
                        </span>
                      ) : (
                        <Typography variant="body2">-</Typography>
                      )}
                    </TableCell>
                  );
                case "stage":
                  return (
                    <TableCell align="center" sx={{ p: "5px 16px" }}>
                      {row?.stage ? (
                        <span
                          className={` text-nowrap px-2 py-[3px] text-xs font-medium rounded-lg text-center min-w-10 justify-center ${getStageColor(
                            row.stage
                          )}`}
                        >
                          {getStageLabel(row.stage)}
                        </span>
                      ) : (
                        <span className="text-nowrap px-2 py-[3px] text-xs font-medium rounded-lg text-center min-w-10 justify-center bg-yellow-100 text-yellow-700">
                          In Review
                        </span>
                      )}
                    </TableCell>
                  );
                case "createdAt":
                  return (
                    <TableCell
                      align="center"
                      sx={{ p: "5px 16px", whiteSpace: "nowrap" }}
                    >
                      <span className="text-[13px] font-normal font-sans">
                        {formatLocalDateTime(row.createdAt, "UTC")}
                      </span>
                    </TableCell>
                  );
                case "updatedAt":
                  return (
                    <TableCell
                      align="center"
                      sx={{ p: "5px 16px", whiteSpace: "nowrap" }}
                    >
                      <span className="text-[13px] font-normal font-sans">
                        {row.updatedAt
                          ? new Date(row.updatedAt).toLocaleString()
                          : "-"}
                      </span>
                    </TableCell>
                  );
                case "page_generated":
                  return (
                    <TableCell align="center" sx={{ p: "5px 16px" }}>
                      {row?.page_id ? (
                        <span className="inline-flex px-2 py-[3px] text-xs font-medium rounded-lg text-center min-w-10 justify-center bg-green-100 text-green-700">
                          True
                        </span>
                      ) : (
                        <span className="text-[13px] font-normal font-sans text-gray-500">
                          -
                        </span>
                      )}
                    </TableCell>
                  );
                case "link":
                  return (
                    <ArticleLinkCell
                      key={key}
                      row={row}
                    />
                  );
                case "actions":
                  return (
                    <TableCell align="center" sx={{ p: "5px 16px" }}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onActionClick(row);
                        }}
                      >
                        <View className="w-4 h-4" />
                      </IconButton>
                    </TableCell>
                  );
                default:
                  return (
                    <TableCell {...commonProps}>
                      <Typography variant="body2">{row[key] ?? "-"}</Typography>
                    </TableCell>
                  );
              }
            })
        }
      />
    </Box>
  );
}

const ArticleLinkCell = ({ row }) => {
  const router = useRouter();

  if (!row?.page_id) {
    return (
      <TableCell align="center" sx={{ p: "5px 16px" }}>
        <span className="text-[13px] font-normal font-sans text-gray-500">-</span>
      </TableCell>
    );
  }

  const handleLinkClick = () => {
    const projectId = row.project_id;
    router.push(`/projects/${projectId}/content-architecture?page_id=${row.page_id}`);
  };

  return (
    <TableCell align="center" sx={{ p: "5px 16px" }}>
      <Button
        variant="text"
        size="small"
        onClick={handleLinkClick}
        sx={{
          textTransform: "none",
          color: "#9810fa",
          fontSize: "13px",
          fontWeight: 500,
          padding: "4px 8px",
          minWidth: "auto",
          "&:hover": {
            backgroundColor: "rgba(152, 16, 250, 0.08)",
          },
        }}
        endIcon={<ExternalLink size={14} />}
      >
        Content Architecture
      </Button>
    </TableCell>
  );
};
