"use client";
import React, { useState, useMemo, forwardRef, useRef, useEffect } from "react";
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
import { Box, IconButton } from "@mui/material";
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
      id={`answer-row-${row.id}`}
      sx={{
        backgroundColor:
          row?.status?.toLowerCase() === "in progress" ? "#e5e7eb" : "",
        "&:last-child td, &:last-child th": { border: 0 },
      }}
    />
  )),
  TableBody: forwardRef((props, ref) => <TableBody {...props} ref={ref} />),
};

export default function AIOAnswersTableComponent({
  columns,
  sortedData,
  visibleColumns,
  isAllSelected,
  selectedRowIds,
  handleSelectAll,
  handleCheckboxToggle,
  openColumnMenu,
  getStatusColor,
  getStatusLabel,
  getStageColor,
  getStageLabel,
  onActionClick,
  onOpenContentArchitecture,
  ArrayCell,
  OverviewCell,
  highlightAnswerId,
  autoScrollEnabled = false,
  onAutoScrollSettled,
}) {
  const data = useMemo(() => sortedData, [sortedData]);
  const router = useRouter();
  const virtuosoRef = useRef(null);
  const lastSettledHighlightRef = useRef(null);

  const handleQuestionClick = (row) => {
    // Navigate to AI Optimizations page with question highlighted
    const projectId = window.location.pathname.split("/")[2]; // Extract project ID from current path
    const questionIdentifier =
      row.question_id || row.id || encodeURIComponent(row.question);
    router.push(
      `/projects/${projectId}/ai-optimizations?highlight=${questionIdentifier}`
    );
  };

  // Auto-scroll to highlighted answer
  useEffect(() => {
    if (!highlightAnswerId) return;
    if (lastSettledHighlightRef.current === highlightAnswerId) return;

    let attemptCount = 0;
    let settled = false;
    let timeoutId = null;

    const finish = (success) => {
      if (settled) return;
      settled = true;
      if (success) {
        lastSettledHighlightRef.current = highlightAnswerId;
      }
      onAutoScrollSettled?.({ success, answerId: highlightAnswerId });
    };

    const tryScroll = () => {
      const maxAttempts = autoScrollEnabled ? 8 : 4;
      attemptCount++;

      const targetIndex = data.findIndex(
        (row) =>
          row.id === highlightAnswerId ||
          row._id === highlightAnswerId ||
          row.question_id === highlightAnswerId
      );

      if (targetIndex === -1) {
        if (attemptCount < maxAttempts) {
          timeoutId = window.setTimeout(tryScroll, 150 * attemptCount);
        } else {
          finish(false);
        }
        return;
      }

      const virtuoso = virtuosoRef.current;
      if (!virtuoso || typeof virtuoso.scrollToIndex !== "function") {
        if (attemptCount < maxAttempts) {
          timeoutId = window.setTimeout(tryScroll, 150 * attemptCount);
        } else {
          finish(false);
        }
        return;
      }

      virtuoso.scrollToIndex({
        index: targetIndex,
        align: "center",
        behavior: autoScrollEnabled ? "smooth" : "auto",
      });

      // After scrolling to index, also try to scroll the element into view
      timeoutId = window.setTimeout(() => {
        const element = document.getElementById(
          `answer-row-${data[targetIndex]?.id}`
        );
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          finish(true);
        } else if (attemptCount < maxAttempts) {
          tryScroll();
        } else {
          finish(false);
        }
      }, autoScrollEnabled ? 200 : 100);
    };

    timeoutId = window.setTimeout(tryScroll, 150);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [
    highlightAnswerId,
    autoScrollEnabled,
    data,
    onAutoScrollSettled,
  ]);

  return (
    <Box sx={{ width: "100%" }}>
      <TableVirtuoso
        ref={virtuosoRef}
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
                      column.key === "question" ? "flex-start" : "center"
                    }
                  >
                    {column.key === "question" && (
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
                align: ["title", "question"].includes(key) ? "left" : "center",
                sx: {
                  p: key === "title" ? "5px 8px" : "5px 16px",
                  whiteSpace: key === "title" ? "normal" : undefined,
                  wordBreak: key === "title" ? "break-word" : undefined,
                },
              };

              switch (key) {
                case "question":
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
                        <Box
                          onClick={() => handleQuestionClick(row)}
                          sx={{
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            "&:hover": {
                              color: "#3b82f6",
                            },
                          }}
                        >
                          <span className="text-[13px] font-[500] font-sans text-blue-600 hover:text-blue-800 hover:underline">
                            {row.question}
                          </span>
                          <ExternalLink size={14} className="text-blue-500" />
                        </Box>
                      </Box>
                    </TableCell>
                  );
                case "title":
                  return <OverviewCell key={key} text={row.title} />;
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
                        <span className="text-nowrap px-2 py-[3px] text-xs font-medium rounded-lg text-center min-w-10 justify-center bg-gray-100 text-gray-800">
                          Draft
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
                        {formatLocalDateTime(row.createdAt, true)}
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
                case "content_architecture":
                  return (
                    <TableCell align="center" sx={{ p: "5px 16px" }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenContentArchitecture(row);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-800 hover:underline cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        disabled={!row.page_id}
                      >
                        Open Page
                        <ExternalLink size={14} />
                      </button>
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
