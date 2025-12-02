"use client"

import * as React from "react"
import { useMediaQuery } from "@/hooks/use-mobile"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "./dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "./drawer"
import { cn } from "@/lib/utils"

interface ResponsiveDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

const ResponsiveDialog = ({ 
  open, 
  onOpenChange, 
  children 
}: ResponsiveDialogProps) => {
  const isMobile = useMediaQuery("(max-width: 640px)")

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        {children}
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  )
}

interface ResponsiveDialogContentProps {
  children: React.ReactNode
  className?: string
}

const ResponsiveDialogContent = ({ 
  children, 
  className 
}: ResponsiveDialogContentProps) => {
  const isMobile = useMediaQuery("(max-width: 640px)")

  if (isMobile) {
    return (
      <DrawerContent 
        className={cn(
          "max-h-[90dvh] overflow-y-auto",
          className
        )}
      >
        {children}
      </DrawerContent>
    )
  }

  return (
    <DialogContent className={className}>
      {children}
    </DialogContent>
  )
}

interface ResponsiveDialogHeaderProps {
  children: React.ReactNode
  className?: string
}

const ResponsiveDialogHeader = ({ 
  children, 
  className 
}: ResponsiveDialogHeaderProps) => {
  const isMobile = useMediaQuery("(max-width: 640px)")

  if (isMobile) {
    return (
      <DrawerHeader className={className}>
        {children}
      </DrawerHeader>
    )
  }

  return (
    <DialogHeader className={className}>
      {children}
    </DialogHeader>
  )
}

interface ResponsiveDialogTitleProps {
  children: React.ReactNode
  className?: string
}

const ResponsiveDialogTitle = ({ 
  children, 
  className 
}: ResponsiveDialogTitleProps) => {
  const isMobile = useMediaQuery("(max-width: 640px)")

  if (isMobile) {
    return (
      <DrawerTitle className={className}>
        {children}
      </DrawerTitle>
    )
  }

  return (
    <DialogTitle className={className}>
      {children}
    </DialogTitle>
  )
}

interface ResponsiveDialogDescriptionProps {
  children: React.ReactNode
  className?: string
}

const ResponsiveDialogDescription = ({ 
  children, 
  className 
}: ResponsiveDialogDescriptionProps) => {
  const isMobile = useMediaQuery("(max-width: 640px)")

  if (isMobile) {
    return (
      <DrawerDescription className={className}>
        {children}
      </DrawerDescription>
    )
  }

  return (
    <DialogDescription className={className}>
      {children}
    </DialogDescription>
  )
}

interface ResponsiveDialogFooterProps {
  children: React.ReactNode
  className?: string
}

const ResponsiveDialogFooter = ({ 
  children, 
  className 
}: ResponsiveDialogFooterProps) => {
  const isMobile = useMediaQuery("(max-width: 640px)")

  if (isMobile) {
    return (
      <DrawerFooter className={cn("pb-safe", className)}>
        {children}
      </DrawerFooter>
    )
  }

  return (
    <DialogFooter className={className}>
      {children}
    </DialogFooter>
  )
}

interface ResponsiveDialogCloseProps {
  children: React.ReactNode
  className?: string
  asChild?: boolean
}

const ResponsiveDialogClose = ({ 
  children, 
  className,
  asChild 
}: ResponsiveDialogCloseProps) => {
  const isMobile = useMediaQuery("(max-width: 640px)")

  if (isMobile) {
    return (
      <DrawerClose asChild={asChild} className={className}>
        {children}
      </DrawerClose>
    )
  }

  return (
    <DialogClose asChild={asChild} className={className}>
      {children}
    </DialogClose>
  )
}

interface ResponsiveDialogBodyProps {
  children: React.ReactNode
  className?: string
}

const ResponsiveDialogBody = ({ 
  children, 
  className 
}: ResponsiveDialogBodyProps) => {
  return (
    <div className={cn("px-4 py-2 sm:px-6", className)}>
      {children}
    </div>
  )
}

export {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogClose,
  ResponsiveDialogBody,
}
