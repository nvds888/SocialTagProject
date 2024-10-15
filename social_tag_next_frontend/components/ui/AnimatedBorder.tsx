import React from 'react';

interface AnimatedBorderProps {
  children: React.ReactNode;
  className?: string;
}

const AnimatedBorder: React.FC<AnimatedBorderProps> = ({ children, className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-full animate-gradient-x"></div>
      <div className="absolute inset-[2px] bg-black rounded-full overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default AnimatedBorder;