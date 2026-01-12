'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Card } from './card';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    width?: string;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    width = 'max-w-md',
}) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
            <div
                ref={modalRef}
                className={`relative w-full ${width} transition-transform transform scale-100`}
                onClick={(e) => e.stopPropagation()}
            >
                <Card className="max-h-[90vh] flex flex-col bg-card border-border shadow-2xl" noPadding>
                    <div className="flex items-center justify-between p-4 border-b border-border">
                        {title && <h3 className="text-lg font-semibold text-foreground">{title}</h3>}
                        <button
                            onClick={onClose}
                            className="p-1 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <div className="p-6 overflow-y-auto">
                        {children}
                    </div>
                </Card>
            </div>
        </div>,
        document.body
    );
};
