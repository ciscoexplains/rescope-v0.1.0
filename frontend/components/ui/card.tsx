import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    noPadding = false,
    ...props
}) => {
    return (
        <div
            className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${className}`}
            {...props}
        >
            <div className={noPadding ? '' : 'p-6'}>
                {children}
            </div>
        </div>
    );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
    <div className={`mb-4 ${className}`} {...props}>
        {children}
    </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, className = '', ...props }) => (
    <h3 className={`text-lg font-semibold text-[var(--color-text-main)] ${className}`} {...props}>
        {children}
    </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ children, className = '', ...props }) => (
    <p className={`text-sm text-gray-500 ${className}`} {...props}>
        {children}
    </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
    <div className={`${className}`} {...props}>
        {children}
    </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
    <div className={`mt-4 flex items-center ${className}`} {...props}>
        {children}
    </div>
);
