"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { HotTable } from "@handsontable/react";
import "handsontable/dist/handsontable.full.css";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectContent,
  SelectValue,
} from "@/components/ui/select";
import { registerAllModules } from "handsontable/registry";
import { Button } from "@/components/ui/button";
import type { HotTableClass } from "@handsontable/react";

registerAllModules();

export default function Home() {
  const hotRef = useRef<HotTableClass | null>(null);
  const [dynamicColumn, setDynamicColumn] = useState("corrosionAllowance");
  const [category, setCategory] = useState("pipe");
  const [detailProperty, setDetailProperty] = useState("shortCode");
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [tableData, setTableData] = useState<string[][]>(
    Array.from({ length: 100 }, () => ["", "", "", "", ""])
  );

  const properties = [
    "corrosionAllowance",
    "basicMaterial",
    "sourService",
    "rating",
    "branchCode",
    "reducerCode",
    "PWHT",
    "designCode",
    "flangeCode",
    "flangeRating",
    "maxAllowableWorkingPressure",
  ];

  const categories = [
    "pipe",
    "nipple",
    "fittings",
    "plug",
    "flange",
    "gasket",
    "bolt",
    "nut",
  ];

  const detailProperties = [
    "shortCode",
    "sizeRange",
    "ends",
    "scheduleOrRating",
    "materialDescription",
    "note",
    "remark",
  ];

  const fetchDynamicProperty = useCallback(async () => {
    const hotInstance = hotRef.current?.hotInstance;
    if (!hotInstance) return;

    const data = hotInstance.getData() as string[][];

    const requests = data.map(async (row: string[], index: number) => {
      const className = row[0];
      const size = row[1];
      if (!className || !size) return;

      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKENDURL;
        if (!backendUrl) {
          console.error("Backend URL is not defined");
          return;
        }

        const [response, response1] = await Promise.all([
          fetch(
            `${backendUrl}class/${className}/property/${dynamicColumn}?size=${size}`
          ),
          fetch(
            `${backendUrl}class/${className}/property/${category}?size=${size}`
          ),
        ]);

        if (!response.ok || !response1.ok) {
          console.error(
            "Failed to fetch data:",
            response.status,
            response1.status
          );
          return;
        }

        const dynamicValue = await response.json();
        const categoryValue = await response1.json();

        const categoryData = categoryValue?.value || {};
        const selectedDetail = categoryData?.[detailProperty] || "N/A";

        setTableData((prevData) => {
          const newData = [...prevData];
          newData[index] = [
            className,
            size,
            JSON.stringify(dynamicValue) || "N/A",
            selectedDetail,
            prevData[index][4] || "",
          ];
          return newData;
        });

        hotInstance.setDataAtCell(index, 2, JSON.stringify(dynamicValue) || "N/A");
        hotInstance.setDataAtCell(index, 3, selectedDetail);
      } catch (error) {
        console.error("Error fetching dynamic property:", error);
      }
    });

    await Promise.all(requests);
  }, [dynamicColumn, category, detailProperty]); // ✅ Proper dependencies

  // ✅ UseEffect now correctly tracks fetchDynamicProperty
  useEffect(() => {
    fetchDynamicProperty();
  }, [fetchDynamicProperty]);

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center p-8 pb-20 gap-6 sm:p-20">
      <div className="flex gap-4 mb-4 w-full max-w-4xl">
        <Select value={dynamicColumn} onValueChange={setDynamicColumn}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select Property" />
          </SelectTrigger>
          <SelectContent>
            {properties.map((prop) => (
              <SelectItem key={prop} value={prop}>
                {prop}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={detailProperty} onValueChange={setDetailProperty}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select Detail Property" />
          </SelectTrigger>
          <SelectContent>
            {detailProperties.map((detail) => (
              <SelectItem key={detail} value={detail}>
                {detail}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full max-w-6xl h-[600px] overflow-auto border border-gray-300 rounded-lg">
        <HotTable
          ref={hotRef}
          data={tableData}
          colHeaders={[
            "Class Name",
            "Size",
            "Dynamic Data 1",
            "Dynamic Data 2",
            "Actions",
          ]}
          rowHeaders={true}
          contextMenu={true}
          manualColumnResize={true}
          manualRowResize={true}
          stretchH="all"
          height="600px"
          colWidths={[200, 150, 250, 250, 200]}
          copyPaste={true}
          allowInsertColumn={true}
          allowInsertRow={true}
          dropdownMenu={true}
          filters={true}
          columnSorting={true}
          afterChange={(changes) => {
            if (!changes) return;
            const newData = [...tableData];
            let shouldFetch = false;
            changes.forEach(([row, col, oldValue, newValue]) => {
              if (typeof col === "number") {
                if (newValue !== oldValue) {
                  newData[row][col] = newValue;

                  if (col === 0 || col === 1) {
                    shouldFetch = true;
                  }
                }
              }
            });
            setTableData(newData);

            if (shouldFetch) {
              if (fetchTimeoutRef.current)
                clearTimeout(fetchTimeoutRef.current);
              fetchTimeoutRef.current = setTimeout(() => {
                fetchDynamicProperty();
              });
            }
          }}
          cells={() => {
            return { className: "htMiddle htCenter" };
          }}
          licenseKey="non-commercial-and-evaluation"
        />
      </div>

      <div>
        <Button onClick={fetchDynamicProperty}>Fetch Data</Button>
      </div>
    </div>
  );
}
