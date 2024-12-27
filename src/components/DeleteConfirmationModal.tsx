// components/DeleteConfirmationModal.tsx
interface DeleteConfirmationModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    itemName: string
}

export function DeleteConfirmationModal({ isOpen, onClose, onConfirm, itemName }: DeleteConfirmationModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#020617] border border-blue-900/20 rounded-xl p-6 max-w-md w-full mx-4">
                <h3 className="text-xl font-semibold text-white mb-4">Confirm Deletion</h3>
                <p className="text-blue-200 mb-6">
                    Are you sure you want to delete {itemName}? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-blue-300 hover:text-white bg-blue-900/30 hover:bg-blue-800/50 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            onConfirm()
                            onClose()
                        }}
                        className="px-4 py-2 text-sm text-red-300 hover:text-white bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    )
}