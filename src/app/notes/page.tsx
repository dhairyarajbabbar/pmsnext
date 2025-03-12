"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import "handsontable/dist/handsontable.full.css";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { registerAllModules } from "handsontable/registry";
import { HyperFormula } from "hyperformula";
import { Textarea } from "@/components/ui/textarea";
// import Handsontable from "handsontable";
import { HotTable, HotTableClass } from "@handsontable/react";
registerAllModules();

interface Condition {
  condition: string;
  text: string;
  showNumber: boolean;
}

export default function Page() {
  const hotRef = useRef<HotTableClass | null>(null);
  const initialColumns = [
    "TagNumber",
    "lineNumber",
    "boltAndNutMaterial",
    "sour",
    "toxic",
    "Notes",
  ];
  const hyperformulaInstance = HyperFormula.buildEmpty({
    licenseKey: "internal-use-in-handsontable",
  });

  const [columns, setColumns] = useState(initialColumns);
  const [data, setData] = useState(
    Array(100)
      .fill(null)
      .map(() => Array(columns.length).fill(""))
  );
  const [conditions, setConditions] = useState<Condition[]>([
    { condition: "", text: "", showNumber: true },
  ]);
  const [tempConditions, setTempConditions] = useState<Condition[]>([
    { condition: "", text: "", showNumber: true },
  ]);
  const isValidCondition = (condition: string): boolean => {
    if (!condition.trim()) return false;
    try {
      new Function(`return ${condition};`);
      return true;
    } catch {
      return false;
    }
  };

  const evaluateCondition = useCallback(
    (
      condition: string,
      rowData: Record<string, string | number | boolean | null>
    ): boolean => {
      if (!condition.trim()) return false;

      try {
        // Validate condition format first
        if (!isValidCondition(condition)) return false;

        // Create sanitized data with proper type conversion
        const sanitizedData = Object.fromEntries(
          Object.entries(rowData).map(([key, value]) => {
            // Convert string 'true'/'false' to actual booleans for condition evaluation
            if (typeof value === "string") {
              const lowerValue = value.toLowerCase().trim();
              if (lowerValue === "true") return [key, true];
              if (lowerValue === "false") return [key, false];
            }
            return [key, value];
          })
        );

        try {
          // Use Function constructor to evaluate the condition with additional safety
          const func = new Function(
            ...Object.keys(sanitizedData),
            `try { return ${condition}; } catch(e) { return false; }`
          );

          return Boolean(func(...Object.values(sanitizedData)));
        } catch {
          // If function creation or execution fails, return false
          return false;
        }
      } catch {
        // Log error but prevent it from crashing the app
        console.warn("Condition evaluation skipped:", condition);
        return false;
      }
    },
    []
  );

  const processTemplate = (
    template: string,
    rowData: Record<string, string | number | boolean | null>
  ): string => {
    return template.replace(/\{\$(\w+)\}/g, (_, key) => {
      return rowData[key] !== undefined ? String(rowData[key]) : `{$${key}}`;
    });
  };
  const toggleShowNumber = (index: number, value: boolean) => {
    const updatedConditions = [...conditions];
    updatedConditions[index].showNumber = value;
    setConditions(updatedConditions);

    const updatedTempConditions = [...tempConditions];
    updatedTempConditions[index].showNumber = value;
    setTempConditions(updatedTempConditions);
  };
  const updateNotes = useCallback(
    (tableData: string[][]): string[][] => {
      const headersMap: Record<string, number> = columns.reduce(
        (acc, col, index) => {
          acc[col] = index;
          return acc;
        },
        {} as Record<string, number>
      );

      return tableData.map((row) => {
        try {
          const rowData = Object.fromEntries(
            columns.map((col, index) => [col, row[index] || ""])
          );
          const noteLines: string[] = [];
          let noteIndex = 1;

          conditions.forEach(({ condition, text, showNumber }) => {
            try {
              const conditionMet = evaluateCondition(condition, rowData);

              if (conditionMet) {
                try {
                  const processedText = processTemplate(text, rowData);
                  const textLines = processedText.split("\n");

                  if (showNumber) {
                    const firstLine = `${noteIndex}. ${textLines[0]}`;
                    noteLines.push(firstLine);
                    if (textLines.length > 1) {
                      const padding = " ".repeat(
                        noteIndex.toString().length + 2
                      );
                      for (let i = 1; i < textLines.length; i++) {
                        noteLines.push(`${padding}${textLines[i]}`);
                      }
                    }
                    noteIndex++;
                  } else {
                    noteLines.push(...textLines);
                  }
                } catch {
                  noteLines.push(`Error processing template: ${text}`);
                }
              }
            } catch {
              console.warn("Skipping condition due to error:", condition);
            }
          });

          row[headersMap["Notes"]] = noteLines.join("\n");
        } catch (rowErr) {
          // If processing a row fails, leave the notes column unchanged
          console.warn("Error processing row:", rowErr);
        }
        return row;
      });
    },
    [columns, conditions, evaluateCondition]
  );

  useEffect(() => {
    setData((prevData) => updateNotes(prevData));
  }, [conditions, updateNotes]);

  const addCondition = () => {
    setConditions([
      ...conditions,
      { condition: "", text: "", showNumber: true },
    ]);
    setTempConditions([
      ...tempConditions,
      { condition: "", text: "", showNumber: true },
    ]);
  };

  const updateConditionTemp = (
    index: number,
    field: "condition" | "text",
    value: string
  ) => {
    const updatedTempConditions = [...tempConditions];
    updatedTempConditions[index][field] = value;
    setTempConditions(updatedTempConditions);
  };

  const updateCondition = (index: number, field: "condition" | "text") => {
    const value = tempConditions[index][field];

    if (field === "condition") {
      // For conditions, we'll still update even if invalid, but mark them
      const updatedConditions = [...conditions];
      updatedConditions[index][field] = value;
      setConditions(updatedConditions);
    } else {
      // For text, no validation needed - just update it
      const updatedConditions = [...conditions];
      updatedConditions[index][field] = value;
      setConditions(updatedConditions);
    }
  };

  const validateCondition = (
    condition: string
  ): { isValid: boolean; message: string } => {
    if (!condition.trim()) {
      return { isValid: false, message: "Empty condition" };
    }

    try {
      new Function(`return ${condition};`);
      return { isValid: true, message: "Valid condition" };
    } catch {
      return {
        isValid: false,
        message: "Invalid syntax",
      };
    }
  };

  const renderConditionInput = (cond: Condition, index: number) => {
    const validation = validateCondition(cond.condition);

    return (
      <div className="relative w-2/3">
        <Input
          className={`w-full ${
            !validation.isValid && cond.condition.trim() ? "border-red-500" : ""
          }`}
          type="text"
          placeholder="Condition (e.g., sour && toxic)"
          value={cond.condition}
          onChange={(e) =>
            updateConditionTemp(index, "condition", e.target.value)
          }
          onBlur={() => updateCondition(index, "condition")}
        />
        {!validation.isValid && cond.condition.trim() && (
          <div className="text-xs text-red-500 mt-1">{validation.message}</div>
        )}
      </div>
    );
  };
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Dynamic Notes in Spreadsheet</h1>
      <HotTable
        ref={hotRef}
        data={data}
        colHeaders={columns}
        rowHeaders={true}
        contextMenu={{
          items: {
            row_above: {},
            row_below: {},
            col_left: {},
            col_right: {},
            remove_col: {},
            remove_row: {},
            separator1: "---------",
            filter_by_condition: {}, // Enables filtering
            filter_action_bar: {}, // Shows the "OK" and "Cancel" buttons in filter UI
          },
        }}
        manualColumnResize={true}
        manualRowResize={true}
        stretchH="all"
        height="600px"
        colWidths={columns.map(() => 200)}
        copyPaste={true}
        allowInsertColumn={true}
        allowInsertRow={true}
        dropdownMenu={true}
        filters={true}
        columnSorting={true}
        formulas={{
          engine: hyperformulaInstance,
        }}
        afterChange={(changes) => {
          if (!changes) return;
          const newData = [...data];
          changes.forEach(([row, col, oldValue, newValue]) => {
            if (newValue !== oldValue) {
              newData[row][col as number] = newValue;
            }
          });
          setData(updateNotes(newData));
        }}
        cells={() => {
          return { className: "htMiddle htCenter" };
        }}
        afterCreateCol={(index, amount) => {
          setColumns((prevColumns) => {
            const newColumns = [...prevColumns];
            for (let i = 0; i < amount; i++) {
              newColumns.splice(index + i, 0, `Column ${index + i + 1}`);
            }
            return newColumns.slice(0, prevColumns.length + amount); // Prevent extra columns
          });
          setData((prevData) =>
            prevData.map((row) => {
              const newRow = [...row];
              // Insert empty values for the new column at the correct index
              for (let i = 0; i < amount; i++) {
                newRow.splice(index + i, 0, "");
              }
              return newRow;
            })
          );
          setTimeout(() => {
            hotRef.current?.hotInstance?.render();
          }, 10); 
        }}
        afterGetColHeader={(col, TH) => {
          if (col >= 0) {
            // Remove old custom header to prevent duplicates
            const existingContainer = TH.querySelector(".custom-header");
            if (existingContainer) {
              existingContainer.remove();
            }
            // Create a container div for inline editing
            const container = document.createElement("div");
            container.className =
              "custom-header flex items-center justify-center w-full px-4 relative";
            // Create a span for the default header text (visible by default)
            const headerText = document.createElement("span");
            headerText.textContent = columns[col]; // Always use the latest column name
            headerText.className =
              "cursor-pointer text-center w-full font-semibold";
            // Create an input field (hidden initially)
            const input = document.createElement("input");
            input.type = "text";
            input.value = columns[col];
            input.className = "w-full p-1 text-center border border-gray-300 rounded-md hidden";
            // Prevent Handsontable from interfering with input focus
            input.addEventListener("keydown", (event) => {
              event.stopPropagation(); // Stops Handsontable from hijacking input
            });
            // Function to save the edited column name
            const saveColumnName = () => {
              const newValue = input.value.trim();
              if (newValue && newValue !== columns[col]) {
                setColumns((prevColumns) => {
                  const updatedColumns = [...prevColumns];
                  updatedColumns[col] = newValue;
                  return updatedColumns;
                });
                // Manually trigger Handsontable header update
                setTimeout(() => {
                  hotRef.current?.hotInstance?.render();
                }, 10);             
              }
              input.classList.add("hidden"); // Hide input field
              headerText.classList.remove("hidden"); // Show text
            };

            // Handle double-click to switch to edit mode
            headerText.ondblclick = (event) => {
              event.stopPropagation(); // Prevent interference with sorting
              input.classList.remove("hidden"); // Show input field
              headerText.classList.add("hidden"); // Hide text
              input.focus();
              input.select();
            };
            // Handle input blur (click outside)
            input.onblur = saveColumnName;
            // Handle Enter key press to save
            input.onkeydown = (event) => {
              if (event.key === "Enter") {
                event.preventDefault(); // Prevent form submission behavior
                saveColumnName();
              }
            };

            // Create an invisible spacer to align text with dropdown
            const dropdownSpacer = document.createElement("span");
            dropdownSpacer.className = "absolute right-2 w-6 h-full";

            // Append elements
            container.appendChild(headerText);
            container.appendChild(input);
            container.appendChild(dropdownSpacer); // Adds space for dropdown
            TH.appendChild(container);
          }
        }}
        licenseKey="non-commercial-and-evaluation"
      />
      <div className="mt-4 w-full space-y-2">
        <label className="block text-lg font-medium">
          Define Note Conditions:
        </label>
        {tempConditions.map((cond, index) => (
          <div key={index} className="flex flex-col gap-2">
            <div className="flex gap-2 items-center">
              {renderConditionInput(cond, index)}
              <div className="flex items-center gap-2 w-1/3">
                <label className="whitespace-nowrap">Show Numbering:</label>
                <select
                  className="p-2 border rounded"
                  value={cond.showNumber ? "true" : "false"}
                  onChange={(e) =>
                    toggleShowNumber(index, e.target.value === "true")
                  }
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>
            <Textarea
              className="w-full min-h-[100px]"
              placeholder="Text to display (use {$columnName} for dynamic values, press Enter for new lines)"
              value={cond.text}
              onChange={(e) =>
                updateConditionTemp(index, "text", e.target.value)
              }
              onBlur={() => updateCondition(index, "text")}
            />
            <hr className="my-2" />
          </div>
        ))}
        <Button onClick={addCondition}>Add Condition</Button>
      </div>
    </div>
  );
}
