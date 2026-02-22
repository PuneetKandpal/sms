import React, { forwardRef, useMemo } from "react";
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
import { CheckIcon, ExternalLink } from "lucide-react";
import { OverviewCell, RelatedDataCell, SourcesCell } from "./TopicsTable";
import { useRouter } from "next/navigation";
import { formatLocalDateTime } from "../../utils/dateUtils";

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

const ArticleStatusCell = ({ row, getStatusColor, getStatusLabel }) => {
  const router = useRouter();
  const articleStage = row.article_status || row.article_current_stage;
  const normalizedStage = articleStage?.toLowerCase();

  const canGoToArticles =
    normalizedStage === "review" && Boolean(row.article_id);
  const canGoToContentArch =
    normalizedStage === "approved" &&
    row.page_created &&
    Boolean(row.page_id);

  const handleRedirect = () => {
    const projectId = row.project_id;

    if (canGoToContentArch) {
      const pageId = row.page_id;
      router.push(
        `/projects/${projectId}/content-architecture?pageId=${pageId}&page_id=${pageId}&autoScroll=true`
      );
      return;
    }

    if (canGoToArticles) {
      router.push(
        `/projects/${projectId}/articles?highlight=${row.article_id}&autoScroll=true`
      );
    }
  };

  const tooltip = canGoToContentArch
    ? "Open in Content Architecture"
    : canGoToArticles
    ? "Open Article"
    : "No destination available";

  const statusValue = articleStage || "Not generated";

  const statusHelpText = (() => {
    if (!normalizedStage || normalizedStage === "not generated") {
      return 'Approve topic, then click "Create Article from Topic" to generate an article.';
    }
    if (normalizedStage === "generated") {
      return canGoToArticles
        ? "Article draft generated. Open Article to review/approve it."
        : "Article draft generated. Review/approve it from Articles.";
    }
    if (normalizedStage === "review") {
      return canGoToArticles
        ? "Open Article to review/approve it."
        : "Article is in review.";
    }
    if (normalizedStage === "approved") {
      return canGoToContentArch
        ? "Approved. Open in Content Architecture to continue."
        : "Approved.";
    }
    if (normalizedStage === "rejected") {
      return "Rejected.";
    }
    return "";
  })();

  return (
    <TableCell
      align="center"
      sx={{ p: "5px 16px", whiteSpace: "nowrap", minWidth: "140px" }}
    >
      <div className="flex flex-col items-center gap-1">
        <Tooltip title={statusHelpText || statusValue} placement="top" arrow>
          <span
            className={`inline-flex px-2 py-[3px] text-xs font-medium rounded-lg text-center min-w-16 justify-center whitespace-nowrap ${getStatusColor(
              statusValue
            )}`}
          >
            {getStatusLabel(statusValue) || statusValue}
          </span>
        </Tooltip>
        {(canGoToArticles || canGoToContentArch) && (
          <Tooltip title={tooltip} placement="top" arrow>
            <button
              onClick={handleRedirect}
              className="text-[12px] text-blue-600 hover:text-blue-800 flex items-center gap-1 underline-offset-2 whitespace-nowrap"
            >
              <ExternalLink size={12} />
              {canGoToContentArch ? "View page" : "View article"}
            </button>
          </Tooltip>
        )}
      </div>
    </TableCell>
  );
};

export default function TopicsTableComponent({
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
}) {
  const data = useMemo(() => sortedData, [sortedData]);
  const funnelStageHelp = useMemo(
    () => ({
      TOFU: "Top of Funnel",
      MOFU: "Middle of Funnel",
      MIDF: "Middle of Funnel",
      BOFU: "Bottom of Funnel",
    }),
    []
  );

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
                  align={column.key === "sub_topic" ? "left" : "center"}
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
                      column.key === "sub_topic" ? "flex-start" : "center"
                    }
                  >
                    {column.key === "sub_topic" && (
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
                align: ["sub_topic", ""].includes(key) ? "left" : "center",
                sx: {
                  p: key === "sub_topic" ? "5px 8px" : "5px 16px",
                  whiteSpace: key === "sub_topic" ? "normal" : undefined,
                  wordBreak: key === "sub_topic" ? "break-word" : undefined,
                },
              };

              switch (key) {
                case "sub_topic":
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
                          {row.sub_topic}
                        </span>
                      </Box>
                    </TableCell>
                  );
                case "main_topic":
                  return (
                    <TableCell
                      align="left"
                      sx={{
                        p: "5px 16px",
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                      }}
                    >
                      <span className="text-[13px] font-normal font-sans">
                        {row.main_topic}
                      </span>
                    </TableCell>
                  );
                case "main_topic_overview":
                  return (
                    <OverviewCell key={key} text={row.main_topic_overview} />
                  );
                case "sub_topic_overview":
                  return (
                    <OverviewCell
                      key={key}
                      text={row.sub_topic_overview}
                      lines={4}
                      maxWidth={360}
                    />
                  );
                case "topic_type":
                  return (
                    <TableCell align="center" sx={{ p: "5px 16px" }}>
                      {row.topic_type ? (
                        <Tooltip
                          title={
                            funnelStageHelp[String(row.topic_type).toUpperCase()] ||
                            "Funnel Stage"
                          }
                          placement="top"
                          arrow
                        >
                          <span
                            className={`inline-flex px-2 pt-[2.5px] pb-[1.5px] text-xs font-medium rounded-lg ${getContentTypeColor(
                              row.topic_type
                            )}`}
                          >
                            {row.topic_type}
                          </span>
                        </Tooltip>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  );
                case "article_status":
                  return (
                    <ArticleStatusCell
                      key={key}
                      row={row}
                      getStatusColor={getStatusColor}
                      getStatusLabel={getStatusLabel}
                    />
                  );
                case "topic_sources":
                  return (
                    <SourcesCell
                      key={key}
                      items={row.topic_sources}
                      title="Topic Sources"
                    />
                  );
                case "sub_topic_sources":
                  return (
                    <SourcesCell
                      key={key}
                      items={row.sub_topic_sources}
                      title="Sub-Topic Sources"
                    />
                  );
                case "related_data":
                  return <RelatedDataCell key={key} items={row.related_data} />;
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
                case "createdAt":
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
                case "updatedAt":
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
                case "article":
                  return (
                    <CombinedTopicCell
                      key={key}
                      row={row}
                    />
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
