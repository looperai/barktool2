"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { nrmData, type NRMElement } from "@/lib/nrm-data"
import { useCreateProjectStore } from "@/lib/stores/create-project-store"
import type { Project, BuildingElement } from "./app-sidebar"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

// Import CreateProjectState type
import type { CreateProjectState } from "@/lib/stores/create-project-store"

// Define valid field names for each step
type StepFields = {
  1: ['name', 'code', 'address', 'typology', 'stage', 'yearOfCompletion']
  2: ['giaDemolition', 'giaNewbuild', 'giaRetrofit', 'hasDigitalModel', 'hasBimModel', 'hasBillOfQuantities']
  3: ['buildingElements']
  4: ['hasEnergyModelling']
}

const steps = [
  { id: 1, name: "General Information" },
  { id: 2, name: "Building Information" },
  { id: 3, name: "Building Element Information" },
  { id: 4, name: "Operational Information" },
] as const

interface BuildUp {
  id: string
  name: string
}

interface CreateProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: Omit<Project, "id" | "versions"> & { buildingElements?: Record<string, BuildingElement> }) => void
}

// Define form schema
const formSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  code: z.string().min(1, "Project code is required"),
  address: z.string().min(1, "Project address is required"),
  typology: z.enum(["Residential", "Fit-out"]),
  stage: z.enum(["RIBA Stage 1", "RIBA Stage 2", "RIBA Stage 3"]),
  yearOfCompletion: z.number().min(2000).max(2100),
  giaDemolition: z.number(),
  giaNewbuild: z.number(),
  giaRetrofit: z.number(),
  hasDigitalModel: z.enum(["Y", "N"]),
  hasBimModel: z.enum(["Y", "N"]),
  hasBillOfQuantities: z.enum(["Y", "N"]),
  hasEnergyModelling: z.enum(["Y", "N"]),
})

