import { useMemo, useState } from 'react';

type SortDirection = 'ascending' | 'descending' | null;

interface SortConfig<T> {
    key: keyof T | string;
    direction: SortDirection;
}

/**
 * Custom hook for sortable data
 * @param items - Array of items to sort
 * @param config - Initial sort configuration
 * @returns Object containing sorted items and sort request function
 */
export function useSortableData<T>(
    items: T[],
    config: SortConfig<T> | null = null
) {
    const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(config);

    const sortedItems = useMemo(() => {
        if (!sortConfig || !sortConfig.direction) {
            return items;
        }

        const sortableItems = [...items];
        sortableItems.sort((a, b) => {
            const key = sortConfig.key as string;

            // Handle nested properties (e.g., 'user.name')
            const getNestedValue = (obj: any, path: string): any => {
                return path.split('.').reduce((current, prop) => current?.[prop], obj);
            };

            const aValue = getNestedValue(a, key);
            const bValue = getNestedValue(b, key);

            // Handle null/undefined values
            if (aValue == null && bValue == null) return 0;
            if (aValue == null) return 1;
            if (bValue == null) return -1;

            // Compare values
            if (aValue < bValue) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });

        return sortableItems;
    }, [items, sortConfig]);

    const requestSort = (key: keyof T | string) => {
        let direction: SortDirection = 'ascending';

        if (
            sortConfig &&
            sortConfig.key === key &&
            sortConfig.direction === 'ascending'
        ) {
            direction = 'descending';
        }

        setSortConfig({ key, direction });
    };

    return { items: sortedItems, requestSort, sortConfig };
}
