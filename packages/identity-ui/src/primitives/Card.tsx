import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...rest }) => (
  <div
    {...rest}
    className={`bg-white rounded-xl shadow-card-lg p-8 w-full max-w-md ${className}`}
  >
    {children}
  </div>
);
