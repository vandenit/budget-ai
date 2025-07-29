"use client";

import React, { useState, useRef, useEffect } from 'react';
import { FaInfoCircle } from 'react-icons/fa';

interface PayeeTooltipProps {
  cleanPayeeName: string;
  fullPayeeName?: string;
  className?: string;
}

export function PayeeTooltip({ cleanPayeeName, fullPayeeName, className = '' }: PayeeTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close tooltip when clicking outside (mobile)
  useEffect(() => {
    if (!isMobile || !showTooltip) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        triggerRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setShowTooltip(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTooltip, isMobile]);

  // Don't show tooltip if no full payee name or if it's the same as clean name
  const shouldShowTooltip = fullPayeeName && 
                           fullPayeeName.trim() !== '' && 
                           fullPayeeName !== cleanPayeeName;

  if (!shouldShowTooltip) {
    return (
      <div className={`font-semibold text-lg dark:text-white truncate ${className}`}>
        {cleanPayeeName}
      </div>
    );
  }

  const handleInteraction = () => {
    if (isMobile) {
      setShowTooltip(!showTooltip);
    }
  };

  const handleMouseEnter = () => {
    if (!isMobile) {
      setShowTooltip(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setShowTooltip(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setShowTooltip(!showTooltip);
    } else if (event.key === 'Escape') {
      setShowTooltip(false);
    }
  };

  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef}
        className={`font-semibold text-lg dark:text-white truncate cursor-help flex items-center gap-2 ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleInteraction}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`Payee: ${cleanPayeeName}. Press Enter to see full name.`}
        aria-expanded={showTooltip}
      >
        <span className="truncate">{cleanPayeeName}</span>
        <FaInfoCircle 
          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 flex-shrink-0 text-sm" 
          aria-hidden="true"
        />
      </div>

      {showTooltip && (
        <div
          ref={tooltipRef}
          className="absolute z-50 px-3 py-2 text-sm font-normal text-white bg-gray-900 rounded-lg shadow-lg dark:bg-gray-700 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg break-words"
          style={{
            top: isMobile ? '100%' : 'auto',
            bottom: isMobile ? 'auto' : '100%',
            left: isMobile ? '0' : '50%',
            transform: isMobile ? 'none' : 'translateX(-50%)',
            marginTop: isMobile ? '8px' : '0',
            marginBottom: isMobile ? '0' : '8px',
          }}
          role="tooltip"
          aria-live="polite"
        >
          <div className="font-medium mb-1">Full payee name:</div>
          <div className="text-gray-200 dark:text-gray-300">{fullPayeeName}</div>
          
          {/* Arrow */}
          <div
            className="absolute w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"
            style={{
              top: isMobile ? '-4px' : 'auto',
              bottom: isMobile ? 'auto' : '-4px',
              left: isMobile ? '16px' : '50%',
              transform: isMobile ? 'none' : 'translateX(-50%)',
            }}
          />
        </div>
      )}
    </div>
  );
}
