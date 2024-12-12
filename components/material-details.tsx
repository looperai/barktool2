import { Material } from "@/lib/database";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MaterialDetailsProps {
  material: Material | null;
}

export function MaterialDetails({ material }: MaterialDetailsProps) {
  if (!material) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Select a material to view details
      </div>
    );
  }

  const propertyGroups = [
    {
      title: "Basic Information",
      properties: [
        { label: "Material", value: material.material },
        { label: "ICE DB Name", value: material.iceDbName },
        { label: "Density (kg/m³)", value: material.density },
      ],
    },
    {
      title: "Environmental Impact",
      properties: [
        { 
          label: "Carbon intensity including biogenic carbon (kgCO2e/kg)", 
          value: material.ecfIncBiogenic 
        },
        { 
          label: "Biogenic carbon intensity (kgCO2e/kg)", 
          value: material.ecfBiogenic 
        },
        { label: "A4 Default", value: material.a4Default },
      ],
    },
    {
      title: "Lifecycle Properties",
      properties: [
        { label: "Lifespan (years)", value: material.lifespan },
        { label: "Waste Rate (%)", value: material.wasteRate },
        { label: "Thermal Conductivity (W/m.K)", value: material.thermalConductivity },
      ],
    },
    {
      title: "End of Life",
      properties: [
        { label: "Reuse (%)", value: material.eolReuse },
        { label: "Recycle (%)", value: material.eolRecycle },
        { label: "Incineration (%)", value: material.eolIncineration },
        { label: "Landfill (%)", value: material.eolLandfill },
      ],
    },
    {
      title: "Additional Properties",
      properties: [
        { label: "C3 (kgCO2e/kg)", value: material.c3 || "N/A" },
        { label: "C4 (kgCO2e/kg)", value: material.c4 || "N/A" },
        { label: "D1 (kgCO2e/kg)", value: material.d1 || "N/A" },
      ],
    },
  ];

  return (
    <div className="h-full p-6 overflow-auto">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b">
        <span className="text-lg font-semibold">Material Details</span>
      </div>
      <div className="grid gap-6">
        {propertyGroups.map((group) => (
          <Card key={group.title}>
            <CardHeader>
              <h3 className="text-lg font-medium">{group.title}</h3>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {group.properties.map((prop) => (
                  <div
                    key={prop.label}
                    className="grid grid-cols-2 gap-4 items-center"
                  >
                    <span className="text-sm font-medium text-muted-foreground">
                      {prop.label}
                    </span>
                    <span className="text-sm">
                      {typeof prop.value === "number"
                        ? prop.value.toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 4,
                          })
                        : prop.value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
