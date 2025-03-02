"use client";

import { useState, ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

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
] as const;

// Create a default material item
const createDefaultItem = (isDefault = true): MaterialItem => ({
  shortCode: "",
  sizeRange: { minSize: 0.5, maxSize: 60 },
  ends: "",
  scheduleOrRating: "",
  materialDescription: "",
  note: "",
  remark: "",
  isDefault: isDefault,
});

export default function ClassForm() {
  // Initialize with default material items for each type
  const initialMaterials: MaterialData = {};
  materialTypes.forEach(type => {
    initialMaterials[type] = [createDefaultItem(true)];
  });

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
    materials: initialMaterials,
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
        updatedMaterials[type][index] = createDefaultItem(false);
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

      // If setting isDefault to true, set all others to false
      if (field === "isDefault" && value === true) {
        updatedMaterials[type].forEach((item, i) => {
          if (i !== index) {
            item.isDefault = false;
          }
        });
      }

      return { ...prev, materials: updatedMaterials };
    });
  };

  // Add new material entry
  const addMaterialEntry = (type: string) => {
    setFormData((prev) => {
      const updatedMaterials = { ...prev.materials };
      
      if (!updatedMaterials[type]) {
        updatedMaterials[type] = [];
      }
      
      updatedMaterials[type].push(createDefaultItem(false));
      
      return { ...prev, materials: updatedMaterials };
    });
  };

  // Remove material entry
  const removeMaterialEntry = (type: string, index: number) => {
    setFormData((prev) => {
      const updatedMaterials = { ...prev.materials };
      
      if (updatedMaterials[type] && updatedMaterials[type].length > index) {
        const wasDefault = updatedMaterials[type][index].isDefault;
        updatedMaterials[type].splice(index, 1);
        if (wasDefault && updatedMaterials[type].length > 0) {
          updatedMaterials[type][0].isDefault = true;
        }
      }
      
      return { ...prev, materials: updatedMaterials };
    });
  };

  return (
    <div className="p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Details</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="className">Class Name</Label>
            <Input
              id="className"
              name="className"
              value={formData.className}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="basicMaterial">Basic Material</Label>
            <Input
              id="basicMaterial"
              name="basicMaterial"
              value={formData.basicMaterial}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="corrosionAllowance">Corrosion Allowance</Label>
            <Input
              id="corrosionAllowance"
              name="corrosionAllowance"
              type="number"
              value={formData.corrosionAllowance}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="branchCode">Branch Code</Label>
            <Input
              id="branchCode"
              name="branchCode"
              value={formData.branchCode}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reducerCode">Reducer Code</Label>
            <Input
              id="reducerCode"
              name="reducerCode"
              value={formData.reducerCode}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="designCode">Design Code</Label>
            <Input
              id="designCode"
              name="designCode"
              value={formData.designCode}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="flangeCode">Flange Code</Label>
            <Input
              id="flangeCode"
              name="flangeCode"
              value={formData.flangeCode}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="flangeRating">Flange Rating</Label>
            <Input
              id="flangeRating"
              name="flangeRating"
              value={formData.flangeRating}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxAllowableWorkingPressure">Max Allowable Working Pressure</Label>
            <Input
              id="maxAllowableWorkingPressure"
              name="maxAllowableWorkingPressure"
              value={formData.maxAllowableWorkingPressure}
              onChange={handleChange}
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="PWHT"
              name="PWHT"
              checked={formData.PWHT}
              onChange={handleChange}
            />
            <Label htmlFor="PWHT">PWHT</Label>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Material Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {materialTypes.map((type) => (
            <div key={type} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold capitalize">{type}</h3>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => addMaterialEntry(type)}
                  className="flex items-center"
                >
                  <Plus size={16} className="mr-1" /> Add {type}
                </Button>
              </div>
              
              {formData.materials[type]?.map((item, index) => (
                <div
                  key={index}
                  className="mb-4 border p-4 rounded-lg space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">{type} Item {index + 1}</h4>
                    {formData.materials[type].length > 1 && (
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => removeMaterialEntry(type, index)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Short Code</Label>
                      <Input
                        placeholder="Short Code"
                        value={item.shortCode || ""}
                        onChange={(e) =>
                          handleMaterialChange(
                            type,
                            index,
                            "shortCode",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Size Range</Label>
                      <div className="flex space-x-2">
                        <Input
                          type="number"
                          placeholder="Min Size"
                          value={item.sizeRange.minSize}
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
                          value={item.sizeRange.maxSize}
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
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Ends</Label>
                      <Input
                        placeholder="Ends"
                        value={item.ends || ""}
                        onChange={(e) =>
                          handleMaterialChange(type, index, "ends", e.target.value)
                        }
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Schedule or Rating</Label>
                      <Input
                        placeholder="Schedule or Rating"
                        value={item.scheduleOrRating || ""}
                        onChange={(e) =>
                          handleMaterialChange(
                            type,
                            index,
                            "scheduleOrRating",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Material Description</Label>
                      <Input
                        placeholder="Material Description"
                        value={item.materialDescription || ""}
                        onChange={(e) =>
                          handleMaterialChange(
                            type,
                            index,
                            "materialDescription",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Note</Label>
                      <Input
                        placeholder="Note"
                        value={item.note || ""}
                        onChange={(e) =>
                          handleMaterialChange(type, index, "note", e.target.value)
                        }
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Remark</Label>
                      <Input
                        placeholder="Remark"
                        value={item.remark || ""}
                        onChange={(e) =>
                          handleMaterialChange(
                            type,
                            index,
                            "remark",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={item.isDefault || false}
                        onChange={(e) =>
                          handleMaterialChange(
                            type,
                            index,
                            "isDefault",
                            e.target.checked
                          )
                        }
                        id={`default-${type}-${index}`}
                      />
                      <Label htmlFor={`default-${type}-${index}`}>Default</Label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>
      
      <Button className="w-full" onClick={() => console.log(formData)}>
        Submit
      </Button>
    </div>
  );
}