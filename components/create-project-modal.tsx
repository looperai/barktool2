"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
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
import { Project } from "./app-sidebar"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { nrmData, type NRMElement } from "@/lib/nrm-data"

const steps = [
  { id: 1, name: "General Information" },
  { id: 2, name: "Building Information" },
  { id: 3, name: "Building Element Information" },
  { id: 4, name: "Operational Information" },
]

interface BuildingElement {
  id: string
  name: string
  width?: number
  length?: number
  area?: number
  buildupId?: string
}

interface BuildUp {
  id: string
  name: string
}

const formSchema = z.object({
  // Step 1: General Information
  name: z.string().min(1, "Project name is required"),
  code: z.string().min(1, "Project code is required"),
  address: z.string().min(1, "Project address is required"),
  typology: z.enum(["Residential", "Fit-out"], {
    required_error: "Please select a project typology",
  }),
  stage: z.enum(["RIBA Stage 1", "RIBA Stage 2", "RIBA Stage 3"], {
    required_error: "Please select a project stage",
  }),
  yearOfCompletion: z.number().min(2000).max(2100),

  // Step 2: Building Information
  giaDemolition: z.number().min(0),
  giaNewbuild: z.number().min(0),
  giaRetrofit: z.number().min(0),
  hasDigitalModel: z.enum(["Y", "N"]),
  hasBimModel: z.enum(["Y", "N"]),
  hasBillOfQuantities: z.enum(["Y", "N"]),

  // Step 3: Building Element Information
  buildingElements: z.record(z.string(), z.object({
    id: z.string(),
    name: z.string(),
    width: z.number().nullable().optional(),
    length: z.number().nullable().optional(),
    area: z.number().nullable().optional(),
    buildupId: z.string().optional(),
  })),

  // Step 4: Operational Information
  hasEnergyModelling: z.enum(["Y", "N"]),
})

type FormValues = z.infer<typeof formSchema>

interface CreateProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: Omit<Project, "id">) => void
}