export function CreateProjectModal({
  open,
  onOpenChange,
  onSubmit,
}: CreateProjectModalProps) {
  const store = useCreateProjectStore()
  const [buildUps, setBuildUps] = useState<BuildUp[]>([])

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      code: "",
      address: "",
      yearOfCompletion: new Date().getFullYear(),
      giaDemolition: 0,
      giaNewbuild: 0,
      giaRetrofit: 0,
    },
  })

  // Reset store when modal is closed
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      store.reset()
      form.reset()
    }
    onOpenChange(open)
  }

  useEffect(() => {
    // Load build-ups from localStorage
    const savedBuildUps = JSON.parse(localStorage.getItem('buildUps') || '[]')
    setBuildUps(savedBuildUps)
  }, [])

  useEffect(() => {
    // Initialize building elements from NRM data
    store.initializeBuildingElements(nrmData)
  }, [])

  const renderBuildingElements = (elements: NRMElement | Record<string, never>, parentId: string = "") => {
    return Object.entries(elements).map(([key, value]) => {
      const elementId = parentId ? `${parentId}-${key}` : key
      const hasChildren = typeof value === 'object' && Object.keys(value).length > 0
      const isExpanded = store.expandedElements.has(elementId)
      const hierarchyLevel = elementId.split('-').length
      
      // Calculate vertical spacing based on hierarchy level
      const getVerticalSpacing = () => {
        switch (hierarchyLevel) {
          case 1: return 'py-3' // Top level items (1, 2, 3)
          case 2: return 'py-2' // Second level items (1.1, 1.2, etc)
          default: return 'py-1' // Third level and deeper
        }
      }

      return (
        <div key={elementId}>
          <div className={cn(
            "grid grid-cols-[minmax(300px,2fr),1fr,1fr,1fr,2fr] gap-4 items-center hover:bg-muted/50",
            getVerticalSpacing()
          )}>
            <div className="flex items-center gap-2 pl-4">
              {hasChildren && (
                <button
                  type="button"
                  onClick={() => store.toggleExpandedElement(elementId)}
                  className="text-sm"
                >
                  {isExpanded ? "▼" : "▶"}
                </button>
              )}
              <span className={cn(
                "text-sm",
                hierarchyLevel === 1 && "font-medium"
              )}>{key}</span>
            </div>
            {!hasChildren ? (
              <>
                <Input
                  type="number"
                  placeholder="Width"
                  value={store.buildingElements[elementId]?.width ?? ''}
                  onChange={(e) => {
                    const value = e.target.value
                    const numValue = value === '' ? null : Number(value)
                    store.updateBuildingElement(elementId, { width: numValue })
                  }}
                />
                <Input
                  type="number"
                  placeholder="Length"
                  value={store.buildingElements[elementId]?.length ?? ''}
                  onChange={(e) => {
                    const value = e.target.value
                    const numValue = value === '' ? null : Number(value)
                    store.updateBuildingElement(elementId, { length: numValue })
                  }}
                />
                <Input
                  type="number"
                  placeholder="Area"
                  value={store.buildingElements[elementId]?.area ?? ''}
                  onChange={(e) => {
                    const value = e.target.value
                    const numValue = value === '' ? null : Number(value)
                    store.updateBuildingElement(elementId, { area: numValue })
                  }}
                />
                <Select
                  value={store.buildingElements[elementId]?.buildupId}
                  onValueChange={(value) => store.updateBuildingElement(elementId, { buildupId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select build-up" />
                  </SelectTrigger>
                  <SelectContent>
                    {buildUps.map((buildup) => (
                      <SelectItem key={buildup.id} value={buildup.id}>
                        {buildup.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            ) : (
              <div className="col-span-4" />
            )}
          </div>
          {hasChildren && isExpanded && (
            <div className="ml-4">
              {renderBuildingElements(value, elementId)}
            </div>
          )}
        </div>
      )
    })
  }

  // Validate current step
  const validateCurrentStep = () => {
    const stepFields: StepFields = {
      1: ['name', 'code', 'address', 'typology', 'stage', 'yearOfCompletion'],
      2: ['giaDemolition', 'giaNewbuild', 'giaRetrofit', 'hasDigitalModel', 'hasBimModel', 'hasBillOfQuantities'],
      3: ['buildingElements'],
      4: ['hasEnergyModelling'],
    }

    const currentStepFields = stepFields[store.currentStep as keyof StepFields] as Array<keyof Omit<CreateProjectState, 'setField' | 'updateBuildingElement' | 'toggleExpandedElement' | 'reset' | 'getProjectData' | 'currentStep' | 'expandedElements'>>

    // Basic validation for required fields
    if (store.currentStep === 1) {
      return currentStepFields.every(field => Boolean(store[field as keyof typeof store]))
    }
    
    return true
  }

  // Handle next button click
  const handleNext = async () => {
    if (store.currentStep === 1) {
      const isValid = await form.trigger(['name', 'code', 'address', 'typology', 'stage', 'yearOfCompletion'])
      if (!isValid) return
      
      // Update store with form values
      const formData = form.getValues()
      store.setField('name', formData.name)
      store.setField('code', formData.code)
      store.setField('address', formData.address)
      store.setField('typology', formData.typology ?? "Residential")
      store.setField('stage', formData.stage ?? "RIBA Stage 1")
      store.setField('yearOfCompletion', formData.yearOfCompletion)
    } else if (store.currentStep === 2) {
      const isValid = await form.trigger(['giaDemolition', 'giaNewbuild', 'giaRetrofit', 'hasDigitalModel', 'hasBimModel', 'hasBillOfQuantities'])
      if (!isValid) return

      // Update store with form values
      const formData = form.getValues()
      store.setField('giaDemolition', formData.giaDemolition ?? 0)
      store.setField('giaNewbuild', formData.giaNewbuild ?? 0)
      store.setField('giaRetrofit', formData.giaRetrofit ?? 0)
      store.setField('hasDigitalModel', formData.hasDigitalModel ?? "N")
      store.setField('hasBimModel', formData.hasBimModel ?? "N")
      store.setField('hasBillOfQuantities', formData.hasBillOfQuantities ?? "N")
    } else if (store.currentStep === 3) {
      const hasAnyData = Object.values(store.buildingElements).some(element => 
        element.buildupId || 
        element.width !== null || 
        element.length !== null || 
        element.area !== null
      )
      if (!hasAnyData) return
    }

    store.setField('currentStep', store.currentStep + 1)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{steps[store.currentStep - 1].name}</DialogTitle>
        </DialogHeader>

        {/* Stepper */}
        <nav aria-label="Progress" className="mb-8">
          <ol role="list" className="relative flex justify-between w-full px-4">
            <div className="absolute top-[15px] left-[2.5rem] right-[2.5rem] h-0.5 bg-gray-200" />
            {steps.map((step) => (
              <li key={step.name} className="relative flex flex-col items-center w-40">
                <div
                  className={cn(
                    "relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white",
                    store.currentStep > step.id
                      ? "bg-primary text-primary-foreground"
                      : store.currentStep === step.id
                      ? "border-2 border-primary"
                      : "border-2 border-gray-300"
                  )}
                >
                  {store.currentStep > step.id ? (
                    <Check className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <span>{step.id}</span>
                  )}
                </div>
                <span className="mt-2 text-sm font-medium text-center">{step.name}</span>
              </li>
            ))}
          </ol>
        </nav>

        <Form {...form}>
          <form className="space-y-4">
            {store.currentStep === 1 && (
              <>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter project name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Code</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter project code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter project address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="typology"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Typology</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a project typology" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Residential">Residential</SelectItem>
                            <SelectItem value="Fit-out">Fit-out</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="stage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Stage</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a project stage" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="RIBA Stage 1">RIBA Stage 1</SelectItem>
                            <SelectItem value="RIBA Stage 2">RIBA Stage 2</SelectItem>
                            <SelectItem value="RIBA Stage 3">RIBA Stage 3</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="yearOfCompletion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year of Completion</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter year of completion"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            {store.currentStep === 2 && (
              <>
                <FormField
                  control={form.control}
                  name="giaDemolition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GIA of demolition (back-date 3 years)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter GIA of demolition"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="giaNewbuild"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GIA of newbuild</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter GIA of newbuild"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="giaRetrofit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GIA of retrofit or re-fit / fit-out</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter GIA of retrofit"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Project Information Level</h3>
                  
                  <FormField
                    control={form.control}
                    name="hasDigitalModel"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel>Is there a digital model of the project?</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="Y" />
                              <FormLabel className="font-normal">Yes</FormLabel>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="N" />
                              <FormLabel className="font-normal">No</FormLabel>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hasBimModel"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel>Is there a BIM model for the project?</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="Y" />
                              <FormLabel className="font-normal">Yes</FormLabel>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="N" />
                              <FormLabel className="font-normal">No</FormLabel>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hasBillOfQuantities"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel>Is there a bill of quantities for the project?</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="Y" />
                              <FormLabel className="font-normal">Yes</FormLabel>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="N" />
                              <FormLabel className="font-normal">No</FormLabel>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            {store.currentStep === 3 && (
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <div className="grid grid-cols-[minmax(300px,2fr),1fr,1fr,1fr,2fr] gap-4 mb-4">
                    <div className="font-medium text-sm pl-4">Category</div>
                    <div className="font-medium text-sm">Width (m)</div>
                    <div className="font-medium text-sm">Length (m)</div>
                    <div className="font-medium text-sm">Area (m²)</div>
                    <div className="font-medium text-sm">Build-up</div>
                  </div>
                  {renderBuildingElements(nrmData)}
                </div>
              </div>
            )}

            {store.currentStep === 4 && (
              <FormField
                control={form.control}
                name="hasEnergyModelling"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Has there been energy modelling undertaken, i.e. following CIBSE or using PHPP etc?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Y" />
                          <FormLabel className="font-normal">Yes</FormLabel>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="N" />
                          <FormLabel className="font-normal">No</FormLabel>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-between pt-4">
              {store.currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => store.setField('currentStep', store.currentStep - 1)}
                >
                  Back
                </Button>
              )}
              <div className={cn(
                "flex gap-2",
                store.currentStep === 1 ? "ml-auto" : ""
              )}>
                {store.currentStep === 3 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => store.setField('currentStep', store.currentStep + 1)}
                  >
                    Skip
                  </Button>
                )}
                {store.currentStep < 4 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => {
                      const formData = form.getValues()
                      store.setField('name', formData.name)
                      store.setField('code', formData.code)
                      store.setField('address', formData.address)
                      store.setField('typology', formData.typology ?? "Residential")
                      store.setField('stage', formData.stage ?? "RIBA Stage 1")
                      store.setField('yearOfCompletion', formData.yearOfCompletion)
                      store.setField('giaDemolition', formData.giaDemolition ?? 0)
                      store.setField('giaNewbuild', formData.giaNewbuild ?? 0)
                      store.setField('giaRetrofit', formData.giaRetrofit ?? 0)
                      store.setField('hasDigitalModel', formData.hasDigitalModel ?? "N")
                      store.setField('hasBimModel', formData.hasBimModel ?? "N")
                      store.setField('hasBillOfQuantities', formData.hasBillOfQuantities ?? "N")
                      store.setField('hasEnergyModelling', formData.hasEnergyModelling ?? "N")

                      // Get project data and submit without versions
                      const projectData = store.getProjectData()
                      console.log('Building Elements in store:', store.buildingElements)
                      console.log('Element Names in store:', store.elementNames)
                      console.log('Project Data before submission:', projectData)
                      console.log('Building Elements in project data:', projectData.versions[0].buildingElements)
                      
                      // Log elements with data
                      const elementsWithData = Object.entries(store.buildingElements).filter(([_, element]) => 
                        element.buildupId || element.width || element.length || element.area
                      )
                      console.log('Elements with data:', elementsWithData)
                      
                      const { versions, ...projectWithoutVersions } = projectData
                      const dataToSubmit = {
                        ...projectWithoutVersions,
                        buildingElements: store.buildingElements // Use store.buildingElements directly instead of filtered version
                      }
                      console.log('Data being submitted:', dataToSubmit)
                      
                      onSubmit(dataToSubmit)
                      store.reset()
                      form.reset()
                    }}
                  >
                    Create Project
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 