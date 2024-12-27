'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

export function Dialog({
    isOpen,
    onClose,
    children,
    title,
}: {
    isOpen: boolean
    onClose: () => void
    children: React.ReactNode
    title: string
}) {
    return (
        <DialogPrimitive.Root open={isOpen} onOpenChange={onClose}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                <DialogPrimitive.Content className="fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
                    <DialogPrimitive.Title className="text-lg font-semibold">
                        {title}
                    </DialogPrimitive.Title>
                    <DialogPrimitive.Close className="absolute right-4 top-4 opacity-70 hover:opacity-100">
                        <X className="h-4 w-4" />
                    </DialogPrimitive.Close>
                    {children}
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    )
}
