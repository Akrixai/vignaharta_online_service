import { LucideIcon, FileText, CheckCircle2, AlertCircle, Clock, Hash, Calendar, ShieldCheck, User, Smartphone, CreditCard, Building2, Landmark, History } from 'lucide-react';

export interface ReceiptInfoItem {
    label: string;
    value: string;
    icon?: LucideIcon;
    isSensitive?: boolean;
}

export interface ReceiptSection {
    title: string;
    icon: LucideIcon;
    items: ReceiptInfoItem[];
    variant?: 'blue' | 'purple' | 'green' | 'gray' | 'gold';
}

export type ReceiptStatus = 'SUCCESS' | 'PENDING' | 'FAILED' | 'PROCESSING';

export interface ReceiptData {
    title: string;
    subtitle?: string;
    status: ReceiptStatus;
    amount: number | string;
    transactionId: string;
    date: string;
    sections: ReceiptSection[];
    customerNote?: string;
    footerLine?: string;
}

export const getStatusConfig = (status: ReceiptStatus) => {
    switch (status) {
        case 'SUCCESS':
            return {
                color: 'text-green-600',
                bgColor: 'bg-green-500',
                bgLight: 'bg-green-50',
                borderColor: 'border-green-100',
                icon: CheckCircle2,
                label: 'PAYMENT SUCCESSFUL',
            };
        case 'PENDING':
            return {
                color: 'text-yellow-600',
                bgColor: 'bg-yellow-500',
                bgLight: 'bg-yellow-50',
                borderColor: 'border-yellow-100',
                icon: Clock,
                label: 'PAYMENT PENDING',
            };
        case 'FAILED':
            return {
                color: 'text-red-600',
                bgColor: 'bg-red-500',
                bgLight: 'bg-red-50',
                borderColor: 'border-red-100',
                icon: AlertCircle,
                label: 'PAYMENT FAILED',
            };
        case 'PROCESSING':
            return {
                color: 'text-blue-600',
                bgColor: 'bg-blue-500',
                bgLight: 'bg-blue-50',
                borderColor: 'border-blue-100',
                icon: History,
                label: 'PROCESSING',
            };
        default:
            return {
                color: 'text-gray-600',
                bgColor: 'bg-gray-500',
                bgLight: 'bg-gray-50',
                borderColor: 'border-gray-100',
                icon: FileText,
                label: 'STATUS UNKNOWN',
            };
    }
};

export const getVariantStyles = (variant?: string) => {
    switch (variant) {
        case 'blue':
            return {
                border: 'border-blue-100',
                bg: 'bg-blue-50',
                text: 'text-blue-900',
                iconColor: 'text-blue-600',
            };
        case 'purple':
            return {
                border: 'border-purple-100',
                bg: 'bg-purple-50',
                text: 'text-purple-900',
                iconColor: 'text-purple-600',
            };
        case 'green':
            return {
                border: 'border-green-100',
                bg: 'bg-green-50',
                text: 'text-green-900',
                iconColor: 'text-green-600',
            };
        case 'gold':
            return {
                border: 'border-amber-100',
                bg: 'bg-amber-50',
                text: 'text-amber-900',
                iconColor: 'text-amber-600',
            };
        default:
            return {
                border: 'border-gray-100',
                bg: 'bg-gray-50',
                text: 'text-gray-900',
                iconColor: 'text-gray-600',
            };
    }
};
