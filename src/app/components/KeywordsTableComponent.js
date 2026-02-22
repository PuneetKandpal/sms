"use client";
import React, { useMemo, forwardRef, useState } from "react";
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
import { Box, Tooltip } from "@mui/material";
import { MdKeyboardArrowDown } from "react-icons/md";
import { CheckIcon, ExternalLink, Info } from "lucide-react";
import CategoryCell from "./CateogaryCell";
import LinkedProductsCell from "./LinkedProductsCell";

const TableComponents = {
  Scroller: forwardRef((props, ref) => (
    <TableContainer
      component={Paper}
      elevation={1}
      ref={ref}
      sx={{
        borderRadius: "8px",
        border: "1px solid black",
        maxHeight: "calc(100vh - 300px)", // match AI Optimizations
        overflowY: "auto",
      }}
      {...props}
    />
  )),
  Table: (props) => (
    <Table {...props} size="small" sx={{ borderCollapse: "separate" }} />
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
      sx={{
        backgroundColor:
          row?.keyword_status?.toLowerCase() === "review" ? "#e5e7eb" : "",
        "&:last-child td, &:last-child th": { border: 0 },
      }}
    />
  )),
  TableBody: forwardRef((props, ref) => <TableBody {...props} ref={ref} />),
};

export default function KeywordsTableComponent({
  columns,
  sortedData,
  visibleColumns,
  isAllSelected,
  checkedRows,
  handleSelectAll,
  handleCheckboxToggle,
  openColumnMenu,
  getCompetitionColor,
  getSearchIntentColor,
  getKeywordStatusColor,
  keywordStatusOptions,
  priorityConfig,
  openPriorityMenu,
  onSubmitAIQuestions,
  aiQuestionsLoading,
}) {
  const data = useMemo(() => sortedData, [sortedData]);

  const [hoverCard, setHoverCard] = useState({
    open: false,
    x: 0,
    y: 0,
    title: "",
    body: "",
  });

  const showHoverCard = (e, { title, body }) => {
    const clientX = e?.clientX ?? 0;
    const clientY = e?.clientY ?? 0;
    setHoverCard({ open: true, x: clientX, y: clientY, title, body });
  };

  const moveHoverCard = (e) => {
    if (!hoverCard.open) return;
    const clientX = e?.clientX ?? hoverCard.x;
    const clientY = e?.clientY ?? hoverCard.y;
    setHoverCard((prev) => ({ ...prev, x: clientX, y: clientY }));
  };

  const hideHoverCard = () => {
    setHoverCard((prev) => ({ ...prev, open: false, title: "", body: "" }));
  };

  return (
    <Box sx={{ width: "100%" }}>
      <TableVirtuoso
        data={data}
        components={TableComponents}
        style={{ width: "100%", height: "calc(100vh - 250px)", border: "1px solid black" }}
        fixedHeaderContent={() => (
          <TableRow>
            {columns
              .filter((c) => visibleColumns[c.key])
              .map((column) => (
                <TableCell
                  key={column.key}
                  align={column.key === "name" ? "left" : "center"}
                  sx={{
                    cursor:
                      column.sortable ||
                      column.filterable ||
                      column.searchable
                        ? "pointer"
                        : "default",
                    fontWeight: 500,
                    fontSize: "12px",
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
                      column.key === "name" ? "flex-start" : "center"
                    }
                  >
                    {column.key === "name" && (
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
                    <span className="text-[13px] font-medium">{column?.label}</span>
                    {column.key === "priority_score" && (
                      <button
                        type="button"
                        onMouseEnter={(e) => {
                          e.stopPropagation();
                          showHoverCard(e, {
                            title: "Priority Score",
                            body: "Hover over the priority score to view the relevancy reasoning.",
                          });
                        }}
                        onMouseMove={(e) => {
                          e.stopPropagation();
                          moveHoverCard(e);
                        }}
                        onMouseLeave={() => hideHoverCard()}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center justify-center"
                      >
                        <Info size={14} className="text-gray-500" />
                      </button>
                    )}
                    {(column?.sortable ||
                      column?.filterable ||
                      column?.searchable) && (
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
        rowContent={(index, row) => ({
          sx: {
            backgroundColor:
              row?.keyword_status?.toLowerCase() === "review" ? "#e5e7eb" : "",
            "&:hover": {
              backgroundColor: "#f5f5f5", // Match MUI hover behavior if needed
            },
          },
        })}
        itemContent={(index, row) => (
          <>
            {columns
              .filter((c) => visibleColumns[c.key])
              .map((column) => {
                const key = column.key;
                switch (key) {
                  case "name":
                    return (
                      <TableCell
                        align="left"
                        sx={{ p: "5px 8px", whiteSpace: "nowrap" }}
                      >
                        <Box display="flex" alignItems="center" gap={1}>
                          <Checkbox
                            checked={!!checkedRows[row.id]}
                            onChange={() => handleCheckboxToggle(row.id)}
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
                                  backgroundColor: "#9810fa", // purple when checked
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
                          <span className="text-[14px] font-medium font-sans text-wrap">
                            {row.name}
                          </span>
                        </Box>
                      </TableCell>
                    );
                  case "priority_label": {
                    const rawLabel = row?.priority_label;
                    const normalizedLabel = rawLabel
                      ? String(rawLabel).trim().toUpperCase()
                      : null;

                    const priority =
                      normalizedLabel && /^P[1-3]$/.test(normalizedLabel)
                        ? normalizedLabel
                        : "-";
                    const cfg = (priorityConfig && priorityConfig[priority]) ||
                      (priorityConfig && priorityConfig["-"]) ||
                      { color: "bg-gray-100 text-gray-700", tooltip: "Unprioritized" };

                    const chip = (
                      <button
                        type="button"
                        onClick={(e) => openPriorityMenu?.(e, row.id)}
                        className={`inline-flex items-center gap-1 px-2 py-[3px] text-xs font-medium rounded-lg text-center min-w-10 justify-center cursor-pointer ${cfg.color}`}
                      >
                        {priority === "-" ? "Unprioritized" : priority}
                        <MdKeyboardArrowDown style={{ width: 14, height: 14 }} />
                      </button>
                    );

                    return (
                      <TableCell align="center" sx={{ p: "5px 16px" }}>
                        <Tooltip title={cfg.tooltip} arrow>
                          <span>{chip}</span>
                        </Tooltip>
                      </TableCell>
                    );
                  }
                  case "priority_score": {

                    
                    const score = row.final_priority_score;
                    const label = Number.isFinite(score) ? score.toFixed(2) : "-";
                    const reasoning = row?.priority_reasoning || row?.reasoning || "";

                    return (
                      <TableCell align="center" sx={{ p: "5px 16px" }}>
                        <span
                          className="text-[13px] font-semibold text-gray-900 cursor-help"
                          onMouseEnter={(e) => {
                            e.stopPropagation();
                            showHoverCard(e, {
                              title: "Relevancy reasoning",
                              body: reasoning || "No reasoning available",
                            });
                          }}
                          onMouseMove={(e) => {
                            e.stopPropagation();
                            moveHoverCard(e);
                          }}
                          onMouseLeave={() => hideHoverCard()}
                        >
                          {label}
                        </span>
                      </TableCell>
                    );
                  }
                  case "ai_questions": {
                    const loading = !!aiQuestionsLoading?.[row.id];
                    const questionCount =
                      typeof row?.total_questions_generated === "number"
                        ? row.total_questions_generated
                        : Array.isArray(row?.generated_question_ids)
                          ? row.generated_question_ids.length
                          : 0;
                    return (
                      <TableCell align="center" sx={{ p: "5px 16px" }}>
                        <div className="flex flex-col items-center gap-1">
                          {questionCount > 0 ? (
                            <a
                              href={`/projects/${row.project_id}/ai-optimizations?keyword_id=${row.id}`}
                              className="text-xs font-medium underline text-indigo-600 hover:text-indigo-800 cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View ({questionCount})
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSubmitAIQuestions?.(row);
                              }}
                              disabled={loading}
                              className={`text-xs font-medium underline ${
                                loading
                                  ? "text-gray-400 cursor-not-allowed"
                                  : "text-indigo-600 hover:text-indigo-800 cursor-pointer"
                              }`}
                            >
                              {loading ? "Submitting…" : "Submit"}
                            </button>
                          )}
                          {row?.aio_answer_id ? (
                            <a
                              href={`/projects/${row.project_id}/aio-answers?highlight=${row.aio_answer_id}&autoScroll=true`}
                              className="text-[11px] text-gray-500 hover:text-gray-700 inline-flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View{questionCount > 0 ? ` (${questionCount})` : ""}
                              <ExternalLink size={12} />
                            </a>
                          ) : (
                            <span className="text-[11px] text-gray-400"></span>
                          )}
                        </div>
                      </TableCell>
                    );
                  }
                  case "search_volume":
                    return (
                      <TableCell align="center" sx={{ p: "5px 16px" }}>
                        <span className="text-[13px] font-normal font-sans">
                          {row?.search_volume?.toLocaleString() || "-"}
                        </span>
                      </TableCell>
                    );
                  case "competition_level":
                    return (
                      <TableCell align="center" sx={{ p: "5px 16px" }}>
                        {row?.competition_level ? (
                          <span
                            className={`inline-flex px-2 py-[3px] text-xs font-medium rounded-lg text-center min-w-10 justify-center ${getCompetitionColor(
                              row.competition_level
                            )}`}
                          >
                            {row.competition_level
                              ? row.competition_level.toLowerCase()
                              : "-"}
                          </span>
                        ) : (
                          <Typography variant="body2">-</Typography>
                        )}
                      </TableCell>
                    );
                  case "linked_products":
                    return (
                      <LinkedProductsCell
                        row={row}
                        visibleColumns={visibleColumns}
                      />
                    );
                  case "search_intent_info":
                    return (
                      <TableCell align="center" sx={{ p: "5px 16px" }}>
                        {row.search_intent_info?.main_intent ? (
                          <span
                            className={`inline-flex px-2 pt-[2.5px] pb-[1.5px] text-xs font-medium rounded-lg ${getSearchIntentColor(
                              row.search_intent_info.main_intent
                            )}`}
                          >
                            {row.search_intent_info.main_intent}
                          </span>
                        ) : (
                          <Typography variant="body2">-</Typography>
                        )}
                      </TableCell>
                    );
                  case "cpc":
                  case "low_top_of_page_bid":
                  case "high_top_of_page_bid":
                    return (
                      <TableCell align="center" sx={{ p: "5px 16px" }}>
                        <span className="flex justify-center items-center">
                          {row?.cpc ? (
                            <span className="flex items-center">
                              <span className="text-[13px] font-normal text-gray-500">
                                $
                              </span>
                              <span className="w-[2px]" />
                              <span className="text-[13px] font-medium">
                                {row.cpc.toFixed(2)}
                              </span>
                            </span>
                          ) : (
                            "-"
                          )}
                        </span>
                      </TableCell>
                    );
                  case "keyword_status":
                    return (
                      <TableCell align="center" sx={{ p: "5px 16px" }}>
                        {row?.keyword_status ? (
                          <span
                            className={`inline-flex px-2 py-[3px] text-xs font-medium rounded-lg text-center min-w-10 justify-center ${getKeywordStatusColor(
                              row?.keyword_status
                            )}`}
                          >
                            {row?.keyword_status
                              ? keywordStatusOptions[
                                  row?.keyword_status.toLowerCase()
                                ].label
                              : "-"}
                          </span>
                        ) : (
                          <Typography variant="body2">-</Typography>
                        )}
                      </TableCell>
                    );
                  case "is_competitor":
                    return (
                      <TableCell align="center" sx={{ p: "5px 16px" }}>
                        {row?.is_competitor === true ||
                        row?.is_competitor === "true" ? (
                          <span className="inline-flex px-2 py-[3px] text-xs font-medium rounded-lg bg-green-100 text-green-700 text-center min-w-10 justify-center">
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-[3px] text-xs font-medium rounded-lg bg-red-100 text-red-700 text-center min-w-10 justify-center">
                            No
                          </span>
                        )}
                      </TableCell>
                    );
                  case "competitor_type":
                    return (
                      <TableCell align="center" sx={{ p: "5px 16px" }}>
                        {row?.competitor_type ? (
                          <span className="inline-flex px-2 py-[3px] text-xs font-medium rounded-lg bg-gray-100 text-gray-800 text-center min-w-10 justify-center">
                            {row.competitor_type}
                          </span>
                        ) : (
                          <Typography variant="body2">-</Typography>
                        )}
                      </TableCell>
                    );
                  case "language_code":
                    return (
                      <TableCell align="center" sx={{ p: "5px 16px" }}>
                        <span className="text-[13px] font-medium">
                          {row.language_code || "-"}
                        </span>
                      </TableCell>
                    );
                  case "se_type":
                    return (
                      <TableCell align="center" sx={{ p: "5px 16px" }}>
                        <span className="text-[13px] font-medium">
                          {row.se_type || "-"}
                        </span>
                      </TableCell>
                    );
                  case "created_at":
                    return (
                      <TableCell align="center" sx={{ p: "5px 16px" }}>
                        <span className="text-[13px] font-medium">
                          {formatLocalDateTime(row.created_at)}
                        </span>
                      </TableCell>
                    );
                  case "updated_at":
                    return (
                      <TableCell align="center" sx={{ p: "5px 16px" }}>
                        <span className="text-[13px] font-medium">
                          {formatLocalDateTime(row.updated_at)}
                        </span>
                      </TableCell>
                    );
                  default:
                    return (
                      <TableCell
                        key={key}
                        align={key === "name" ? "left" : "center"}
                        sx={{ p: "5px 16px" }}
                      >
                        <Typography variant="body2">
                          {row[key] || "-"}
                        </Typography>
                      </TableCell>
                    );
                }
              })}
          </>
        )}
      />

      {hoverCard.open && (
        <div
          style={{
            position: "fixed",
            left: hoverCard.x + 12,
            top: hoverCard.y + 12,
            zIndex: 2000,
            pointerEvents: "none",
          }}
        >
          <div
            className="bg-white border border-gray-200 shadow-lg rounded-xl p-3 max-w-[420px]"
            style={{ maxHeight: 220, overflow: "auto" }}
          >
            {hoverCard.title ? (
              <div className="text-[12px] font-semibold text-gray-900 mb-1">
                {hoverCard.title}
              </div>
            ) : null}
            <div className="text-[12px] text-gray-700 leading-relaxed whitespace-pre-wrap">
              {hoverCard.body}
            </div>
          </div>
        </div>
      )}
    </Box>
  );
}
