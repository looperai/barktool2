"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChevronRight, Building2, Calendar, MapPin, Hash, LayoutDashboard, Scale, Ruler } from "lucide-react"
import Link from "next/link"
import type { Project } from "@/components/app-sidebar"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default function ProjectPage({ params }: { params: { projectId: string } }) {
  const [project, setProject] = useState<Project | null>(null)

  useEffect(() => {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]')
    const currentProject = projects.find((p: Project) => p.id === params.projectId)
    setProject(currentProject || null)
  }, [params.projectId])

  if (!project) return null

  const totalGIA = project.giaDemolition + project.giaNewbuild + project.giaRetrofit

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="flex items-center space-x-2">
        <div className="inline-flex items-center space-x-2">
          <Link href="/projects" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Projects
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="inline-flex items-center">
          <span className="text-sm font-medium">{project.name}</span>
        </div>
      </nav>

      {/* Project Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Hash className="h-4 w-4" />
            <span className="text-sm">{project.code}</span>
            <span className="text-sm">•</span>
            <MapPin className="h-4 w-4" />
            <span className="text-sm">{project.address}</span>
          </div>
        </div>
        <Badge variant="outline" className="font-medium">
          {project.stage}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Project Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Project Information
            </CardTitle>
            <CardDescription>General information about the project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Typology</div>
                <div className="font-medium">{project.typology}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Year of Completion</div>
                <div className="font-medium">{project.yearOfCompletion}</div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Scale className="h-4 w-4 text-primary" />
                Gross Internal Area (GIA)
              </h3>
              <div className="grid gap-3">
                <div className="grid grid-cols-2 items-center">
                  <div className="text-sm text-muted-foreground">Demolition</div>
                  <div className="font-medium">{project.giaDemolition} m²</div>
                </div>
                <div className="grid grid-cols-2 items-center">
                  <div className="text-sm text-muted-foreground">Newbuild</div>
                  <div className="font-medium">{project.giaNewbuild} m²</div>
                </div>
                <div className="grid grid-cols-2 items-center">
                  <div className="text-sm text-muted-foreground">Retrofit</div>
                  <div className="font-medium">{project.giaRetrofit} m²</div>
                </div>
                <Separator className="my-2" />
                <div className="grid grid-cols-2 items-center">
                  <div className="text-sm font-medium">Total GIA</div>
                  <div className="font-medium text-primary">{totalGIA} m²</div>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4 text-primary" />
                Project Resources
              </h3>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">Digital Model</div>
                  <Badge variant={project.hasDigitalModel === "Y" ? "default" : "secondary"}>
                    {project.hasDigitalModel === "Y" ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">BIM Model</div>
                  <Badge variant={project.hasBimModel === "Y" ? "default" : "secondary"}>
                    {project.hasBimModel === "Y" ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">Bill of Quantities</div>
                  <Badge variant={project.hasBillOfQuantities === "Y" ? "default" : "secondary"}>
                    {project.hasBillOfQuantities === "Y" ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">Energy Modelling</div>
                  <Badge variant={project.hasEnergyModelling === "Y" ? "default" : "secondary"}>
                    {project.hasEnergyModelling === "Y" ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Versions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="h-5 w-5 text-primary" />
              Project Versions
            </CardTitle>
            <CardDescription>All versions of this project</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {project.versions.map((version, index) => {
                const elementCount = Object.values(version.buildingElements).filter(element => 
                  element.buildupId || element.width || element.length || element.area
                ).length

                return (
                  <Link
                    key={version.id}
                    href={`/projects/${project.id}/versions/${version.id}`}
                    className={cn(
                      "block p-4 rounded-lg border transition-all duration-200",
                      "hover:border-primary/50 hover:shadow-sm hover:bg-accent/50",
                      "group relative"
                    )}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 rounded-lg transition-opacity" />
                    <div className="relative space-y-1">
                      <div className="font-medium group-hover:text-primary transition-colors">
                        {version.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {elementCount} building elements with data
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 