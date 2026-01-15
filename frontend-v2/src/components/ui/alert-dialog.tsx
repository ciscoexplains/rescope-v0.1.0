'use client';

import React from 'react';
import { Modal } from './modal';
import { Button } from './button';
import { AlertCircle } from 'lucide-react';

interface AlertDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'primary' | 'destructive';
    isLoading?: boolean;
}

export const AlertDialog: React.FC<AlertDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'primary',
    isLoading = false,
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} width="max-w-sm">
            <div className="flex flex-col gap-4 text-center sm:text-left">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                        {variant === 'destructive' && <AlertCircle className="w-5 h-5 text-destructive" />}
                        {title}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-2">
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        {cancelText}
                    </Button>
                    <Button
                        variant={variant}
                        onClick={onConfirm}
                        disabled={isLoading}
                        isLoading={isLoading}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
