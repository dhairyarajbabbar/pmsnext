"use client";
// import "../../envconfig.ts";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Define the expected structure of the class data
interface SizeRange {
  minSize: number;
  maxSize: number;
}

interface Pipe {
  materialDescription: string;
  sizeRange: SizeRange;
}

interface ClassData {
  className: string;
  corrosionAllowance: string;
  basicMaterial: string;
  pipe?: Pipe[];
}

interface TableRowData {
  className: string;
  size: string;
  data?: ClassData | null;
  loading: boolean;
}

export default function Home() {
  const [rows, setRows] = useState<TableRowData[]>([
    { className: "", size: "", data: null, loading: false },
  ]);

  // Function to fetch class data based on class name and size
  const fetchData = async (index: number) => {
    const row = rows[index];
    if (!row.className) return alert("Enter Class Name");

    setRows((prevRows) =>
      prevRows.map((r, i) =>
        i === index ? { ...r, loading: true } : r
      )
    );

    try {
      // const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      // console.log("BACKEND URL", process.env.BACKENDURL, apiUrl);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKENDURL}class/?className=${row.className}`
      );
      const data: ClassData = await response.json();

      setRows((prevRows) =>
        prevRows.map((r, i) =>
          i === index ? { ...r, data, loading: false } : r
        )
      );
    } catch (error) {
      console.error("Error fetching class data:", error);
      setRows((prevRows) =>
        prevRows.map((r, i) =>
          i === index ? { ...r, loading: false } : r
        )
      );
    }
  };

  // Function to add a new row
  const addRow = () => {
    setRows([...rows, { className: "", size: "", data: null, loading: false }]);
  };

  return (
    <div className="grid grid-rows-[auto_1fr_auto] items-center justify-items-center min-h-screen p-8 pb-20 gap-6 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <Table>
        <TableCaption>Piping Material Specification Management</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">Class Name</TableHead>
            <TableHead className="w-[100px]">Size</TableHead>
            <TableHead>Corrosion Allowance</TableHead>
            <TableHead>Basic Material</TableHead>
            <TableHead>Pipe Material</TableHead>
            <TableHead className="text-center">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={index}>
              {/* Input for Class Name */}
              <TableCell>
                <Input
                  value={row.className}
                  onChange={(e) => {
                    const newRows = [...rows];
                    newRows[index].className = e.target.value;
                    setRows(newRows);
                  }}
                  placeholder="Enter Class"
                />
              </TableCell>

              {/* Input for Size */}
              <TableCell>
                <Input
                  value={row.size}
                  onChange={(e) => {
                    const newRows = [...rows];
                    newRows[index].size = e.target.value;
                    setRows(newRows);
                  }}
                  placeholder="Enter Size"
                />
              </TableCell>

              {/* Fetched Data Columns */}
              <TableCell>{row.data?.corrosionAllowance ?? "-"}</TableCell>
              <TableCell>{row.data?.basicMaterial ?? "-"}</TableCell>
              <TableCell>
                {row.data?.pipe?.[0]?.materialDescription ?? "-"}
              </TableCell>

              {/* Fetch Button */}
              <TableCell className="text-center">
                <Button
                  onClick={() => fetchData(index)}
                  disabled={row.loading}
                >
                  {row.loading ? "Loading..." : "Fetch"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Button to Add More Rows */}
      <Button onClick={addRow} className="mt-4">
        Add Row
      </Button>
    </div>
  );
}
