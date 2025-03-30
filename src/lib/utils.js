import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const WAIT_APPROVE = 'w-ap';
export const APPROVE = 'ap';
export const DECLINE = 'dec';
export const IN_PROGRESS = 'ip';
export const WAIT_PAYMENT = 'w-p';
export const READY = 'rd';

export const ORDER_STATUSES = {
  [WAIT_APPROVE]: 'Ожидает подтверждения',
  [APPROVE]: 'Подтвержден',
  [DECLINE]: 'Отклонен',
  [IN_PROGRESS]: 'В работе',
  [WAIT_PAYMENT]: 'Готов, Ожидает оплаты',
  [READY]: 'Готов',
};

export function formatDate(date) {
  if (!date) return '';

  const d = new Date(date);
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}
