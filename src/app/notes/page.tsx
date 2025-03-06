"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import "handsontable/dist/handsontable.full.css";
import { HotTable } from "@handsontable/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { registerAllModules } from "handsontable/registry";

registerAllModules();

export default function Page() {
  const hotRef = useRef(null);
  const initialColumns = [
    "TagNumber",
    "lineNumber",
    "boltAndNutMaterial",
    "sour",
    "toxic",
    "Notes",
  ];

  const [columns, setColumns] = useState(initialColumns);
  const [data, setData] = useState(
    Array(100)
      .fill(null)
      .map(() => Array(columns.length).fill(""))
  );
  const [conditions, setConditions] = useState([{ condition: "", text: "" }]);
  const [tempConditions, setTempConditions] = useState([
    { condition: "", text: "" },
  ]);

  const convertToBoolean = (value: unknown): boolean => {
    if (typeof value === "string") {
      const lowerVal = value.trim().toLowerCase();
      return lowerVal === "true" || lowerVal === "1";
    }
    return Boolean(value);
  };

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
      try {
        if (!isValidCondition(condition)) return false;
        const sanitizedData = Object.fromEntries(
          Object.entries(rowData).map(([key, value]) => [
            key,
            convertToBoolean(value),
          ])
        );
        const func = new Function(
          ...Object.keys(sanitizedData),
          `return ${condition};`
        );
        return func(...Object.values(sanitizedData));
      } catch (error) {
        console.error("Invalid condition:", condition, "Error:", error);
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
      return rowData[key] !== undefined ? `${String(rowData[key])}` : `{$${key}}`;
    });
  };  
  

  const updateNotes = useCallback((tableData: string[][]): string[][] => {
    const headersMap: Record<string, number> = columns.reduce(
      (acc, col, index) => {
        acc[col] = index;
        return acc;
      },
      {} as Record<string, number>
    );
  
    return tableData.map((row) => {
      const rowData = Object.fromEntries(
        columns.map((col, index) => [col, row[index] || ""])
      );
      let note = '';
  
      conditions.forEach(({ condition, text }) => {
        if (evaluateCondition(condition, rowData)) {
          note += (note ? "\n" : "") + processTemplate(text, rowData);
        }
      });
  
      row[headersMap["Notes"]] = note;
      return row;
    });
  }, [columns, conditions, evaluateCondition]);  // ✅ Add dependencies
  

  useEffect(() => {
    setData((prevData) => updateNotes(prevData));
  }, [conditions, updateNotes]);

  const addColumn = () => {
    setColumns((prevColumns) => {
      const newColumn = `Column ${prevColumns.length + 1}`;
      return [
        ...prevColumns.slice(0, -1),
        newColumn,
        prevColumns[prevColumns.length - 1],
      ];
    });
    setData((prevData) =>
      prevData.map((row) => [...row.slice(0, -1), "", row[row.length - 1]])
    );
  };

  const editColumnHeader = (index: number, newHeader: string) => {
    setColumns((prevColumns) => {
      const updatedColumns = [...prevColumns];
      updatedColumns[index] = newHeader;
      return updatedColumns;
    });
  };

  const addCondition = () => {
    setConditions([...conditions, { condition: "", text: "" }]);
    setTempConditions([...tempConditions, { condition: "", text: "" }]);
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
    if (isValidCondition(value)) {
      const updatedConditions = [...conditions];
      updatedConditions[index][field] = value;
      setConditions(updatedConditions);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Dynamic Notes in Spreadsheet</h1>
      <Button onClick={addColumn}>Add Column</Button>

      <HotTable
        ref={hotRef}
        data={data}
        colHeaders={columns}
        rowHeaders={true}
        contextMenu={true}
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
        afterGetColHeader={(col, TH) => {
          if (col >= 0) {
            if (TH.querySelector("input")) return;
            const input = document.createElement("input");
            input.type = "text";
            input.value = columns[col];
            input.className = "w-full p-1 text-center border border-gray-300";
            input.onchange = (e) => editColumnHeader(col, (e.target as HTMLInputElement).value);
            TH.appendChild(input);
          }
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
        licenseKey="non-commercial-and-evaluation"
      />

      <div className="mt-4 w-full space-y-2">
        <label className="block text-lg font-medium">
          Define Note Conditions:
        </label>
        {tempConditions.map((cond, index) => (
          <div key={index} className="flex gap-2">
            <Input
              className="w-1/2"
              type="text"
              placeholder="Condition (e.g., sour && toxic)"
              value={cond.condition}
              onChange={(e) =>
                updateConditionTemp(index, "condition", e.target.value)
              }
              onBlur={() => updateCondition(index, "condition")}
            />
            <Input
              className="w-1/2"
              type="text"
              placeholder="Text to display (use {$columnName} for dynamic values)"
              value={cond.text}
              onChange={(e) =>
                updateConditionTemp(index, "text", e.target.value)
              }
              onBlur={() => updateCondition(index, "text")}
            />
          </div>
        ))}
        <Button onClick={addCondition}>Add Condition</Button>
      </div>
    </div>
  );
}