export function CreateProjectModal({
  open,
  onOpenChange,
  onSubmit,
}: CreateProjectModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [buildUps, setBuildUps] = useState<BuildUp[]>([])
  const [expandedElements, setExpandedElements] = useState<Set<string>>(new Set())

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      code: "",
      address: "",
      typology: undefined,
      stage: undefined,
      yearOfCompletion: new Date().getFullYear(),
      giaDemolition: 0,
      giaNewbuild: 0,
      giaRetrofit: 0,
      hasDigitalModel: undefined,
      hasBimModel: undefined,
      hasBillOfQuantities: undefined,
      buildingElements: {},
      hasEnergyModelling: undefined,
    },
  })

  useEffect(() => {
    // Load build-ups from localStorage
    const savedBuildUps = JSON.parse(localStorage.getItem('buildUps') || '[]')
    setBuildUps(savedBuildUps)

    // Initialize building elements from NRM data
    const nrmElements = ["1 Sub-structure", "2 Super structure", "3 Finishes"]
    const elements: Record<string, BuildingElement> = {}
    
    Object.entries(nrmData).forEach(([key, value]) => {
      if (nrmElements.some(element => key.startsWith(element))) {
        const processElements = (obj: NRMElement | Record<string, never>, parentId: string = "") => {
          Object.entries(obj).forEach(([k, v]) => {
            const id = parentId ? `${parentId}-${k}` : k
            elements[id] = { id, name: k }
            if (v && typeof v === 'object' && Object.keys(v).length > 0) {
              processElements(v, id)
            }
          })
        }
        processElements({ [key]: value })
      }
    })
    
    form.setValue('buildingElements', elements)
  }, [form])

  const handleSubmit = (values: FormValues) => {
    onSubmit(values)
    form.reset()
    setCurrentStep(1)
  }

  const toggleElement = (elementId: string) => {
    setExpandedElements(prev => {
      const next = new Set(prev)
      if (next.has(elementId)) {
        next.delete(elementId)
      } else {
        next.add(elementId)
      }
      return next
    })
  }

  const renderBuildingElements = (elements: NRMElement | Record<string, never>, parentId: string = "") => {
    return Object.entries(elements).map(([key, value]) => {
      const elementId = parentId ? `${parentId}-${key}` : key
      const hasChildren = typeof value === 'object' && Object.keys(value).length > 0
      const isExpanded = expandedElements.has(elementId)

      if (!form.getValues(`buildingElements.${elementId}`)) {
        form.setValue(`buildingElements.${elementId}`, {
          id: elementId,
          name: key,
          width: null,
          length: null,
          area: null,
        })
      }

      const calculateArea = (width: number | null | undefined, length: number | null | undefined) => {
        if (width && length) {
          return Number((width * length).toFixed(2))
        }
        return null
      }

      return (
        <div key={elementId} className="ml-4">
          <div className="flex items-center gap-2 py-1">
            {hasChildren && (
              <button
                type="button"
                onClick={() => toggleElement(elementId)}
                className="text-sm"
              >
                {isExpanded ? "▼" : "▶"}
              </button>
            )}
            <span className="text-sm">{key}</span>
          </div>
          {!hasChildren && (
            <div className="ml-4 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name={`buildingElements.${elementId}.width`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Width (m)"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => {
                            const width = e.target.value ? Number(e.target.value) : null
                            field.onChange(width)
                            
                            const length = form.getValues(`buildingElements.${elementId}.length`)
                            const area = calculateArea(width, length)
                            form.setValue(`buildingElements.${elementId}.area`, area)
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`buildingElements.${elementId}.length`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Length (m)"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => {
                            const length = e.target.value ? Number(e.target.value) : null
                            field.onChange(length)
                            
                            const width = form.getValues(`buildingElements.${elementId}.width`)
                            const area = calculateArea(width, length)
                            form.setValue(`buildingElements.${elementId}.area`, area)
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`buildingElements.${elementId}.area`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Area (m²)"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => {
                            const area = e.target.value ? Number(e.target.value) : null
                            field.onChange(area)
                            // Reset width and length when area is manually changed
                            form.setValue(`buildingElements.${elementId}.width`, null)
                            form.setValue(`buildingElements.${elementId}.length`, null)
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name={`buildingElements.${elementId}.buildupId`}
                render={({ field }) => (
                  <FormItem>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select build-up" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {buildUps.map((buildup) => (
                          <SelectItem key={buildup.id} value={buildup.id}>
                            {buildup.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
          )}
          {hasChildren && isExpanded && (
            <div className="ml-4">
              {renderBuildingElements(value, elementId)}
            </div>
          )}
        </div>
      )
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{steps[currentStep - 1].name}</DialogTitle>
        </DialogHeader>

        {/* Stepper */}
        <nav aria-label="Progress" className="mb-8">
          <ol role="list" className="flex items-center">
            {steps.map((step, stepIdx) => (
              <li
                key={step.name}
                className={cn(
                  stepIdx !== steps.length - 1 ? "pr-8 sm:pr-20" : "",
                  "relative"
                )}
              >
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-gray-200" />
                </div>
                <div
                  className={cn(
                    "relative flex h-8 w-8 items-center justify-center rounded-full",
                    currentStep > step.id
                      ? "bg-primary text-primary-foreground"
                      : currentStep === step.id
                      ? "border-2 border-primary bg-background"
                      : "border-2 border-gray-300 bg-background"
                  )}
                >
                  {currentStep > step.id ? (
                    <Check className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <span>{step.id}</span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </nav>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {currentStep === 1 && (
              <>
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
              </>
            )}

            {currentStep === 2 && (
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
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <RadioGroupItem value="Y" />
                              </FormControl>
                              <FormLabel className="font-normal">Yes</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <RadioGroupItem value="N" />
                              </FormControl>
                              <FormLabel className="font-normal">No</FormLabel>
                            </FormItem>
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
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <RadioGroupItem value="Y" />
                              </FormControl>
                              <FormLabel className="font-normal">Yes</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <RadioGroupItem value="N" />
                              </FormControl>
                              <FormLabel className="font-normal">No</FormLabel>
                            </FormItem>
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
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <RadioGroupItem value="Y" />
                              </FormControl>
                              <FormLabel className="font-normal">Yes</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <RadioGroupItem value="N" />
                              </FormControl>
                              <FormLabel className="font-normal">No</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  {renderBuildingElements(nrmData)}
                </div>
              </div>
            )}

            {currentStep === 4 && (
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
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <RadioGroupItem value="Y" />
                          </FormControl>
                          <FormLabel className="font-normal">Yes</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <RadioGroupItem value="N" />
                          </FormControl>
                          <FormLabel className="font-normal">No</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-between pt-4">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                >
                  Back
                </Button>
              )}
              <div className={cn(
                "flex gap-2",
                currentStep === 1 ? "ml-auto" : ""
              )}>
                {currentStep === 3 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(prev => prev + 1)}
                  >
                    Skip
                  </Button>
                )}
                {currentStep < 4 ? (
                  <Button
                    type="button"
                    onClick={() => setCurrentStep(prev => prev + 1)}
                  >
                    Next
                  </Button>
                ) : (
                  <Button type="submit">Create Project</Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 