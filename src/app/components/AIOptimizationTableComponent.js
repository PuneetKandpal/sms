import React, { forwardRef, useMemo, useRef, useEffect } from "react";
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
import { Box, Button } from "@mui/material";
import { MdKeyboardArrowDown } from "react-icons/md";
import { CheckIcon, ExternalLink } from "lucide-react";
import { AnswerCell, CombinedAnswerCell } from "./AIOptimizationTable";
import { formatLocalDateTime } from "../../utils/dateUtils";
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
        maxHeight: "calc(100vh - 250px)",
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
      sx={{
        backgroundColor: row.status.toLowerCase() === "review" ? "#e5e7eb" : "",
        "&:last-child td, &:last-child th": { border: 0 },
      }}
    />
  )),
  TableBody: forwardRef((props, ref) => <TableBody {...props} ref={ref} />),
};

export default function AIOptimizationTableComponent({
  columns,
  sortedData,
  visibleColumns,
  isAllSelected,
  selectedRowIds,
  handleSelectAll,
  handleCheckboxToggle,
  openColumnMenu,
  getTypeColor,
  getStatusColor,
  getStatusLabel,
  firstSelectedId,
}) {
  const data = useMemo(() => sortedData, [sortedData]);
  const virtuosoRef = useRef(null);

  useEffect(() => {
    if (!firstSelectedId || !data.length) return;

    const targetIndex = data.findIndex((row) => row?.id === firstSelectedId);
    if (targetIndex === -1) return;

    const scrollApi = virtuosoRef.current;
    if (!scrollApi?.scrollToIndex) return;

    const timeoutId = setTimeout(() => {
      try {
        scrollApi.scrollToIndex({ index: targetIndex, align: "start", behavior: "smooth" });
      } catch (err) {
        console.error("Failed to auto-scroll to highlighted AI question", err);
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [firstSelectedId, data]);

  return (
    <Box sx={{ width: "100%" }}>
      <TableVirtuoso
        ref={virtuosoRef}
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
                  align={column.key === "question_phrase" ? "left" : "center"}
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
                      column.key === "question_phrase" ? "flex-start" : "center"
                    }
                  >
                    {column.key === "question_phrase" && (
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
                align: ["question_phrase", ""].includes(key)
                  ? "left"
                  : "center",
                sx: {
                  p: key === "question_phrase" ? "5px 8px" : "5px 16px",
                  whiteSpace: key === "question_phrase" ? "normal" : undefined,
                  wordBreak:
                    key === "question_phrase" ? "break-word" : undefined,
                },
              };

              switch (key) {
                case "question_phrase":
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
                          checked={selectedRowIds.has(
                            row.id || `${row.question_phrase}`
                          )}
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
                          {row.question_phrase}
                        </span>
                      </Box>
                    </TableCell>
                  );
                case "requested_for":
                  return (
                    <TableCell
                      align="center"
                      sx={{
                        p: "5px 16px",
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                      }}
                    >
                      <span className="text-[13px] font-normal font-sans">
                        {row.requested_for}
                      </span>
                    </TableCell>
                  );
                case "type":
                  return (
                    <TableCell align="center" sx={{ p: "5px 16px" }}>
                      {row.type ? (
                        <span
                          className={`text-nowrap px-2 pt-[2.5px] pb-[1.5px] text-xs font-medium rounded-lg ${getTypeColor(
                            row.type
                          )}`}
                        >
                          {row.type === "people_also_ask"
                            ? "People Also Ask"
                            : row.type === "people_also_search"
                            ? "People Also Search"
                            : row.type}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  );
                case "answer":
                  return (
                    <CombinedAnswerCell
                      key={key}
                      row={row}
                    />
                  );
                case "answer_details":
                  return (
                    <AnswerCell
                      key={key}
                      answer={row.QP_answer}
                      description={row.QP_answer_description}
                      url={row.QP_answer_URL}
                    />
                  );
                case "status":
                  return (
                    <TableCell align="center" sx={{ p: "5px 16px" }}>
                      {row?.status ? (
                        <span
                          className={`inline-flex px-2 py-[3px] text-xs font-medium rounded-lg text-center min-w-10 justify-center ${getStatusColor(
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
                case "created_at":
                  return (
                    <TableCell
                      align="center"
                      sx={{ p: "5px 16px", whiteSpace: "nowrap" }}
                    >
                      <span className="text-[13px] font-normal font-sans">
                        {formatLocalDateTime(row.createdAt)}
                      </span>
                    </TableCell>
                  );
                case "updated_at":
                  return (
                    <TableCell
                      align="center"
                      sx={{ p: "5px 16px", whiteSpace: "nowrap" }}
                    >
                      <span className="text-[13px] font-normal font-sans">
                        {formatLocalDateTime(row.updatedAt)}
                      </span>
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
