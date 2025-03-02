"use client";

import { useState, ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

// Define types for materials

interface SizeRange {
  minSize: number;
  maxSize: number;
}

interface MaterialItem {
  shortCode: string;
  sizeRange: SizeRange;
  ends: string;
  scheduleOrRating: string;
  materialDescription: string;
  note: string;
  remark: string;
  isDefault: boolean;
}

type MaterialData = Record<string, MaterialItem[]>;

// Define types for form data
interface ClassFormData {
  className: string;
  basicMaterial: string;
  corrosionAllowance: string;
  branchCode: string;
  reducerCode: string;
  PWHT: boolean;
  designCode: string;
  flangeCode: string;
  flangeRating: string;
  maxAllowableWorkingPressure: string;
  materials: MaterialData;
}

// List of material types
const materialTypes = [
  "pipe",
  "nipple",
  "fittings",
  "plug",
  "flange",
  "gasket",
  "bolt",
  "nut",
] as const; // ✅ `as const` makes it readonly & ensures type safety

export default function ClassForm() {
  const [formData, setFormData] = useState<ClassFormData>({
    className: "",
    basicMaterial: "",
    corrosionAllowance: "",
    branchCode: "",
    reducerCode: "",
    PWHT: false,
    designCode: "",
    flangeCode: "",
    flangeRating: "",
    maxAllowableWorkingPressure: "",
    materials: {},
  });
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleMaterialChange = (
    type: string,
    index: number,
    field: keyof MaterialItem | "sizeRangeMin" | "sizeRangeMax",
    value: string | boolean | number
  ) => {
    setFormData((prev) => {
      const updatedMaterials = { ...prev.materials };

      if (!updatedMaterials[type]) updatedMaterials[type] = [];

      if (!updatedMaterials[type][index]) {
        updatedMaterials[type][index] = {
          shortCode: "",
          sizeRange: { minSize: 0.125, maxSize: 60 },
          ends: "",
          scheduleOrRating: "",
          materialDescription: "",
          note: "",
          remark: "",
          isDefault: false,
        };
      }

      if (field === "sizeRangeMin" || field === "sizeRangeMax") {
        updatedMaterials[type][index].sizeRange = {
          ...updatedMaterials[type][index].sizeRange,
          [field === "sizeRangeMin" ? "minSize" : "maxSize"]: value as number,
        };
      } else {
        updatedMaterials[type][index][field as keyof MaterialItem] =
          value as never;
      }

      return { ...prev, materials: updatedMaterials };
    });
  };

  return (
    <div className="p-4 grid gap-4">
      <Card>
        <CardContent className="p-4 space-y-2">
          <Label>Class Name</Label>
          <Input
            name="className"
            value={formData.className}
            onChange={handleChange}
          />
          <Label>Basic Material</Label>
          <Input
            name="basicMaterial"
            value={formData.basicMaterial}
            onChange={handleChange}
          />
          <Label>Corrosion Allowance</Label>
          <Input
            name="corrosionAllowance"
            type="number"
            value={formData.corrosionAllowance}
            onChange={handleChange}
          />
          <Label>Branch Code</Label>
          <Input
            name="branchCode"
            value={formData.branchCode}
            onChange={handleChange}
          />
          <Label>Reducer Code</Label>
          <Input
            name="reducerCode"
            value={formData.reducerCode}
            onChange={handleChange}
          />
          <Label>PWHT</Label>
          <input
            type="checkbox"
            name="PWHT"
            checked={formData.PWHT}
            onChange={handleChange}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-2">
          {materialTypes.map((type) => (
            <div key={type}>
              <h3 className="text-lg font-semibold capitalize">{type}</h3>
              {[0].map((_, index) => (
                <div
                  key={index}
                  className="grid grid-cols-2 gap-2 border p-2 rounded-lg"
                >
                  <Input
                    placeholder="Short Code"
                    onChange={(e) =>
                      handleMaterialChange(
                        type,
                        index,
                        "shortCode",
                        e.target.value
                      )
                    }
                  />
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      placeholder="Min Size"
                      onChange={(e) =>
                        handleMaterialChange(
                          type,
                          index,
                          "sizeRangeMin",
                          Number(e.target.value)
                        )
                      }
                    />
                    <Input
                      type="number"
                      placeholder="Max Size"
                      onChange={(e) =>
                        handleMaterialChange(
                          type,
                          index,
                          "sizeRangeMax",
                          Number(e.target.value)
                        )
                      }
                    />
                  </div>
                  <Input
                    placeholder="Ends"
                    onChange={(e) =>
                      handleMaterialChange(type, index, "ends", e.target.value)
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Schedule or Rating"
                    onChange={(e) =>
                      handleMaterialChange(
                        type,
                        index,
                        "scheduleOrRating",
                        e.target.value
                      )
                    }
                  />
                  <Input
                    placeholder="Material Description"
                    onChange={(e) =>
                      handleMaterialChange(
                        type,
                        index,
                        "materialDescription",
                        e.target.value
                      )
                    }
                  />
                  <Input
                    placeholder="Note"
                    onChange={(e) =>
                      handleMaterialChange(type, index, "note", e.target.value)
                    }
                  />
                  <Input
                    placeholder="Remark"
                    onChange={(e) =>
                      handleMaterialChange(
                        type,
                        index,
                        "remark",
                        e.target.value
                      )
                    }
                  />
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      onChange={(e) =>
                        handleMaterialChange(
                          type,
                          index,
                          "isDefault",
                          e.target.checked
                        )
                      }
                    />
                    <Label>Default</Label>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>
      <Button className="col-span-2" onClick={() => console.log(formData)}>
        Submit
      </Button>
    </div>
  );
}
