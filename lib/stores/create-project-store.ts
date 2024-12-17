import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Project } from '@/components/app-sidebar'

export interface BuildingElement {
  id: string
  name: string
  width: number | null
  length: number | null
  area: number | null
  buildupId?: string
}

type StateFields = {
  // Step 1: General Information
  name: string
  code: string
  address: string
  typology: "Residential" | "Fit-out" | undefined
  stage: "RIBA Stage 1" | "RIBA Stage 2" | "RIBA Stage 3" | undefined
  yearOfCompletion: number

  // Step 2: Building Information
  giaDemolition: number
  giaNewbuild: number
  giaRetrofit: number
  hasDigitalModel: "Y" | "N" | undefined
  hasBimModel: "Y" | "N" | undefined
  hasBillOfQuantities: "Y" | "N" | undefined

  // Step 3: Building Element Information
  buildingElements: { [key: string]: BuildingElement }
  elementNames: { [key: string]: string } // Store element names separately

  // Step 4: Operational Information
  hasEnergyModelling: "Y" | "N" | undefined

  // UI State
  currentStep: number
  expandedElements: Set<string>
}

type Actions = {
  setField: <K extends keyof StateFields>(field: K, value: StateFields[K]) => void
  updateBuildingElement: (elementId: string, updates: Partial<BuildingElement>) => void
  toggleExpandedElement: (elementId: string) => void
  reset: () => void
  getProjectData: () => Omit<Project, "id">
  initializeBuildingElements: (nrmData: Record<string, any>) => void
}

export type CreateProjectState = StateFields & Actions

const initialState: StateFields = {
  // Step 1
  name: "",
  code: "",
  address: "",
  typology: undefined,
  stage: undefined,
  yearOfCompletion: new Date().getFullYear(),

  // Step 2
  giaDemolition: 0,
  giaNewbuild: 0,
  giaRetrofit: 0,
  hasDigitalModel: undefined,
  hasBimModel: undefined,
  hasBillOfQuantities: undefined,

  // Step 3
  buildingElements: {},
  elementNames: {},

  // Step 4
  hasEnergyModelling: undefined,

  // UI State
  currentStep: 1,
  expandedElements: new Set<string>(),
}

export const useCreateProjectStore = create<CreateProjectState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setField: (field, value) => {
        set((state) => ({ ...state, [field]: value }))
      },

      initializeBuildingElements: (nrmData) => {
        set((state) => {
          const newBuildingElements: { [key: string]: BuildingElement } = {}
          const newElementNames: { [key: string]: string } = {}
          
          const processElements = (obj: Record<string, any>, parentId: string = "", parentName: string = "") => {
            Object.entries(obj).forEach(([key, value]) => {
              const id = parentId ? `${parentId}-${key}` : key
              const name = parentName ? `${parentName} - ${key}` : key
              
              newElementNames[id] = name
              newBuildingElements[id] = {
                id,
                name,
                width: null,
                length: null,
                area: null,
              }
              
              if (value && typeof value === 'object' && Object.keys(value).length > 0) {
                processElements(value, id, name)
              }
            })
          }

          const nrmElements = ["1 Sub-structure", "2 Super structure", "3 Finishes"]
          Object.entries(nrmData).forEach(([key, value]) => {
            if (nrmElements.some(element => key.startsWith(element))) {
              processElements({ [key]: value })
            }
          })

          return {
            ...state,
            buildingElements: newBuildingElements,
            elementNames: newElementNames,
          }
        })
      },

      updateBuildingElement: (elementId, updates) => {
        set((state) => {
          const currentElement = state.buildingElements[elementId] || {
            id: elementId,
            name: state.elementNames[elementId] || "",
            width: null,
            length: null,
            area: null,
          }

          // Calculate area if width or length is updated
          let newArea = currentElement.area
          if ('width' in updates || 'length' in updates) {
            const width = 'width' in updates ? updates.width : currentElement.width
            const length = 'length' in updates ? updates.length : currentElement.length
            newArea = width && length ? Number((width * length).toFixed(2)) : null
          }

          // If area is directly updated, clear width and length
          if ('area' in updates) {
            updates = {
              ...updates,
              width: null,
              length: null,
            }
          }

          const updatedElement: BuildingElement = {
            ...currentElement,
            ...updates,
            area: 'area' in updates && updates.area !== undefined ? updates.area : newArea,
          }

          return {
            ...state,
            buildingElements: {
              ...state.buildingElements,
              [elementId]: updatedElement,
            },
          }
        })
      },

      toggleExpandedElement: (elementId) => {
        set((state) => {
          const newSet = new Set(state.expandedElements)
          if (newSet.has(elementId)) {
            newSet.delete(elementId)
          } else {
            newSet.add(elementId)
          }
          return { ...state, expandedElements: newSet }
        })
      },

      reset: () => {
        set(initialState)
      },

      getProjectData: () => {
        const state = get()
        
        // Include all building elements, preserving the structure
        const buildingElements = Object.entries(state.buildingElements).reduce((acc, [id, element]) => {
          acc[id] = {
            ...element,
            name: state.elementNames[id] || element.name || id
          }
          return acc
        }, {} as Record<string, BuildingElement>)

        return {
          name: state.name,
          code: state.code,
          address: state.address,
          typology: state.typology!,
          stage: state.stage!,
          yearOfCompletion: state.yearOfCompletion,
          giaDemolition: state.giaDemolition,
          giaNewbuild: state.giaNewbuild,
          giaRetrofit: state.giaRetrofit,
          hasDigitalModel: state.hasDigitalModel!,
          hasBimModel: state.hasBimModel!,
          hasBillOfQuantities: state.hasBillOfQuantities!,
          hasEnergyModelling: state.hasEnergyModelling!,
          versions: [{
            id: crypto.randomUUID(),
            name: 'Version 1',
            buildingElements: buildingElements
          }]
        }
      },
    }),
    { name: 'create-project-store' }
  )
) 